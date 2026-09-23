import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Sparkles, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2, Crown,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  originalSize: number;
  processedSize: number;
}

interface PhotoSharpenerProps {
  onClose: () => void;
}

const PhotoSharpener: React.FC<PhotoSharpenerProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [intensity, setIntensity] = useState(50);
  const [radius, setRadius] = useState(1);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Unsharp mask sharpening algorithm ──
  const applyToCanvas = useCallback(
    (img: HTMLImageElement, amount: number, r: number): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const src = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // ── Step 1: Create blurred version (simple box blur) ──
      const blurred = new Uint8ClampedArray(src.length);
      const rInt = Math.max(1, Math.round(r));
      const kernelSize = rInt * 2 + 1;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let dy = -rInt; dy <= rInt; dy++) {
            for (let dx = -rInt; dx <= rInt; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const idx = (ny * w + nx) * 4;
                sumR += src[idx];
                sumG += src[idx + 1];
                sumB += src[idx + 2];
                count++;
              }
            }
          }
          const idx = (y * w + x) * 4;
          blurred[idx] = sumR / count;
          blurred[idx + 1] = sumG / count;
          blurred[idx + 2] = sumB / count;
          blurred[idx + 3] = src[idx + 3];
        }
      }

      // ── Step 2: Unsharp mask = original + amount * (original - blurred) ──
      const factor = amount / 100;
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, src[i] + factor * (src[i] - blurred[i])));
        data[i + 1] = Math.min(255, Math.max(0, src[i + 1] + factor * (src[i + 1] - blurred[i + 1])));
        data[i + 2] = Math.min(255, Math.max(0, src[i + 2] + factor * (src[i + 2] - blurred[i + 2])));
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas;
    },
    []
  );

  // ── Live preview (debounced 300ms) ──
  useEffect(() => {
    if (images.length === 0) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      const updated = await Promise.all(
        images.map(async (item) => {
          return new Promise<ImageItem>((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (cancelled) return resolve(item);

              // Limit preview size for performance (max 1200px)
              const maxPreview = 1200;
              let srcImg: HTMLImageElement | HTMLCanvasElement = img;
              if (img.naturalWidth > maxPreview || img.naturalHeight > maxPreview) {
                const scale = Math.min(maxPreview / img.naturalWidth, maxPreview / img.naturalHeight);
                const tmp = document.createElement('canvas');
                tmp.width = Math.round(img.naturalWidth * scale);
                tmp.height = Math.round(img.naturalHeight * scale);
                const tmpCtx = tmp.getContext('2d');
                if (tmpCtx) {
                  tmpCtx.drawImage(img, 0, 0, tmp.width, tmp.height);
                  srcImg = tmp;
                }
              }

              const imgForProcess = srcImg instanceof HTMLCanvasElement
                ? (() => {
                    const tempImg = new Image();
                    tempImg.src = srcImg.toDataURL();
                    return tempImg;
                  })()
                : img;

              // For simplicity, if we made a canvas, use it directly
              let canvas: HTMLCanvasElement;
              if (srcImg instanceof HTMLCanvasElement) {
                const ctx2 = srcImg.getContext('2d');
                if (!ctx2) return resolve(item);
                const imageData = ctx2.getImageData(0, 0, srcImg.width, srcImg.height);
                const src = imageData.data;
                const w = srcImg.width;
                const h = srcImg.height;

                // Fast blur
                const blurred = new Uint8ClampedArray(src.length);
                const rInt = Math.max(1, Math.round(radius));
                for (let y = 0; y < h; y++) {
                  for (let x = 0; x < w; x++) {
                    let sumR = 0, sumG = 0, sumB = 0, count = 0;
                    for (let dy = -rInt; dy <= rInt; dy++) {
                      for (let dx = -rInt; dx <= rInt; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                          const idx = (ny * w + nx) * 4;
                          sumR += src[idx];
                          sumG += src[idx + 1];
                          sumB += src[idx + 2];
                          count++;
                        }
                      }
                    }
                    const idx = (y * w + x) * 4;
                    blurred[idx] = sumR / count;
                    blurred[idx + 1] = sumG / count;
                    blurred[idx + 2] = sumB / count;
                    blurred[idx + 3] = src[idx + 3];
                  }
                }

                const factor = intensity / 100;
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                  data[i] = Math.min(255, Math.max(0, src[i] + factor * (src[i] - blurred[i])));
                  data[i + 1] = Math.min(255, Math.max(0, src[i + 1] + factor * (src[i + 1] - blurred[i + 1])));
                  data[i + 2] = Math.min(255, Math.max(0, src[i + 2] + factor * (src[i + 2] - blurred[i + 2])));
                }
                ctx2.putImageData(imageData, 0, 0);
                canvas = srcImg;
              } else {
                canvas = applyToCanvas(srcImg as HTMLImageElement, intensity, radius);
              }

              if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);

              canvas.toBlob(
                (blob) => {
                  if (!blob || cancelled) return resolve(item);
                  resolve({
                    ...item,
                    processedBlob: blob,
                    processedUrl: URL.createObjectURL(blob),
                    processedSize: blob.size,
                  });
                },
                'image/jpeg',
                0.95
              );
            };
            img.onerror = () => resolve(item);
            img.src = item.originalUrl;
          });
        })
      );

      if (!cancelled) setImages(updated);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, radius]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please upload valid image files');
        return;
      }

      const newItems: ImageItem[] = validFiles.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        originalUrl: URL.createObjectURL(f),
        processedBlob: null,
        processedUrl: null,
        originalSize: f.size,
        processedSize: f.size,
      }));

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `sharpened_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
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
          `sharpened_${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `photo_sharpener_${Date.now()}.zip`;
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
    setIntensity(50);
    setRadius(1);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Photo Sharpener
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" /> PREMIUM
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Enhance photo clarity with unsharp mask</p>
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

              {/* Controls */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Sharpen Settings</h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    ⚡ Live Preview
                  </span>
                </div>

                {/* Intensity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sharpening Intensity
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded">
                      {intensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    disabled={images.length === 0}
                    className="w-full accent-amber-500 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0 (None)</span>
                    <span>50 (Natural)</span>
                    <span>150 (Extreme)</span>
                  </div>
                </div>

                {/* Radius */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Radius (Detail Size)</label>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-slate-900 px-2 py-0.5 rounded">
                      {radius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    disabled={images.length === 0}
                    className="w-full accent-blue-500 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1px (Fine)</span>
                    <span>3px</span>
                    <span>5px (Coarse)</span>
                  </div>
                </div>

                {/* Presets */}
                {images.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Quick Presets</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Subtle', i: 25, r: 1 },
                        { label: 'Natural', i: 50, r: 1 },
                        { label: 'Strong', i: 100, r: 2 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => { setIntensity(p.i); setRadius(p.r); }}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                            intensity === p.i && radius === p.r
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200 flex gap-2">
                  <Crown className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Premium Tool:</strong> Free users get <strong>3 uses/day</strong>. Upgrade for unlimited.
                  </div>
                </div>
              </div>

              {/* Upload */}
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
                <div className="flex items-center gap-3 flex-wrap">
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

              {/* Images */}
              {images.length > 0 && (
                <div className="space-y-6">
                  {images.map((img) => (
                    <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

                      {/* Header bar */}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
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
                        <div className="relative bg-white rounded-lg border-2 border-amber-500 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            SHARPENED
                          </div>
                          <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                            {img.processedUrl ? (
                              <img
                                src={img.processedUrl}
                                alt="processed"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                                <p className="text-[10px] text-slate-500 mt-2">Sharpening...</p>
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
                          <Download className="w-4 h-4" /> Download Sharpened Image
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Live Preview:</strong> Move sliders for instant sharpen effect. Preview uses max 1200px for performance. Download at full quality. Click <Maximize2 className="w-3 h-3 inline" /> for fullscreen.
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
                <Sparkles className="w-5 h-5 text-amber-400" />
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
                  ORIGINAL
                </div>
                <img
                  src={fullscreenImg.originalUrl}
                  alt="original"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-amber-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  SHARPENED
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="processed"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
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
                <Download className="w-4 h-4" /> Download Sharpened
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoSharpener;
