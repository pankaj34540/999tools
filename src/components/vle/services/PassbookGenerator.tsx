import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { FileText, X, Loader2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { doc, getDoc, updateDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';

interface PassbookGeneratorProps {
  onClose: () => void;
  bankName?: string;
  onSuccess?: () => void;
}

const PassbookGenerator: React.FC<PassbookGeneratorProps> = ({ onClose, bankName = 'Airtel', onSuccess }) => {
  const { showNotification, currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templateImage, setTemplateImage] = useState<string>('');
  const [fetchingTemplate, setFetchingTemplate] = useState(true);

  const SERVICE_PRICE = 5;

  const [formData, setFormData] = useState({
    accountOpeningDate: '',
    cifNumber: '',
    accountNumber: '',
    accountHolderName: '',
    sonOf: '',
    address: '',
    pinCode: '',
    panNumber: '',
    aadhaarNumber: '',
    mobileNumber: '',
    accountType: 'Suraksha Savings Account',
    passbookIssueDate: '',
    bcName: 'E Suvidha Kendra',
    bcLocation: '',
  });

  // 🆕 Fetch the uploaded image from Firestore
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const q = query(collection(db, 'passbookTemplates'), where('bankName', '==', bankName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (data.templateImage) {
            setTemplateImage(data.templateImage);
          }
        }
      } catch (err) {
        console.error('Error fetching template:', err);
      } finally {
        setFetchingTemplate(false);
      }
    };
    fetchTemplate();
  }, [bankName]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // 🆕 PDF Build with Image Overlay
  const buildPdf = () => {
    // A4 size in mm (Standard)
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // 1. Image ko poore page par background mein daalo
    if (templateImage) {
      doc.addImage(templateImage, 'JPEG', 0, 0, 210, 297); // 210x297 is A4 size in mm
    }

    // 2. Text Coordinates (X aur Y adjust karna padega image ke hisaab se)
    // NOTE: Ye coordinates tumhari image ke hisaab se maine guess kiye hain. 
    // Agar thoda idhar-udhar lage toh in numbers ko change karna.
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // CIF NO (Image ke hisaab se X=25, Y=65)
    doc.text(formData.cifNumber || 'NA', 45, 65);

    // A/C HOLDER NAME (X=25, Y=72)
    doc.text(formData.accountHolderName, 50, 72);

    // ADDRESS (X=25, Y=78)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(formData.address || 'NA', 40, 78);

    // ACCOUNT NUMBER (X=135, Y=72)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(formData.accountNumber, 155, 72);

    // IFSC CODE (X=135, Y=78)
    doc.text(formData.ifscCode || (bankName === 'Airtel' ? 'AIRP0000001' : 'NA'), 155, 78);

    // A/C OPENING DATE (X=50, Y=110)
    doc.setFontSize(9);
    doc.text(formData.accountOpeningDate || 'NA', 55, 110);

    // PAN (X=50, Y=117)
    doc.text(formData.panNumber || 'NA', 55, 117);

    // AADHAAR (X=50, Y=123)
    doc.text(formData.aadhaarNumber || 'NA', 55, 123);

    // PASSBOOK ISSUE DATE (X=55, Y=113)
    doc.text(formData.passbookIssueDate || 'NA', 75, 113);

    // BC NAME (X=25, Y=150)
    doc.text(formData.bcName || 'NA', 50, 150);

    // BC LOCATION (X=130, Y=150)
    doc.text(formData.bcLocation || 'NA', 155, 150);

    return doc;
  };

  const handleGenerateAndSave = async () => {
    if (!currentUser) {
      showNotification('Please login first');
      return;
    }
    if (!formData.accountNumber || !formData.accountHolderName) {
      setError('Account Number and Holder Name required');
      return;
    }
    if (!templateImage) {
      setError('Template image not found. Owner se sampark karein.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'userAccounts', currentUser.id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User data not found');

      const currentBalance = userSnap.data().walletBalance || 0;
      if (currentBalance < SERVICE_PRICE) {
        throw new Error(`Insufficient balance. Need ₹${SERVICE_PRICE}, you have ₹${currentBalance}.`);
      }

      // Build PDF
      const pdfDoc = buildPdf();
      const pdfBlob = pdfDoc.output('blob');

      // Convert to Base64
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Save History
      await addDoc(collection(db, 'passbookHistory'), {
        userId: currentUser.id,
        userEmail: currentUser.email,
        bankName,
        customerName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        cifNumber: formData.cifNumber,
        formData,
        pdfBase64: base64data,
        price: SERVICE_PRICE,
        createdAt: new Date().toISOString(),
      });

      // Deduct Wallet
      const newBalance = currentBalance - SERVICE_PRICE;
      await updateDoc(userRef, { walletBalance: newBalance });

      // Add Wallet Transaction
      await addDoc(collection(db, 'walletTransactions'), {
        userId: currentUser.id,
        type: 'debit',
        amount: SERVICE_PRICE,
        description: `${bankName} Passbook Generated (${formData.accountNumber})`,
        createdAt: new Date().toISOString(),
      });

      // Download PDF
      pdfDoc.save(`${bankName}_Passbook_${formData.accountNumber}.pdf`);

      showNotification('✅ Passbook downloaded! ₹5 deducted from wallet.');
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Passbook error:', err);
      setError(err.message || 'Failed to generate passbook');
      setLoading(false);
    }
  };

  if (fetchingTemplate) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{bankName} Passbook Print</h2>
              <p className="text-xs text-slate-500">Fee: ₹{SERVICE_PRICE} (Wallet se katega)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Opening Date</label>
            <input type="date" value={formData.accountOpeningDate} onChange={(e) => updateField('accountOpeningDate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CIF Number</label>
            <input type="text" value={formData.cifNumber} onChange={(e) => updateField('cifNumber', e.target.value)} placeholder="Enter CIF Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
            <input type="text" value={formData.accountNumber} onChange={(e) => updateField('accountNumber', e.target.value)} placeholder="Enter Account Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
            <input type="text" value={formData.accountHolderName} onChange={(e) => updateField('accountHolderName', e.target.value)} placeholder="Enter Account Holder Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
            <textarea value={formData.address} onChange={(e) => updateField('address', e.target.value)} rows={2} placeholder="Enter Full Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
            <input type="text" value={formData.panNumber} onChange={(e) => updateField('panNumber', e.target.value)} placeholder="Enter PAN Number (or NA)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number</label>
            <input type="text" value={formData.aadhaarNumber} onChange={(e) => updateField('aadhaarNumber', e.target.value)} placeholder="Enter Aadhaar Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Passbook Issue Date</label>
            <input type="date" value={formData.passbookIssueDate} onChange={(e) => updateField('passbookIssueDate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">BC Name</label>
            <input type="text" value={formData.bcName} onChange={(e) => updateField('bcName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">BC Location</label>
            <input type="text" value={formData.bcLocation} onChange={(e) => updateField('bcLocation', e.target.value)} placeholder="Enter BC Location" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-700 font-semibold">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerateAndSave}
          disabled={loading}
          className="w-full mt-6 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
          ) : (
            <>Generate PDF (₹{SERVICE_PRICE})</>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-3">
          Wallet se ₹{SERVICE_PRICE} deduct honge. PDF download + history mein save hogi.
        </p>
      </div>
    </div>
  );
};

export default PassbookGenerator;
