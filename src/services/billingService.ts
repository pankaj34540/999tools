import { 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Bill, BillItem, BillStats, PaymentMode, BillStatus } from '../types';
import { createLedgerEntry } from './khatabookService';

// ============================================
// DEEP CLEAN
// ============================================
const deepClean = (value: any): any => {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map(item => deepClean(item)).filter(item => item !== undefined);
  }
  if (typeof value === 'object') {
    const cleanedObj: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleanedVal = deepClean(val);
      if (cleanedVal !== undefined && cleanedVal !== '') {
        cleanedObj[key] = cleanedVal;
      }
    });
    return cleanedObj;
  }
  if (value === '') return undefined;
  return value;
};

// ============================================
// GENERATE BILL NUMBER
// Format: BILL-YYYYMMDD-XXXX
// ============================================
export const generateBillNumber = (existingCount: number): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const dateStr = istTime.toISOString().split('T')[0].replace(/-/g, '');
  const seq = (existingCount + 1).toString().padStart(4, '0');
  return `BILL-${dateStr}-${seq}`;
};

// ============================================
// CALCULATE BILL TOTALS
// ============================================
export const calculateBillTotals = (
  items: BillItem[],
  gstEnabled: boolean,
  billDiscount: number
): {
  subtotal: number;
  itemDiscount: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  discountAmount: number;
  grandTotal: number;
  roundOff: number;
} => {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let totalGst = 0;

  items.forEach((item) => {
    const itemTotal = item.quantity * item.rate;
    subtotal += itemTotal;
    
    const itemDisc = item.discount ? (itemTotal * item.discount) / 100 : 0;
    itemDiscountTotal += itemDisc;
    
    if (gstEnabled && item.gstRate > 0) {
      const taxableAmount = itemTotal - itemDisc;
      totalGst += (taxableAmount * item.gstRate) / 100;
    }
  });

  const afterItemDiscount = subtotal - itemDiscountTotal;
  const billDiscAmount = (afterItemDiscount * billDiscount) / 100;
  const discountAmount = itemDiscountTotal + billDiscAmount;
  
  const taxableValue = subtotal - discountAmount;
  const beforeRound = taxableValue + totalGst;
  const grandTotal = Math.round(beforeRound);
  const roundOff = grandTotal - beforeRound;

  // Split GST into CGST + SGST (both half)
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const igst = 0;

  return {
    subtotal,
    itemDiscount: itemDiscountTotal,
    totalGst,
    cgst,
    sgst,
    igst,
    discountAmount,
    grandTotal,
    roundOff,
  };
};

// ============================================
// CREATE BILL
// ============================================
export const createBill = async (
  billData: Omit<Bill, 'id' | 'createdAt' | 'timestamp'>
): Promise<Bill | null> => {
  try {
    const id = 'bill_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    const now = new Date();
    
    const newBill: Bill = {
      ...billData,
      id,
      createdAt: now.toISOString(),
      timestamp: now.toISOString(),
    };

    const cleaned = deepClean(newBill);
    await setDoc(doc(db, 'bills', id), cleaned);

    // ✅ AUTO KHATABOOK SYNC
    // Agar bill unpaid/credit hai toh ledger mein debit entry banão
    if (newBill.status === 'unpaid' || newBill.status === 'partial' || newBill.paymentMode === 'credit') {
      try {
        await createLedgerEntry({
          vleId: newBill.vleId,
          vleCenterName: newBill.vleCenterName,
          customerName: newBill.customerName,
          customerMobile: newBill.customerMobile || 'N/A',
          customerAddress: newBill.customerAddress,
          type: 'debit',
          amount: newBill.balanceAmount || newBill.grandTotal,
          description: `Bill ${newBill.billNumber} - ${newBill.items.length} items`,
          category: 'Bill (Credit)',
          billId: newBill.id,
        });
        console.log('✅ Khatabook entry created for bill:', newBill.billNumber);
      } catch (err) {
        console.error('⚠️ Khatabook sync failed:', err);
      }
    }

    // Agar cash/upi/card paid hai toh sale entry banão
    if (newBill.status === 'paid' && newBill.paymentMode !== 'credit') {
      try {
        await createLedgerEntry({
          vleId: newBill.vleId,
          vleCenterName: newBill.vleCenterName,
          customerName: newBill.customerName,
          customerMobile: newBill.customerMobile || 'N/A',
          customerAddress: newBill.customerAddress,
          type: 'sale',
          amount: newBill.grandTotal,
          description: `Bill ${newBill.billNumber} - ${newBill.paymentMode.toUpperCase()}`,
          category: 'Bill (Cash Sale)',
          billId: newBill.id,
        });
        console.log('✅ Khatabook entry created for bill:', newBill.billNumber);
      } catch (err) {
        console.error('⚠️ Khatabook sync failed:', err);
      }
    }

    console.log('✅ Bill created:', id);
    return newBill;
  } catch (error: any) {
    console.error('❌ Error creating bill:', error.code, error.message);
    return null;
  }
};

