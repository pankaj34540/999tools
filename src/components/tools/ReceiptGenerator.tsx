import React, { useState } from 'react';
import { Printer, Download, QrCode, CheckCircle, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReceiptGeneratorProps {
  onClose?: () => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ onClose }) => {
  const { activeVle, siteConfig } = useApp();

  const [customerName, setCustomerName] = useState('Rahul Verma');
  const [customerMobile, setCustomerMobile] = useState('9876543210');
  const [serviceName, setServiceName] = useState('SSC GD Constable 2026 Form Fill Up');
  const [totalAmount, setTotalAmount] = useState<number>(150);
  const [paidAmount, setPaidAmount] = useState<number>(150);
  const [deliveryDate, setDeliveryDate] = useState('14/09/2026, 05:00 PM');
  const [tokenNo] = useState(() => '999-TK-' + Math.floor(1000 + Math.random() * 9000));
  const [remarks, setRemarks] = useState('Candidate photo & sign uploaded. Fee paid via UPI.');

  const centerTitle = activeVle?.centerName || '999tools Cyber Cafe & CSC Center';
  const vleCode = activeVle?.vleId || 'VLE-999-1001';
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="receipt-generator-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Receipt className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Customer Job Token & Bill Generator</h2>
            <p className="text-xs text-emerald-100">
              Print thermal 80mm or standard bill slip with token QR code & balance status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Form Controls */}
        <div className="lg:col-span-5 p-5 bg-slate-50 border-r border-slate-200 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-500 font-bold uppercase">Customer Name:</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold uppercase">Mobile Number:</label>
              <input
                type="text"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold uppercase">Service Description:</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-bold uppercase">Total Bill (₹):</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-bold uppercase">Amount Paid (₹):</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold uppercase">Expected Ready / Delivery Date:</label>
              <input
                type="text"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-bold uppercase">Work Notes / Instructions:</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Receipt Slip Preview */}
        <div className="lg:col-span-7 p-6 bg-slate-200 flex justify-center items-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[360px] bg-white border border-slate-300 shadow-2xl p-6 rounded-lg text-slate-900 font-mono text-xs"
          >
            {/* Slip Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h3 className="font-bold text-sm tracking-tight uppercase text-slate-900">{centerTitle}</h3>
              <p className="text-[10px] text-slate-600">CSC / Cyber Cafe Partner ID: {vleCode}</p>
              <p className="text-[10px] text-slate-500">Powered by {siteConfig.siteName}</p>
              <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold text-[11px]">
                TOKEN: {tokenNo}
              </div>
            </div>

            {/* Date and Customer */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile:</span>
                <span>{customerMobile}</span>
              </div>
            </div>

            {/* Service & Charges */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2 space-y-1 text-[11px]">
              <div className="font-semibold text-slate-800">{serviceName}</div>
              <div className="flex justify-between pt-1">
                <span>Total Fee:</span>
                <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span className="font-bold">₹{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-700">
                <span>Balance Due:</span>
                <span>₹{balanceDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery & Notes */}
            <div className="space-y-1 text-[10px] text-slate-600 border-b border-dashed border-slate-300 pb-3 mb-3">
              <div><strong>Delivery:</strong> {deliveryDate}</div>
              {remarks && <div><strong>Note:</strong> {remarks}</div>}
            </div>

            {/* Barcode & Verification */}
            <div className="text-center space-y-2">
              <div className="inline-block p-1 bg-slate-50 border border-slate-200 rounded">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=TOKEN:${tokenNo}|CUST:${customerName}|DUE:${balanceDue}`}
                  alt="QR Verification"
                  className="w-20 h-20 mx-auto"
                />
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">
                Scan QR to verify job receipt online on {siteConfig.siteName}. Please bring this token slip during collection.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
