import React, { useState, useRef, useEffect } from 'react';
import { 
  Stamp, 
  Download, 
  Printer, 
  UploadCloud, 
  ShieldCheck, 
  RotateCw, 
  Sliders, 
  Check, 
  RefreshCw,
  Sparkles,
  Layers,
  FileCheck,
  Building2,
  Copy,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

interface WatermarkToolProps {
  onClose?: () => void;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ onClose }) => {
  const { activeVle, showNotification } = useApp();
  const { triggerDirectLink } = useAdsterraDirectLink();

  // Document state
  const [docImage, setDocImage] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>('sample_aadhaar_card.png');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Watermark options
  const [watermarkMode, setWatermarkMode] = useState<'repeat' | 'single' | 'stamp' | 'dual'>('repeat');
  const [watermarkText, setWatermarkText] = useState<string>('ONLY FOR SBI BANK ACCOUNT - DO NOT REUSE');
  const [opacity, setOpacity] = useState<number>(0.28);
  const [angle, setAngle] = useState<number>(-30);
  const [fontSize, setFontSize] = useState<number>(26);
  const [color, setColor] = useState<string>('#1e40af'); // Classic Violet Blue Indian Govt ink
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');

  // Stamp specific options
  const [stampShopName, setStampShopName] = useState<string>(
    activeVle?.centerName || 'MAA DURGA CYBER CAFE & CSC SEVA KENDRA'
  );
  const [stampLocation, setStampLocation] = useState<string>(
    activeVle?.district ? `${activeVle.district}, ${activeVle.state}` : 'CSC AUTHORIZED CENTER'
  );
  const [stampDate, setStampDate] = useState<string>(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [stampPos, setStampPos] = useState<'bottom-right' | 'bottom-left' | 'center' | 'top-right'>('bottom-right');
  const [stampScale, setStampScale] = useState<number>(1.0);

  // Load sample Aadhaar document on first render
  useEffect(() => {
    generateSampleDoc();
  }, []);

  const generateSampleDoc = () => {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 1000;
    sCanvas.height = 700;
    const sCtx = sCanvas.getContext('2d');
    if (sCtx) {
      // White paper bg
      sCtx.fillStyle = '#ffffff';
      sCtx.fillRect(0, 0, 1000, 700);

      // Light border
      sCtx.strokeStyle = '#cbd5e1';
      sCtx.lineWidth = 2;
      sCtx.strokeRect(15, 15, 970, 670);

      // Document Header
      sCtx.fillStyle = '#f8fafc';
      sCtx.fillRect(16, 16, 968, 80);

      sCtx.fillStyle = '#1e293b';
      sCtx.font = 'bold 22px Arial, sans-serif';
      sCtx.fillText('GOVERNMENT OF INDIA / UIDAI - AADHAAR PHOTOCOPY', 40, 50);

      sCtx.fillStyle = '#64748b';
      sCtx.font = '13px Arial, sans-serif';
      sCtx.fillText('Standard Customer Identity Document Verification Copy', 40, 75);

      // Front card frame
      sCtx.strokeStyle = '#e2e8f0';
      sCtx.fillStyle = '#fffdf7';
      sCtx.fillRect(50, 130, 420, 260);
      sCtx.strokeRect(50, 130, 420, 260);

      sCtx.fillStyle = '#ea580c';
      sCtx.fillRect(50, 130, 420, 25);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 12px Arial, sans-serif';
      sCtx.fillText('UNIQUE IDENTIFICATION AUTHORITY OF INDIA', 60, 147);

      // Photo block
      sCtx.fillStyle = '#cbd5e1';
      sCtx.fillRect(70, 175, 100, 125);
      sCtx.fillStyle = '#64748b';
      sCtx.font = '12px Arial, sans-serif';
      sCtx.fillText('PHOTO', 100, 240);

      sCtx.fillStyle = '#0f172a';
      sCtx.font = 'bold 15px Arial, sans-serif';
      sCtx.fillText('MOHIT SINGH CHAUHAN', 190, 200);
      sCtx.font = '13px Arial, sans-serif';
      sCtx.fillText('DOB: 12/04/1998  •  MALE', 190, 225);
      sCtx.fillText('Aadhaar No: XXXX XXXX 8934', 190, 250);

      // Back card frame
      sCtx.fillStyle = '#f8fafc';
      sCtx.fillRect(520, 130, 420, 260);
      sCtx.strokeRect(520, 130, 420, 260);

      sCtx.fillStyle = '#334155';
      sCtx.fillRect(520, 130, 420, 25);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 12px Arial, sans-serif';
      sCtx.fillText('ADDRESS & QR VERIFICATION', 530, 147);

      sCtx.fillStyle = '#0f172a';
      sCtx.font = '13px Arial, sans-serif';
      sCtx.fillText('Address: S/O R. S. Chauhan, Plot No. 84, Sector 12,', 540, 190);
      sCtx.fillText('Gomti Nagar, Lucknow, Uttar Pradesh - 226010', 540, 215);

      // QR box
      sCtx.fillStyle = '#e2e8f0';
      sCtx.fillRect(800, 230, 120, 120);
      sCtx.fillStyle = '#475569';
      sCtx.font = '11px Arial, sans-serif';
      sCtx.fillText('QR CODE', 835, 295);

      // Xerox info lines
      sCtx.fillStyle = '#475569';
      sCtx.font = '13px Arial, sans-serif';
      sCtx.fillText('---------------------------------------------------------------------------------------------------------------------------------', 40, 440);
      sCtx.fillText('DECLARATION: I hereby state that this photocopy is submitted strictly for legitimate customer KYC.', 40, 480);
      sCtx.fillText('Signature of Aadhaar Holder: _______________________________', 40, 540);
      sCtx.fillText('Mobile No: +91 98XXXXXXXX                          Date: ' + new Date().toLocaleDateString('en-IN'), 40, 570);

      // Footer
      sCtx.fillStyle = '#94a3b8';
      sCtx.font = '11px Arial, sans-serif';
      sCtx.fillText('Official Verification Template • High Contrast Standard Resolution', 40, 650);

      setDocImage(sCanvas.toDataURL());
      setDocName('sample_aadhaar_document.png');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setDocImage(ev.target.result as string);
          showNotification(`Loaded document: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw Official Circular Rubber Stamp helper
  const drawCircularStamp = (
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    radius: number, 
    shopName: string, 
    location: string, 
    date: string, 
    stampColor: string
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    // Slight human tilt for real stamp look (-3 to +3 deg)
    ctx.rotate(-0.06);

    ctx.strokeStyle = stampColor;
    ctx.fillStyle = stampColor;
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

    // Center circular badge
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    // Draw arched text on top arc
    const drawCurvedText = (text: string, r: number, startAngle: number, endAngle: number, inward: boolean) => {
      ctx.font = `bold ${Math.round(radius * 0.135)}px Arial, sans-serif`;
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

    // Upper text (Shop Name)
    const upperText = shopName.toUpperCase().slice(0, 38);
    drawCurvedText(upperText, radius - 14, -Math.PI * 0.72, -Math.PI * 0.28, true);

    // Bottom text (Location / CSC ID)
    const bottomText = location.toUpperCase().slice(0, 32);
    drawCurvedText(bottomText, radius - 14, Math.PI * 0.28, Math.PI * 0.72, false);

    // Star decorations at 9 o'clock & 3 o'clock
    ctx.font = `bold ${Math.round(radius * 0.16)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', -radius + 18, 0);
    ctx.fillText('★', radius - 18, 0);

    // Center Box: "VERIFIED & ATTESTED" & Date
    ctx.font = `bold ${Math.round(radius * 0.14)}px Arial, sans-serif`;
    ctx.fillText('DIGITALLY VERIFIED', 0, -radius * 0.18);

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.05);
    ctx.lineTo(radius * 0.42, -radius * 0.05);
    ctx.stroke();

    ctx.font = `bold ${Math.round(radius * 0.13)}px Arial, sans-serif`;
    ctx.fillText(date, 0, radius * 0.12);

    ctx.font = `900 ${Math.round(radius * 0.1)}px Arial, sans-serif`;
    ctx.fillText('AUTHORIZED CSC VLE', 0, radius * 0.28);

    ctx.restore();
  };

  // Render on Canvas
  useEffect(() => {
    if (!docImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = docImage;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth || 1000;
      canvas.height = img.naturalHeight || 700;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw base document
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Draw Watermarks based on mode
      const w = canvas.width;
      const h = canvas.height;

      // Repeat Diagonal Grid
      if (watermarkMode === 'repeat' || watermarkMode === 'dual') {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const rad = (angle * Math.PI) / 180;
        const stepX = Math.max(fontSize * 12, 320);
        const stepY = Math.max(fontSize * 5, 140);

        // Expand bounds to cover rotated canvas
        for (let x = -w * 0.5; x < w * 1.5; x += stepX) {
          for (let y = -h * 0.5; y < h * 1.5; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rad);
            ctx.fillText(watermarkText.toUpperCase(), 0, 0);
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // Single Prominent Watermark
      if (watermarkMode === 'single') {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `900 ${fontSize * 1.8}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.translate(w / 2, h / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.fillText(watermarkText.toUpperCase(), 0, 0);

        // Subtext box
        ctx.font = `bold ${fontSize * 0.65}px sans-serif`;
        ctx.fillText('NOT VALID FOR ANY OTHER PURPOSE / FRAUD PROHIBITED', 0, fontSize * 1.3);
        ctx.restore();
      }

      // Official Cyber Cafe Rubber Stamp
      if (watermarkMode === 'stamp' || watermarkMode === 'dual') {
        ctx.save();
        // Stamp has slight transparency like real ink
        ctx.globalAlpha = Math.min(Math.max(opacity * 2.5, 0.75), 0.95);

        const stampRadius = Math.round(110 * stampScale);
        let cx = w - stampRadius - 40;
        let cy = h - stampRadius - 40;

        if (stampPos === 'bottom-left') {
          cx = stampRadius + 40;
          cy = h - stampRadius - 40;
        } else if (stampPos === 'center') {
          cx = w / 2;
          cy = h / 2;
        } else if (stampPos === 'top-right') {
          cx = w - stampRadius - 40;
          cy = stampRadius + 50;
        }

        drawCircularStamp(ctx, cx, cy, stampRadius, stampShopName, stampLocation, stampDate, color);
        ctx.restore();
      }
    };
  }, [
    docImage,
    watermarkMode,
    watermarkText,
    opacity,
    angle,
    fontSize,
    color,
    fontFamily,
    stampShopName,
    stampLocation,
    stampDate,
    stampPos,
    stampScale,
  ]);

  // Presets
  const applyPreset = (presetText: string, presetColor: string, presetMode: 'repeat' | 'single' | 'stamp' | 'dual' = 'repeat') => {
    setWatermarkText(presetText);
    setColor(presetColor);
    setWatermarkMode(presetMode);
    showNotification(`Applied Preset: "${presetText.slice(0, 24)}..."`);
  };

  const handleDownload = () => {
    triggerDirectLink();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `Watermarked_${docName.replace(/\.[^/.]+$/, '')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('✅ Watermarked document downloaded successfully!');
  };

  const handleDownloadStampOnly = () => {
    triggerDirectLink();
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 400;
    sCanvas.height = 400;
    const sCtx = sCanvas.getContext('2d');
    if (sCtx) {
      drawCircularStamp(sCtx, 200, 200, 160, stampShopName, stampLocation, stampDate, color);
      const link = document.createElement('a');
      link.download = `Official_Rubber_Stamp_${stampShopName.slice(0, 15)}.png`;
      link.href = sCanvas.toDataURL('image/png');
      link.click();
      showNotification('✅ Transparent Cyber Cafe Rubber Stamp PNG downloaded!');
    }
  };

  const handlePrint = () => {
    triggerDirectLink();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Watermarked Document</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 98vh; background: #fff; }
              img { max-width: 100%; max-height: 94vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Tool #025 • High Security
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Anti-Fraud Protection
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Stamp className="w-5 h-5 text-blue-600" />
            <span>Document Security Watermark & Cyber Cafe Stamp Adder</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add custom security watermarks ("ONLY FOR BANK USE", "COPY") and official Cyber Cafe digital rubber seals to protect Aadhaar, PAN, and certificates.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start md:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Exit Tool
          </button>
        )}
      </div>

      {/* 1-Click Fast Presets */}
      <div className="bg-slate-900 p-4 rounded-2xl text-white space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Security Presets (Most Requested by Cyber Cafes & Banks):
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">Prevents Customer Identity Misuse</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            {
              label: '🏦 Only For Bank Account',
              text: 'ONLY FOR BANK ACCOUNT OPENING - DO NOT MISUSE',
              color: '#1e40af',
              mode: 'repeat' as const,
            },
            {
              label: '📱 Only For SIM / Mobile KYC',
              text: 'SUBMITTED STRICTLY FOR AIRTEL / JIO SIM CARD VERIFICATION',
              color: '#b91c1c',
              mode: 'repeat' as const,
            },
            {
              label: '📝 Only For Govt Exam Verification',
              text: 'COPY FOR SSC / UPSC DOCUMENT VERIFICATION ONLY',
              color: '#047857',
              mode: 'repeat' as const,
            },
            {
              label: '🔒 Confidential - Copy Only',
              text: 'CONFIDENTIAL COPY - NOT VALID FOR FINANCIAL TRANSACTIONS',
              color: '#475569',
              mode: 'single' as const,
            },
            {
              label: '🏢 Official Cyber Cafe Rubber Stamp',
              text: 'VERIFIED & PROCESSED COPY',
              color: '#1e40af',
              mode: 'stamp' as const,
            },
            {
              label: '⭐ Dual Security (Watermark + Seal)',
              text: 'AUTHENTICATED KYC COPY',
              color: '#1e40af',
              mode: 'dual' as const,
            },
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset.text, preset.color, preset.mode)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1"
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Controls Form */}
        <div className="lg:col-span-5 space-y-4">
          {/* Document Source Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>1. Upload Customer Document</span>
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.png,.jpg,.jpeg,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center gap-2 transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Custom Document</span>
              </button>

              <button
                onClick={generateSampleDoc}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
                title="Load Sample Aadhaar Card Photocopy"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sample Aadhaar</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 truncate">
              Active File: <strong className="text-slate-800 font-mono">{docName}</strong>
            </div>
          </div>

          {/* Watermark Mode Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>2. Choose Watermark Pattern</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'repeat', label: 'Diagonal Tiled Grid', desc: 'Full page anti-fraud protection' },
                { id: 'single', label: 'Single Prominent', desc: 'Bold center watermark text' },
                { id: 'stamp', label: 'Cyber Cafe Stamp', desc: 'Official circular rubber seal' },
                { id: 'dual', label: 'Both Stamp & Grid', desc: 'Maximum legal protection' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWatermarkMode(m.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    watermarkMode === m.id
                      ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Watermark Text & Styling (for repeat/single/dual) */}
          {(watermarkMode === 'repeat' || watermarkMode === 'single' || watermarkMode === 'dual') && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3. Watermark Text & Color</span>
              </h3>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Watermark Purpose / Text:</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 uppercase text-xs"
                  placeholder="e.g. ONLY FOR LOAN VERIFICATION"
                />
              </div>

              {/* Ink Color Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Stamp & Watermark Ink Color:</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { name: 'Violet Blue', code: '#1e40af' },
                    { name: 'Govt Red', code: '#b91c1c' },
                    { name: 'Teal Green', code: '#047857' },
                    { name: 'Neutral Gray', code: '#64748b' },
                    { name: 'Carbon Black', code: '#0f172a' },
                    { name: 'Royal Purple', code: '#6b21a8' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setColor(c.code)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                        color === c.code ? 'border-slate-900 ring-2 ring-slate-400 font-bold' : 'border-slate-200'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.code }}></span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded border p-0 cursor-pointer"
                    title="Custom Ink Color"
                  />
                </div>
              </div>

              {/* Sliders: Opacity, Angle, Size */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Watermark Visibility / Opacity:</span>
                  <span className="font-mono font-bold text-slate-900">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.08}
                  max={0.75}
                  step={0.02}
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Rotation Angle:</label>
                  <input
                    type="number"
                    value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Font Size (px):</label>
                  <input
                    type="number"
                    min={14}
                    max={60}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 24)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rubber Stamp Customizer (for stamp or dual mode) */}
          {(watermarkMode === 'stamp' || watermarkMode === 'dual') && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-amber-950 uppercase tracking-wider text-xs flex items-center gap-2">
                <Stamp className="w-4 h-4 text-amber-700" />
                <span>Official Cyber Cafe Rubber Stamp Details</span>
              </h3>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shop / Center Name (Arched on Top):</label>
                <input
                  type="text"
                  value={stampShopName}
                  onChange={(e) => setStampShopName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-xl font-bold bg-white text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District / Place:</label>
                  <input
                    type="text"
                    value={stampLocation}
                    onChange={(e) => setStampLocation(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stamp Date:</label>
                  <input
                    type="text"
                    value={stampDate}
                    onChange={(e) => setStampDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stamp Position:</label>
                  <select
                    value={stampPos}
                    onChange={(e) => setStampPos(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white font-semibold text-xs"
                  >
                    <option value="bottom-right">Bottom Right Corner</option>
                    <option value="bottom-left">Bottom Left Corner</option>
                    <option value="center">Center of Page</option>
                    <option value="top-right">Top Right Corner</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stamp Size Scale:</label>
                  <select
                    value={stampScale}
                    onChange={(e) => setStampScale(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white font-semibold text-xs"
                  >
                    <option value={0.8}>Compact (80%)</option>
                    <option value={1.0}>Standard (100%)</option>
                    <option value={1.25}>Large Official (125%)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadStampOnly}
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Rubber Stamp Only (Transparent PNG)</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res Watermarked Document</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Document (Direct to Printer)</span>
            </button>
          </div>
        </div>

        {/* Right Side: Live Canvas Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">Live Document Preview with Watermark & Stamp</span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono">100% Client-Side Safe</span>
          </div>

          <div className="bg-slate-100 p-4 rounded-3xl border border-slate-300 overflow-auto flex items-center justify-center min-h-[460px] max-h-[680px]">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[620px] object-contain rounded-xl shadow-2xl bg-white border border-slate-300"
            />
          </div>

          <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Cyber Cafe Operator Tip:</strong> Banks and Telecom operators (Airtel, Jio, SBI, HDFC) strongly advise customers to write the exact purpose across photocopies. Stamping your shop name ensures that customers remember your center for all future digital services!
            </div>
          </div>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};
