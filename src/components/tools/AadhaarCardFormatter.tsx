import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Printer, Download, UploadCloud, CheckCircle, RefreshCw } from 'lucide-react';

interface AadhaarCardFormatterProps {
  onClose?: () => void;
}

export const AadhaarCardFormatter: React.FC<AadhaarCardFormatterProps> = ({ onClose }) => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [cardType, setCardType] = useState<string>('aadhaar');
  const [paperFormat, setPaperFormat] = useState<'4x6' | 'a4'>('4x6');
  const [addCutGuides, setAddCutGuides] = useState<boolean>(true);
  const [roundedCorners, setRoundedCorners] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('NONE');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  // Generate placeholder cards so user immediately sees how it looks
  useEffect(() => {
    // Front card demo
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 600;
    fCanvas.height = 380;
    const fCtx = fCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#fff7ed';
      fCtx.fillRect(0, 0, 600, 380);
      fCtx.fillStyle = '#ea580c';
      fCtx.fillRect(0, 0, 600, 40);
      fCtx.fillStyle = '#ffffff';
      fCtx.font = 'bold 16px sans-serif';
      fCtx.fillText('GOVERNMENT OF INDIA - SMART CARD (FRONT)', 20, 26);

      // Photo block
      fCtx.fillStyle = '#cbd5e1';
      fCtx.fillRect(30, 70, 140, 175);
      fCtx.fillStyle = '#64748b';
      fCtx.font = '12px sans-serif';
      fCtx.fillText('PHOTO', 80, 160);

      // Details lines
      fCtx.fillStyle = '#0f172a';
      fCtx.font = 'bold 16px sans-serif';
      fCtx.fillText('NAME: AMIT KUMAR SHARMA', 190, 100);
      fCtx.font = '14px sans-serif';
      fCtx.fillText('DOB: 15/08/1996  •  MALE', 190, 130);
      fCtx.fillText('ID NO: XXXX XXXX 4920', 190, 160);

      fCtx.fillStyle = '#16a34a';
      fCtx.fillRect(0, 350, 600, 30);
      setFrontImage(fCanvas.toDataURL());
    }

    // Back card demo
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 600;
    bCanvas.height = 380;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#f8fafc';
      bCtx.fillRect(0, 0, 600, 380);
      bCtx.fillStyle = '#334155';
      bCtx.fillRect(0, 0, 600, 30);
      bCtx.fillStyle = '#ffffff';
      bCtx.font = 'bold 14px sans-serif';
      bCtx.fillText('UNIQUE IDENTIFICATION AUTHORITY OF INDIA (BACK)', 20, 20);

      bCtx.fillStyle = '#0f172a';
      bCtx.font = '13px sans-serif';
      bCtx.fillText('Address: S/O R. K. Sharma, House No. 42,', 30, 90);
      bCtx.fillText('Civil Lines, District Lucknow, Uttar Pradesh - 226001', 30, 115);

      // QR box
      bCtx.fillStyle = '#e2e8f0';
      bCtx.fillRect(400, 65, 170, 170);
      bCtx.fillStyle = '#475569';
      bCtx.font = '11px sans-serif';
      bCtx.fillText('SECURE QR CODE', 430, 155);

      setBackImage(bCanvas.toDataURL());
    }
  }, []);

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setFrontImage(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setBackImage(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Render on canvas
  useEffect(() => {
    if (!frontImage || !backImage) return;

    const fImg = new Image();
    const bImg = new Image();
    fImg.crossOrigin = 'anonymous';
    bImg.crossOrigin = 'anonymous';

    fImg.src = frontImage;
    bImg.src = backImage;

    let loaded = 0;
    const checkBoth = () => {
      loaded++;
      if (loaded < 2) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // CR-80 Standard: 85.6mm x 53.98mm (Ratio: ~1.585)
      // At 300 DPI: Width = 1011 px, Height = 638 px
      const cardW = 1011;
      const cardH = 638;

      let sheetW = 2400;
      let sheetH = 1600;

      if (paperFormat === '4x6') {
        sheetW = 2400;
        sheetH = 1600;
      } else {
        // A4 sheet
        sheetW = 2480;
        sheetH = 3508;
      }

      canvas.width = sheetW;
      canvas.height = sheetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Pure white paper
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, sheetW, sheetH);

      // Positioning Front and Back cards side-by-side or stacked
      const spacing = 80;
      const totalWidthCards = cardW * 2 + spacing;
      const startX = (sheetW - totalWidthCards) / 2;
      const startY = paperFormat === '4x6' ? (sheetH - cardH) / 2 : 500;

      // Function to draw card with border and optional rounded corners
      const drawCard = (img: HTMLImageElement, x: number, y: number, label: string) => {
        ctx.save();

        if (roundedCorners) {
          const radius = 28;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + cardW - radius, y);
          ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + radius);
          ctx.lineTo(x + cardW, y + cardH - radius);
          ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - radius, y + cardH);
          ctx.lineTo(x + radius, y + cardH);
          ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.clip();
        }

        ctx.drawImage(img, x, y, cardW, cardH);
        ctx.restore();

        // Border line for cutting
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        if (roundedCorners) {
          const radius = 28;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + cardW - radius, y);
          ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + radius);
          ctx.lineTo(x + cardW, y + cardH - radius);
          ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - radius, y + cardH);
          ctx.lineTo(x + radius, y + cardH);
          ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, cardW, cardH);
        }

        // Cut Guides if enabled
        if (addCutGuides) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          const arm = 25;
          // Top Left
          ctx.beginPath();
          ctx.moveTo(x - arm, y); ctx.lineTo(x, y);
          ctx.moveTo(x, y - arm); ctx.lineTo(x, y);
          // Top Right
          ctx.moveTo(x + cardW, y); ctx.lineTo(x + cardW + arm, y);
          ctx.moveTo(x + cardW, y - arm); ctx.lineTo(x + cardW, y);
          // Bottom Left
          ctx.moveTo(x - arm, y + cardH); ctx.lineTo(x, y + cardH);
          ctx.moveTo(x, y + cardH); ctx.lineTo(x, y + cardH + arm);
          // Bottom Right
          ctx.moveTo(x + cardW, y + cardH); ctx.lineTo(x + cardW + arm, y + cardH);
          ctx.moveTo(x + cardW, y + cardH); ctx.lineTo(x + cardW, y + cardH + arm);
          ctx.stroke();
        }

        // Watermark if enabled
        if (watermarkText && watermarkText !== 'NONE') {
          ctx.save();
          ctx.globalAlpha = 0.24;
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 30px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.translate(x + cardW / 2, y + cardH / 2);
          ctx.rotate(-0.38);
          ctx.fillText(watermarkText.toUpperCase(), 0, 0);
          ctx.restore();
        }

        // Label below card
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + cardW / 2, y + cardH + 45);
      };

      // Draw Front & Back
      drawCard(fImg, startX, startY, 'FRONT SIDE (85.6 × 54.0 mm)');
      drawCard(bImg, startX + cardW + spacing, startY, 'BACK SIDE (85.6 × 54.0 mm)');

      // Top info bar
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`999tools - Smart PVC Card Print Template (CR80 Standard)`, sheetW / 2, startY - 70);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Scale: 100% (Do not fit to printable area) • Standard Glossy/PVC Paper', sheetW / 2, startY - 35);
    };

    fImg.onload = checkBoth;
    bImg.onload = checkBoth;
  }, [frontImage, backImage, paperFormat, addCutGuides, roundedCorners, watermarkText]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `999tools_CR80_${cardType}_PrintSheet.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <html>
          <head><title>Print CR80 Card - 999tools</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;">
            <img src="${dataUrl}" style="max-width:100%;" onload="window.print();window.close();"/>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  return (
    <div id="aadhaar-formatter-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <CreditCard className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Aadhaar & Smart Card Print Formatter (CR80)</h2>
            <p className="text-xs text-orange-100">
              Format Front & Back scans into standard 85.6mm x 54mm PVC Card with cut guidelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-900 font-bold rounded-xl shadow-sm hover:bg-orange-50 text-sm"
          >
            <Printer className="w-4 h-4" /> Print Sheet
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 text-sm"
          >
            <Download className="w-4 h-4" /> Download Sheet
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
        {/* Left Inputs */}
        <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Document Type
            </label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-semibold"
            >
              <option value="aadhaar">Aadhaar Card (UIDAI)</option>
              <option value="pan">PAN Card (Income Tax)</option>
              <option value="voter">Voter ID Card (Election Commission)</option>
              <option value="ayushman">Ayushman Bharat (PM-JAY)</option>
              <option value="dl">Driving License (Sarathi)</option>
            </select>
          </div>

          {/* Front & Back Uploads */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">1. Front Side Image</label>
              <input
                type="file"
                ref={frontInputRef}
                onChange={handleFrontUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => frontInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-white border border-dashed border-orange-400 hover:border-orange-600 rounded-xl text-orange-800 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" /> Upload Front Image
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">2. Back Side Image</label>
              <input
                type="file"
                ref={backInputRef}
                onChange={handleBackUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => backInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-white border border-dashed border-orange-400 hover:border-orange-600 rounded-xl text-orange-800 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" /> Upload Back Image
              </button>
            </div>
          </div>

          {/* Paper Format */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">Print Paper Selection</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaperFormat('4x6')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border ${
                  paperFormat === '4x6' ? 'bg-orange-50 border-orange-500 text-orange-900' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                4 x 6 Photo Paper
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('a4')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border ${
                  paperFormat === 'a4' ? 'bg-orange-50 border-orange-500 text-orange-900' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                A4 Document Sheet
              </button>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={addCutGuides}
                  onChange={(e) => setAddCutGuides(e.target.checked)}
                  className="rounded text-orange-600 accent-orange-600"
                />
                Show Scissor Cutting Guidelines
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={roundedCorners}
                  onChange={(e) => setRoundedCorners(e.target.checked)}
                  className="rounded text-orange-600 accent-orange-600"
                />
                Simulate PVC Rounded Corners (3.18mm)
              </label>
            </div>
          </div>

          {/* Security Watermark Protection */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Anti-Fraud Security Watermark
            </label>
            <p className="text-[11px] text-slate-500">
              Imprint purpose directly on card print to prevent Aadhaar misuse.
            </p>
            <select
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
            >
              <option value="NONE">No Watermark (Standard Clean Print)</option>
              <option value="COPY FOR KYC ONLY">COPY FOR KYC ONLY</option>
              <option value="FOR BANK VERIFICATION">FOR BANK VERIFICATION</option>
              <option value="ONLY FOR SIM VERIFICATION">ONLY FOR SIM VERIFICATION</option>
              <option value="EXAM ADMISSION PURPOSE">EXAM ADMISSION PURPOSE</option>
              <option value="CONFIDENTIAL COPY">CONFIDENTIAL COPY</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
            <span className="font-bold block mb-1">💡 Cyber Cafe Pro Tip:</span>
            Print at 100% scale on 250 GSM glossy paper or PVC inkjet card. Cut on guidelines and laminate with 250 micron pouch for lifetime durability.
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-8 p-6 bg-slate-100 flex flex-col items-center justify-center">
          <div className="text-xs text-slate-500 mb-2 font-medium">
            Standard CR-80 PVC Dimensions (85.60 mm × 53.98 mm)
          </div>
          <div className="border-4 border-slate-300 rounded-xl bg-white shadow-xl overflow-hidden max-w-full flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};
