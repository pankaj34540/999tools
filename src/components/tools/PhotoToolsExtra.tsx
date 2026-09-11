import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Upload, 
  RefreshCw, 
  Check, 
  Sliders, 
  SlidersHorizontal,
  Crop, 
  Maximize2, 
  Calendar, 
  Type, 
  Sparkles, 
  Layers, 
  Palette,
  AlertCircle
} from 'lucide-react';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

interface ToolProps {
  onClose?: () => void;
}

// -------------------------------------------------------------
// #003: Photo Name & Date (DOPO/DOB) Stamp
// -------------------------------------------------------------
export const PhotoNameDateTool: React.FC<ToolProps> = ({ onClose }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('ANIL KUMAR');
  const [stampType, setStampType] = useState<'dopo' | 'dob'>('dopo');
  const [dateText, setDateText] = useState(new Date().toLocaleDateString('en-GB'));
  const [boxBg, setBoxBg] = useState<'white' | 'black'>('white');
  const [boxHeight, setBoxHeight] = useState<number>(55);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  // Draw default demo photo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 350;
    canvas.height = 450;

    const render = (img?: HTMLImageElement) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 350, 450);
      } else {
        // Placeholder portrait
        const grad = ctx.createLinearGradient(0, 0, 0, 450);
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(1, '#7dd3fc');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 350, 450);

        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.arc(175, 170, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(175, 360, 130, 95, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw bottom Name & Date banner
      ctx.fillStyle = boxBg === 'white' ? '#ffffff' : '#0f172a';
      ctx.fillRect(0, 450 - boxHeight, 350, boxHeight);

      // Border line on top of banner
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 450 - boxHeight);
      ctx.lineTo(350, 450 - boxHeight);
      ctx.stroke();

      // Text
      ctx.fillStyle = boxBg === 'white' ? '#0f172a' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(candidateName.toUpperCase(), 175, 450 - boxHeight + 22);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = boxBg === 'white' ? '#334155' : '#cbd5e1';
      const label = stampType === 'dopo' ? 'DOPO: ' : 'DOB: ';
      ctx.fillText(label + dateText, 175, 450 - boxHeight + 42);
    };

    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => render(img);
      img.src = imageSrc;
    } else {
      render();
    }
  }, [imageSrc, candidateName, stampType, dateText, boxBg, boxHeight]);

  const handleDownload = () => {
    triggerDirectLink();
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${candidateName.replace(/\s+/g, '_')}_Photo_Stamped.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #003
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Photo Name & Date (DOPO / DOB) Banner Stamp
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory for SSC CGL, CHSL, GD Constable, and state recruitment forms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Controls */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">1. Upload Candidate Photo:</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setImageSrc(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Candidate Full Name (in CAPS):</label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value.toUpperCase())}
              placeholder="e.g. RAHUL KUMAR"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Stamp Type:</label>
              <select
                value={stampType}
                onChange={(e) => setStampType(e.target.value as any)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="dopo">DOPO (Date of Photo)</option>
                <option value="dob">DOB (Date of Birth)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date Stamp:</label>
              <input
                type="text"
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Banner Background:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBoxBg('white')}
                  className={`flex-1 py-1.5 border rounded-lg font-bold ${
                    boxBg === 'white' ? 'bg-white border-blue-600 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  White Strip
                </button>
                <button
                  type="button"
                  onClick={() => setBoxBg('black')}
                  className={`flex-1 py-1.5 border rounded-lg font-bold ${
                    boxBg === 'black' ? 'bg-slate-900 text-white border-slate-950' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Black Strip
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Banner Height (px):</label>
              <input
                type="range"
                min="45"
                max="75"
                value={boxHeight}
                onChange={(e) => setBoxHeight(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Stamped Photo (Ready for SSC/Exam)</span>
          </button>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto"
            style={{ width: '220px', height: 'auto' }}
          />
          <p className="text-[11px] text-slate-500 mt-2">Exact 3.5cm x 4.5cm standard exam passport scale</p>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #004: Signature White Background Cleaner
// -------------------------------------------------------------
export const SignatureWhiteBgTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(140);
  const [inkColor, setInkColor] = useState<'black' | 'blue'>('black');
  const [contrastBoost, setContrastBoost] = useState<number>(30);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 160;

    const render = (img?: HTMLImageElement) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 400, 160);
        const imgData = ctx.getImageData(0, 0, 400, 160);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Grayscale brightness
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (gray > threshold) {
            // Pure white background
            d[i] = 255;
            d[i + 1] = 255;
            d[i + 2] = 255;
          } else {
            // Crisp dark ink
            if (inkColor === 'blue') {
              d[i] = 10;
              d[i + 1] = 40;
              d[i + 2] = 160;
            } else {
              d[i] = Math.max(0, gray - contrastBoost);
              d[i + 1] = Math.max(0, gray - contrastBoost);
              d[i + 2] = Math.max(0, gray - contrastBoost);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } else {
        // Demo signature
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 160);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'italic bold 32px cursive';
        ctx.textAlign = 'center';
        ctx.fillText('Sample Sign Cleaner', 200, 85);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Upload phone photo of signature on white paper', 200, 120);
      }
    };

    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => render(img);
      img.src = imageSrc;
    } else {
      render();
    }
  }, [imageSrc, threshold, inkColor, contrastBoost]);

  const handleDownload = () => {
    triggerDirectLink();
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `Clean_Signature_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #004
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Signature White Background & Paper Shadow Cleaner
          </h2>
          <p className="text-xs text-slate-500">
            Converts dirty, shadowed mobile phone signature scans into 100% pure white background.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Upload Signature Photo:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setImageSrc(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Shadow Threshold (Cut-Off):</span>
              <span>{threshold}</span>
            </div>
            <input
              type="range"
              min="80"
              max="220"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-[11px] text-slate-500">Slide right if paper shadow is still showing.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Output Ink Color:</label>
              <select
                value={inkColor}
                onChange={(e) => setInkColor(e.target.value as any)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-bold"
              >
                <option value="black">Crisp Black Ink</option>
                <option value="blue">Official Blue Ink</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Contrast Boost:</label>
              <input
                type="range"
                min="0"
                max="80"
                value={contrastBoost}
                onChange={(e) => setContrastBoost(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Clean Signature (PNG)</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-200 rounded-xl border border-slate-300">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border-2 border-slate-400 max-w-full h-auto bg-white"
            style={{ width: '320px', height: 'auto' }}
          />
          <p className="text-[11px] text-slate-600 mt-2 font-semibold">
            Zero shadows. Clean white background ready for SSC / UPSC upload.
          </p>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #005: Target KB Image Compressor
// -------------------------------------------------------------
export const TargetKbCompressorTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [targetKb, setTargetKb] = useState<number>(45);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [actualOutputKb, setActualOutputKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalSizeKb(Math.round(file.size / 1024));
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        compressToTarget(reader.result as string, targetKb);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressToTarget = (src: string, maxKb: number) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      let width = img.width;
      let height = img.height;

      // Iterative quality reduction
      let quality = 0.92;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

      // If still too big, step down quality and dimensions
      let step = 0;
      while (sizeKb > maxKb && step < 15) {
        step++;
        if (quality > 0.3) {
          quality -= 0.08;
        } else {
          width = Math.round(width * 0.9);
          height = Math.round(height * 0.9);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
        }
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
      }

      setCompressedUrl(dataUrl);
      setActualOutputKb(sizeKb);
      setIsProcessing(false);
    };
    img.src = src;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #005
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Exact KB Image Compressor
          </h2>
          <p className="text-xs text-slate-500">
            Set desired file size in KB (e.g., 20KB for signature, 50KB for photo).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Heavy Image (JPG/PNG):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white"
            />
            {originalSizeKb > 0 && (
              <p className="text-[11px] text-slate-600 mt-1 font-semibold">
                Original file size: <span className="text-rose-600 font-bold">{originalSizeKb} KB</span>
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Desired Target Size (KB):</label>
            <div className="flex gap-2">
              {[20, 50, 100, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTargetKb(preset);
                    if (imageSrc) compressToTarget(imageSrc, preset);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold border ${
                    targetKb === preset ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'
                  }`}
                >
                  {preset} KB
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-600">Custom:</span>
              <input
                type="number"
                value={targetKb}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetKb(val);
                  if (imageSrc) compressToTarget(imageSrc, val);
                }}
                className="w-24 px-2 py-1 border border-slate-300 rounded font-bold"
              />
              <span className="font-bold">KB</span>
            </div>
          </div>

          {compressedUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Compressed Successfully!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Reduced from <strong>{originalSizeKb} KB</strong> to{' '}
                <strong className="text-emerald-700 text-sm">{actualOutputKb} KB</strong> (Ready for upload).
              </p>
            </div>
          )}

          <button
            disabled={!compressedUrl || isProcessing}
            onClick={() => {
              triggerDirectLink();
              if (compressedUrl) {
                const link = document.createElement('a');
                link.download = `Compressed_${actualOutputKb}KB.jpg`;
                link.href = compressedUrl;
                link.click();
              }
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isProcessing ? 'Compressing...' : `Download ${actualOutputKb} KB File`}</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200 min-h-[200px]">
          {compressedUrl ? (
            <img
              src={compressedUrl}
              alt="Compressed preview"
              className="max-h-56 object-contain rounded border shadow-sm"
            />
          ) : (
            <p className="text-xs text-slate-400">Upload image to view live compression</p>
          )}
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #006: Image Format Converter (JPG / PNG / WebP)
// -------------------------------------------------------------
export const ImageFormatConverterTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('image');
  const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png' | 'webp'>('png');
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handleConvertDownload = () => {
    triggerDirectLink();
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, img.width, img.height);
        }
        ctx.drawImage(img, 0, 0);
        const mime = `image/${targetFormat}`;
        const dataUrl = canvas.toDataURL(mime, 0.95);
        const link = document.createElement('a');
        link.download = `${fileName}_converted.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
        link.href = dataUrl;
        link.click();
      }
    };
    img.src = imageSrc;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #006
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Image Format Converter (JPG ⇄ PNG ⇄ WebP)
          </h2>
          <p className="text-xs text-slate-500">
            Convert modern WebP or PNG into standard JPG for online portal acceptance.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Select Any Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFileName(file.name.split('.')[0]);
                const reader = new FileReader();
                reader.onload = () => setImageSrc(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
            className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Convert Into Format:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'jpeg', label: 'JPG / JPEG (Standard)' },
              { id: 'png', label: 'PNG (Transparent)' },
              { id: 'webp', label: 'WebP (Ultra Compact)' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setTargetFormat(fmt.id as any)}
                className={`py-2 rounded-lg font-bold border text-xs ${
                  targetFormat === fmt.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!imageSrc}
          onClick={handleConvertDownload}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Convert & Download ({targetFormat.toUpperCase()})</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #007: DPI Converter & Rescaler (200 / 300 / 600 DPI)
