import React, { useState, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import {
  Camera, Upload, Download, X, Loader2, Trash2,
  RotateCw, RotateCcw, ZoomIn, ZoomOut, RefreshCw,
  Eye, EyeOff, ChevronDown, FileText, Grid3X3, Palette,
  Undo2, Redo2, Maximize2, Smartphone, Layers, Printer,
  Copy, Share2, Settings, Sparkles, Check, Square,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

// ═══════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════
interface PassportPreset {
  id: string;
  label: string;
  w: number;
  h: number;
  category: 'passport' | 'visa' | 'exam' | 'other';
  bg: string;
}

const PRESETS: PassportPreset[] = [
  { id: 'india_passport', label: 'India Passport', w: 35, h: 45, category: 'passport', bg: '#ffffff' },
  { id: 'india_visa', label: 'India Visa / e-Visa', w: 51, h: 51, category: 'visa', bg: '#ffffff' },
  { id: 'us_visa', label: 'US Visa / 2×2"', w: 51, h: 51, category: 'visa', bg: '#ffffff' },
  { id: 'uk_passport', label: 'UK Passport', w: 35, h: 45, category: 'passport', bg: '#f0f0f0' },
  { id: 'schengen', label: 'EU / Schengen', w: 35, h: 45, category: 'visa', bg: '#f0f0f0' },
  { id: 'australia', label: 'Australia Passport', w: 35, h: 45, category: 'passport', bg: '#ffffff' },
  { id: 'newzealand', label: 'New Zealand Passport', w: 35, h: 45, category: 'passport', bg: '#ffffff' },
  { id: 'canada', label: 'Canada Passport', w: 50, h: 70, category: 'passport', bg: '#ffffff' },
  { id: 'uae_visa', label: 'UAE / Dubai Visa', w: 43, h: 55, category: 'visa', bg: '#ffffff' },
  { id: 'saudi_visa', label: 'Saudi Arabia Visa', w: 51, h: 51, category: 'visa', bg: '#ffffff' },
  { id: 'singapore', label: 'Singapore Passport', w: 35, h: 45, category: 'passport', bg: '#ffffff' },
  { id: 'nepal', label: 'Nepal Passport', w: 35, h: 45, category: 'passport', bg: '#e6f0fa' },
  { id: 'bangladesh', label: 'Bangladesh Passport', w: 40, h: 50, category: 'passport', bg: '#ffffff' },
  { id: 'upsc', label: 'UPSC', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'ssc', label: 'SSC (CGL/CHSL/MTS/GD)', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'ibps', label: 'IBPS (PO/Clerk/SO/RRB)', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'sbi', label: 'SBI (PO/Clerk)', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'rbi', label: 'RBI (Grade B/Assistant)', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'neet', label: 'NEET', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'jee', label: 'JEE', w: 35, h: 45, category: 'exam', bg: '#ffffff' },
  { id: 'pan_card', label: 'PAN Card', w: 25, h: 35, category: 'other', bg: '#ffffff' },
];

const DPI = 300;
const MM_TO_PX = DPI / 25.4;
const BG_COLORS = [
  { id: 'original', label: 'Original', color: null },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'light_blue', label: 'Blue', color: '#cfe2f3' },
  { id: 'grey', label: 'Grey', color: '#f0f0f0' },
  { id: 'red', label: 'Red', color: '#d32f2f' },
  { id: 'black', label: 'Black', color: '#1a1a1a' },
];

interface PassportPhotoMakerProps {
  onClose: () => void;
}

const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({ onClose }) => {
  const { currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();

  // State
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [presetId, setPresetId] = useState('india_passport');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [background, setBackground] = useState<string | null>('#ffffff');
  const [showGuides, setShowGuides] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [showPhotosPerRow, setShowPhotosPerRow] = useState(false);
  const [showPrintQuality, setShowPrintQuality] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'background' | 'layout'>('crop');
  const [layoutPhotos, setLayoutPhotos] = useState(10);
  const [photosPerRow, setPhotosPerRow] = useState(5);
  const [printQuality, setPrintQuality] = useState('Print quality');
  const [outputFormat, setOutputFormat] = useState('JPG');
  const [compareMode, setCompareMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pendingDownload, setPendingDownload] = useState<{ label: string; action: () => void } | null>(null);

  const shouldShowAds = () => {
    if (ownerAuthenticated) return false;
    if (currentUser?.plan === 'premium' && isUserPremium()) return false;
    if (currentUser?.plan === 'vle' || activeVle) return false;
    return true;
  };
  const isPaidUser = !shouldShowAds();

  const requestDownload = (label: string, action: () => void) => {
    if (isPaidUser) { action(); return; }
    setPendingDownload({ label, action });
  };

  const currentPreset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const canvasW = Math.round(currentPreset.w * MM_TO_PX);
  const canvasH = Math.round(currentPreset.h * MM_TO_PX);

  // Upload
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image');
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setZoom(1);
        setRotation(0);
        setOffsetX(0);
        setOffsetY(0);
        setBackground(currentPreset.bg);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { setError('Failed to load image'); URL.revokeObjectURL(url); };
      img.src = url;
    } catch { setError('Failed to load image'); }
  };

  // Render to canvas
  const renderCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!originalImage) return null;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const srcW = originalImage.naturalWidth;
    const srcH = originalImage.naturalHeight;
    const srcRatio = srcW / srcH;
    const destRatio = canvasW / canvasH;

    let cropW: number;
    let cropH: number;

    if (srcRatio > destRatio) {
      cropH = srcH / zoom;
      cropW = cropH * destRatio;
    } else {
      cropW = srcW / zoom;
      cropH = cropW / destRatio;
    }

    const availW = srcW - cropW;
    const availH = srcH - cropH;
    const cropX = Math.max(0, Math.min(availW, availW / 2 + (offsetX * availW) / 2));
    const cropY = Math.max(0, Math.min(availH, availH / 2 + (offsetY * availH) / 2));

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvasW / 2, -canvasH / 2);
    ctx.drawImage(originalImage, cropX, cropY, cropW, cropH, 0, 0, canvasW, canvasH);
    ctx.restore();

    return canvas;
  }, [originalImage, canvasW, canvasH, zoom, rotation, offsetX, offsetY, background]);

  // Live preview
  useEffect(() => {
    const canvas = renderCanvas();
    if (!canvas || !previewCanvasRef.current) return;
    const preview = previewCanvasRef.current;
    preview.width = canvas.width;
    preview.height = canvas.height;
    const pCtx = preview.getContext('2d');
    if (pCtx) {
      pCtx.clearRect(0, 0, preview.width, preview.height);
      pCtx.drawImage(canvas, 0, 0);
    }
  }, [renderCanvas]);

  // Download single
  const actualDownloadSingle = () => {
    const canvas = renderCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `passport_${currentPreset.id}_${Date.now()}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/jpeg', 0.95);
  };
  const downloadSingle = () => {
    if (!originalImage) return;
    requestDownload(`${currentPreset.label} — Single Photo`, actualDownloadSingle);
  };

  // Generate A4 Sheet
  const actualGenerateSheet = async () => {
    const canvas = renderCanvas();
    if (!canvas) return;
    setIsGenerating(true);
    setError(null);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const photoW = currentPreset.w;
      const photoH = currentPreset.h;
      const cols = photosPerRow;
      const rows = Math.ceil(layoutPhotos / cols);
      const totalGridW = cols * photoW;
      const totalGridH = rows * photoH;
      const startX = (210 - totalGridW) / 2;
      const startY = (297 - totalGridH) / 2;
      const base64 = canvas.toDataURL('image/jpeg', 0.95);

      for (let i = 0; i < layoutPhotos; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        pdf.addImage(base64, 'JPEG', startX + col * photoW, startY + row * photoH, photoW, photoH, undefined, 'FAST');
      }
      pdf.save(`passport_sheet_${currentPreset.id}_${Date.now()}.pdf`);
    } catch { setError('Failed to generate sheet'); }
    finally { setIsGenerating(false); }
  };
  const generateSheet = () => {
    if (!originalImage) return;
    requestDownload(`A4 Sheet (${layoutPhotos} photos)`, actualGenerateSheet);
  };

  const resetAll = () => {
    setOriginalImage(null);
    setZoom(1); setRotation(0); setOffsetX(0); setOffsetY(0);
    setError(null);
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <div className="min-h-screen flex flex-col">

          {/* ═══ TOP HEADER BAR ═══ */}
          <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
            <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-slate-950" />
                </div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Passport Photo Maker
                  <span className="text-[9px] font-black bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                  <Smartphone className="w-3.5 h-3.5" /> Mobile Version
                </button>
                <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                  <Layers className="w-3.5 h-3.5" /> Multiple Photos
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <X className="w-3.5 h-3.5" /> Exit Full Screen
                </button>
              </div>
            </div>
          </div>

          {/* ═══ TOOLBAR ═══ */}
          {originalImage && (
            <div className="sticky top-[60px] z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
              <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center gap-1.5 flex-wrap">
                <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Undo">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset all
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.05))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-200 px-2 min-w-[46px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.05))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Fit
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <button
                  onClick={() => setRotation((r) => r - 90)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Rotate left</span>
                </button>
                <button
                  onClick={() => setRotation((r) => r + 90)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <RotateCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Rotate right</span>
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <button
                  onClick={() => setShowGuides(!showGuides)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    showGuides ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {showGuides ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{showGuides ? 'Hide guides' : 'Show guides'}</span>
                </button>
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    compareMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Compare</span>
                </button>

                <div className="ml-auto relative">
                  <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white text-xs font-bold transition"
                  >
                    <span>{currentPreset.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition ${showPresets ? 'rotate-180' : ''}`} />
                  </button>
                  {showPresets && (
                    <div className="absolute top-full right-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                      {['passport', 'visa', 'exam', 'other'].map((cat) => (
                        <div key={cat}>
                          <div className="px-3 py-1.5 bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                            {cat === 'passport' ? '🌍 Passport' : cat === 'visa' ? '✈️ Visa' : cat === 'exam' ? '🎓 Exam' : '🆔 Other'}
                          </div>
                          {PRESETS.filter((p) => p.category === cat).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setPresetId(p.id);
                                setBackground(p.bg);
                                setShowPresets(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition ${
                                presetId === p.id ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'
                              }`}
                            >
                              {p.label} <span className="text-[10px] text-slate-500">({p.w}×{p.h})</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ MAIN BODY ═══ */}
          <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4">

            {!originalImage ? (
              /* UPLOAD */
              <div className="max-w-2xl mx-auto mt-16">
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-16 text-center transition bg-slate-900/50"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                    <Upload className="w-9 h-9 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">Upload your photo</p>
                  <p className="text-xs text-slate-400 mb-6">
                    JPG, PNG, WEBP or iPhone HEIC up to 10 MB.<br />
                    You can also paste an image anywhere on this page.
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg transition"
                    >
                      <Upload className="w-4 h-4" /> Choose Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold rounded-xl shadow-lg transition border border-slate-300"
                    >
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                </div>
                {error && (
                  <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm">
                    ⚠️ {error}
                  </div>
                )}
              </div>
            ) : (
              /* EDITOR */
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

                {/* ═══ LEFT: CANVAS ═══ */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 min-h-[600px] flex items-center justify-center relative">

                  <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Position & Crop
                  </div>

                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                    >
                      ✏️ Change Photo
                    </button>
                  </div>

                  <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-500">
                    {canvasW} × {canvasH}px
                  </div>

                  {/* Canvas */}
                  <div className="relative flex items-center justify-center">
                    <div className="relative">
                      {/* BEFORE (if compare mode) */}
                      {compareMode && originalImage && (
                        <div className="absolute left-0 top-0 opacity-40 -z-10" style={{ transform: 'translateX(-50%)' }}>
                          <img
                            src={originalImage.src}
                            alt="before"
                            className="max-w-[300px] max-h-[500px] object-contain rounded"
                          />
                        </div>
                      )}

                      <canvas
                        ref={previewCanvasRef}
                        className="rounded-lg shadow-2xl border-4 border-slate-950 bg-white"
                        style={{
                          width: `${Math.min(400, canvasW)}px`,
                          height: 'auto',
                          display: 'block',
                        }}
                      />

                      {/* Guides Overlay */}
                      {showGuides && (
                        <div
                          className="absolute inset-0 pointer-events-none rounded-lg"
                          style={{ width: `${Math.min(400, canvasW)}px`, height: `${(Math.min(400, canvasW) * canvasH) / canvasW}px` }}
                        >
                          <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ top: '15%' }}>
                            <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Crown
                            </span>
                          </div>
                          <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ top: '40%' }}>
                            <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Eye line
                            </span>
                          </div>
                          <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ top: '72%' }}>
                            <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Chin
                            </span>
                          </div>
                          <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-cyan-500/40" />
                        </div>
                      )}

                      {/* Size label */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                        {currentPreset.w} × {currentPreset.h} mm
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ RIGHT: SIDEBAR ═══ */}
                <div className="space-y-3">

                  {/* Tabs */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1 flex">
                    {[
                      { id: 'crop', label: 'Crop', icon: Square },
                      { id: 'background', label: 'BG', icon: Palette },
                      { id: 'layout', label: 'Layout', icon: Grid3X3 },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id as any)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                            activeTab === t.id
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab content */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">

                    {/* ─── CROP TAB ─── */}
                    {activeTab === 'crop' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Preview</h4>
                          <span className="text-[10px] font-mono text-slate-500">{canvasW} × {canvasH}px</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Zoom
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              {zoom.toFixed(2)}×
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.5}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <RotateCw className="w-3.5 h-3.5 text-amber-400" /> Straighten
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              {rotation}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            step={1}
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>

                        <details className="group">
                          <summary className="cursor-pointer text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
                            <ChevronDown className="w-3.5 h-3.5 transition group-open:rotate-180" />
                            Advanced (pan by percentage)
                          </summary>
                          <div className="mt-3 space-y-3 pl-4">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                Horizontal: {offsetX.toFixed(2)}
                              </label>
                              <input
                                type="range" min={-1} max={1} step={0.05}
                                value={offsetX}
                                onChange={(e) => setOffsetX(Number(e.target.value))}
                                className="w-full accent-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                Vertical: {offsetY.toFixed(2)}
                              </label>
                              <input
                                type="range" min={-1} max={1} step={0.05}
                                value={offsetY}
                                onChange={(e) => setOffsetY(Number(e.target.value))}
                                className="w-full accent-amber-500"
                              />
                            </div>
                          </div>
                        </details>
                      </>
                    )}

                    {/* ─── BACKGROUND TAB ─── */}
                    {activeTab === 'background' && (
                      <>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Background</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {BG_COLORS.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => setBackground(bg.color)}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition ${
                                background === bg.color
                                  ? 'border-amber-500 bg-amber-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <div
                                className="w-10 h-10 rounded-lg border border-slate-600"
                                style={{
                                  backgroundColor: bg.color || 'transparent',
                                  backgroundImage: bg.color ? undefined : 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%), linear-gradient(45deg, #333 25%, #222 25%, #222 75%, #333 75%)',
                                  backgroundSize: bg.color ? undefined : '10px 10px',
                                  backgroundPosition: bg.color ? undefined : '0 0, 5px 5px',
                                }}
                              />
                              <span className={`text-[9px] font-bold ${background === bg.color ? 'text-amber-300' : 'text-slate-400'}`}>
                                {bg.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-2.5 text-[10px] text-blue-200">
                          💡 Best result: plain white/blue background photo use karo
                        </div>
                      </>
                    )}

                    {/* ─── LAYOUT TAB ─── */}
                    {activeTab === 'layout' && (
                      <>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Layout & Print</h4>

                        {/* Photo size dropdown */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Photo Size</label>
                          <button
                            onClick={() => setShowPresets(!showPresets)}
                            className="w-full px-3 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold flex items-center justify-between transition"
                          >
                            <span className="truncate">{currentPreset.label} ({currentPreset.w}×{currentPreset.h}mm)</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>

                        {/* Page Size */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Page Size</label>
                          <div className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-bold">
                            A4 (210 × 297 mm)
                          </div>
                        </div>

                        {/* Info box */}
                        <div className="bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-2.5 text-[10px] text-cyan-200">
                          <strong>{canvasW}×{canvasH}px</strong> — {currentPreset.w}×{currentPreset.h}mm @ 300 DPI
                        </div>

                        {/* Photos per row */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Photos Per Row</label>
                          <div className="flex items-center gap-2">
                            {[3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => setPhotosPerRow(n)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                                  photosPerRow === n
                                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Total photos */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">
                            Total Photos (max 30)
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLayoutPhotos((p) => Math.max(1, p - 1))}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
                            >
                              −
                            </button>
                            <div className="flex-1 py-2 text-center bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-bold">
                              {layoutPhotos}
                            </div>
                            <button
                              onClick={() => setLayoutPhotos((p) => Math.min(30, p + 1))}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-400 text-center">
                          📄 {Math.ceil(layoutPhotos / photosPerRow)} rows × {photosPerRow} photos
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && originalImage && (
              <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm max-w-2xl mx-auto">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ═══ BOTTOM ACTION BAR ═══ */}
          {originalImage && (
            <div className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
              <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-2 flex-wrap justify-center">

                {/* Print Quality dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPrintQuality(!showPrintQuality)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{printQuality}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Format dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFormat(!showFormat)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>{outputFormat}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition">
                  <Maximize2 className="w-3.5 h-3.5" /> Preview
                </button>

                <button
                  onClick={downloadSingle}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download Single
                </button>

                <button
                  onClick={generateSheet}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white text-xs font-bold rounded-lg shadow-md transition"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><FileText className="w-3.5 h-3.5" /> Download A4 Sheet ({layoutPhotos})</>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>

                <button
                  onClick={() => {
                    const canvas = renderCanvas();
                    if (canvas) {
                      canvas.toBlob((blob) => {
                        if (blob) {
                          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        }
                      }, 'image/png');
                    }
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>

                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Checkout my passport photo made with 999tools!`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-md transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad gate modal */}
      {!isPaidUser && pendingDownload && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-2">Download Ready</h3>
            <p className="text-slate-400 text-sm mb-4">{pendingDownload.label}</p>
            <button
              onClick={() => { pendingDownload.action(); setPendingDownload(null); }}
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
