import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Crop, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2, Lock, Unlock, RotateCcw,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  aspectRatio: number | null;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedSize: number;
}

interface PhotoCropProps {
  onClose: () => void;
}

type DragMode =
  | 'move'
  | 'nw' | 'ne' | 'sw' | 'se'
  | 'n' | 's' | 'e' | 'w'
  | null;

const ASPECT_PRESETS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: 'Passport', value: 35 / 45 },
  { label: 'A4', value: 1 / 1.414 },
];

const PhotoCrop: React.FC<PhotoCropProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentAspect, setCurrentAspect] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const activeIdxRef = useRef(0);

  // Keep activeIdx ref in sync (for use in non-React callbacks)
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  const dragState = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
    scaleX: number;
    scaleY: number;
    imgW: number;
    imgH: number;
    aspectRatio: number | null;
    rafId: number | null;
    pendingUpdate: { x: number; y: number; w: number; h: number } | null;
  } | null>(null);

  const activeImage = images[activeIdx] || null;

  // ── Apply crop to canvas ──
  const applyCrop = useCallback(async (item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(item.cropW));
          canvas.height = Math.max(1, Math.round(item.cropH));
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(item);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            Math.round(item.cropX),
            Math.round(item.cropY),
            Math.round(item.cropW),
            Math.round(item.cropH),
            0,
            0,
            canvas.width,
            canvas.height
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(item);
              if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
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
        } catch {
          resolve(item);
        }
      };
      img.onerror = () => resolve(item);
      img.src = item.originalUrl;
    });
  }, []);

  // ── Auto-apply crop (debounced) ──
  useEffect(() => {
    if (!activeImage) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsApplying(true);
      const updated = await applyCrop(activeImage);
      if (!cancelled) {
        setImages((prev) => prev.map((p, i) => (i === activeIdx ? updated : p)));
        setIsApplying(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImage?.cropX, activeImage?.cropY, activeImage?.cropW, activeImage?.cropH]);

  // ── Upload ──
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
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                const margin = 0.1;
                resolve({
                  id: `${f.name}-${Date.now()}-${Math.random()}`,
                  file: f,
                  originalUrl: url,
                  originalWidth: w,
                  originalHeight: h,
                  originalSize: f.size,
                  cropX: w * margin,
                  cropY: h * margin,
                  cropW: w * (1 - margin * 2),
                  cropH: h * (1 - margin * 2),
                  aspectRatio: null,
                  processedBlob: null,
                  processedUrl: null,
                  processedSize: f.size,
                });
              };
              img.onerror = () => URL.revokeObjectURL(url);
              img.src = url;
            })
        )
      );

      setImages((prev) => [...prev, ...newItems]);
      if (images.length === 0) setActiveIdx(0);
    } catch {
      setError('Failed to load images');
    }
  };

  // ── Get image display rect ──
  const getImageDisplayRect = () => {
    if (!previewRef.current || !activeImage) return null;
    const container = previewRef.current;
    const rect = container.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;
    const imgRatio = activeImage.originalWidth / activeImage.originalHeight;
    const containerRatio = containerW / containerH;

    let displayW, displayH, offsetX, offsetY;
    if (imgRatio > containerRatio) {
      displayW = containerW;
      displayH = containerW / imgRatio;
      offsetX = 0;
      offsetY = (containerH - displayH) / 2;
    } else {
      displayH = containerH;
      displayW = containerH * imgRatio;
      offsetX = (containerW - displayW) / 2;
      offsetY = 0;
    }

    const scaleX = displayW / activeImage.originalWidth;
    const scaleY = displayH / activeImage.originalHeight;

    return { x: offsetX, y: offsetY, w: displayW, h: displayH, scaleX, scaleY };
  };

  // ── Mouse Move (RAF throttled) ──
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const state = dragState.current;
    if (!state || !state.mode) return;

    const { mode, startX, startY, startCrop, scaleX, scaleY, imgW, imgH, aspectRatio } = state;

    const dx = (e.clientX - startX) / scaleX;
    const dy = (e.clientY - startY) / scaleY;

    let newX = startCrop.x;
    let newY = startCrop.y;
    let newW = startCrop.w;
    let newH = startCrop.h;
    const minSize = 20;

    if (mode === 'move') {
      newX = Math.max(0, Math.min(imgW - newW, startCrop.x + dx));
      newY = Math.max(0, Math.min(imgH - newH, startCrop.y + dy));
    } else {
      let left = startCrop.x;
      let top = startCrop.y;
      let right = startCrop.x + startCrop.w;
      let bottom = startCrop.y + startCrop.h;

      if (mode.includes('w')) left = Math.max(0, left + dx);
      if (mode.includes('e')) right = Math.min(imgW, right + dx);
      if (mode.includes('n')) top = Math.max(0, top + dy);
      if (mode.includes('s')) bottom = Math.min(imgH, bottom + dy);

      newX = left;
      newY = top;
      newW = right - left;
      newH = bottom - top;

      if (newW < minSize) newW = minSize;
      if (newH < minSize) newH = minSize;

      if (aspectRatio) {
        const ar = aspectRatio;
        if (mode === 'e' || mode === 'w') {
          newH = newW / ar;
        } else if (mode === 'n' || mode === 's') {
          newW = newH * ar;
        } else {
          if (newW / newH > ar) newW = newH * ar;
          else newH = newW / ar;
        }
        newX = Math.max(0, Math.min(imgW - newW, newX));
        newY = Math.max(0, Math.min(imgH - newH, newY));
        newW = Math.min(newW, imgW - newX);
        newH = Math.min(newH, imgH - newY);
      }
    }

    state.pendingUpdate = { x: newX, y: newY, w: newW, h: newH };

    if (state.rafId === null) {
      state.rafId = requestAnimationFrame(() => {
        const pending = dragState.current?.pendingUpdate;
        if (pending) {
          const idx = activeIdxRef.current;
          setImages((prev) =>
            prev.map((img, i) =>
              i === idx
                ? { ...img, cropX: pending.x, cropY: pending.y, cropW: pending.w, cropH: pending.h }
                : img
            )
          );
          if (dragState.current) dragState.current.pendingUpdate = null;
        }
        if (dragState.current) dragState.current.rafId = null;
      });
    }
  }, []);

  // ── Mouse Up ──
  const handleMouseUp = useCallback(() => {
    const state = dragState.current;
    if (state?.rafId !== null && state?.rafId !== undefined) {
      cancelAnimationFrame(state.rafId);
    }
    if (state?.pendingUpdate) {
      const pending = state.pendingUpdate;
      const idx = activeIdxRef.current;
      setImages((prev) =>
        prev.map((img, i) =>
          i === idx
            ? { ...img, cropX: pending.x, cropY: pending.y, cropW: pending.w, cropH: pending.h }
            : img
        )
      );
    }
    dragState.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // ── Mouse Down ──
  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeImage) return;
    const rect = getImageDisplayRect();
    if (!rect) return;

    dragState.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: {
        x: activeImage.cropX,
        y: activeImage.cropY,
        w: activeImage.cropW,
        h: activeImage.cropH,
      },
      scaleX: rect.scaleX,
      scaleY: rect.scaleY,
      imgW: activeImage.originalWidth,
      imgH: activeImage.originalHeight,
      aspectRatio: activeImage.aspectRatio,
      rafId: null,
      pendingUpdate: null,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'crosshair';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (dragState.current?.rafId) cancelAnimationFrame(dragState.current.rafId);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Aspect ratio change ──
  const applyAspect = (ar: number | null) => {
    setCurrentAspect(ar);
    if (!activeImage) return;

    if (ar === null) {
      setImages((prev) =>
        prev.map((img, i) => (i === activeIdx ? { ...img, aspectRatio: null } : img))
      );
      return;
    }

    const imgW = activeImage.originalWidth;
    const imgH = activeImage.originalHeight;
    let w = activeImage.cropW;
    let h = w / ar;

    if (h > imgH) { h = imgH; w = h * ar; }
    if (w > imgW) { w = imgW; h = w / ar; }

    const x = Math.max(0, (imgW - w) / 2);
    const y = Math.max(0, (imgH - h) / 2);

    setImages((prev) =>
      prev.map((img, i) =>
        i === activeIdx ? { ...img, cropX: x, cropY: y, cropW: w, cropH: h, aspectRatio: ar } : img
      )
    );
  };

  // ── Reset crop ──
  const resetCrop = () => {
    if (!activeImage) return;
    const margin = 0.1;
    setImages((prev) =>
      prev.map((img, i) =>
        i === activeIdx
          ? {
              ...img,
              cropX: img.originalWidth * margin,
              cropY: img.originalHeight * margin,
              cropW: img.originalWidth * (1 - margin * 2),
              cropH: img.originalHeight * (1 - margin * 2),
            }
          : img
      )
    );
    setCurrentAspect(null);
  };

  // ── Download single ──
  const downloadSingle = (item: ImageItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `cropped_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
  };

  // ── Download ZIP ──
  const downloadZip = async () => {
    const ready = images.filter((i) => i.processedBlob);
    if (ready.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      ready.forEach((img, idx) => {
        zip.file(
          `cropped_${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `photo_crop_${Date.now()}.zip`;
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
      const idx = prev.findIndex((i) => i.id === id);
      const img = prev[idx];
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
      }
      const updated = prev.filter((i) => i.id !== id);
      if (idx === activeIdx && updated.length > 0) {
        setActiveIdx(Math.min(activeIdx, updated.length - 1));
      } else if (updated.length === 0) {
        setActiveIdx(0);
      }
      return updated;
    });
  };

  const resetAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    setActiveIdx(0);
    setCurrentAspect(null);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ── Render crop overlay ──
  const renderCropOverlay = () => {
    if (!activeImage || !previewRef.current) return null;
    const rect = getImageDisplayRect();
    if (!rect) return null;

    const x = rect.x + activeImage.cropX * rect.scaleX;
    const y = rect.y + activeImage.cropY * rect.scaleY;
    const w = activeImage.cropW * rect.scaleX;
    const h = activeImage.cropH * rect.scaleY;

    const handles: { mode: DragMode; x: number; y: number; cursor: string }[] = [
      { mode: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
      { mode: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
      { mode: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
      { mode: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
      { mode: 'n', x: 0.5, y: 0, cursor: 'ns-resize' },
      { mode: 's', x: 0.5, y: 1, cursor: 'ns-resize' },
      { mode: 'w', x: 0, y: 0.5, cursor: 'ew-resize' },
      { mode: 'e', x: 1, y: 0.5, cursor: 'ew-resize' },
    ];

    return (
      <>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-slate-950/60" style={{ left: 0, top: 0, right: 0, height: y }} />
          <div className="absolute bg-slate-950/60" style={{ left: 0, top: y + h, right: 0, bottom: 0 }} />
          <div className="absolute bg-slate-950/60" style={{ left: 0, top: y, width: x, height: h }} />
          <div className="absolute bg-slate-950/60" style={{ left: x + w, top: y, right: 0, height: h }} />
        </div>

        <div
          className="absolute border-2 border-white"
          style={{
            left: x,
            top: y,
            width: w,
            height: h,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
            cursor: 'grab',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
          </div>

          {handles.map((hd) => (
            <div
              key={hd.mode}
              className="absolute w-4 h-4 bg-white border-2 border-slate-900 rounded-sm hover:scale-125 transition-transform"
              style={{
                left: `calc(${hd.x * 100}% - 8px)`,
                top: `calc(${hd.y * 100}% - 8px)`,
                cursor: hd.cursor,
              }}
              onMouseDown={(e) => handleMouseDown(e, hd.mode)}
            />
          ))}

          <div className="absolute -top-8 left-0 bg-slate-950/90 text-white text-[10px] font-mono font-bold px-2 py-1 rounded whitespace-nowrap">
            {Math.round(activeImage.cropW)} × {Math.round(activeImage.cropH)}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                  <Crop className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Photo Crop
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      INTERACTIVE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Drag the crop box to select area</p>
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

              {/* Aspect Ratio Presets */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {currentAspect ? <Lock className="w-4 h-4 text-teal-400" /> : <Unlock className="w-4 h-4 text-teal-400" />}
                    Aspect Ratio
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    ⚡ Live
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ASPECT_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyAspect(p.value)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition ${
                        currentAspect === p.value
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {images.length > 0 && (
                  <button
                    onClick={resetCrop}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Crop
                  </button>
                )}
              </div>

              {/* Upload */}
              {images.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-teal-400" />
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

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveIdx(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        idx === activeIdx
                          ? 'border-teal-500 ring-2 ring-teal-500/30'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <img src={img.originalUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-white text-[9px] font-bold py-0.5 text-center">
                        {idx + 1}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Crop Area */}
              {activeImage && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <p className="text-xs text-white font-bold truncate">{activeImage.file.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(activeImage.cropX)},{Math.round(activeImage.cropY)} · {Math.round(activeImage.cropW)}×{Math.round(activeImage.cropH)}
                      </span>
                      <button
                        onClick={() => setFullscreenImg(activeImage)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeImage(activeImage.id)}
                        className="p-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-900">
                    {/* Editor */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                          EDITOR
                        </span>
                        {isApplying && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                          </span>
                        )}
                      </div>
                      <div
                        ref={previewRef}
                        className="relative bg-slate-950 rounded-lg border-2 border-slate-700 overflow-hidden select-none"
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        <img
                          src={activeImage.originalUrl}
                          alt="edit"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                          draggable={false}
                        />
                        {renderCropOverlay()}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 text-center">
                        💡 Drag the box or handles to adjust crop area
                      </p>
                    </div>

                    {/* Live Preview */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          LIVE PREVIEW
                        </span>
                      </div>
                      <div className="bg-white rounded-lg border-2 border-teal-500 overflow-hidden aspect-square flex items-center justify-center p-2">
                        {activeImage.processedUrl ? (
                          <img
                            src={activeImage.processedUrl}
                            alt="cropped"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-[10px] text-slate-400">
                          {Math.round(activeImage.cropW)} × {Math.round(activeImage.cropH)} px
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-800">
                    <button
                      onClick={() => downloadSingle(activeImage)}
                      disabled={!activeImage.processedUrl}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                    >
                      <Download className="w-4 h-4" /> Download Cropped Image
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Interactive Crop:</strong> Drag the white box to move. Drag corner/edge handles to resize. Aspect ratios lock dimensions. Live preview updates instantly.
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
                <Crop className="w-5 h-5 text-teal-400" />
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

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-teal-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  CROPPED
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="cropped"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
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
                <Download className="w-4 h-4" /> Download Cropped
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoCrop;
