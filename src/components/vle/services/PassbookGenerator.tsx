import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { FileText, Download, X, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface PassbookGeneratorProps {
  onClose: () => void;
  bankName?: 'Airtel' | 'Paytm' | 'Fino';
}

const PassbookGenerator: React.FC<PassbookGeneratorProps> = ({ onClose, bankName = 'Airtel' }) => {
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(false);

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

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Watermark (Background)
      doc.setTextColor(245, 245, 245);
      doc.setFontSize(60);
      doc.setFont('helvetica', 'bold');
      doc.text('airtel Payments Bank', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });

      // 2. Header (Logo and Title)
      doc.setTextColor(227, 28, 38); // Airtel Red
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('airtel', 15, 20);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Payments Bank', 15, 26);

      // 3. Left Column (CIF, Name, Address, Acc No, IFSC)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      let y = 40;

      doc.setFont('helvetica', 'bold');
      doc.text(`CIF NO: ${formData.cifNumber || 'NA'}`, 15, y);
      y += 7;
      
      doc.text(`A/C HOLDER NAME: ${formData.accountHolderName || 'NA'}`, 15, y);
      y += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`ADDRESS: ${formData.address || 'NA'}`, 15, y);
      y += 7;

      doc.text(`ACCOUNT NUMBER: ${formData.accountNumber || 'NA'}`, 15, y);
      y += 7;

      doc.text(`IFSC CODE: ${bankName === 'Airtel' ? 'AIRP0000001' : 'NA'}`, 15, y);

      // 4. Right Column (Photo Copy Box)
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(140, 35, 40, 45); // Box
      
      // Watermark in Photo Box
      doc.setTextColor(240, 240, 240);
      doc.setFontSize(20);
      doc.text('airtel', 160, 55, { align: 'center', angle: 45 });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PHOTO COPY', 160, 65, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('(1.1 inc X 1.3inc)', 160, 70, { align: 'center' });

      // 5. Bottom Details (Dates, PAN, Aadhaar, Type)
      y = 100;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`A/C OPENING DATE: ${formData.accountOpeningDate || 'NA'}`, 15, y);
      doc.text(`PASSBOOK ISSUE DATE: ${formData.passbookIssueDate || 'NA'}`, 85, y);
      y += 7;

      doc.text(`PAN NUMBER: ${formData.panNumber || 'NA'}`, 15, y);
      doc.text(`AADHAAR NUMBER: ${formData.aadhaarNumber || 'NA'}`, 85, y);
      y += 7;

      doc.text(`TYPE OF ACCOUNT: ${formData.accountType || 'NA'}`, 15, y);

      // 6. Footer (Branch Details)
      y += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('BRANCH NAME: Airtel Payments Bank, Gurgaon', 15, y);
      doc.text('BRANCH CODE: 000001', 15, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('BRANCH ADDRESS: Airtel Center, Plat No- 16, Udyog Vihar, Phase- 4, Gurgaon, Haryana', 15, y + 10);
      doc.text('CONTACT: 124 4222222', 15, y + 15);

      // 7. BC Details
      y += 25;
      doc.setFont('helvetica', 'bold');
      doc.text(`BC NAME: ${formData.bcName || 'NA'}`, 15, y);
      y += 7;
      doc.text(`BC LOCATION: ${formData.bcLocation || 'NA'}`, 15, y);

      // 8. Save PDF
      doc.save(`${bankName}_Passbook_${formData.accountNumber || 'Unknown'}.pdf`);
      
      showNotification('✅ PDF Generated Successfully!');
      onClose();
    } catch (err) {
      console.error('PDF generation error:', err);
      showNotification('❌ Failed to generate PDF.');
    } finally {
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
              <p className="text-xs text-slate-500">Customer details bharein</p>
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

        <button onClick={generatePDF} disabled={loading || !formData.accountNumber || !formData.accountHolderName} className={`w-full mt-6 py-4 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${bankName === 'Airtel' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'} disabled:opacity-50 disabled:cursor-not-allowed`}>
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</> : <><Download className="w-5 h-5" /> Generate & Download PDF</>}
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-3">Wallet se ₹5 deduct honge. PDF automatically download ho jayegi.</p>
      </div>
    </div>
  );
};

export default PassbookGenerator;
