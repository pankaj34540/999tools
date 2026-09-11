import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, UploadCloud, RefreshCw, SunMedium, Contrast } from 'lucide-react';

interface DocumentCleanToolProps {
  onClose?: () => void;
}

export const DocumentCleanTool: React.FC<DocumentCleanToolProps> = ({ onClose }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'bw' | 'grayscale' | 'contrast'>('bw');
  const [threshold, setThreshold] = useState<number>(140);
  const [brightness, setBrightness] = useState<number>(115);
  const [contrastVal, setContrastVal] = useState<number>(140);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate a sample document mockup
  useEffect(() => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 700;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      // Slightly dark/yellowish phone snapshot simulation
      ctx.fillStyle = '#f5eedb';
      ctx.fillRect(0, 0, 500, 700);

      // Certificate header
      ctx.fillStyle = '#5c4d3c';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOARD OF SECONDARY EDUCATION', 250, 70);
      ctx.font = '14px serif';
      ctx.fillText('HIGH SCHOOL CERTIFICATE EXAMINATION', 250, 95);

      // Lines
      ctx.strokeStyle = '#8c7853';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(50, 115);
      ctx.lineTo(450, 115);
      ctx.stroke();

      // Sample marksheet text
      ctx.fillStyle = '#4a3f35';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Candidate Name: ROHIT VERMA', 60, 170);
      ctx.fillText('Roll Number: 2849102', 60, 205);
      ctx.fillText('Father Name: SH. SURESH VERMA', 60, 240);
      ctx.fillText('School: GOVT INTER COLLEGE', 60, 275);
      ctx.fillText('Year of Passing: 2024 (FIRST DIVISION)', 60, 310);

      // Stamp circle
      ctx.strokeStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(380, 550, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7c2d12';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VERIFIED', 380, 555);

      setImageSrc(tempCanvas.toDataURL());
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImageSrc(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw base image with brightness/contrast
      ctx.filter = `brightness(${brightness}%) contrast(${contrastVal}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      // If B&W threshold mode
      if (filterMode === 'bw') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          // Grayscale luminance
          const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Binarize
          const val = avg >= threshold ? 255 : 0;
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filterMode === 'grayscale') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = avg;
          d[i + 1] = avg;
          d[i + 2] = avg;
        }
        ctx.putImageData(imgData, 0, 0);
      }
    };
  }, [imageSrc, filterMode, threshold, brightness, contrastVal]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `999tools_Cleaned_Document.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div id="document-clean-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Sparkles className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Scanned Document Cleaner & B&W Enhancer</h2>
            <p className="text-xs text-teal-100">
              Transform dark, yellow, or blurry phone snapshots of certificates into crisp Xerox-ready black & white
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" /> Download Cleaned File
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
        {/* Controls */}
        <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 space-y-4">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-teal-400 hover:border-teal-600 rounded-xl text-teal-800 font-semibold flex items-center justify-center gap-2 text-xs"
            >
              <UploadCloud className="w-5 h-5 text-teal-600" /> Upload Document Photo
            </button>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Filter Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bw', label: 'B&W Xerox' },
                { id: 'grayscale', label: 'Grayscale' },
                { id: 'contrast', label: 'Color Boost' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFilterMode(m.id as any)}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition ${
                    filterMode === m.id
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Adjustment Sliders */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            {filterMode === 'bw' && (
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Threshold (Dark / Light cutoff):</span>
                  <span className="font-bold">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="220"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Brightness:</span>
                <span className="font-bold">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Contrast:</span>
                <span className="font-bold">{contrastVal}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={contrastVal}
                onChange={(e) => setContrastVal(parseInt(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <button
              onClick={() => {
                setThreshold(140);
                setBrightness(115);
                setContrastVal(140);
              }}
              className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 pt-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset default levels
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 p-6 bg-slate-100 flex flex-col items-center justify-center">
          <div className="border-4 border-slate-300 rounded-xl bg-white shadow-xl overflow-hidden max-w-full flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full max-h-[65vh] object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};
