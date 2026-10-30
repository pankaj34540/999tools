import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { FileText, X, Loader2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../../config/firebase';

interface PassbookGeneratorProps {
  onClose: () => void;
  bankName?: 'Airtel' | 'Paytm' | 'Fino';
  onSuccess?: () => void;
}

const PassbookGenerator: React.FC<PassbookGeneratorProps> = ({ onClose, bankName = 'Airtel', onSuccess }) => {
  const { showNotification, currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
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

    setLoading(true);
    setError('');

    try {
      // 🔥 1. Check Wallet Balance
      const userRef = doc(db, 'userAccounts', currentUser.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('User data not found');
      }

      const currentBalance = userSnap.data().walletBalance || 0;
      if (currentBalance < SERVICE_PRICE) {
        throw new Error(`Insufficient balance. Need ₹${SERVICE_PRICE}, you have ₹${currentBalance}.`);
      }

      // 🔥 2. Deduct ₹5 from Wallet
      const newBalance = currentBalance - SERVICE_PRICE;
      await updateDoc(userRef, { walletBalance: newBalance });

      // 🔥 3. Save Transaction Record
      await addDoc(collection(db, 'walletTransactions'), {
        userId: currentUser.id,
        type: 'debit',
        amount: SERVICE_PRICE,
        description: `${bankName} Passbook Generated`,
        createdAt: new Date().toISOString(),
      });

      // 🔥 4. Generate PDF Blob
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Watermark
      doc.setTextColor(245, 245, 245);
      doc.setFontSize(60);
      doc.setFont('helvetica', 'bold');
      doc.text('airtel Payments Bank', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });

      // Red Header
      doc.setFillColor(227, 28, 38);
      doc.rect(0, 0, pageWidth, 20, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('airtel', 15, 13);
      doc.setFontSize(10);
      doc.text('Payments Bank', 40, 13);

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Passbook Front Page', pageWidth / 2, 35, { align: 'center' });

      // Details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 50;

      doc.setFont('helvetica', 'bold');
      doc.text(`CIF NO : ${formData.cifNumber || 'NA'}`, 15, y);
      y += 8;
      
      doc.text(`A/C HOLDER NAME : ${formData.accountHolderName}`, 15, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`ADDRESS : ${formData.address || 'NA'}`, 15, y);
      y += 8;

      doc.text(`ACCOUNT NUMBER : ${formData.accountNumber}`, 15, y);
      y += 8;

      doc.text(`IFSC CODE : ${bankName === 'Airtel' ? 'AIRP0000001' : 'NA'}`, 15, y);

      // Photo Box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(145, 45, 40, 50);
      
      doc.setTextColor(240, 240, 240);
      doc.setFontSize(25);
      doc.text('airtel', 165, 70, { align: 'center', angle: 45 });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PHOTO COPY', 165, 80, { align: 'center' });
      doc.setFontSize(7);
      doc.text('(1.1 inc X 1.3inc)', 165, 85, { align: 'center' });

      // Bottom details
      y = 110;
      doc.setFontSize(9);
      doc.text(`A/C OPENING DATE : ${formData.accountOpeningDate || 'NA'}`, 15, y);
      doc.text(`PASSBOOK ISSUE DATE : ${formData.passbookIssueDate || 'NA'}`, 110, y);
      y += 7;
      doc.text(`PAN NUMBER : ${formData.panNumber || 'NA'}`, 15, y);
      doc.text(`AADHAAR NUMBER : ${formData.aadhaarNumber || 'NA'}`, 110, y);
      y += 7;
      doc.text(`TYPE OF ACCOUNT : ${formData.accountType || 'NA'}`, 15, y);

      // Branch info
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text(`BRANCH NAME : ${bankName} Payments Bank, Gurgaon`, 15, y);
      y += 5;
      doc.text(`BRANCH CODE : 000001`, 15, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`BRANCH ADDRESS : Airtel Center, Plat No- 16, Udyog Vihar, Phase- 4, Gurgaon, Haryana`, 15, y);
      y += 5;
      doc.text(`CONTACT : 124 4222222`, 15, y);

      // BC info
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`BC NAME : ${formData.bcName || 'NA'}`, 15, y);
      y += 5;
      doc.text(`BC LOCATION : ${formData.bcLocation || 'NA'}`, 15, y);

      // 🔥 5. Save to Firestore (Passbook History)
      const pdfBlob = doc.output('blob');
      
      // Convert blob to base64 (for storage)
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        await addDoc(collection(db, 'passbookHistory'), {
          userId: currentUser.id,
          userEmail: currentUser.email,
          bankName,
          customerName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          cifNumber: formData.cifNumber,
          formData: formData,
          pdfBase64: base64data,
          price: SERVICE_PRICE,
          createdAt: new Date().toISOString(),
        });

        showNotification('✅ Passbook generated! ₹5 deducted from wallet.');
        setLoading(false);
        
        if (onSuccess) onSuccess();
        onClose();
      };

    } catch (err: any) {
      console.error('Passbook error:', err);
      setError(err.message || 'Failed to generate passbook');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bankName === 'Airtel' ? 'bg-red-600' : 'bg-blue-700'}`}>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">S/o, W/o, D/o</label>
            <input type="text" value={formData.sonOf} onChange={(e) => updateField('sonOf', e.target.value)} placeholder="Enter Father/Husband Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
            <textarea value={formData.address} onChange={(e) => updateField('address', e.target.value)} rows={2} placeholder="Enter Full Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
            <input type="text" value={formData.pinCode} onChange={(e) => updateField('pinCode', e.target.value)} placeholder="Enter PIN Code" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
            <input type="text" value={formData.mobileNumber} onChange={(e) => updateField('mobileNumber', e.target.value)} placeholder="Enter Mobile Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
            <select value={formData.accountType} onChange={(e) => updateField('accountType', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Suraksha Savings Account">Suraksha Savings Account</option>
              <option value="Savings Account">Savings Account</option>
              <option value="Current Account">Current Account</option>
            </select>
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
          className={`w-full mt-6 py-4 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
            bankName === 'Airtel' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
          ) : (
            <>Generate PDF (₹{SERVICE_PRICE})</>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-3">
          Wallet se ₹{SERVICE_PRICE} deduct honge. PDF history mein save hogi.
        </p>
      </div>
    </div>
  );
};

export default PassbookGenerator;