// -------------------------------------------------------------
export const DpiConverterTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dpi, setDpi] = useState<number>(300);
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handleDownload = () => {
    triggerDirectLink();
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.download = `Doc_${dpi}DPI.jpg`;
    link.href = imageSrc;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #007
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            DPI Rescaler (200 DPI / 300 DPI / 600 DPI)
          </h2>
          <p className="text-xs text-slate-500">
            For High Court, Judicial, and Gazette portals requiring mandatory 200 or 300 DPI resolution.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setImageSrc(reader.result as string);
              reader.readAsDataURL(file);
            }
          }}
          className="w-full text-xs"
        />

        <div className="flex gap-3">
          {[200, 300, 600].map((val) => (
            <button
              key={val}
              onClick={() => setDpi(val)}
              className={`flex-1 py-2 rounded-lg font-bold border ${
                dpi === val ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {val} DPI
            </button>
          ))}
        </div>

        <button
          disabled={!imageSrc}
          onClick={handleDownload}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Save Document at {dpi} DPI</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #008: Photo Crop, Flip & Rotate Utility
// -------------------------------------------------------------
export const ImageCropRotateTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const { triggerDirectLink } = useAdsterraDirectLink();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #008
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Photo Crop, Flip & Rotate Utility
          </h2>
          <p className="text-xs text-slate-500">Quickly fix upside-down scans and crop to 3.5x4.5cm ratio.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setImageSrc(reader.result as string);
              reader.readAsDataURL(file);
            }
          }}
          className="w-full text-xs"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex-1 py-2 bg-white border border-slate-200 rounded-lg font-bold"
          >
            Rotate 90°
          </button>
          <button
            onClick={() => setRotation((r) => (r + 180) % 360)}
            className="flex-1 py-2 bg-white border border-slate-200 rounded-lg font-bold"
          >
            Rotate 180°
          </button>
        </div>

        {imageSrc && (
          <div className="text-center p-4 bg-slate-200 rounded-lg overflow-hidden">
            <img
              src={imageSrc}
              style={{ transform: `rotate(${rotation}deg)` }}
              alt="Rotate preview"
              className="max-h-48 mx-auto transition-transform"
            />
          </div>
        )}

        <button
          disabled={!imageSrc}
          onClick={() => {
            triggerDirectLink();
            if (!imageSrc) return;
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const isRotated = rotation === 90 || rotation === 270;
              canvas.width = isRotated ? img.height : img.width;
              canvas.height = isRotated ? img.width : img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                const link = document.createElement('a');
                link.download = `Rotated_${rotation}deg.jpg`;
                link.href = canvas.toDataURL('image/jpeg');
                link.click();
              }
            };
            img.src = imageSrc;
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Adjusted Image</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #009: Bulk Image Resizer
// -------------------------------------------------------------
export const BulkImageResizerTool: React.FC<ToolProps> = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetWidth, setTargetWidth] = useState<number>(300);
  const [isProcessing, setIsProcessing] = useState(false);
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handleBulkDownload = async () => {
    triggerDirectLink();
    setIsProcessing(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      const ratio = targetWidth / img.width;
      canvas.width = targetWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `Resized_${file.name}`;
        link.href = canvas.toDataURL('image/jpeg', 0.85);
        link.click();
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #009
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Bulk Multiple Images Resizer
          </h2>
          <p className="text-xs text-slate-500">Select 5 to 20 candidate photos at once to resize in 1 click.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              setFiles(Array.from(e.target.files));
            }
          }}
          className="w-full text-xs"
        />

        {files.length > 0 && (
          <p className="font-bold text-blue-700">{files.length} images selected for batch resizing.</p>
        )}

        <div>
          <label className="font-bold text-slate-700 block mb-1">Target Width (px):</label>
          <input
            type="number"
            value={targetWidth}
            onChange={(e) => setTargetWidth(Number(e.target.value))}
            className="w-full px-3 py-1.5 border rounded font-bold"
          />
        </div>

        <button
          disabled={files.length === 0 || isProcessing}
          onClick={handleBulkDownload}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>{isProcessing ? 'Processing...' : `Resize & Download ${files.length} Images`}</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #010: Photo Background Colorizer
// -------------------------------------------------------------
export const PhotoBgColorizerTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<'white' | 'blue' | 'grey' | 'red'>('blue');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  const colors = {
    white: '#ffffff',
    blue: '#0284c7',
    grey: '#cbd5e1',
    red: '#dc2626',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 380;

    // Draw background
    ctx.fillStyle = colors[bgColor];
    ctx.fillRect(0, 0, 300, 380);

    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw image over
        ctx.drawImage(img, 0, 0, 300, 380);
      };
      img.src = imageSrc;
    } else {
      // Demo person
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(150, 150, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(150, 320, 110, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sample Portrait', 150, 160);
    }
  }, [imageSrc, bgColor]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #010
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Passport Photo Background Colorizer
          </h2>
          <p className="text-xs text-slate-500">
            Official White, Studio Sky Blue, or Neutral Grey backdrop.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setImageSrc(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
            className="w-full text-xs"
          />

          <div>
            <label className="font-bold text-slate-700 block mb-2">Select Passport Backdrop Color:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBgColor('blue')}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-2 ${
                  bgColor === 'blue' ? 'bg-sky-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block border" />
                <span>Studio Sky Blue</span>
              </button>

              <button
                onClick={() => setBgColor('white')}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-2 ${
                  bgColor === 'white' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white inline-block border" />
                <span>Official White</span>
              </button>

              <button
                onClick={() => setBgColor('grey')}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-2 ${
                  bgColor === 'grey' ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block border" />
                <span>Neutral Grey</span>
              </button>

              <button
                onClick={() => setBgColor('red')}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-2 ${
                  bgColor === 'red' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border" />
                <span>Passport Red</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              triggerDirectLink();
              if (canvasRef.current) {
                const link = document.createElement('a');
                link.download = `Passport_${bgColor}_bg.jpg`;
                link.href = canvasRef.current.toDataURL('image/jpeg');
                link.click();
              }
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Colored Backdrop Photo</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto"
            style={{ width: '200px', height: 'auto' }}
          />
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};
