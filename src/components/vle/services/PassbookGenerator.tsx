import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { FileText, Download, X, Loader2, Image as ImageIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PassbookGeneratorProps {
  onClose: () => void;
  bankName?: 'Airtel' | 'Paytm' | 'Fino';
}

const PassbookGenerator: React.FC<PassbookGeneratorProps> = ({ onClose, bankName = 'Airtel' }) => {
  const { showNotification, currentUser } = useApp();
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

      // 1. Background Color (Red for Airtel, Blue for Paytm, etc.)
      const bankColor = bankName === 'Airtel' ? [227, 28, 38] : [0, 56, 134];
      doc.setFillColor(bankColor[0], bankColor[1], bankColor[2]);
      doc.rect(0, 0, pageWidth, 15, 'F');

      // 2. Bank Name Header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${bankName} Payments Bank`, pageWidth / 2, 10, { align: 'center' });

      // 3. Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('Passbook Front Page', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('(For Printing on Passbook)', pageWidth / 2, 36, { align: 'center' });

      // 4. Customer Details Table
      const tableData = [
        ['CIF Number', formData.cifNumber || 'NA', 'Account Holder Name', formData.accountHolderName || 'NA'],
        ['Account Opening Date', formData.accountOpeningDate || 'NA', 'Account Number', formData.accountNumber || 'NA'],
        ['A/C Type', formData.accountType || 'NA', 'Passbook Issue Date', formData.passbookIssueDate || 'NA'],
        ['PAN Number', formData.panNumber || 'NA', 'Aadhaar Number', formData.aadhaarNumber || 'NA'],
        ['Mobile Number', formData.mobileNumber || 'NA', 'PIN Code', formData.pinCode || 'NA'],
        ['S/o, W/o, D/o', formData.sonOf || 'NA', 'Branch Name', `${bankName} Payments Bank`],
        ['Address', formData.address || 'NA', 'Branch Code', '000001'],
        ['BC Name', formData.bcName || 'NA', 'BC Location', formData.bcLocation || 'NA'],
      ];

      autoTable(doc, {
        startY: 45,
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', cellWidth: 40 },
          3: { cellWidth: 55 },
        },
      });

      // 5. Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.text(`IFSC CODE: ${bankName === 'Airtel' ? 'AIRP0000001' : 'PAYT0000001'}`, 15, finalY);
      doc.text(`Branch Address: ${bankName} Center, Gurgaon, Haryana`, 15, finalY + 5);
      doc.text(`Contact: 124 4222222`, 15, finalY + 10);

      // 6. Save PDF
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
        
        {/* Header */}
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

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Opening Date</label>
            <input
              type="date"
              value={formData.accountOpeningDate}
              onChange={(e) => updateField('accountOpeningDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CIF Number</label>
            <input
              type="text"
              value={formData.cifNumber}
              onChange={(e) => updateField('cifNumber', e.target.value)}
              placeholder="Enter CIF Number"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => updateField('accountNumber', e.target.value)}
              placeholder="Enter Account Number"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
            <input
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => updateField('accountHolderName', e.target.value)}
              placeholder="Enter Account Holder Name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">S/o, W/o, D/o</label>
            <input
              type="text"
              value={formData.sonOf}
              onChange={(e) => updateField('sonOf', e.target.value)}
              placeholder="Enter Father/Husband Name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              rows={2}
              placeholder="Enter Full Address"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
            <input
              type="text"
              value={formData.pinCode}
              onChange={(e) => updateField('pinCode', e.target.value)}
              placeholder="Enter PIN Code"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
            <input
              type="text"
              value={formData.panNumber}
              onChange={(e) => updateField('panNumber', e.target.value)}
              placeholder="Enter PAN Number (or NA)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number</label>
            <input
              type="text"
              value={formData.aadhaarNumber}
              onChange={(e) => updateField('aadhaarNumber', e.target.value)}
              placeholder="Enter Aadhaar Number"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
            <input
              type="text"
              value={formData.mobileNumber}
              onChange={(e) => updateField('mobileNumber', e.target.value)}
              placeholder="Enter Mobile Number"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
            <select
              value={formData.accountType}
              onChange={(e) => updateField('accountType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Suraksha Savings Account">Suraksha Savings Account</option>
              <option value="Savings Account">Savings Account</option>
              <option value="Current Account">Current Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Passbook Issue Date</label>
            <input
              type="date"
              value={formData.passbookIssueDate}
              onChange={(e) => updateField('passbookIssueDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">BC Name</label>
            <input
              type="text"
              value={formData.bcName}
              onChange={(e) => updateField('bcName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">BC Location</label>
            <input
              type="text"
              value={formData.bcLocation}
              onChange={(e) => updateField('bcLocation', e.target.value)}
              placeholder="Enter BC Location"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={generatePDF}
          disabled={loading || !formData.accountNumber || !formData.accountHolderName}
          className={`w-full mt-6 py-4 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
            bankName === 'Airtel' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="w-5 h-5" /> Generate & Download PDF</>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-3">
          Wallet se ₹5 deduct honge. PDF automatically download ho jayegi.
        </p>
      </div>
    </div>
  );
};

export default PassbookGenerator;