// ============================================
// UPDATE BILL
// ============================================
export const updateBill = async (
  billId: string,
  updates: Partial<Bill>
): Promise<boolean> => {
  try {
    const cleaned = deepClean({ ...updates, updatedAt: new Date().toISOString() });
    await updateDoc(doc(db, 'bills', billId), cleaned);
    return true;
  } catch (error: any) {
    console.error('❌ Error updating bill:', error.code, error.message);
    return false;
  }
};

// ============================================
// DELETE BILL
// ============================================
export const deleteBill = async (billId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'bills', billId));
    return true;
  } catch (error: any) {
    console.error('❌ Error deleting bill:', error.code, error.message);
    return false;
  }
};

// ============================================
// GET VLE BILLS
// ============================================
export const getVleBills = async (vleId: string): Promise<Bill[]> => {
  try {
    const q = query(collection(db, 'bills'), where('vleId', '==', vleId));
    const snap = await getDocs(q);
    const bills = snap.docs.map((d) => d.data() as Bill);
    return bills.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('❌ Error getting bills:', error);
    return [];
  }
};

// ============================================
// SUBSCRIBE TO VLE BILLS
// ============================================
export const subscribeToVleBills = (
  vleId: string,
  callback: (bills: Bill[]) => void
) => {
  const q = query(collection(db, 'bills'), where('vleId', '==', vleId));
  return onSnapshot(q, (snap) => {
    const bills = snap.docs.map((d) => d.data() as Bill);
    const sorted = bills.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    callback(sorted);
  });
};

// ============================================
// CALCULATE BILL STATS
// ============================================
export const calculateBillStats = (vleId: string, bills: Bill[]): BillStats => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istToday = new Date(now.getTime() + istOffset).toISOString().split('T')[0];
  const currentMonth = istToday.substring(0, 7);

  const todayBills = bills.filter(b => b.date === istToday);
  const monthBills = bills.filter(b => b.date.startsWith(currentMonth));

  const sumRevenue = (arr: Bill[]) => arr.reduce((s, b) => s + b.grandTotal, 0);
  const sumPaid = (arr: Bill[]) => arr.filter(b => b.status === 'paid').reduce((s, b) => s + b.grandTotal, 0);
  const sumUnpaid = (arr: Bill[]) => arr.filter(b => b.status !== 'paid').reduce((s, b) => s + b.balanceAmount, 0);

  const totalRevenue = sumRevenue(bills);

  return {
    vleId,
    todayBills: todayBills.length,
    todayRevenue: sumRevenue(todayBills),
    todayPaid: sumPaid(todayBills),
    todayUnpaid: sumUnpaid(todayBills),
    monthBills: monthBills.length,
    monthRevenue: sumRevenue(monthBills),
    monthPaid: sumPaid(monthBills),
    monthUnpaid: sumUnpaid(monthBills),
    totalBills: bills.length,
    totalRevenue,
    averageBillValue: bills.length > 0 ? totalRevenue / bills.length : 0,
  };
};

// ============================================
// NUMBER TO WORDS (Indian Format)
// ============================================
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  const whole = Math.floor(num);
  const decimal = Math.round((num - whole) * 100);

  let result = numToWords(whole) + ' Rupees';
  if (decimal > 0) {
    result += ' and ' + numToWords(decimal) + ' Paise';
  }
  result += ' Only';
  return result;
};

