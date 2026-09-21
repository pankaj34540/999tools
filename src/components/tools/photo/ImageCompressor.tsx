import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Zap, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2, Crown, Check,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  originalSize: number;
  processedSize: number;
  originalWidth: number;
  originalHeight: number;
  isProcessing: boolean;
}

interface ImageCompressorProps {
  onClose: () => void;
}

const TARGET_PRESETS = [
  { label: '20 KB', value: 20, note: 'Signature' },
  { label: '50 KB', value: 50, note: 'Photo (SSC)' },
  { label: '100 KB', value: 100, note: 'Photo (UPSC)' },
  { label: '200 KB', value: 200, note: 'Document' },
  { label: '500 KB', value: 500, note: 'High Quality' },
];

const ImageCompressor: React.FC<ImageCompressorProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [targetKB, setTargetKB] = useState(50);
  const [customKB, setCustomKB] = useState('');
  const [maxDimension, setMaxDimension] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Binary search compression ──
  const compressToTarget = async (
    img: HTMLImageElement,
    targetBytes: number,
    maxDim: number
  ): Promise<Blob> => {
    let drawW = img.naturalWidth;
    let drawH = img.naturalHeight;

    // Resize if maxDimension specified
    if (maxDim > 0 && (drawW > maxDim || drawH > maxDim)) {
      if (drawW > drawH) {
        drawH = Math.round((drawH / drawW) * maxDim);
        drawW = maxDim;
      } else {
        drawW = Math.round((drawW / drawH) * maxDim);
        drawH = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = drawW;
    canvas.height = drawH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, drawW, drawH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, drawW, drawH);

    // Binary search for quality
    let minQ = 0.05;
    let maxQ = 0.95;
    let bestBlob: Blob | null = null;

    for (let i = 0; i < 12; i++) {
      const midQ = (minQ + maxQ) / 2;
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', midQ);
      });

      if (!blob) break;

      if (blob.size <= targetBytes) {
        bestBlob = blob;
        minQ = midQ;
        if (blob.size >= targetBytes * 0.92) break;
      } else {
        maxQ = midQ;
      }

      if (maxQ - minQ < 0.01) break;
    }

    // If still too big, reduce dimensions progressively
    if (!bestBlob || bestBlob.size > targetBytes) {
      let scale = 0.9;
      while (scale > 0.15) {
        const scaledW = Math.round(drawW * scale);
        const scaledH = Math.round(drawH * scale);
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = scaledW;
        scaledCanvas.height = scaledH;
        const scaledCtx = scaledCanvas.getContext('2d');
        if (!scaledCtx) break;
        scaledCtx.fillStyle = '#ffffff';
        scaledCtx.fillRect(0, 0, scaledW, scaledH);
        scaledCtx.imageSmoothingEnabled = true;
        scaledCtx.imageSmoothingQuality = 'high';
        scaledCtx.drawImage(canvas, 0, 0, scaledW, scaledH);

        const blob = await new Promise<Blob | null>((resolve) => {
          scaledCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
        });

        if (blob && blob.size <= targetBytes) {
          bestBlob = blob;
          break;
        }
        scale -= 0.1;
      }
    }

    if (!bestBlob) throw new Error('Cannot compress to target size');
    return bestBlob;
  };

  // ── Process one image ──
  const processSingleImage = async (item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const targetBytes = targetKB * 1024;
          const blob = await compressToTarget(img, targetBytes, maxDimension);
          if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
          resolve({
            ...item,
            processedBlob: blob,
            processedUrl: URL.createObjectURL(blob),
            processedSize: blob.size,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            isProcessing: false,
          });
        } catch {
          resolve({ ...item, isProcessing: false });
        }
      };
      img.onerror = () => resolve({ ...item, isProcessing: false });
      img.src = item.originalUrl;
    });
  };

  // ── Apply compression to all ──
  const applyCompression = async () => {
    if (images.length === 0) return;
    setIsBatchProcessing(true);
    setError(null);

    try {
      const updated = await Promise.all(images.map((img) => processSingleImage(img)));
      setImages(updated);
    } catch {
      setError('Failed to compress images');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // ── Handle upload ──
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please upload valid image files');
        return;
      }

      const newItems: ImageItem[] = await Promise.all(
        validFiles.map(
          (f) =>
            new Promise<ImageItem>((resolve) => {
              const img = new Image();
              const url = URL.createObjectURL(f);
              img.onload = () => {
                resolve({
                  id: `${f.name}-${Date.now()}-${Math.random()}`,
                  file: f,
                  originalUrl: url,
                  processedBlob: null,
                  processedUrl: null,
                  originalSize: f.size,
                  processedSize: f.size,
                  originalWidth: img.naturalWidth,
                  originalHeight: img.naturalHeight,
                  isProcessing: false,
                });
              };
              img.onerror = () => resolve({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                file: f,
                originalUrl: url,
                processedBlob: null,
                processedUrl: null,
                originalSize: f.size,
                processedSize: f.size,
                originalWidth: 0,
                originalHeight: 0,
                isProcessing: false,
              });
              img.src = url;
            })
        )
      );

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `compressed_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
  };

  const downloadZip = async () => {
    const ready = images.filter((i) => i.processedBlob);
    if (ready.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      ready.forEach((img, idx) => {
        zip.file(
          `compressed_${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `compressed_${targetKB}KB_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('Failed to create ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const resetAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    setTargetKB(50);
    setCustomKB('');
    setMaxDimension(0);
    setError(null);
  };

  // ── Custom KB handler ──
  useEffect(() => {
    const n = Number(customKB);
    if (n > 0 && n <= 5000) setTargetKB(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customKB]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getSavingsPercent = (original: number, processed: number) => {
    if (original === 0) return 0;
    return Math.round(((original - processed) / original) * 100);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Image Compressor
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" /> PREMIUM
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Compress to exact KB for govt exam forms</p>
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

              {/* Settings */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Target File Size</h3>
                  <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-full">
                    🎯 Exact KB
                  </span>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TARGET_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setTargetKB(p.value); setCustomKB(''); }}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        targetKB === p.value && !customKB
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{p.label}</div>
                      <div className={`text-[10px] mt-0.5 ${targetKB === p.value && !customKB ? 'text-orange-100' : 'text-slate-500'}`}>
                        {p.note}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom KB & Max Dimension */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Custom Target (KB)</label>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={customKB}
                      onChange={(e) => setCustomKB(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Max Dimension (px, 0 = no resize)</label>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={maxDimension}
                      onChange={(e) => setMaxDimension(Number(e.target.value))}
                      placeholder="e.g. 1920"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200 flex gap-2">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Binary search:</strong> Finds best quality closest to your target KB. If target too small, dimensions auto-reduce.
                  </div>
                </div>

                {/* Apply Button */}
                {images.length > 0 && (
                  <button
                    onClick={applyCompression}
                    disabled={isBatchProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition shadow-md"
                  >
                    {isBatchProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Compressing {images.length} image(s)...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Apply Compression to All ({images.length})</>
                    )}
                  </button>
                )}
              </div>

              {/* Upload */}
              {images.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-orange-400" />
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
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                  >
                    <Upload className="w-4 h-4" /> Add More
                  </button>
                  <button
                    onClick={downloadZip}
                    disabled={isZipping || !images.some((i) => i.processedBlob)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                  >
                    {isZipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Zipping...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Download All (ZIP)</>
                    )}
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-bold rounded-lg transition ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All
                  </button>
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

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Images with A4 preview */}
              {images.length > 0 && (
                <div className="space-y-6">
                  {images.map((img) => {
                    const savings = img.processedBlob ? getSavingsPercent(img.originalSize, img.processedSize) : 0;
                    return (
                      <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

                        {/* Header bar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <ImageIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                            <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {img.processedBlob && (
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                                -{savings}%
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              {formatSize(img.originalSize)} → {formatSize(img.processedSize)}
                            </span>
                            <button
                              onClick={() => setFullscreenImg(img)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="Fullscreen"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeImage(img.id)}
                              className="p-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* A4 side-by-side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900">
                          {/* BEFORE */}
                          <div className="relative bg-white rounded-lg border-2 border-slate-700 overflow-hidden shadow-lg">
                            <div className="absolute top-2 left-2 z-10 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-600">
                              ORIGINAL
                            </div>
                            <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                              <img
                                src={img.originalUrl}
                                alt="original"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          </div>

                          {/* AFTER */}
                          <div className="relative bg-white rounded-lg border-2 border-orange-500 overflow-hidden shadow-lg">
                            <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                              COMPRESSED
                            </div>
                            <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                              {img.processedUrl ? (
                                <img
                                  src={img.processedUrl}
                                  alt="processed"
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : img.isProcessing ? (
                                <div className="text-center">
                                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                                  <p className="text-[10px] text-slate-500 mt-2">Compressing...</p>
                                </div>
                              ) : (
                                <div className="text-center px-4">
                                  <Zap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                  <p className="text-xs text-slate-500 font-bold">Not compressed yet</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Click "Apply Compression"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Download */}
                        <div className="p-3 border-t border-slate-800">
                          <button
                            onClick={() => downloadSingle(img)}
                            disabled={!img.processedUrl}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                          >
                            <Download className="w-4 h-4" /> Download Compressed
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Note:</strong> Binary search algorithm runs on "Apply" click. Free users: <strong>3/day</strong>. Premium: <strong>unlimited</strong>.
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen */}
      {fullscreenImg && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/98 backdrop-blur-md overflow-auto"
          onClick={() => setFullscreenImg(null)}
        >
          <div className="min-h-screen flex flex-col p-4">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-400" />
                <p className="text-sm text-white font-bold truncate max-w-md">
                  {fullscreenImg.file.name}
                </p>
              </div>
              <button
                onClick={() => setFullscreenImg(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-slate-950/90 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-slate-600">
                  ORIGINAL ({formatSize(fullscreenImg.originalSize)})
                </div>
                <img
                  src={fullscreenImg.originalUrl}
                  alt="original"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-orange-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  COMPRESSED ({formatSize(fullscreenImg.processedSize)})
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="processed"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Zap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-bold">Not compressed yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-4 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSingle(fullscreenImg);
                }}
                disabled={!fullscreenImg.processedUrl}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl transition shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Compressed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCompressor;
