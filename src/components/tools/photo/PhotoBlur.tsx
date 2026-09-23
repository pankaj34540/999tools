import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Droplet, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2, Sparkles,
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

interface PhotoBlurProps {
  onClose: () => void;
}

type BlurType = 'gaussian' | 'box' | 'motion' | 'radial';

const PhotoBlur: React.FC<PhotoBlurProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [blurType, setBlurType] = useState<BlurType>('gaussian');
  const [intensity, setIntensity] = useState(5);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Apply blur to canvas ──
  const applyToCanvas = useCallback(
    (img: HTMLImageElement, type: BlurType, strength: number): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.drawImage(img, 0, 0);

      // Apply CSS-like blur via canvas filter
      if (type === 'gaussian' || type === 'box') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return canvas;

        tempCtx.filter = `blur(${strength}px)`;
        tempCtx.drawImage(img, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
      } else if (type === 'motion') {
        // Motion blur: draw multiple offset copies
        const layers = 12;
        const offset = strength * 1.5;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1 / layers;
        for (let i = 0; i < layers; i++) {
          const dx = (i - layers / 2) * (offset / layers);
          ctx.drawImage(img, dx, 0);
        }
        ctx.globalAlpha = 1;
      } else if (type === 'radial') {
        // Radial blur: draw scaled copies from center
        const layers = 10;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1 / layers;
        for (let i = 0; i < layers; i++) {
          const scale = 1 + (i * strength) / 200;
          const w = canvas.width * scale;
          const h = canvas.height * scale;
          ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
        }
        ctx.globalAlpha = 1;
      }

      return canvas;
    },
    []
  );

  // ── Live preview ──
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
              const canvas = applyToCanvas(img, blurType, intensity);

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
                0.92
              );
            };
            img.onerror = () => resolve(item);
            img.src = item.originalUrl;
          });
        })
      );

      if (!cancelled) setImages(updated);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blurType, intensity]);

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
    link.download = `blurred_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
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
          `blurred_${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `photo_blur_${Date.now()}.zip`;
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
    setBlurType('gaussian');
    setIntensity(5);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const blurTypes: { id: BlurType; label: string; emoji: string }[] = [
    { id: 'gaussian', label: 'Gaussian Blur', emoji: '🌫️' },
    { id: 'box', label: 'Box Blur', emoji: '⬜' },
    { id: 'motion', label: 'Motion Blur', emoji: '💨' },
    { id: 'radial', label: 'Radial Blur', emoji: '🎯' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Photo Blur
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Apply blur effects with real-time preview</p>
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
                  <h3 className="text-sm font-bold text-white">Blur Settings</h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    ⚡ Live Preview
                  </span>
                </div>

                {/* Blur Type */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Blur Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {blurTypes.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBlurType(b.id)}
                        className={`p-3 rounded-lg border-2 transition text-left ${
                          blurType === b.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                        }`}
                      >
                        <div className="text-lg mb-1">{b.emoji}</div>
                        <div className={`text-xs font-bold ${blurType === b.id ? 'text-purple-300' : 'text-slate-300'}`}>
                          {b.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Intensity
                    </label>
                    <span className="text-xs font-mono font-bold text-purple-400 bg-slate-900 px-2 py-0.5 rounded">
                      {intensity}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    disabled={images.length === 0}
                    className="w-full accent-purple-500 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1px (Subtle)</span>
                    <span>15px</span>
                    <span>30px (Heavy)</span>
                  </div>
                </div>
              </div>

              {/* Upload */}
              {images.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-purple-400" />
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

              {/* Images with A4 preview */}
              {images.length > 0 && (
                <div className="space-y-6">
                  {images.map((img) => (
                    <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

                      {/* Header bar */}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
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
                        <div className="relative bg-white rounded-lg border-2 border-purple-500 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            BLURRED
                          </div>
                          <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                            {img.processedUrl ? (
                              <img
                                src={img.processedUrl}
                                alt="processed"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
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
                          <Download className="w-4 h-4" /> Download Blurred Image
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Live Preview:</strong> Change blur type or intensity for instant results. Click <Maximize2 className="w-3 h-3 inline" /> for fullscreen.
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
                <Droplet className="w-5 h-5 text-purple-400" />
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

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-purple-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  BLURRED
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="processed"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
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
                <Download className="w-4 h-4" /> Download Blurred Image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoBlur;
