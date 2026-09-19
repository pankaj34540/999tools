import React, { useState, useRef } from 'react';
import {
  X, Upload, Download, Image as ImageIcon, Check, Loader2,
  Trash2, FileArchive, AlertCircle, Zap, Target,
} from 'lucide-react';

interface ToolProps {
  onClose: () => void;
}

interface CompressedImage {
  id: string;
  originalFile: File;
  originalPreview: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  compressedBlob: Blob | null;
  compressedPreview: string;
  compressedSize: number;
  finalQuality: number;
  finalWidth: number;
  finalHeight: number;
  status: 'pending' | 'processing' | 'done' | 'error' | 'warning';
  error?: string;
  outputName: string;
}

const PRESETS = [
  { kb: 20, label: '20 KB', desc: 'Signature' },
  { kb: 50, label: '50 KB', desc: 'Photo (SSC)' },
  { kb: 100, label: '100 KB', desc: 'Photo (UPSC)' },
  { kb: 200, label: '200 KB', desc: 'Document' },
  { kb: 500, label: '500 KB', desc: 'High Quality' },
];

export const ImageCompressor: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [targetKB, setTargetKB] = useState(50);
  const [maxDimension, setMaxDimension] = useState(0); // 0 = no resize
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('50');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // HELPERS
  // ============================================
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getBaseName = (filename: string): string => {
    return filename.replace(/\.[^.]+$/, '');
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // ============================================
  // COMPRESS WITH BINARY SEARCH
  // ============================================
  const compressImage = async (
    imageData: CompressedImage,
    targetKB: number,
    maxDim: number
  ): Promise<CompressedImage> => {
    try {
      const img = await loadImage(imageData.originalFile);
      const targetBytes = targetKB * 1024;

      // Calculate dimensions
      let finalW = img.width;
      let finalH = img.height;

      if (maxDim > 0 && (img.width > maxDim || img.height > maxDim)) {
        const ratio = Math.min(maxDim / img.width, maxDim / img.height);
        finalW = Math.round(img.width * ratio);
        finalH = Math.round(img.height * ratio);
      }

      // Prepare canvas
      const canvas = document.createElement('canvas');
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, finalW, finalH);

      // Binary search for quality
      let low = 10;
      let high = 100;
      let bestBlob: Blob | null = null;
      let bestQuality = 92;
      const MAX_ITERATIONS = 12;

      // First check if 100% quality itself is under target
      const fullQualityBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 1.0);
      });

      if (fullQualityBlob && fullQualityBlob.size <= targetBytes) {
        bestBlob = fullQualityBlob;
        bestQuality = 100;
      } else {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const mid = Math.floor((low + high) / 2);
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', mid / 100);
          });

          if (!blob) break;

          if (blob.size <= targetBytes) {
            bestBlob = blob;
            bestQuality = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }

          if (low > high) break;
        }
      }

      if (!bestBlob) {
        // Fallback: reduce dimensions and try again
        const scale = 0.7;
        const newW = Math.round(finalW * scale);
        const newH = Math.round(finalH * scale);
        canvas.width = newW;
        canvas.height = newH;
        const ctx2 = canvas.getContext('2d')!;
        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillRect(0, 0, newW, newH);
        ctx2.drawImage(img, 0, 0, newW, newH);

        bestBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.3);
        });
        bestQuality = 30;
        finalW = newW;
        finalH = newH;
      }

      if (!bestBlob) throw new Error('Compression failed');

      const compressedPreview = URL.createObjectURL(bestBlob);
      const outputName = `${getBaseName(imageData.originalFile.name)}_${targetKB}KB.jpg`;

      // Warning if over target
      const status = bestBlob.size > targetBytes ? 'warning' : 'done';

      return {
        ...imageData,
        compressedBlob: bestBlob,
        compressedPreview,
        compressedSize: bestBlob.size,
        finalQuality: bestQuality,
        finalWidth: finalW,
        finalHeight: finalH,
        status,
        outputName,
      };
    } catch (err: any) {
      return {
        ...imageData,
        status: 'error',
        error: err.message || 'Compression failed',
      };
    }
  };

  // ============================================
  // HANDLE FILES
  // ============================================
  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Please upload valid image files');
      return;
    }

    const newImages: CompressedImage[] = [];

    for (const file of validFiles) {
      try {
        const img = await loadImage(file);
        newImages.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalFile: file,
          originalPreview: URL.createObjectURL(file),
          originalWidth: img.width,
          originalHeight: img.height,
          originalSize: file.size,
          compressedBlob: null,
          compressedPreview: '',
          compressedSize: 0,
          finalQuality: 0,
          finalWidth: 0,
          finalHeight: 0,
          status: 'pending',
          outputName: '',
        });
      } catch (err) {
        console.error('Failed to load:', file.name, err);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFiles(files);
  };

  // ============================================
  // COMPRESS ALL
  // ============================================
  const compressAll = async () => {
    if (images.length === 0 || targetKB <= 0) return;
    setBusy(true);

    setImages((prev) => prev.map((i) => ({ ...i, status: 'processing' })));

    const results: CompressedImage[] = [];
    for (const img of images) {
      if (img.compressedPreview) URL.revokeObjectURL(img.compressedPreview);
      const result = await compressImage(img, targetKB, maxDimension);
      results.push(result);
    }

    setImages(results);
    setBusy(false);
  };

  // ============================================
  // REMOVE / CLEAR
  // ============================================
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalPreview);
        if (img.compressedPreview) URL.revokeObjectURL(img.compressedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalPreview);
      if (img.compressedPreview) URL.revokeObjectURL(img.compressedPreview);
    });
    setImages([]);
  };

  // ============================================
  // DOWNLOADS
  // ============================================
  const downloadSingle = (img: CompressedImage) => {
    if (!img.compressedBlob) return;
    const url = URL.createObjectURL(img.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const downloadAllAsZip = async () => {
    const done = images.filter((i) => (i.status === 'done' || i.status === 'warning') && i.compressedBlob);
    if (done.length === 0) return;

    setBusy(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      done.forEach((img) => {
        if (img.compressedBlob) zip.file(img.outputName, img.compressedBlob);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `999tools_compressed_${targetKB}KB_${Date.now()}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (err) {
      console.error('ZIP failed:', err);
      alert('ZIP failed. Download individually.');
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // STATS
  // ============================================
  const doneCount = images.filter((i) => i.status === 'done' || i.status === 'warning').length;
  const totalOriginalSize = images.reduce((s, i) => s + i.originalSize, 0);
  const totalCompressedSize = images
    .filter((i) => i.status === 'done' || i.status === 'warning')
    .reduce((s, i) => s + i.compressedSize, 0);
  const totalSaved = totalOriginalSize - totalCompressedSize;
  const savedPercent = totalOriginalSize > 0 ? (totalSaved / totalOriginalSize) * 100 : 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Image Compressor (Target KB)</h2>
            <p className="text-xs text-slate-500">
              Compress to exact file size — SSC, UPSC, Railway forms
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* SETTINGS */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-5 space-y-4">
        {/* Target KB Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-orange-600" />
            Target File Size:
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.kb}
                onClick={() => {
                  setTargetKB(preset.kb);
                  setSelectedPreset(String(preset.kb));
                }}
                className={`p-2.5 rounded-xl border-2 transition ${
                  selectedPreset === String(preset.kb)
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="text-xs font-black">{preset.label}</div>
                <div className={`text-[9px] mt-0.5 ${
                  selectedPreset === String(preset.kb) ? 'text-orange-100' : 'text-slate-400'
                }`}>
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom KB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Custom Target (KB):
            </label>
            <input
              type="number"
              min={5}
              max={5000}
              value={targetKB}
              onChange={(e) => {
                setTargetKB(parseInt(e.target.value) || 0);
                setSelectedPreset('');
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Max Dimension (px, 0 = no resize):
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              value={maxDimension}
              onChange={(e) => setMaxDimension(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              e.g. 1920 for web, 1000 for fast loading
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>How it works:</strong> Binary search algorithm automatically finds the best quality that gets closest to your target KB without exceeding it. If target is too small, image dimension will be reduced.
          </p>
        </div>
      </div>

      {/* UPLOAD AREA */}
      {images.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            dragActive
              ? 'border-orange-500 bg-orange-50 scale-[1.01]'
              : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/30'
          }`}
        >
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-base font-black text-slate-800 mb-1">
            {dragActive ? 'Drop images here' : 'Upload Images to Compress'}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Click or drag & drop — Multiple images supported
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl">
            <ImageIcon className="w-4 h-4" />
            Choose Files
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            Perfect for govt exam photo/signature requirements
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {/* STATS */}
          {doneCount > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Compressed</div>
                <div className="text-lg font-black text-slate-900">{doneCount}/{images.length}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Original</div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatBytes(totalOriginalSize)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Compressed</div>
                <div className="text-sm font-black text-orange-700 font-mono">
                  {formatBytes(totalCompressedSize)}
                </div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Saved</div>
                <div className="text-lg font-black text-emerald-700 font-mono">
                  −{savedPercent.toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" /> Add More
            </button>
            <button
              onClick={compressAll}
              disabled={busy || targetKB <= 0}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Compress All to {targetKB}KB
                </>
              )}
            </button>
            {doneCount > 1 && (
              <button
                onClick={downloadAllAsZip}
                disabled={busy}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
              >
                <FileArchive className="w-3.5 h-3.5" /> Download All (ZIP)
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={busy}
              className="ml-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${
                  img.status === 'error' ? 'border-rose-300' :
                  img.status === 'warning' ? 'border-amber-300' :
                  img.status === 'done' ? 'border-emerald-300' :
                  img.status === 'processing' ? 'border-orange-300' :
                  'border-slate-200'
                }`}
              >
                <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                  {img.status === 'done' || img.status === 'warning' ? (
                    <img src={img.compressedPreview} alt="Compressed" className="w-full h-full object-contain" />
                  ) : (
                    <img src={img.originalPreview} alt="Original" className="w-full h-full object-contain" />
                  )}

                  {img.status === 'processing' && (
                    <div className="absolute inset-0 bg-orange-600/80 backdrop-blur flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                      <p className="text-[10px] text-white font-bold mt-2">Compressing...</p>
                    </div>
                  )}

                  {img.status === 'error' && (
                    <div className="absolute inset-0 bg-rose-600/80 backdrop-blur flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                      <p className="text-[10px] text-white font-bold">{img.error}</p>
                    </div>
                  )}

                  {img.status === 'done' && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> {Math.round(img.compressedSize / 1024)}KB
                    </div>
                  )}

                  {img.status === 'warning' && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> {Math.round(img.compressedSize / 1024)}KB
                    </div>
                  )}

                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 truncate">
                    {img.outputName || img.originalFile.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {formatBytes(img.originalSize)}
                    </span>
                    {(img.status === 'done' || img.status === 'warning') && (
                      <>
                        <span className="text-slate-400">→</span>
                        <span className={`font-mono font-bold ${
                          img.status === 'done' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {formatBytes(img.compressedSize)}
                        </span>
                      </>
                    )}
                  </div>
                  {(img.status === 'done' || img.status === 'warning') && (
                    <>
                      <div className="text-[10px] text-slate-500">
                        Quality: <span className="font-bold">{img.finalQuality}%</span> • 
                        {' '}{img.finalWidth}×{img.finalHeight}
                      </div>
                      {img.status === 'warning' && (
                        <div className="text-[10px] text-amber-700 font-bold bg-amber-50 p-1.5 rounded">
                          ⚠️ Couldn't reach {targetKB}KB — try smaller max dimension
                        </div>
                      )}
                    </>
                  )}
                  {(img.status === 'done' || img.status === 'warning') && (
                    <button
                      onClick={() => downloadSingle(img)}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition mt-2"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {images.length > 0 && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      )}
    </div>
  );
};
