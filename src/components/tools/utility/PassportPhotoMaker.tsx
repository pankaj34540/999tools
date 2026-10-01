import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  UserSquare2, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2, Grid3X3, FileText,
  Sparkles, Check,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface PhotoItem {
  id: string;
  file: File;
  originalUrl: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
}

interface PassportPhotoMakerProps {
  onClose: () => void;
}

type LayoutMode = 'single' | 'sheet_4' | 'sheet_8';
type BackgroundMode = 'white' | 'light_blue' | 'grey';

const BG_COLORS: Record<BackgroundMode, string> = {
  white: '#ffffff',
  light_blue: '#e6f0fa',
  grey: '#f0f0f0',
};

const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({ onClose }) => {
  const { currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [layout, setLayout] = useState<LayoutMode>('sheet_8');
  const [background, setBackground] = useState<BackgroundMode>('white');
  const [faceZoom, setFaceZoom] = useState(1.0);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<PhotoItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ad gate
  const [pendingDownload, setPendingDownload] = useState<{ label: string; action: () => void } | null>(null);

  const shouldShowAds = () => {
    if (ownerAuthenticated) return false;
    if (currentUser?.plan === 'premium' && isUserPremium()) return false;
    if (currentUser?.plan === 'vle' || activeVle) return false;
    return true;
  };
  const isPaidUser = !shouldShowAds();

  const requestDownload = (label: string, action: () => void) => {
    if (isPaidUser) {
      action();
      return;
    }
    setPendingDownload({ label, action });
  };

  // Passport photo dimensions (35×45mm at 300 DPI = 413×531 px)
  const PASSPORT_W = 413;
  const PASSPORT_H = 531;

  // ── Crop to passport ratio (35:45) ──
  const cropToPassport = (img: HTMLImageElement): HTMLCanvasElement => {
    const targetRatio = PASSPORT_W / PASSPORT_H; // 0.778

    const canvas = document.createElement('canvas');
    canvas.width = PASSPORT_W;
    canvas.height = PASSPORT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background
    ctx.fillStyle = BG_COLORS[background];
    ctx.fillRect(0, 0, PASSPORT_W, PASSPORT_H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const srcRatio = srcW / srcH;

    // Determine crop area (center on face)
    let cropW: number;
    let cropH: number;

    if (srcRatio > targetRatio) {
      // Image is wider — crop width
      cropH = srcH / faceZoom;
      cropW = cropH * targetRatio;
    } else {
      // Image is taller — crop height
      cropW = srcW / faceZoom;
      cropH = cropW / targetRatio;
    }

    // Center crop with vertical offset (slider -100 to +100)
    const offsetY = (verticalOffset / 100) * (srcH - cropH) / 2;
    const cropX = (srcW - cropW) / 2;
    const cropY = Math.max(0, Math.min(srcH - cropH, (srcH - cropH) / 2 + offsetY));

    ctx.drawImage(
      img,
      cropX, cropY, cropW, cropH,
      0, 0, PASSPORT_W, PASSPORT_H
    );

    return canvas;
  };

  // ── Process single photo ──
  const processPhoto = async (item: PhotoItem): Promise<PhotoItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = cropToPassport(img);
          if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(item);
              resolve({
                ...item,
                processedBlob: blob,
                processedUrl: URL.createObjectURL(blob),
                originalWidth: img.naturalWidth,
                originalHeight: img.naturalHeight,
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
  };

  // ── Auto-process on setting change ──
  useEffect(() => {
    if (photos.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsProcessing(true);
      const updated = await Promise.all(
        photos.map(async (p) => (cancelled ? p : await processPhoto(p)))
      );
      if (!cancelled) {
        setPhotos(updated);
        setIsProcessing(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [background, faceZoom, verticalOffset]);

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

      const newItems: PhotoItem[] = await Promise.all(
        validFiles.map(
          (f) =>
            new Promise<PhotoItem>((resolve) => {
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
                  originalWidth: img.naturalWidth,
                  originalHeight: img.naturalHeight,
                });
              };
              img.onerror = () => URL.revokeObjectURL(url);
              img.src = url;
            })
        )
      );

      setPhotos((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  // ── Download single passport photo ──
  const actualDownloadSingle = (item: PhotoItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `passport_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
  };

  const downloadSingle = (item: PhotoItem) => {
    requestDownload(item.file.name, () => actualDownloadSingle(item));
  };

  // ── Generate A4 Sheet PDF (8 photos) ──
  const actualGenerateSheet = async () => {
    const ready = photos.filter((p) => p.processedBlob);
    if (ready.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setIsZipping(true);
    setError(null);

    try {
      // A4 = 210×297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Passport photo size in mm
      const photoW = 35;
      const photoH = 45;

      // Grid: 8 photos in 2 columns × 4 rows
      const cols = 2;
      const rows = layout === 'sheet_4' ? 2 : 4;
      const totalPhotos = cols * rows;

      // Margins (centered)
      const totalGridW = cols * photoW;
      const totalGridH = rows * photoH;
      const startX = (210 - totalGridW) / 2;
      const startY = (297 - totalGridH) / 2;

      // Convert each processed blob to base64
      const images: string[] = [];
      for (const photo of ready) {
        if (!photo.processedBlob) continue;
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo.processedBlob!);
        });
        images.push(base64);
      }

      // Place photos in grid
      for (let i = 0; i < totalPhotos; i++) {
        const photoData = images[i % images.length];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * photoW;
        const y = startY + row * photoH;

        pdf.addImage(
          photoData,
          'JPEG',
          x,
          y,
          photoW,
          photoH,
          undefined,
          'FAST'
        );
      }

      const fileName = `passport_sheet_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch {
      setError('Failed to generate sheet');
    } finally {
      setIsZipping(false);
    }
  };

  const generateSheet = () => {
    const ready = photos.filter((p) => p.processedBlob);
    if (ready.length === 0) {
      setError('Please upload at least one photo');
      return;
    }
    requestDownload('A4 Passport Photo Sheet (PDF)', actualGenerateSheet);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const resetAll = () => {
    photos.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    setPhotos([]);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const layoutPhotos = layout === 'sheet_8' ? 8 : layout === 'sheet_4' ? 4 : 1;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <UserSquare2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Passport Photo Maker
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      A4 SHEET
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Single photo → 8 passport photos on A4</p>
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
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-cyan-400" />
                    Photo Settings
                  </h3>
                  {isProcessing && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                    </span>
                  )}
                </div>

                {/* Layout */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Print Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sheet_8', label: '8 Photos', desc: '2×4 on A4' },
                      { id: 'sheet_4', label: '4 Photos', desc: '2×2 on A4' },
                      { id: 'single', label: 'Single', desc: '1 photo only' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLayout(l.id as LayoutMode)}
                        className={`p-3 rounded-lg border-2 transition text-left ${
                          layout === l.id
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                        }`}
                      >
                        <div className={`text-xs font-bold ${layout === l.id ? 'text-cyan-300' : 'text-slate-300'}`}>
                          {l.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{l.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Background
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'white', label: 'White', color: '#ffffff' },
                      { id: 'light_blue', label: 'Light Blue', color: '#e6f0fa' },
                      { id: 'grey', label: 'Grey', color: '#f0f0f0' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBackground(b.id as BackgroundMode)}
                        className={`p-3 rounded-lg border-2 transition flex items-center gap-2 ${
                          background === b.id
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded border border-slate-600"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className={`text-xs font-bold ${background === b.id ? 'text-cyan-300' : 'text-slate-300'}`}>
                          {b.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Face Zoom */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Face Zoom</label>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded">
                      {faceZoom.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.5}
                    step={0.1}
                    value={faceZoom}
                    onChange={(e) => setFaceZoom(Number(e.target.value))}
                    disabled={photos.length === 0}
                    className="w-full accent-cyan-500 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0.8x (Wider)</span>
                    <span>1.0x (Default)</span>
                    <span>1.5x (Tight)</span>
                  </div>
                </div>

                {/* Vertical Offset */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Vertical Adjust</label>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded">
                      {verticalOffset > 0 ? '+' : ''}{verticalOffset}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={verticalOffset}
                    onChange={(e) => setVerticalOffset(Number(e.target.value))}
                    disabled={photos.length === 0}
                    className="w-full accent-cyan-500 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>-100 (Down)</span>
                    <span>0 (Center)</span>
                    <span>+100 (Up)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    💡 Agar face top mein zyada aa raha hai, negative value use karo.
                  </p>
                </div>

                {/* Info */}
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 flex gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Passport Size:</strong> 35×45mm (413×531 px @ 300 DPI) — Indian passport & exam standard.
                  </div>
                </div>
              </div>

              {/* Upload */}
              {photos.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-cyan-400" />
                  </div>
                  <p className="text-white font-bold mb-1">Drop photo here or click to upload</p>
                  <p className="text-xs text-slate-400">JPG, PNG, WebP • Selfie/portrait photo</p>
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
                    onClick={generateSheet}
                    disabled={isZipping || photos.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                  >
                    {isZipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Download A4 Sheet ({layoutPhotos} photos)</>
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

              {/* Photos Grid */}
              {photos.length > 0 && (
                <div className="space-y-6">
                  {photos.map((img) => (
                    <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            {formatSize(img.originalSize)}
                          </span>
                          <button
                            onClick={() => setFullscreenImg(img)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Fullscreen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removePhoto(img.id)}
                            className="p-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900">
                        {/* BEFORE */}
                        <div className="relative bg-white rounded-lg border-2 border-slate-700 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-600">
                            ORIGINAL
                          </div>
                          <div className="aspect-[35/45] flex items-center justify-center bg-white">
                            <img
                              src={img.originalUrl}
                              alt="original"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* AFTER */}
                        <div className="relative bg-white rounded-lg border-2 border-cyan-500 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-cyan-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            PASSPORT 35×45mm
                          </div>
                          <div className="aspect-[35/45] flex items-center justify-center bg-white">
                            {img.processedUrl ? (
                              <img
                                src={img.processedUrl}
                                alt="processed"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-800">
                        <button
                          onClick={() => downloadSingle(img)}
                          disabled={!img.processedUrl}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                        >
                          <Download className="w-4 h-4" /> Download Passport Photo
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <UserSquare2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Tip:</strong> Selfie/photo upload karo → passport size mein auto-crop → A4 sheet pe 8 photos → print karo (₹20-30 mein local shop pe).
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
                <UserSquare2 className="w-5 h-5 text-cyan-400" />
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

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-cyan-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  PASSPORT
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="processed"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
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
                <Download className="w-4 h-4" /> Download Passport Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad gate modal */}
      {!isPaidUser && pendingDownload && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-2">Download Ready</h3>
            <p className="text-slate-400 text-sm mb-4">
              {pendingDownload.label}
            </p>
            <button
              onClick={() => {
                pendingDownload.action();
                setPendingDownload(null);
              }}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition"
            >
              <Download className="w-4 h-4 inline mr-2" /> Download Now
            </button>
            <button
              onClick={() => setPendingDownload(null)}
              className="mt-3 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PassportPhotoMaker;
