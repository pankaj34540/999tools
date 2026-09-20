import React, { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Sun, Contrast, Upload, Download, X, Loader2,
  Image as ImageIcon, Trash2, RotateCcw, Check, Sparkles,
} from 'lucide-react';

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
  processedBlob: Blob;
  originalSize: number;
  processedSize: number;
}

interface BrightnessContrastProps {
  onClose: () => void;
}

const BrightnessContrast: React.FC<BrightnessContrastProps> = ({ onClose }) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [brightness, setBrightness] = useState(0);   // -100 to +100
  const [contrast, setContrast] = useState(0);       // -100 to +100
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Apply brightness/contrast to a single image ──
  const processImage = useCallback(
    (file: File, b: number, c: number): Promise<ProcessedImage> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));

          // contrast factor: 0-2 range (0 = gray, 1 = original, 2 = max)
          const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
          const brightnessOffset = b * 2.55; // -255 to +255

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128 + brightnessOffset));
            data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128 + brightnessOffset));
            data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128 + brightnessOffset));
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Failed to process'));
              resolve({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                originalFile: file,
                originalUrl: url,
                processedUrl: URL.createObjectURL(blob),
                processedBlob: blob,
                originalSize: file.size,
                processedSize: blob.size,
              });
            },
            'image/jpeg',
            0.92
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      }),
    []
  );

  // ── Handle file upload ──
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsProcessing(true);

    try {
      const validFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (validFiles.length === 0) {
        setError('Please upload valid image files');
        setIsProcessing(false);
        return;
      }

      const processed = await Promise.all(
        validFiles.map((f) => processImage(f, brightness, contrast))
      );
      setImages((prev) => [...prev, ...processed]);
    } catch (err) {
      setError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Reprocess all with new settings ──
  const applySettings = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const reprocessed = await Promise.all(
        images.map(async (img) => {
          URL.revokeObjectURL(img.processedUrl);
          return processImage(img.originalFile, brightness, contrast);
        })
      );
      setImages(reprocessed);
    } catch (err) {
      setError('Failed to apply settings');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Download single ──
  const downloadSingle = (img: ProcessedImage) => {
    const link = document.createElement('a');
    link.href = img.processedUrl;
    link.download = `bc_${img.originalFile.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
  };

  // ── Download ZIP ──
  const downloadZip = async () => {
    if (images.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      images.forEach((img, idx) => {
        zip.file(
          `bc_${idx + 1}_${img.originalFile.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `brightness_contrast_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError('Failed to create ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  // ── Remove image ──
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        URL.revokeObjectURL(img.processedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // ── Reset ──
  const resetAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    setBrightness(0);
    setContrast(0);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Brightness & Contrast
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Adjust brightness and contrast of your photos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Settings ── */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Adjustment Settings
              </h3>

              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded">
                    {brightness > 0 ? '+' : ''}{brightness}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>-100 (Dark)</span>
                  <span>0 (Original)</span>
                  <span>+100 (Bright)</span>
                </div>
              </div>

              {/* Contrast */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-blue-400" /> Contrast
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-slate-900 px-2 py-0.5 rounded">
                    {contrast > 0 ? '+' : ''}{contrast}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>-100 (Flat)</span>
                  <span>0 (Original)</span>
                  <span>+100 (Sharp)</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={applySettings}
                  disabled={images.length === 0 || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Apply to All</>
                  )}
                </button>

                <button
                  onClick={() => { setBrightness(0); setContrast(0); }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Sliders
                </button>

                {images.length > 0 && (
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-bold rounded-lg transition ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All
                  </button>
                )}
              </div>
            </div>

            {/* ── Upload Area ── */}
            {images.length === 0 ? (
              <div
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-white font-bold mb-1">Drop images here or click to upload</p>
                <p className="text-xs text-slate-400">JPG, PNG, WebP • Multiple files supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                >
                  <Upload className="w-4 h-4" /> Add More
                </button>
                <button
                  onClick={downloadZip}
                  disabled={isZipping}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                >
                  {isZipping ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Zipping...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download All (ZIP)</>
                  )}
                </button>
                <span className="text-xs text-slate-400 ml-auto">{images.length} image(s)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* ── Image Grid ── */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="relative aspect-square">
                      <img
                        src={img.processedUrl}
                        alt={img.originalFile.name}
                        className="w-full h-full object-contain bg-slate-900"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-white font-bold truncate mb-1">{img.originalFile.name}</p>
                      <p className="text-[10px] text-slate-400 mb-2">
                        {formatSize(img.originalSize)} → {formatSize(img.processedSize)}
                      </p>
                      <button
                        onClick={() => downloadSingle(img)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Info ── */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
              <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Tip:</strong> Set brightness/contrast values first, then upload images. Changes are applied automatically on upload. Use "Apply to All" to re-process after adjusting sliders.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BrightnessContrast;
