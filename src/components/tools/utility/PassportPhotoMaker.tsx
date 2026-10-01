import React, { useState, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import {
  Camera, Upload, Download, X, Loader2, Trash2,
  RotateCw, RotateCcw, ZoomIn, ZoomOut, RefreshCw,
  Eye, EyeOff, ChevronDown, FileText, Grid3X3, Palette,
  Undo2, Redo2, Maximize2, Smartphone, Layers, Printer,
  Copy, Share2, Sparkles, Square, UserPlus, User, Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

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

interface Customer {
  id: string;
  name: string;
  image: HTMLImageElement | null;
  zoom: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  background: string | null;
}

interface PassportPhotoMakerProps {
  onClose: () => void;
}

const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({ onClose }) => {
  const { currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();

  const [mode, setMode] = useState<'single' | 'multi'>('single');

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [background, setBackground] = useState<string | null>('#ffffff');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  const [presetId, setPresetId] = useState('india_passport');
  const [showGuides, setShowGuides] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'background' | 'layout'>('crop');
  const [layoutPhotos, setLayoutPhotos] = useState(10);
  const [photosPerRow, setPhotosPerRow] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customerFileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pendingCustomerIdxRef = useRef<number | null>(null);

  const [pendingDownload, setPendingDownload] = useState<{ label: string; action: () => void } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const shouldShowAds = () => {
    if (ownerAuthenticated) return false;
    if (currentUser && (currentUser.plan === 'premium' || currentUser.plan === 'vle')) {
      if (isUserPremium()) return false;
    }
    if (activeVle) return false;
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

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || null;

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

  const addCustomer = () => {
    if (customers.length >= 6) {
      setError('Max 6 customers per A4 sheet. Download & start new sheet.');
      return;
    }
    const newCustomer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `Customer ${customers.length + 1}`,
      image: null,
      zoom: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      background: currentPreset.bg,
    };
    setCustomers([...customers, newCustomer]);
    setActiveCustomerId(newCustomer.id);
    pendingCustomerIdxRef.current = customers.length;
    setTimeout(() => customerFileInputRef.current?.click(), 100);
  };

  const handleCustomerFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (pendingCustomerIdxRef.current === null) return;
    const idx = pendingCustomerIdxRef.current;
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
        setCustomers((prev) => {
          const updated = [...prev];
          if (updated[idx]) {
            updated[idx] = {
              ...updated[idx],
              image: img,
              zoom: 1,
              rotation: 0,
              offsetX: 0,
              offsetY: 0,
              background: currentPreset.bg,
            };
          }
          return updated;
        });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { setError('Failed to load image'); URL.revokeObjectURL(url); };
      img.src = url;
      pendingCustomerIdxRef.current = null;
    } catch { setError('Failed to load image'); }
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (activeCustomerId === id) setActiveCustomerId(null);
  };

  const changeCustomerPhoto = (idx: number) => {
    pendingCustomerIdxRef.current = idx;
    customerFileInputRef.current?.click();
  };

  const renderCanvas = useCallback((
    image: HTMLImageElement | null,
    z: number,
    r: number,
    ox: number,
    oy: number,
    bg: string | null
  ): HTMLCanvasElement | null => {
    if (!image) return null;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const srcW = image.naturalWidth;
    const srcH = image.naturalHeight;
    const srcRatio = srcW / srcH;
    const destRatio = canvasW / canvasH;

    let cropW: number;
    let cropH: number;

    if (srcRatio > destRatio) {
      cropH = srcH / z;
      cropW = cropH * destRatio;
    } else {
      cropW = srcW / z;
      cropH = cropW / destRatio;
    }

    const availW = srcW - cropW;
    const availH = srcH - cropH;
    const cropX = Math.max(0, Math.min(availW, availW / 2 + (ox * availW) / 2));
    const cropY = Math.max(0, Math.min(availH, availH / 2 + (oy * availH) / 2));

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((r * Math.PI) / 180);
    ctx.translate(-canvasW / 2, -canvasH / 2);
    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, canvasW, canvasH);
    ctx.restore();

    return canvas;
  }, [canvasW, canvasH]);

  const activeImage = mode === 'single' ? originalImage : activeCustomer?.image || null;
  const activeZoom = mode === 'single' ? zoom : activeCustomer?.zoom || 1;
  const activeRotation = mode === 'single' ? rotation : activeCustomer?.rotation || 0;
  const activeOffsetX = mode === 'single' ? offsetX : activeCustomer?.offsetX || 0;
  const activeOffsetY = mode === 'single' ? offsetY : activeCustomer?.offsetY || 0;
  const activeBackground = mode === 'single' ? background : activeCustomer?.background ?? currentPreset.bg;

  const setActiveZoom = (v: number) => {
    if (mode === 'single') setZoom(v);
    else if (activeCustomer) updateCustomer(activeCustomer.id, { zoom: v });
  };
  const setActiveRotation = (v: number) => {
    if (mode === 'single') setRotation(v);
    else if (activeCustomer) updateCustomer(activeCustomer.id, { rotation: v });
  };
  const setActiveOffsetX = (v: number) => {
    if (mode === 'single') setOffsetX(v);
    else if (activeCustomer) updateCustomer(activeCustomer.id, { offsetX: v });
  };
  const setActiveOffsetY = (v: number) => {
    if (mode === 'single') setOffsetY(v);
    else if (activeCustomer) updateCustomer(activeCustomer.id, { offsetY: v });
  };
  const setActiveBackground = (v: string | null) => {
    if (mode === 'single') setBackground(v);
    else if (activeCustomer) updateCustomer(activeCustomer.id, { background: v });
  };

  useEffect(() => {
    const canvas = renderCanvas(activeImage, activeZoom, activeRotation, activeOffsetX, activeOffsetY, activeBackground);
    if (!canvas || !previewCanvasRef.current) return;
    const preview = previewCanvasRef.current;
    preview.width = canvas.width;
    preview.height = canvas.height;
    const pCtx = preview.getContext('2d');
    if (pCtx) {
      pCtx.clearRect(0, 0, preview.width, preview.height);
      pCtx.drawImage(canvas, 0, 0);
    }
  }, [activeImage, activeZoom, activeRotation, activeOffsetX, activeOffsetY, activeBackground, renderCanvas]);

  const actualDownloadSingle = () => {
    const canvas = renderCanvas(activeImage, activeZoom, activeRotation, activeOffsetX, activeOffsetY, activeBackground);
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
    if (!activeImage) return;
    requestDownload(`${currentPreset.label} — Single Photo`, actualDownloadSingle);
  };

  const buildSheetPDF = (): jsPDF | null => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const photoW = currentPreset.w;
    const photoH = currentPreset.h;
    const cols = photosPerRow;
    const MARGIN_TOP = 10;
    const MARGIN_LEFT = 10;

    if (mode === 'single') {
      const canvas = renderCanvas(originalImage, zoom, rotation, offsetX, offsetY, background);
      if (!canvas) return null;
      const base64 = canvas.toDataURL('image/jpeg', 0.95);
      const rows = Math.ceil(layoutPhotos / cols);
      let count = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (count >= layoutPhotos) break;
          pdf.addImage(base64, 'JPEG', MARGIN_LEFT + col * photoW, MARGIN_TOP + row * photoH, photoW, photoH, undefined, 'FAST');
          count++;
        }
        if (count >= layoutPhotos) break;
      }
    } else {
      customers.forEach((customer, idx) => {
        if (!customer.image) return;
        const canvas = renderCanvas(
          customer.image,
          customer.zoom,
          customer.rotation,
          customer.offsetX,
          customer.offsetY,
          customer.background
        );
        if (!canvas) return;
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        const y = MARGIN_TOP + idx * photoH;
        for (let col = 0; col < cols; col++) {
          pdf.addImage(base64, 'JPEG', MARGIN_LEFT + col * photoW, y, photoW, photoH, undefined, 'FAST');
        }
      });
    }

    return pdf;
  };

  const actualGenerateSheet = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const pdf = buildSheetPDF();
      if (!pdf) {
        setError('Please add at least one photo');
        return;
      }
      pdf.save(`passport_sheet_${currentPreset.id}_${Date.now()}.pdf`);
    } catch { setError('Failed to generate sheet'); }
    finally { setIsGenerating(false); }
  };

  const generateSheet = () => {
    if (mode === 'single' && !originalImage) return;
    if (mode === 'multi' && customers.filter((c) => c.image).length === 0) {
      setError('Please add at least one customer photo');
      return;
    }
    requestDownload('A4 Sheet', actualGenerateSheet);
  };

  const handlePrint = () => {
    requestDownload('Print A4 Sheet', () => {
      const pdf = buildSheetPDF();
      if (!pdf) return;
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    });
  };

  // ═══════════════════════════════════════════
  // PREVIEW — A4 sheet preview modal
  // ═══════════════════════════════════════════
  const generatePreview = () => {
    const pdf = buildSheetPDF();
    if (!pdf) {
      setError('Please add at least one photo');
      return;
    }
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    setPreviewImageUrl(pdfUrl);
    setShowPreview(true);
  };

  const resetAll = () => {
    setOriginalImage(null);
    setZoom(1); setRotation(0); setOffsetX(0); setOffsetY(0);
    setCustomers([]);
    setActiveCustomerId(null);
    setError(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <div className="min-h-screen flex flex-col">

          {/* TOP HEADER BAR */}
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

              <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setMode('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    mode === 'single' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Single
                </button>
                <button
                  onClick={() => setMode('multi')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    mode === 'multi' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Multi-Customer
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <X className="w-3.5 h-3.5" /> Exit
                </button>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          {(mode === 'single' && originalImage) || (mode === 'multi' && customers.length > 0) ? (
            <div className="sticky top-[60px] z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
              <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <button onClick={() => setActiveZoom(Math.max(0.5, activeZoom - 0.05))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-200 px-2 min-w-[46px] text-center">
                  {Math.round(activeZoom * 100)}%
                </span>
                <button onClick={() => setActiveZoom(Math.min(3, activeZoom + 0.05))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <button onClick={() => setActiveRotation(activeRotation - 90)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setActiveRotation(activeRotation + 90)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                  <RotateCw className="w-3.5 h-3.5" />
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
                                if (mode === 'single') setBackground(p.bg);
                                else if (activeCustomer) updateCustomer(activeCustomer.id, { background: p.bg });
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
          ) : null}

          {/* MAIN BODY */}
          <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4">

            {mode === 'single' && !originalImage && (
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
                  <p className="text-xs text-slate-400 mb-6">JPG, PNG, WEBP up to 10 MB</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg transition mx-auto"
                  >
                    <Upload className="w-4 h-4" /> Choose Photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
                </div>
              </div>
            )}

            {mode === 'multi' && customers.length === 0 && (
              <div className="max-w-2xl mx-auto mt-16">
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-16 text-center bg-slate-900/50">
                  <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                    <Users className="w-9 h-9 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">Multi-Customer Sheet</p>
                  <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                    Har customer ka photo ek row pe (5 copies). Max 6 customers per A4 sheet.
                  </p>
                  <button
                    onClick={addCustomer}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg transition mx-auto"
                  >
                    <UserPlus className="w-4 h-4" /> Add First Customer
                  </button>
                </div>
              </div>
            )}

            {((mode === 'single' && originalImage) || (mode === 'multi' && customers.length > 0)) && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 min-h-[600px] flex items-center justify-center relative">

                  {mode === 'multi' && (
                    <div className="absolute top-4 left-4 right-4 flex items-center gap-2 flex-wrap bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg p-2 z-10">
                      {customers.map((c, idx) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveCustomerId(c.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            activeCustomerId === c.id ? 'bg-amber-500 text-slate-950' : c.image ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-rose-900/40 text-rose-300 border border-rose-700'
                          }`}
                          title={c.name}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                          <span className="truncate max-w-[80px]">{c.name}</span>
                          {!c.image && <span className="text-[10px]">📷</span>}
                          <button onClick={(e) => { e.stopPropagation(); removeCustomer(c.id); }} className="ml-1 hover:text-rose-500">
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                      {customers.length < 6 && (
                        <button onClick={addCustomer} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition">
                          <UserPlus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                      <span className="text-[10px] text-slate-500 ml-auto">{customers.length}/6 · 1 row each</span>
                    </div>
                  )}

                  {mode === 'multi' && !activeCustomer && (
                    <div className="text-center mt-16">
                      <Users className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Click a customer above to edit</p>
                    </div>
                  )}

                  {activeImage && (
                    <div className={`relative flex items-center justify-center ${mode === 'multi' ? 'mt-16' : ''}`}>
                      <div className="relative">
                        <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Position & Crop</div>
                        <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-500">{canvasW} × {canvasH}px</div>

                        <canvas
                          ref={previewCanvasRef}
                          className="rounded-lg shadow-2xl border-4 border-slate-950 bg-white"
                          style={{ width: `${Math.min(400, canvasW)}px`, height: 'auto', display: 'block' }}
                        />

                        {showGuides && (
                          <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ width: `${Math.min(400, canvasW)}px`, height: `${(Math.min(400, canvasW) * canvasH) / canvasW}px` }}>
                            <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ top: '15%' }}>
                              <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Crown</span>
                            </div>
                            <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ top: '40%' }}>
                              <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Eye line</span>
                            </div>
                            <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ top: '72%' }}>
                              <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Chin</span>
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                          {currentPreset.w} × {currentPreset.h} mm
                        </div>
                      </div>
                    </div>
                  )}

                  {mode === 'multi' && activeCustomer && (
                    <button
                      onClick={() => changeCustomerPhoto(customers.findIndex((c) => c.id === activeCustomer.id))}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow"
                    >
                      <Camera className="w-3.5 h-3.5" /> {activeCustomer.image ? 'Change Photo' : 'Upload Photo'}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
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
                            activeTab === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {t.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">

                    {activeTab === 'crop' && activeImage && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Zoom
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400">{activeZoom.toFixed(2)}×</span>
                          </div>
                          <input type="range" min={0.5} max={3} step={0.05} value={activeZoom} onChange={(e) => setActiveZoom(Number(e.target.value))} className="w-full accent-amber-500" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <RotateCw className="w-3.5 h-3.5 text-amber-400" /> Straighten
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400">{activeRotation}°</span>
                          </div>
                          <input type="range" min={-45} max={45} step={1} value={activeRotation} onChange={(e) => setActiveRotation(Number(e.target.value))} className="w-full accent-amber-500" />
                        </div>

                        <details className="group">
                          <summary className="cursor-pointer text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
                            <ChevronDown className="w-3.5 h-3.5 transition group-open:rotate-180" />
                            Advanced (pan)
                          </summary>
                          <div className="mt-3 space-y-3 pl-4">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">Horizontal: {activeOffsetX.toFixed(2)}</label>
                              <input type="range" min={-1} max={1} step={0.05} value={activeOffsetX} onChange={(e) => setActiveOffsetX(Number(e.target.value))} className="w-full accent-amber-500" />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">Vertical: {activeOffsetY.toFixed(2)}</label>
                              <input type="range" min={-1} max={1} step={0.05} value={activeOffsetY} onChange={(e) => setActiveOffsetY(Number(e.target.value))} className="w-full accent-amber-500" />
                            </div>
                          </div>
                        </details>
                      </>
                    )}

                    {activeTab === 'background' && (
                      <>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Background</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {BG_COLORS.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => setActiveBackground(bg.color)}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition ${
                                activeBackground === bg.color ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg border border-slate-600" style={{ backgroundColor: bg.color || '#222', backgroundImage: bg.color ? undefined : 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%)', backgroundSize: '10px 10px' }} />
                              <span className={`text-[9px] font-bold ${activeBackground === bg.color ? 'text-amber-300' : 'text-slate-400'}`}>{bg.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {activeTab === 'layout' && (
                      <>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Layout</h4>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Photo Size</label>
                          <button
                            onClick={() => setShowPresets(!showPresets)}
                            className="w-full px-3 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold flex items-center justify-between transition"
                          >
                            <span className="truncate">{currentPreset.label}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Page Size</label>
                          <div className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-bold">
                            A4 (210 × 297 mm)
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Photos Per Row (Max 5)</label>
                          <div className="flex items-center gap-2">
                            {[3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => setPhotosPerRow(n)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                                  photosPerRow === n ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1.5">⚠️ 5 max — 6 photos pe printer cut karega</p>
                        </div>

                        {mode === 'single' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Total Photos</label>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setLayoutPhotos((p) => Math.max(1, p - 1))} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition">−</button>
                              <div className="flex-1 py-2 text-center bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-bold">{layoutPhotos}</div>
                              <button onClick={() => setLayoutPhotos((p) => Math.min(30, p + 1))} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition">+</button>
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-400 text-center">
                          {mode === 'single' ? (
                            <>📄 {Math.ceil(layoutPhotos / photosPerRow)} rows × {photosPerRow} photos</>
                          ) : (
                            <>📄 {customers.length} customer(s) · {customers.length} row(s) × {photosPerRow} = <strong className="text-amber-400">{customers.length * photosPerRow} photos</strong></>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm max-w-2xl mx-auto">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* BOTTOM ACTION BAR */}
          {((mode === 'single' && originalImage) || (mode === 'multi' && customers.length > 0)) && (
            <div className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
              <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-2 flex-wrap justify-center">

                <button
                  onClick={downloadSingle}
                  disabled={!activeImage}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg shadow-md transition"
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
                    <><FileText className="w-3.5 h-3.5" /> Download A4 Sheet</>
                  )}
                </button>

                <button
                  onClick={generatePreview}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>

                <button
                  onClick={() => {
                    const canvas = renderCanvas(activeImage, activeZoom, activeRotation, activeOffsetX, activeOffsetY, activeBackground);
                    if (canvas) {
                      canvas.toBlob((blob) => {
                        if (blob) {
                          try { navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); } catch {}
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
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden input for customer photo */}
      <input
        ref={customerFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleCustomerFile(e.target.files)}
        className="hidden"
      />

      {/* ═══ PREVIEW MODAL ═══ */}
      {showPreview && previewImageUrl && (
        <div className="fixed inset-0 z-[90] bg-slate-950/98 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between mb-4 flex-shrink-0 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-white font-bold text-base">A4 Sheet Preview</h3>
                <p className="text-slate-400 text-xs">
                  {mode === 'single'
                    ? `${layoutPhotos} photos · ${photosPerRow} per row`
                    : `${customers.length} customer${customers.length !== 1 ? 's' : ''} · ${photosPerRow} per row`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPreview(false);
                if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
                setPreviewImageUrl(null);
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 bg-white rounded-xl overflow-hidden max-w-4xl mx-auto w-full shadow-2xl">
            <iframe
              src={previewImageUrl}
              className="w-full h-full"
              title="A4 Sheet Preview"
            />
          </div>

          <div className="flex items-center justify-center gap-3 mt-4 flex-shrink-0 max-w-4xl mx-auto w-full">
            <button
              onClick={generateSheet}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white text-sm font-bold rounded-lg shadow-md transition"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4" /> Download A4 PDF</>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold rounded-lg transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      )}

      {/* Ad gate modal */}
      {!isPaidUser && pendingDownload && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-950">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">Sponsored</div>
              <div className="min-h-[250px] flex items-center justify-center text-slate-500 text-xs">
                <div className="text-center">
                  <div className="text-4xl mb-2">📢</div>
                  <p className="text-slate-400">Ad loading...</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-slate-900 border-t border-slate-800 text-center">
              <h3 className="text-white font-bold text-base mb-1">Your file is ready!</h3>
              <p className="text-slate-400 text-xs mb-4">{pendingDownload.label}</p>
              <button
                onClick={() => { pendingDownload.action(); setPendingDownload(null); }}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition"
              >
                <Download className="w-4 h-4 inline mr-2" /> Download Now
              </button>
              <button onClick={() => setPendingDownload(null)} className="mt-3 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PassportPhotoMaker;
