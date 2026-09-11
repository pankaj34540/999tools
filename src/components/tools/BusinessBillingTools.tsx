import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Hash, 
  Coins, 
  Calculator, 
  TrendingUp, 
  FileCheck2, 
  ShieldAlert, 
  Ticket, 
  Copy, 
  Check, 
  Printer, 
  Download,
  Percent
} from 'lucide-react';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

interface ToolProps {
  onClose?: () => void;
}

// -------------------------------------------------------------
// Helper: Convert Number to Indian Words
// -------------------------------------------------------------
function convertNumberToIndianWords(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString().length > 9 ? parseFloat(num.toString().slice(0, 9)) : num) === 0) return 'Zero';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + ' Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + ' Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + ' Thousand ' : '';
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + ' Hundred ' : '';
  str +=
    Number(n[5]) !== 0
      ? (str !== '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) + ' '
      : '';
  return str.trim();
}

// -------------------------------------------------------------
// #036: Number to Words Converter
// -------------------------------------------------------------
export const NumberToWordsTool: React.FC<ToolProps> = () => {
  const [amount, setAmount] = useState<number>(18500);
  const [words, setWords] = useState<string>('Rupees Eighteen Thousand Five Hundred Only');
  const [copied, setCopied] = useState(false);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    if (amount >= 0) {
      const text = convertNumberToIndianWords(amount);
      setWords(`Rupees ${text} Only`);
    }
  }, [amount]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #036
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Number to Words Converter (Indian Rupee Format)
          </h2>
          <p className="text-xs text-slate-500">
            Cheque, bank deposit challan, and bill invoice number-to-words generator.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Enter Amount in Figures (₹):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg font-black text-xl text-blue-700"
          />
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-300 space-y-2">
          <span className="text-slate-500 font-semibold block text-[11px]">In Words (Formal Indian English):</span>
          <div className="text-base font-bold text-slate-900 leading-snug">{words}</div>
        </div>

        <button
          onClick={() => {
            triggerDirectLink();
            navigator.clipboard.writeText(words);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Words for Cheque / Form'}</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #037: Gaon & Vyapar Byaj / Interest Calculator
// -------------------------------------------------------------
export const ByajCalculatorTool: React.FC<ToolProps> = () => {
  const [principal, setPrincipal] = useState<number>(50000);
  const [rate, setRate] = useState<number>(2); // 2% per month (Gaon Saikda)
  const [calcType, setCalcType] = useState<'gaon' | 'annual'>('gaon');
  const [months, setMonths] = useState<number>(6);

  const interest = calcType === 'gaon' ? principal * (rate / 100) * months : (principal * (rate / 100) * months) / 12;

  const total = principal + interest;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #037
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Gaon & Vyapar Byaj (Interest) Calculator
          </h2>
          <p className="text-xs text-slate-500">
            Calculate village monthly interest (₹2, ₹3 saikda) & bank annual simple interest.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setCalcType('gaon')}
            className={`flex-1 py-2 rounded-lg font-bold border ${
              calcType === 'gaon' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Gaon Byaj (Mahina Saikda)
          </button>
          <button
            onClick={() => setCalcType('annual')}
            className={`flex-1 py-2 rounded-lg font-bold border ${
              calcType === 'annual' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Annual Bank Interest (%)
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Mool Dhan (₹):</label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Rate ({calcType === 'gaon' ? '% / Mahina' : '% / Saal'}):
            </label>
            <input
              type="number"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Total Mahina:</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-lg font-bold"
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Kul Byaj (Total Interest):</span>
            <span className="font-bold text-rose-600 text-base">₹{interest.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-black text-slate-900">
            <span>Kul Rashi (Mool + Byaj):</span>
            <span className="text-emerald-700">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #038: GST Calculator (Add / Remove GST)
// -------------------------------------------------------------
export const GstCalculatorTool: React.FC<ToolProps> = () => {
  const [amount, setAmount] = useState<number>(1000);
  const [rate, setRate] = useState<number>(18);
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const gstAmount = mode === 'add' ? (amount * rate) / 100 : amount - amount / (1 + rate / 100);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const finalAmount = mode === 'add' ? amount + gstAmount : amount - gstAmount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #038
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            GST Tax Calculator (Add / Reverse GST)
          </h2>
          <p className="text-xs text-slate-500">Calculates CGST + SGST or IGST split with 1-click reverse GST.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('add')}
            className={`flex-1 py-2 rounded-lg font-bold border ${
              mode === 'add' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Add GST (Exclusive)
          </button>
          <button
            onClick={() => setMode('remove')}
            className={`flex-1 py-2 rounded-lg font-bold border ${
              mode === 'remove' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Remove GST (Inclusive)
          </button>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Base Amount (₹):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg font-black text-lg"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Select GST Slab:</label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 12, 18, 28].map((s) => (
              <button
                key={s}
                onClick={() => setRate(s)}
                className={`py-2 rounded-lg font-bold border ${
                  rate === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                }`}
              >
                {s}% GST
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>CGST ({rate / 2}%):</span>
            <span className="font-bold">₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>SGST ({rate / 2}%):</span>
            <span className="font-bold">₹{sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 border-t pt-2">
            <span>Total GST Tax:</span>
            <span className="font-bold text-rose-600">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 border-t pt-2">
            <span>Final Gross Amount:</span>
            <span className="text-emerald-700">₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #039: Discount & Profit Margin Calculator
// -------------------------------------------------------------
export const DiscountMarginTool: React.FC<ToolProps> = () => {
  const [cost, setCost] = useState<number>(200);
  const [sellingPrice, setSellingPrice] = useState<number>(300);

  const profit = sellingPrice - cost;
  const marginPercent = cost > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';
  const markupPercent = cost > 0 ? ((profit / cost) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #039
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Discount & Shop Margin Profit Calculator
          </h2>
          <p className="text-xs text-slate-500">Calculate net profit and margins on cyber cafe products.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Purchase / Cost Price (₹):</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Selling Price (₹):</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Net Profit:</span>
            <span className="font-bold text-emerald-600 text-base">₹{profit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Profit Margin (% of Selling Price):</span>
            <span className="font-bold text-blue-700">{marginPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Markup (% over Cost):</span>
            <span className="font-bold text-purple-700">{markupPercent}%</span>
          </div>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #040: 11-Month Rent Agreement Printable Draft
// -------------------------------------------------------------
export const RentAgreementDraftTool: React.FC<ToolProps> = () => {
  const [landlord, setLandlord] = useState('Shri Ramesh Chandra');
  const [tenant, setTenant] = useState('Ankit Sharma');
  const [rent, setRent] = useState(6500);
  const [address, setAddress] = useState('Shop No. 4, Main Market, Varanasi');
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handlePrint = () => {
    triggerDirectLink();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Rent Agreement Draft</title>
            <style>
              body { font-family: serif; padding: 40px; line-height: 1.8; color: #111; max-width: 800px; margin: auto; }
              h1 { text-align: center; text-decoration: underline; font-size: 20px; }
              .stamp-space { height: 180px; border: 1px dashed #ccc; text-align: center; line-height: 180px; color: #999; margin-bottom: 20px; }
              .clause { margin-bottom: 12px; }
              .sign { display: flex; justify-content: space-between; margin-top: 60px; }
            </style>
          </head>
          <body>
            <div class="stamp-space">[ SPACE FOR ₹100 NON-JUDICIAL STAMP PAPER ]</div>
            <h1>RENT AGREEMENT (11 MONTHS)</h1>
            <p>This Rent Agreement is made and executed on this <strong>${new Date().toLocaleDateString('en-IN')}</strong> between:</p>
            <p><strong>FIRST PARTY (Landlord):</strong> ${landlord}</p>
            <p><strong>AND SECOND PARTY (Tenant):</strong> ${tenant}</p>
            <div class="clause">1. That the tenancy is for a fixed period of 11 months commencing from today.</div>
            <div class="clause">2. That the monthly agreed rent of the premises situated at <strong>${address}</strong> is <strong>₹${rent}/-</strong> per month payable on or before 7th of every month.</div>
            <div class="clause">3. That electricity and water charges shall be paid extra by the Tenant as per meter reading.</div>
            <div class="clause">4. That the Tenant shall not sublet or assign the rented property to any third party.</div>
            <div class="sign">
              <div>Signature of Landlord<br/>(${landlord})</div>
              <div>Signature of Tenant<br/>(${tenant})</div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #040
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            11-Month Rent Agreement Printable Draft
          </h2>
          <p className="text-xs text-slate-500">Standard legal draft ready to print directly onto ₹100 stamp paper.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-3 max-w-lg mx-auto">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Landlord Name (Makaan Malik):</label>
          <input
            type="text"
            value={landlord}
            onChange={(e) => setLandlord(e.target.value)}
            className="w-full px-3 py-1.5 border rounded-lg"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Tenant Name (Kirayedaar):</label>
          <input
            type="text"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="w-full px-3 py-1.5 border rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Monthly Rent (₹):</label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Premises Address:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Rent Agreement (Formatted for Stamp Paper)</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #041: Lost Document & Police Complaint Draft Formats
// -------------------------------------------------------------
export const AffidavitFormatsTool: React.FC<ToolProps> = () => {
  const [docType, setDocType] = useState<'marksheet' | 'aadhaar' | 'name_change'>('marksheet');
  const [applicant, setApplicant] = useState('Rahul Verma');
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handlePrint = () => {
    triggerDirectLink();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head><title>Official Affidavit Draft</title></head>
          <body style="font-family: serif; padding: 40px; line-height: 1.8;">
            <h2 style="text-align: center; text-decoration: underline;">AFFIDAVIT / SELF DECLARATION</h2>
            <p>I, <strong>${applicant}</strong>, resident of India, do hereby solemnly affirm and declare on oath as under:</p>
            <p>1. That I had lost my original ${docType.toUpperCase()} while traveling and despite best efforts, it could not be traced.</p>
            <p>2. That the said document has not been misused or pledged anywhere for any illegal purpose.</p>
            <p>3. That I am submitting this affidavit to obtain a duplicate copy.</p>
            <div style="margin-top: 60px; text-align: right;">DEPONENT<br/>(${applicant})</div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #041
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Lost Document Affidavit & Police GD Draft Formats
          </h2>
          <p className="text-xs text-slate-500">
            Ready-to-print legal drafts for lost marksheet, lost Aadhaar, and police lost property report.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Select Affidavit Type:</label>
          <div className="flex gap-2">
            {[
              { id: 'marksheet', label: 'Lost Marksheet' },
              { id: 'aadhaar', label: 'Lost Aadhaar' },
              { id: 'name_change', label: 'Name Correction' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDocType(t.id as any)}
                className={`flex-1 py-1.5 rounded-lg font-bold border ${
                  docType === t.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Applicant Full Name:</label>
          <input
            type="text"
            value={applicant}
            onChange={(e) => setApplicant(e.target.value)}
            className="w-full px-3 py-1.5 border rounded-lg font-bold"
          />
        </div>

        <button
          onClick={handlePrint}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Complete Legal Affidavit Draft</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #042: Customer Queue Token Slip Maker
// -------------------------------------------------------------
export const TokenSlipMakerTool: React.FC<ToolProps> = () => {
  const [tokenNumber, setTokenNumber] = useState(42);
  const [cafeName, setCafeName] = useState('MAA DURGA CYBER CAFE');
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handlePrintToken = () => {
    triggerDirectLink();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Token Slip</title>
            <style>
              body { margin: 0; padding: 10px; font-family: monospace; width: 58mm; text-align: center; }
              .box { border: 2px dashed #000; padding: 10px; }
              .num { font-size: 40px; font-weight: bold; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="box">
              <div style="font-weight:bold;">${cafeName}</div>
              <div style="font-size:10px;">CUSTOMER QUEUE TOKEN</div>
              <div class="num">#${tokenNumber}</div>
              <div style="font-size:10px;">Please wait for your turn. Thank you!</div>
              <div style="font-size:9px;margin-top:5px;">Time: ${new Date().toLocaleTimeString()}</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      setTokenNumber((t) => t + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #042
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Customer Queue Token Slip Maker
          </h2>
          <p className="text-xs text-slate-500">
            Print numbered queue tokens on 58mm/80mm thermal paper during admit card and form rush days.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-sm mx-auto text-center">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Cyber Cafe Center Name:</label>
          <input
            type="text"
            value={cafeName}
            onChange={(e) => setCafeName(e.target.value)}
            className="w-full px-3 py-1.5 border rounded-lg text-center font-bold uppercase"
          />
        </div>

        <div className="p-4 bg-white rounded-xl border-2 border-dashed border-slate-400">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Token</span>
          <div className="text-5xl font-black text-slate-900 my-2">#{tokenNumber}</div>
          <span className="text-[11px] text-slate-600">Auto increments after each print</span>
        </div>

        <button
          onClick={handlePrintToken}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-sm"
        >
          <Ticket className="w-5 h-5" />
          <span>Print Token #{tokenNumber}</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};
