import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VleOperator } from '../../types';
import { 
  Store, 
  QrCode, 
  CheckCircle2, 
  Printer, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Sparkles,
  Save,
  MessageSquare,
  Stamp,
  Download,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface ShopBrandingManagerProps {
  currentCenter: VleOperator;
  onOpenWatermarkTool?: () => void;
}

export const ShopBrandingManager: React.FC<ShopBrandingManagerProps> = ({ currentCenter, onOpenWatermarkTool }) => {
  const { updateVleProfile, showNotification, setActiveTool } = useApp();

  const [centerName, setCenterName] = useState(currentCenter.centerName);
  const [operatorName, setOperatorName] = useState(currentCenter.operatorName);
  const [mobile, setMobile] = useState(currentCenter.mobile);
  const [email, setEmail] = useState(currentCenter.email);
  const [address, setAddress] = useState(currentCenter.address || '');
  const [shopUpiId, setShopUpiId] = useState(currentCenter.shopUpiId || 'yourshop@upi');
  const [shopNoticeBanner, setShopNoticeBanner] = useState(
    currentCenter.shopNoticeBanner || '⚡ Instant Passport Photo (2 mins) • PVC Aadhaar Card • PAN & Voter Card Print Available Here'
  );

  // Watermark and rubber stamp state
  const [shopWatermarkText, setShopWatermarkText] = useState(
    currentCenter.shopWatermarkText || `PROCESSED BY ${currentCenter.centerName.toUpperCase()}`
  );
  const [shopWatermarkPurpose, setShopWatermarkPurpose] = useState(
    currentCenter.shopWatermarkPurpose || 'VERIFIED & ATTESTED COPY'
  );
  const [shopStampColor, setShopStampColor] = useState(
    currentCenter.shopStampColor || '#1e40af'
  );
  const [shopWatermarkStampEnabled, setShopWatermarkStampEnabled] = useState(
    currentCenter.shopWatermarkStampEnabled ?? true
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateVleProfile(currentCenter.id, {
      centerName,
      operatorName,
      mobile,
      email,
      address,
      shopUpiId,
      shopNoticeBanner,
      shopWatermarkText,
      shopWatermarkPurpose,
      shopStampColor,
      shopWatermarkStampEnabled,
    });
    showNotification('Shop Branding & Watermark settings saved successfully!');
  };

  const handleDownloadShopStamp = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = 200;
    const cy = 200;
    const radius = 160;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.05);

    ctx.strokeStyle = shopStampColor;
    ctx.fillStyle = shopStampColor;
    ctx.lineWidth = 3.5;

    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
    ctx.stroke();

    // Inner badge
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    // Text curved on arc helper
    const drawCurvedText = (text: string, r: number, startAngle: number, endAngle: number, inward: boolean) => {
      ctx.font = `bold ${Math.round(radius * 0.13)}px Arial, sans-serif`;
      const numChars = text.length;
      const angleStep = (endAngle - startAngle) / Math.max(numChars - 1, 1);

      for (let i = 0; i < numChars; i++) {
        const charAngle = startAngle + i * angleStep;
        ctx.save();
        ctx.rotate(charAngle);
        ctx.translate(0, inward ? -r : r);
        if (!inward) ctx.rotate(Math.PI);
        ctx.textAlign = 'center';
        ctx.textBaseline = inward ? 'bottom' : 'top';
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }
    };

    drawCurvedText(centerName.toUpperCase().slice(0, 36), radius - 14, -Math.PI * 0.72, -Math.PI * 0.28, true);
    drawCurvedText(
      (currentCenter.district || 'AUTHORIZED CSC VLE').toUpperCase().slice(0, 30),
      radius - 14,
      Math.PI * 0.28,
      Math.PI * 0.72,
      false
    );

    ctx.font = `bold ${Math.round(radius * 0.16)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', -radius + 18, 0);
    ctx.fillText('★', radius - 18, 0);

    ctx.font = `bold ${Math.round(radius * 0.14)}px Arial, sans-serif`;
    ctx.fillText('DIGITALLY VERIFIED', 0, -radius * 0.18);

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.05);
    ctx.lineTo(radius * 0.42, -radius * 0.05);
    ctx.stroke();

    ctx.font = `bold ${Math.round(radius * 0.13)}px Arial, sans-serif`;
    ctx.fillText(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 0, radius * 0.12);

    ctx.font = `900 ${Math.round(radius * 0.1)}px Arial, sans-serif`;
    ctx.fillText('AUTHORIZED CSC VLE', 0, radius * 0.28);

    ctx.restore();

    const link = document.createElement('a');
    link.download = `Shop_Rubber_Stamp_${centerName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('Official Cyber Cafe Stamp PNG downloaded!');
  };

  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `upi://pay?pa=${shopUpiId}&pn=${encodeURIComponent(centerName)}&cu=INR`
  )}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Lifetime VIP Member Feature
          </div>
          <h3 className="text-xl font-black">Shop Branding & Customer Counter UPI QR</h3>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Configure your shop's own UPI QR code, print header, and customer notice banner. All receipts and tokens printed from this portal will carry your shop's official branding!
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Print Shop UPI QR Standee</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customization Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Center Details & Receipt Header</span>
          </h4>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Center / Cyber Cafe Name *</label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operator Name *</label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shop Mobile / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Center Shop Address (For Receipt Footer)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop No. 4, Market Complex, Near Tehsil Gate"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
              <h5 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Your Center's UPI ID (Direct Customer Payments)</span>
              </h5>
              <p className="text-[11px] text-amber-800">
                Customers scanning your counter QR code or paying for services will send money directly to your own bank account!
              </p>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Your Shop's UPI ID *</label>
                <input
                  type="text"
                  required
                  value={shopUpiId}
                  onChange={(e) => setShopUpiId(e.target.value)}
                  placeholder="e.g. 9891234567@paytm or yourname@okaxis"
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Watermark & Official Stamp Settings */}
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                  <Stamp className="w-4 h-4 text-blue-700" />
                  <span>Official Rubber Stamp & Watermark Settings</span>
                </h5>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shopWatermarkStampEnabled}
                    onChange={(e) => setShopWatermarkStampEnabled(e.target.checked)}
                    className="rounded text-blue-600 accent-blue-600"
                  />
                  <span>Enable Shop Stamp</span>
                </label>
              </div>
              <p className="text-[11px] text-blue-800">
                Your shop name and digital seal can be stamped on customer documents, Aadhaar photocopies, and receipts to build trust and market your shop!
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Watermark Header / Shop Name</label>
                <input
                  type="text"
                  value={shopWatermarkText}
                  onChange={(e) => setShopWatermarkText(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-bold text-slate-900 uppercase text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Stamp Sub-text</label>
                  <input
                    type="text"
                    value={shopWatermarkPurpose}
                    onChange={(e) => setShopWatermarkPurpose(e.target.value.toUpperCase())}
                    placeholder="VERIFIED & ATTESTED"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Stamp Ink Color</label>
                  <select
                    value={shopStampColor}
                    onChange={(e) => setShopStampColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="#1e40af">Classic Violet Blue (Official)</option>
                    <option value="#b91c1c">Govt Stamp Red</option>
                    <option value="#047857">Forest Green</option>
                    <option value="#0f172a">Carbon Black</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Shop Notice / Service Marquee Banner</label>
              <input
                type="text"
                value={shopNoticeBanner}
                onChange={(e) => setShopNoticeBanner(e.target.value)}
                placeholder="⚡ Instant Passport Photo • PVC Cards • PAN Card • Color Photocopy"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Shop Branding, QR Code & Stamp</span>
            </button>
          </form>
        </div>

        {/* Right: Live Standee & Receipt Preview */}
        <div className="lg:col-span-5 space-y-5">
          {/* Standee QR Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 text-center shadow-lg relative overflow-hidden">
            <div className="bg-slate-900 text-white py-2 -mx-6 -mt-6 mb-4 px-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                Official UPI Payment Standee
              </span>
              <h4 className="font-black text-sm tracking-tight truncate">
                {centerName}
              </h4>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mb-3">
              <img
                src={dynamicQrUrl}
                alt="Shop UPI QR Standee"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <div className="text-xs font-mono font-black text-blue-900 bg-blue-50 py-1.5 px-3 rounded-lg inline-block border border-blue-200">
              {shopUpiId}
            </div>

            <p className="text-[11px] text-slate-600 mt-2 font-medium">
              Scan with Any UPI App: PhonePe • Google Pay • Paytm • BHIM
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{mobile}</span>
              <span>{address || 'Cyber Cafe Counter'}</span>
            </div>
          </div>

          {/* Rubber Stamp Preview Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Stamp className="w-4 h-4 text-blue-600" />
                <span>Your Official Digital Rubber Stamp</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="p-3 flex justify-center">
              {/* Visual simulated CSS rubber stamp */}
              <div 
                className="w-44 h-44 rounded-full border-4 p-1.5 flex flex-col items-center justify-center relative select-none transform -rotate-3 transition hover:rotate-0"
                style={{ borderColor: shopStampColor, color: shopStampColor }}
              >
                <div 
                  className="w-full h-full rounded-full border-2 flex flex-col items-center justify-center p-2 relative"
                  style={{ borderColor: shopStampColor }}
                >
                  <span className="text-[9px] font-black uppercase text-center leading-tight tracking-wider px-1">
                    {centerName.slice(0, 32)}
                  </span>

                  <div className="my-1 border-t border-b w-3/4 py-0.5 text-center" style={{ borderColor: shopStampColor }}>
                    <span className="text-[8px] font-black tracking-widest block">
                      {shopWatermarkPurpose}
                    </span>
                    <span className="text-[8px] font-bold block">
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <span className="text-[8px] font-bold uppercase tracking-wider">
                    ★ CSC VLE AUTH ★
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Download this official transparent seal PNG and insert it into customer bills, court forms, or online documents anytime!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadShopStamp}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Stamp PNG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenWatermarkTool) onOpenWatermarkTool();
                  else setActiveTool('tool-pdf-watermark');
                }}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Watermark Tool</span>
              </button>
            </div>
          </div>

          {/* Shop Notice Preview */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Counter Notice Preview</span>
            </div>
            <p className="text-[11px] text-emerald-800 italic">
              "{shopNoticeBanner}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