// ============================================
// GENERATE BILL HTML (for print)
// ============================================
export const generateBillHTML = (
  bill: Bill,
  format: 'thermal' | 'a4',
  siteName: string,
): string => {
  const isThermal = format === 'thermal';
  const width = isThermal ? '80mm' : '210mm';
  const padding = isThermal ? '8px' : '20px';
  const fontSize = isThermal ? '11px' : '13px';
  const titleSize = isThermal ? '16px' : '22px';

  const itemsHTML = bill.items.map((item, i) => {
    const itemTotal = item.quantity * item.rate;
    const itemDisc = item.discount ? (itemTotal * item.discount) / 100 : 0;
    const afterDisc = itemTotal - itemDisc;
    const gstAmt = bill.gstEnabled && item.gstRate > 0 ? (afterDisc * item.gstRate) / 100 : 0;
    const finalAmt = afterDisc + gstAmt;

    return `
      <tr>
        <td style="padding:4px 2px;border-bottom:1px solid #eee;text-align:center;">${i + 1}</td>
        <td style="padding:4px 2px;border-bottom:1px solid #eee;">
          ${item.name}
          ${item.hsnCode ? `<br><small style="color:#666;">HSN: ${item.hsnCode}</small>` : ''}
          ${bill.gstEnabled && item.gstRate > 0 ? `<br><small style="color:#666;">GST: ${item.gstRate}%</small>` : ''}
        </td>
        <td style="padding:4px 2px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 2px;border-bottom:1px solid #eee;text-align:right;">₹${item.rate.toFixed(2)}</td>
        <td style="padding:4px 2px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">₹${finalAmt.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${bill.billNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: ${isThermal ? "'Courier New', monospace" : "Arial, sans-serif"}; 
          font-size: ${fontSize};
          width: ${width};
          padding: ${padding};
          margin: 0 auto;
          color: #000;
        }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .header h1 { font-size: ${titleSize}; font-weight: bold; }
        .header p { font-size: ${isThermal ? '10px' : '12px'}; margin: 2px 0; }
        .info { margin-bottom: 8px; }
        .info-row { display: flex; justify-content: space-between; padding: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th { background: #f0f0f0; padding: 4px 2px; border-bottom: 1px solid #000; font-size: ${isThermal ? '10px' : '12px'}; }
        .totals { margin-top: 8px; border-top: 2px dashed #000; padding-top: 8px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
        .grand-total { font-weight: bold; font-size: ${isThermal ? '14px' : '16px'}; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
        .footer { text-align: center; border-top: 2px dashed #000; padding-top: 8px; margin-top: 8px; font-size: ${isThermal ? '9px' : '11px'}; }
        @media print {
          body { width: ${width}; padding: ${padding}; }
          @page { size: ${isThermal ? '80mm auto' : 'A4'}; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${bill.vleCenterName}</h1>
        ${bill.vleAddress ? `<p>${bill.vleAddress}</p>` : ''}
        <p>Mobile: ${bill.vleMobile}</p>
        ${bill.vleGstin ? `<p>GSTIN: ${bill.vleGstin}</p>` : ''}
      </div>

      <div class="info">
        <div class="info-row">
          <span><strong>Bill No:</strong> ${bill.billNumber}</span>
          <span>${bill.date}</span>
        </div>
        <div class="info-row">
          <span><strong>Customer:</strong> ${bill.customerName}</span>
        </div>
        ${bill.customerMobile ? `
          <div class="info-row">
            <span><strong>Mobile:</strong> ${bill.customerMobile}</span>
          </div>
        ` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:8%;">#</th>
            <th style="width:42%;">Item</th>
            <th style="width:10%;">Qty</th>
            <th style="width:20%;">Rate</th>
            <th style="width:20%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${bill.subtotal.toFixed(2)}</span>
        </div>
        ${bill.discountAmount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-₹${bill.discountAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        ${bill.gstEnabled && bill.totalGst > 0 ? `
          <div class="total-row">
            <span>CGST:</span>
            <span>₹${bill.cgst.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST:</span>
            <span>₹${bill.sgst.toFixed(2)}</span>
          </div>
        ` : ''}
        ${bill.roundOff !== 0 ? `
          <div class="total-row">
            <span>Round Off:</span>
            <span>${bill.roundOff > 0 ? '+' : ''}₹${bill.roundOff.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>GRAND TOTAL:</span>
          <span>₹${bill.grandTotal.toFixed(2)}</span>
        </div>
        <div class="info-row" style="margin-top:6px;">
          <span><strong>Payment:</strong> ${bill.paymentMode.toUpperCase()}</span>
          <span><strong>Status:</strong> ${bill.status.toUpperCase()}</span>
        </div>
      </div>

      <div style="margin-top:8px;font-size:${isThermal ? '10px' : '11px'};font-style:italic;">
        <strong>Amount in words:</strong> ${numberToWords(bill.grandTotal)}
      </div>

      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>Powered by ${siteName}</p>
        ${bill.notes ? `<p style="margin-top:4px;font-style:italic;">${bill.notes}</p>` : ''}
      </div>
    </body>
    </html>
  `;
};

// ============================================
// GENERATE BILL WHATSAPP MESSAGE
// ============================================
export const generateBillWhatsApp = (
  bill: Bill,
  siteName: string,
): string => {
  const cleanPhone = (bill.customerMobile || '').replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;

  const itemsText = bill.items
    .map((it, i) => `${i + 1}. ${it.name} × ${it.quantity} = ₹${(it.quantity * it.rate).toFixed(2)}`)
    .join('\n');

  const text = encodeURIComponent(
    `🧾 *BILL RECEIPT*\n` +
    `*${bill.vleCenterName}*\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `📄 Bill No: ${bill.billNumber}\n` +
    `📅 Date: ${bill.date}\n` +
    `👤 Customer: ${bill.customerName}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `*ITEMS:*\n${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `Subtotal: ₹${bill.subtotal.toFixed(2)}\n` +
    (bill.discountAmount > 0 ? `Discount: -₹${bill.discountAmount.toFixed(2)}\n` : '') +
    (bill.gstEnabled && bill.totalGst > 0 ? `CGST: ₹${bill.cgst.toFixed(2)}\nSGST: ₹${bill.sgst.toFixed(2)}\n` : '') +
    `*GRAND TOTAL: ₹${bill.grandTotal.toFixed(2)}*\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `Payment: ${bill.paymentMode.toUpperCase()}\n` +
    `Status: ${bill.status.toUpperCase()}\n\n` +
    `Thank you for your business! 🙏\n` +
    `*${siteName}*`
  );

  return `https://wa.me/${phoneWithCountry}?text=${text}`;
};
