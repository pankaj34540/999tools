import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Download, RefreshCw, CheckCircle2, AlertTriangle, UploadCloud } from 'lucide-react';
import { govtExamPresets } from '../../data/initialData';
import { GovtExamPreset } from '../../types';

interface PhotoSignResizerProps {
  onClose?: () => void;
}

export const PhotoSignResizer: React.FC<PhotoSignResizerProps> = ({ onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<GovtExamPreset>(govtExamPresets[0]);
  const [itemType, setItemType] = useState<'photo' | 'signature'>('photo');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Custom dimensions & KB limits
  const [targetWidth, setTargetWidth] = useState<number>(govtExamPresets[0].photoWidth);
  const [targetHeight, setTargetHeight] = useState<number>(govtExamPresets[0].photoHeight);
  const [minKb, setMinKb] = useState<number>(govtExamPresets[0].photoMinKb);
  const [maxKb, setMaxKb] = useState<number>(govtExamPresets[0].photoMaxKb);

  // Compression state
  const [qualitySlider, setQualitySlider] = useState<number>(85);
  const [outputDataUrl, setOutputDataUrl] = useState<string | null>(null);
  const [outputKb, setOutputKb] = useState<number>(0);
  const [processing, setProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When preset or itemType changes, update targets
  useEffect(() => {
    if (itemType === 'photo') {
      setTargetWidth(selectedPreset.photoWidth);
      setTargetHeight(selectedPreset.photoHeight);
      setMinKb(selectedPreset.photoMinKb);
      setMaxKb(selectedPreset.photoMaxKb);
    } else {
      setTargetWidth(selectedPreset.signWidth);
      setTargetHeight(selectedPreset.signHeight);
      setMinKb(selectedPreset.signMinKb);
      setMaxKb(selectedPreset.signMaxKb);
    }
  }, [selectedPreset, itemType]);

  // Default sample image so user immediately interacts
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 300, 360);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(150, 130, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(150, 290, 100, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload Photo / Sign', 150, 220);
      setImageSrc(canvas.toDataURL());
    }
  }, []);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Compress and resize process
  const processImage = (targetQ?: number) => {
    if (!imageSrc) return;
    setProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background (crucial for JPEG signatures and photos)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // If user provided a manual quality slider, use it.
      // Otherwise auto-tune quality to stay right inside [minKb, maxKb]!
      let bestQuality = (targetQ !== undefined ? targetQ : qualitySlider) / 100;
      let finalDataUrl = canvas.toDataURL('image/jpeg', bestQuality);
      let calculatedKb = Math.round((finalDataUrl.length * (3 / 4)) / 1024 * 10) / 10;

      // Auto-tune if not forced by user slider
      if (targetQ === undefined) {
        let low = 0.05;
        let high = 1.0;
        let bestDiff = Infinity;
        const targetMidKb = (minKb + maxKb) / 2;

        for (let i = 0; i < 7; i++) {
          const mid = (low + high) / 2;
          const candidate = canvas.toDataURL('image/jpeg', mid);
          const kb = (candidate.length * (3 / 4)) / 1024;
          if (Math.abs(kb - targetMidKb) < bestDiff) {
            bestDiff = Math.abs(kb - targetMidKb);
            bestQuality = mid;
            finalDataUrl = candidate;
            calculatedKb = Math.round(kb * 10) / 10;
          }
          if (kb > targetMidKb) {
            high = mid;
          } else {
            low = mid;
          }
        }
        setQualitySlider(Math.round(bestQuality * 100));
      }

      setOutputDataUrl(finalDataUrl);
      setOutputKb(calculatedKb);
      setProcessing(false);
    };
  };

  useEffect(() => {
    processImage();
  }, [imageSrc, targetWidth, targetHeight, minKb, maxKb]);

  const handleDownload = () => {
    if (!outputDataUrl) return;
    const link = document.createElement('a');
    link.download = `${selectedPreset.id}_${itemType}_${targetWidth}x${targetHeight}_${outputKb}kb.jpg`;
    link.href = outputDataUrl;
    link.click();
  };

  const isWithinRange = outputKb >= minKb && outputKb <= maxKb;

  return (
    <div id="photo-sign-resizer-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Maximize2 className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Govt Exam Photo & Signature Resizer</h2>
            <p className="text-xs text-emerald-100">
              One-click pixel crop & KB compressor for SSC, UPSC, Railway, Police, PAN Card & Bank Exams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="resizer-btn-download"
            onClick={handleDownload}
            disabled={!outputDataUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            Download ({outputKb} KB)
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
        {/* Controls Column */}
        <div className="lg:col-span-5 p-5 bg-slate-50 border-r border-slate-200 space-y-4">
          {/* Item Type: Photo vs Signature */}
          <div className="flex rounded-xl p-1 bg-slate-200">
            <button
              type="button"
              onClick={() => setItemType('photo')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                itemType === 'photo' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📷 Candidate Photo
            </button>
            <button
              type="button"
              onClick={() => setItemType('signature')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                itemType === 'signature' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✍️ Candidate Signature
            </button>
          </div>

          {/* Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              id="resizer-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-emerald-400 hover:border-emerald-600 rounded-xl text-emerald-800 font-medium flex items-center justify-center gap-2 transition hover:bg-emerald-50/50"
            >
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              Upload {itemType === 'photo' ? 'Photo' : 'Signature'} File
            </button>
          </div>

          {/* Exam Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Exam / Portal Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {govtExamPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    selectedPreset.id === preset.id
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{preset.examName}</div>
                  <div className="text-[10px] text-slate-500">{preset.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Notes / Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" /> Official Exam Guideline:
            </div>
            <p className="text-[11px] leading-relaxed">{selectedPreset.notes}</p>
          </div>

          {/* Target Pixel & KB Inputs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700">Exact Dimensions & KB Target</div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Width (pixels):</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(parseInt(e.target.value) || 100)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Height (pixels):</label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(parseInt(e.target.value) || 100)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Min File Size (KB):</label>
                <input
                  type="number"
                  value={minKb}
                  onChange={(e) => setMinKb(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Max File Size (KB):</label>
                <input
                  type="number"
                  value={maxKb}
                  onChange={(e) => setMaxKb(parseInt(e.target.value) || 50)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            {/* Manual fine-tuning slider */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Manual Quality Fine-Tuner:</span>
                <span className="font-bold">{qualitySlider}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={qualitySlider}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQualitySlider(val);
                  processImage(val);
                }}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-7 p-6 bg-slate-100 flex flex-col items-center justify-center">
          {/* Status Badge */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="text-xs text-slate-600">
              Target: <span className="font-semibold">{targetWidth} x {targetHeight} px</span> | Range: <span className="font-semibold">{minKb} - {maxKb} KB</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                isWithinRange
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {isWithinRange ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ready: {outputKb} KB (Valid)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {outputKb} KB (Out of Range)
                </>
              )}
            </div>
          </div>

          {/* Visual Canvas Output */}
          <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl shadow-lg flex flex-col items-center justify-center min-w-[280px] max-w-full">
            {outputDataUrl ? (
              <img
                src={outputDataUrl}
                alt="Processed result"
                style={{ width: targetWidth, height: targetHeight, maxWidth: '100%', maxHeight: '400px' }}
                className="border border-slate-200 shadow-sm object-contain bg-slate-50"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Generating preview...
              </div>
            )}

            <div className="mt-4 text-center">
              <span className="text-xs font-semibold text-slate-700 block">
                {selectedPreset.examName} ({itemType.toUpperCase()})
              </span>
              <span className="text-[11px] text-slate-500">
                Resolution: {targetWidth} × {targetHeight} px • File Size: {outputKb} KB
              </span>
            </div>
          </div>

          {/* Quick Action */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => processImage()}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Auto-Tune File Size
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download Compressed File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
