import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Maximize2, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Link as LinkIcon, Unlock, Lock,
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
  processedWidth: number;
  processedHeight: number;
}

interface ImageResizerProps {
  onClose: () => void;
}

type ResizeMode = 'fit' | 'fill' | 'stretch';

const ImageResizer: React.FC<ImageResizerProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [mode, setMode] = useState<ResizeMode>('fit');
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Apply resize to canvas ──
  const applyToCanvas = useCallback(
    (
      img: HTMLImageElement,
      targetW: number,
      targetH: number,
      resizeMode: ResizeMode
    ): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const srcRatio = srcW / srcH;
      const targetRatio = targetW / targetH;

      if (resizeMode === 'stretch') {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      } else if (resizeMode === 'fit') {
        // Fit whole image inside, letterbox
        let drawW = targetW;
        let drawH = targetH;
        if (srcRatio > targetRatio) {
          drawH = targetW / srcRatio;
        } else {
          drawW = targetH * srcRatio;
        }
        const dx = (targetW - drawW) / 2;
        const dy = (targetH - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
      } else {
        // Fill: crop to cover
        let cropW = srcW;
        let cropH = srcH;
        if (srcRatio > targetRatio) {
          cropW = srcH * targetRatio;
        } else {
          cropH = srcW / targetRatio;
        }
        const cropX = (srcW - cropW) / 2;
        const cropY = (srcH - cropH) / 2;
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
      }

      return canvas;
    },
    []
  );

  // ── Live preview ──
  useEffect(() => {
    if (images.length === 0) return;
    if (width < 1 || height < 1) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      const updated = await Promise.all(
        images.map(async (item) => {
          return new Promise<ImageItem>((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (cancelled) return resolve(item);
              const canvas = applyToCanvas(img, width, height, mode);

              if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);

              canvas.toBlob(
                (blob) => {
                  if (!blob || cancelled) return resolve(item);
                  resolve({
                    ...item,
                    processedBlob: blob,
                    processedUrl: URL.createObjectURL(blob),
                    processedSize: blob.size,
                    processedWidth: width,
                    processedHeight: height,
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
  }, [width, height, mode]);

  // ── Handle width change with aspect lock ──
  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setWidth(Math.round(val * aspectRatio));
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

      // Load dimensions
      const newItems = await Promise.all(
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
                  processedWidth: img.naturalWidth,
                  processedHeight: img.naturalHeight,
                });
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({
                  id: `${f.name}-${Date.now()}-${Math.random()}`,
                  file: f,
                  originalUrl: url,
                  processedBlob: null,
                  processedUrl: null,
                  originalSize: f.size,
                  processedSize: f.size,
                  originalWidth: 0,
                  originalHeight: 0,
                  processedWidth: 0,
                  processedHeight: 0,
                });
              };
              img.src = url;
            })
        )
      );

      // Set aspect ratio based on first image if lock is on
      if (lockAspect && newItems[0]?.originalWidth) {
        const ar = newItems[0].originalWidth / newItems[0].originalHeight;
        setAspectRatio(ar);
        setWidth(newItems[0].originalWidth);
        setHeight(newItems[0].originalHeight);
      }

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `resized_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
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
          `resized_${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `resized_images_${Date.now()}.zip`;
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
    setWidth(800);
    setHeight(600);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const presets = [
    { label: 'Instagram Post', w: 1080, h: 1080 },
    { label: 'Instagram Story', w: 1080, h: 1920 },
    { label: 'Facebook Cover', w: 820, h: 312 },
    { label: 'YouTube Thumb', w: 1280, h: 720 },
    { label: 'Passport Photo', w: 600, h: 600 },
    { label: 'WhatsApp DP', w: 500, h: 500 },
  ];

  const applyPreset = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
    setAspectRatio(w / h);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Image Resizer
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Resize images with real-time preview</p>
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
                  <h3 className="text-sm font-bold text-white">Dimensions</h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    ⚡ Live Preview
                  </span>
                </div>

                {/* Width & Height */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Width (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={width}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">Height (px)</label>
                      <button
                        onClick={() => setLockAspect(!lockAspect)}
                        className={`p-1 rounded transition ${lockAspect ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500'}`}
                        title={lockAspect ? 'Aspect locked' : 'Aspect unlocked'}
                      >
                        {lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={height}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Resize Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fit', 'fill', 'stretch'] as ResizeMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition capitalize ${
                          mode === m
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Quick Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p.w, p.h)}
                        className={`py-2 px-3 rounded-lg text-[11px] font-bold border transition ${
                          width === p.w && height === p.h
                            ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {p.label}
                        <div className="text-[9px] text-slate-500 mt-0.5">{p.w}×{p.h}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload */}
              {images.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-rose-400" />
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
                          <ImageIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {img.originalWidth}×{img.originalHeight} → {img.processedWidth}×{img.processedHeight}
                          </span>
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
                            BEFORE
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
                        <div className="relative bg-white rounded-lg border-2 border-rose-500 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            AFTER
                          </div>
                          <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                            {img.processedUrl ? (
                              <img
                                src={img.processedUrl}
                                alt="processed"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
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
                          <Download className="w-4 h-4" /> Download Resized Image
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Live Preview:</strong> Change width/height or mode to see instant results. Click <Maximize2 className="w-3 h-3 inline" /> for fullscreen.
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
                <Maximize2 className="w-5 h-5 text-rose-400" />
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
                  BEFORE
                </div>
                <img
                  src={fullscreenImg.originalUrl}
                  alt="original"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-rose-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  AFTER
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="processed"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
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
                <Download className="w-4 h-4" /> Download Resized Image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageResizer;
