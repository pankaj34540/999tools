import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Download, Camera, Maximize2, CreditCard, FileText,
  Grid3x3, Layers, Image as ImageIcon, Stamp, Sparkles, Type,
  User, Printer, Loader2, Check, Crop, RefreshCw, Crosshair, Info, Sliders
} from 'lucide-react';

// ============================================
// SHARED UTILITIES
// ============================================
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file'));
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

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string, format: string = 'image/png', quality: number = 0.95) => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, format, quality);
};

interface ToolProps {
  onClose: () => void;
}

// ============================================
// FULL-SCREEN WRAPPER
// ============================================
const ToolWrapper: React.FC<{ title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }> = ({ title, icon, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-3">
      <div className="bg-white rounded-2xl w-full h-[97vh] max-w-[99vw] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              {icon}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">Full-Screen Workspace • Press ESC to close</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center shadow-sm hover:shadow-md transition"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TOOL 11: Passport Photo Sheet Maker (4x6 & A4) - UPGRADED
// ============================================
export const PassportPhotoSheetTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [paperSize, setPaperSize] = useState<'4x6' | 'a4'>('4x6');
  const [photoCount, setPhotoCount] = useState(6);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
  const [showFaceGuide, setShowFaceGuide] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [includeNameDate, setIncludeNameDate] = useState(false);
  const [candidateName, setCandidateName] = useState('RAHUL KUMAR');
  const [photoDate, setPhotoDate] = useState(new Date().toLocaleDateString('en-GB'));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 300 DPI dimensions
  const PAPER = {
    '4x6': { w: 1800, h: 1200, label: '4×6 inch (Standard Photo Lab)' },
    'a4': { w: 2480, h: 3508, label: 'A4 (Regular Printer Paper)' },
  };

  // Passport photo: 35mm × 45mm at 300 DPI = 413 × 531 px
  const PHOTO_W = 413;
  const PHOTO_H = 531;
  const PHOTO_RATIO = PHOTO_H / PHOTO_W;

  const COUNTS = {
    '4x6': [6, 8],
    'a4': [8, 16, 24, 32],
  };

  // Grid layouts (cols × rows) per count
  const getGrid = (): { cols: number; rows: number } => {
    if (paperSize === '4x6') {
      if (photoCount === 8) return { cols: 4, rows: 2 };
      return { cols: 3, rows: 2 }; // 6 photos
    } else {
      if (photoCount === 32) return { cols: 4, rows: 8 };
      if (photoCount === 24) return { cols: 4, rows: 6 };
      if (photoCount === 16) return { cols: 4, rows: 4 };
      return { cols: 4, rows: 2 }; // 8 photos
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Reset count when paper size changes
  useEffect(() => {
    if (paperSize === '4x6') setPhotoCount(6);
    else setPhotoCount(16);
  }, [paperSize]);

  // ============================================
  // RENDER CANVAS
  // ============================================
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const paper = PAPER[paperSize];
    canvas.width = paper.w;
    canvas.height = paper.h;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { cols, rows } = getGrid();

    // Balanced margins
    const marginX = Math.round(canvas.width * 0.04);
    const marginY = Math.round(canvas.height * 0.04);
    const availableW = canvas.width - marginX * 2;
    const availableH = canvas.height - marginY * 2;

    const cellW = availableW / cols;
    const cellH = availableH / rows;

    // Photo size — fit 35×45mm ratio inside cell
    const cellPadding = Math.round(Math.min(cellW, cellH) * 0.06);
    const maxPhotoW = cellW - cellPadding * 2;
    const maxPhotoH = cellH - cellPadding * 2;

    let finalPhotoW = maxPhotoW;
    let finalPhotoH = finalPhotoW * PHOTO_RATIO;
    if (finalPhotoH > maxPhotoH) {
      finalPhotoH = maxPhotoH;
      finalPhotoW = finalPhotoH / PHOTO_RATIO;
    }

    // Draw each photo
    let drawn = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (drawn >= photoCount) break;

        const cellCenterX = marginX + col * cellW + cellW / 2;
        const cellCenterY = marginY + row * cellH + cellH / 2;
        const photoX = Math.round(cellCenterX - finalPhotoW / 2);
        const photoY = Math.round(cellCenterY - finalPhotoH / 2);

        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, finalPhotoW, finalPhotoH);
        ctx.clip();

        // Brightness + contrast filter
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        // Fit source image (aspect ratio preserving)
        const imgAspect = image.width / image.height;
        const photoAspect = finalPhotoW / finalPhotoH;
        let drawW, drawH;
        if (imgAspect > photoAspect) {
          drawH = finalPhotoH * zoom;
          drawW = drawH * imgAspect;
        } else {
          drawW = finalPhotoW * zoom;
          drawH = drawW / imgAspect;
        }
        const drawX = photoX + (finalPhotoW - drawW) / 2 + panX;
        const drawY = photoY + (finalPhotoH - drawH) / 2 + panY;
        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        ctx.filter = 'none';

        // Name & Date strip
        if (includeNameDate) {
          const stripH = Math.round(finalPhotoH * 0.22);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(photoX, photoY + finalPhotoH - stripH, finalPhotoW, stripH);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(photoX, photoY + finalPhotoH - stripH);
          ctx.lineTo(photoX + finalPhotoW, photoY + finalPhotoH - stripH);
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.font = `bold ${Math.round(stripH * 0.38)}px Arial`;
          ctx.fillText(
            candidateName.toUpperCase(),
            photoX + finalPhotoW / 2,
            photoY + finalPhotoH - stripH * 0.52
          );
          ctx.font = `${Math.round(stripH * 0.32)}px Arial`;
          ctx.fillText(
            photoDate,
            photoX + finalPhotoW / 2,
            photoY + finalPhotoH - stripH * 0.16
          );
        }

        ctx.restore();

        // Border
        if (showBorder) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.strokeRect(photoX, photoY, finalPhotoW, finalPhotoH);
        }

        drawn++;
      }
    }

    // Cut lines (full grid — dotted)
    if (showCutLines) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);

      for (let c = 0; c <= cols; c++) {
        const x = marginX + c * cellW;
        if (x < canvas.width - marginX + 2) {
          ctx.beginPath();
          ctx.moveTo(x, marginY);
          ctx.lineTo(x, canvas.height - marginY);
          ctx.stroke();
        }
      }
      for (let r = 0; r <= rows; r++) {
        const y = marginY + r * cellH;
        if (y < canvas.height - marginY + 2) {
          ctx.beginPath();
          ctx.moveTo(marginX, y);
          ctx.lineTo(canvas.width - marginX, y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    // Corner cut marks
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    drawn = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (drawn >= photoCount) break;
        const cellCenterX = marginX + col * cellW + cellW / 2;
        const cellCenterY = marginY + row * cellH + cellH / 2;
        const photoX = Math.round(cellCenterX - finalPhotoW / 2);
        const photoY = Math.round(cellCenterY - finalPhotoH / 2);
        const markLen = 14;

        ctx.beginPath();
        ctx.moveTo(photoX - markLen, photoY); ctx.lineTo(photoX - 3, photoY);
        ctx.moveTo(photoX, photoY - markLen); ctx.lineTo(photoX, photoY - 3);
        ctx.moveTo(photoX + finalPhotoW + markLen, photoY); ctx.lineTo(photoX + finalPhotoW + 3, photoY);
        ctx.moveTo(photoX + finalPhotoW, photoY - markLen); ctx.lineTo(photoX + finalPhotoW, photoY - 3);
        ctx.moveTo(photoX - markLen, photoY + finalPhotoH); ctx.lineTo(photoX - 3, photoY + finalPhotoH);
        ctx.moveTo(photoX, photoY + finalPhotoH + markLen); ctx.lineTo(photoX, photoY + finalPhotoH + 3);
        ctx.moveTo(photoX + finalPhotoW + markLen, photoY + finalPhotoH); ctx.lineTo(photoX + finalPhotoW + 3, photoY + finalPhotoH);
        ctx.moveTo(photoX + finalPhotoW, photoY + finalPhotoH + markLen); ctx.lineTo(photoX + finalPhotoW, photoY + finalPhotoH + 3);
        ctx.stroke();

        drawn++;
      }
    }

    // Footer
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('999tools.store', canvas.width - 30, canvas.height - 20);
  }, [image, paperSize, photoCount, showCutLines, showBorder, zoom, panX, panY, brightness, contrast, includeNameDate, candidateName, photoDate]);

  // ============================================
  // MOUSE / TOUCH HANDLERS
  // ============================================
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setPanX(e.touches[0].clientX - dragStart.x);
    setPanY(e.touches[0].clientY - dragStart.y);
  };

  // ============================================
  // DOWNLOAD
  // ============================================
  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `passport_sheet_${paperSize}_${photoCount}photos.jpg`, 'image/jpeg', 0.95);
  };

  // ============================================
  // PRINT
  // ============================================
  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups for printing');
      return;
    }
    const pageSize = paperSize === '4x6' ? '6in 4in' : '210mm 297mm';
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Passport Sheet — 999tools</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: ${pageSize}; margin: 0; }
            body { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff; }
            img { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="setTimeout(function(){ window.print(); window.close(); }, 400);" />
        </body>
      </html>
    `);
    win.document.close();
  };

  // ============================================
  // PREVIEW DIMENSIONS
  // ============================================
  const previewStyle: React.CSSProperties = paperSize === '4x6'
    ? { aspectRatio: '3 / 2', width: '100%', maxWidth: '760px', maxHeight: '65vh' }
    : { aspectRatio: '210 / 297', maxWidth: 'min(55%, 500px)', maxHeight: '65vh' };

  return (
    <ToolWrapper title="Passport Photo Sheet Maker" icon={<Camera className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Passport Photo</p>
          <p className="text-sm text-slate-500 mt-2">Portrait photo with white background preferred</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* SIDEBAR */}
          <div className="lg:col-span-2 space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Paper Size */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Paper Size:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaperSize('4x6')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      paperSize === '4x6' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    4×6 inch
                    <div className="text-[10px] text-slate-500 mt-0.5">Photo Lab Paper</div>
                  </button>
                  <button
                    onClick={() => setPaperSize('a4')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      paperSize === 'a4' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    A4 Sheet
                    <div className="text-[10px] text-slate-500 mt-0.5">Regular Printer</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Number of Photos:</label>
                <div className="flex gap-2 flex-wrap">
                  {COUNTS[paperSize].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPhotoCount(c)}
                      className={`px-3.5 py-2 rounded-lg border-2 text-xs font-bold transition ${
                        photoCount === c ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showCutLines} onChange={(e) => setShowCutLines(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Show Cutting Guide Lines</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showBorder} onChange={(e) => setShowBorder(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Show 1px Black Border</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showFaceGuide} onChange={(e) => setShowFaceGuide(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  Show Face Position Guide
                </span>
              </label>
            </div>

            {/* Zoom & Adjust */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Zoom & Position
                </span>
                <button
                  onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                  className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Zoom</span>
                  <span className="font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
                </div>
                <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-500">Brightness: {brightness}%</span>
                  <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Contrast: {contrast}%</span>
                  <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-indigo-500" />
                <span>Preview pe mouse/touch se drag karke photo position adjust karo</span>
              </div>
            </div>

            {/* Name & Date */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeNameDate} onChange={(e) => setIncludeNameDate(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-600" />
                  Add Name & Date (Govt Exam Req.)
                </span>
              </label>
              {includeNameDate && (
                <>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </>
              )}
            </div>

            {/* Info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">📐 Standard Sizes:</strong><br />
                Passport: 35 × 45 mm (413 × 531 px @ 300 DPI)<br />
                Paper: {PAPER[paperSize].label}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handlePrint} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="lg:col-span-3 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <div className="w-full flex flex-wrap items-center justify-between mb-3 text-xs text-slate-500 gap-2 px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Preview: {PAPER[paperSize].label} · {photoCount} Photos
              </span>
              <span>🖱️ Drag to reposition</span>
            </div>

            <div
              className="relative border-4 border-slate-300 rounded-lg bg-white shadow-2xl overflow-hidden cursor-move select-none"
              style={previewStyle}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

              {showFaceGuide && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="12" x2="100" y2="12" stroke="#f59e0b" strokeWidth="0.4" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="48" x2="100" y2="48" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#8b5cf6" strokeWidth="0.4" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1 2" vectorEffect="non-scaling-stroke" opacity="0.5" />
                  </svg>
                  <div className="absolute left-1 top-2 text-[8px] font-bold text-amber-600 bg-white/90 px-1 rounded">👑 Crown</div>
                  <div className="absolute left-1 text-[8px] font-bold text-blue-600 bg-white/90 px-1 rounded" style={{ top: '46%' }}>👁️ Eyes</div>
                  <div className="absolute left-1 text-[8px] font-bold text-purple-600 bg-white/90 px-1 rounded" style={{ top: '73%' }}>🎯 Chin</div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Printer Settings:</span>
              <span>• Glossy Photo Paper</span>
              <span>• Quality: High</span>
              <span>• <strong className="text-rose-600">Scale: 100%</strong></span>
              <span>• Borderless: Off</span>
            </div>
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 12: Govt Exam Photo & Sign Resizer (PREMIUM)
// ============================================
export const GovtExamResizerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [exam, setExam] = useState<string>('ssc');
  const [type, setType] = useState<'photo' | 'signature'>('photo');
  const [currentSize, setCurrentSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const PRESETS: Record<string, any> = {
    ssc: { name: 'SSC (CGL/CHSL/GD)', photo: { w: 138, h: 177, minKb: 20, maxKb: 50 }, sign: { w: 140, h: 60, minKb: 10, maxKb: 20 } },
    upsc: { name: 'UPSC (CSE/CDS/NDA)', photo: { w: 350, h: 350, minKb: 20, maxKb: 300 }, sign: { w: 350, h: 350, minKb: 20, maxKb: 300 } },
    railway: { name: 'Railway (RRB/NTPC)', photo: { w: 140, h: 175, minKb: 30, maxKb: 70 }, sign: { w: 140, h: 60, minKb: 30, maxKb: 70 } },
    pan: { name: 'PAN Card (NSDL)', photo: { w: 213, h: 213, minKb: 10, maxKb: 30 }, sign: { w: 400, h: 200, minKb: 5, maxKb: 10 } },
    ibps: { name: 'Bank (IBPS/SBI)', photo: { w: 200, h: 230, minKb: 20, maxKb: 50 }, sign: { w: 140, h: 60, minKb: 10, maxKb: 20 } },
    police: { name: 'State Police', photo: { w: 150, h: 200, minKb: 20, maxKb: 50 }, sign: { w: 150, h: 60, minKb: 5, maxKb: 20 } },
  };

  const currentPreset = PRESETS[exam];
  const currentType = currentPreset[type];
  const targetKB = currentType.maxKb;
  const targetBytes = targetKB * 1024;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const applyCompression = async () => {
      let targetW = currentType.w;
      let targetH = currentType.h;
      let sourceX = 0, sourceY = 0, sourceW = image.width, sourceH = image.height;

      const imgRatio = image.width / image.height;
      const targetRatio = targetW / targetH;

      if (imgRatio > targetRatio) {
        sourceW = image.height * targetRatio;
        sourceX = (image.width - sourceW) / 2;
      } else {
        sourceH = image.width / targetRatio;
        sourceY = (image.height - sourceH) / 2;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetW;
      tempCanvas.height = targetH;
      const tempCtx = tempCanvas.getContext('2d')!;

      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, targetW, targetH);
      tempCtx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);

      let low = 10, high = 100, best = { quality: 92, size: 0 };
      for (let i = 0; i < 10; i++) {
        const mid = Math.floor((low + high) / 2);
        const blob = await new Promise<Blob | null>((res) => tempCanvas.toBlob(res, 'image/jpeg', mid / 100));
        if (!blob) break;
        if (blob.size <= targetBytes) {
          best = { quality: mid, size: blob.size };
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);

      setCurrentSize(best.size);
    };

    applyCompression();
  }, [image, exam, type]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `${exam}_${type}_${targetKB}KB.jpg`, 'image/jpeg', 0.95);
  };

  const isInRange = currentSize >= currentType.minKb * 1024 && currentSize <= currentType.maxKb * 1024;

  return (
    <ToolWrapper title="Govt Exam Photo & Sign Resizer" icon={<Maximize2 className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Photo or Signature</p>
          <p className="text-sm text-slate-500 mt-2">Auto-resize to exam requirements (exact KB)</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Exam / Document:</label>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {Object.entries(PRESETS).map(([key, p]: any) => (
                    <option key={key} value={key}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setType('photo')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      type === 'photo' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    📷 Photo
                  </button>
                  <button
                    onClick={() => setType('signature')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      type === 'signature' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ✍️ Signature
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-amber-800">Target Pixels:</span>
                    <span className="font-mono font-bold text-amber-900">{currentType.w} × {currentType.h} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800">KB Range:</span>
                    <span className="font-mono font-bold text-amber-900">{currentType.minKb}–{currentType.maxKb} KB</span>
                  </div>
                  {currentSize > 0 && (
                    <div className="flex justify-between pt-2 border-t border-amber-200">
                      <span className="text-amber-800">Current:</span>
                      <span className={`font-mono font-bold ${isInRange ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {(currentSize / 1024).toFixed(2)} KB {isInRange ? '✓' : '⚠'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} disabled={!currentSize} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-2xl border-4 border-white shadow-slate-400" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 13: Signature White Background Cleaner
// ============================================
export const SignatureWhiteBgTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState(180);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg > threshold) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        data[i] = Math.max(0, data[i] - 30);
        data[i + 1] = Math.max(0, data[i + 1] - 30);
        data[i + 2] = Math.max(0, data[i + 2] - 30);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [image, threshold]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'signature_white_bg.png');
  };

  return (
    <ToolWrapper title="Signature White Background Cleaner" icon={<Sparkles className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Signature Photo</p>
          <p className="text-sm text-slate-500 mt-2">Remove yellow tint & shadows — get pure white background</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Cleanup Strength: <span className="font-mono text-emerald-600">{threshold}</span>
              </label>
              <input type="range" min="100" max="240" value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full accent-emerald-600" />
              <p className="text-[11px] text-slate-500 mt-2">Higher value = more aggressive cleaning</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 14: Photo Name & Date (DOPO/DOB) Stamp
// ============================================
export const PhotoNameDateStampTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bgColor, setBgColor] = useState<'black' | 'white'>('black');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const stripH = Math.max(60, Math.round(image.height * 0.12));
    canvas.width = image.width;
    canvas.height = image.height + stripH;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(image, 0, 0);

    ctx.fillStyle = bgColor === 'black' ? '#000000' : '#FFFFFF';
    ctx.fillRect(0, image.height, canvas.width, stripH);

    ctx.fillStyle = bgColor === 'black' ? '#FFFFFF' : '#000000';
    const fontSize = Math.max(14, Math.round(canvas.width * 0.05));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const line1 = name || 'NAME';
    const line2 = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'DATE';

    ctx.fillText(line1.toUpperCase(), canvas.width / 2, image.height + stripH * 0.32);
    ctx.font = `${fontSize * 0.75}px Arial, sans-serif`;
    ctx.fillText(line2, canvas.width / 2, image.height + stripH * 0.72);
  }, [image, name, date, bgColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'photo_with_stamp.jpg', 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Photo Name & Date Stamp (DOPO/DOB)" icon={<Stamp className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Passport Photo</p>
          <p className="text-sm text-slate-500 mt-2">Add Name & Photo Date banner (required for UPSC, SSC)</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Candidate Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Photo Date (DOPO):</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Banner Style:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBgColor('black')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      bgColor === 'black' ? 'border-blue-500 bg-slate-800 text-white' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ⬛ Black BG
                  </button>
                  <button
                    onClick={() => setBgColor('white')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      bgColor === 'white' ? 'border-blue-500 bg-white text-slate-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ⬜ White BG
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 15: Multiple Photo Stitcher
// ============================================
export const MultiplePhotoStitcherTool: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [gap, setGap] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length < 2) return;
    const loaded = await Promise.all(files.map(f => loadImage(f)));
    setImages(loaded);
  };

  useEffect(() => {
    if (images.length < 2 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    if (direction === 'vertical') {
      const maxW = Math.max(...images.map(i => i.width));
      const totalH = images.reduce((s, i) => s + i.height, 0) + gap * (images.length - 1);
      canvas.width = maxW;
      canvas.height = totalH;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let y = 0;
      images.forEach(img => {
        ctx.drawImage(img, (maxW - img.width) / 2, y);
        y += img.height + gap;
      });
    } else {
      const maxH = Math.max(...images.map(i => i.height));
      const totalW = images.reduce((s, i) => s + i.width, 0) + gap * (images.length - 1);
      canvas.width = totalW;
      canvas.height = maxH;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let x = 0;
      images.forEach(img => {
        ctx.drawImage(img, x, (maxH - img.height) / 2);
        x += img.width + gap;
      });
    }
  }, [images, direction, gap]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'stitched.jpg', 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Multiple Photo Stitcher" icon={<Layers className="w-5 h-5" />} onClose={onClose}>
      {images.length < 2 ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload 2 or More Photos</p>
          <p className="text-sm text-slate-500 mt-2">Join vertically or horizontally</p>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Direction:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDirection('vertical')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      direction === 'vertical' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ↕️ Vertical
                  </button>
                  <button
                    onClick={() => setDirection('horizontal')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      direction === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ↔️ Horizontal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Gap: {gap}px</label>
                <input type="range" min="0" max="50" value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-blue-600" />
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs">
                <strong>{images.length}</strong> photos loaded
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImages([])} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4 overflow-auto">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 16: Photo Grid Maker (2x2, 3x3, 4x4)
// ============================================
export const PhotoGridMakerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(2);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const loaded = await Promise.all(files.slice(0, 16).map(f => loadImage(f)));
    setImages(loaded);
  };

  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const cellSize = 800;
    canvas.width = cellSize * gridSize;
    canvas.height = cellSize * gridSize;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const total = gridSize * gridSize;
    for (let i = 0; i < Math.min(images.length, total); i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const img = images[i];
      const x = col * cellSize;
      const y = row * cellSize;

      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, x, y, cellSize, cellSize);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }, [images, gridSize]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `photo_grid_${gridSize}x${gridSize}.jpg`, 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Photo Grid Maker" icon={<Grid3x3 className="w-5 h-5" />} onClose={onClose}>
      {images.length === 0 ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Photos for Grid</p>
          <p className="text-sm text-slate-500 mt-2">2x2 (4), 3x3 (9), or 4x4 (16) grid</p>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">Grid Size:</label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size as 2 | 3 | 4)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      gridSize === size ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {size}×{size}
                    <div className="text-[10px] text-slate-500 mt-0.5">{size * size} photos</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">{images.length} photos loaded</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImages([])} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 17: Polaroid Photo Maker
// ============================================
export const PolaroidMakerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [caption, setCaption] = useState('');
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const photoSize = 800;
    const bottomStrip = 200;
    canvas.width = photoSize + 60;
    canvas.height = photoSize + bottomStrip + 60;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const min = Math.min(image.width, image.height);
    const sx = (image.width - min) / 2;
    const sy = (image.height - min) / 2;
    ctx.drawImage(image, sx, sy, min, min, 30, 30, photoSize, photoSize);

    if (caption) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 42px "Brush Script MT", cursive, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(caption, canvas.width / 2, photoSize + 30 + bottomStrip / 2);
    }
  }, [image, caption, frameColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'polaroid.jpg', 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Polaroid Photo Maker" icon={<ImageIcon className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Photo</p>
          <p className="text-sm text-slate-500 mt-2">Create retro polaroid style print</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Caption:</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Best Memories 2026"
                  maxLength={40}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Frame Color:</label>
                <div className="grid grid-cols-5 gap-2">
                  {['#FFFFFF', '#FFF7ED', '#FCE7F3', '#DBEAFE', '#FEF3C7'].map(c => (
                    <button
                      key={c}
                      onClick={() => setFrameColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-10 rounded-lg border-2 transition ${frameColor === c ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 18: Photo Collage Maker
// ============================================
export const PhotoCollageMakerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [layout, setLayout] = useState<'side' | 'stack' | 'quad'>('quad');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const loaded = await Promise.all(files.slice(0, 4).map(f => loadImage(f)));
    setImages(loaded);
  };

  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const SIZE = 1200;
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const drawImg = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      const min = Math.min(img.width / w, img.height / h);
      const sw = w * min;
      const sh = h * min;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    };

    if (layout === 'side' && images.length >= 2) {
      drawImg(images[0], 0, 0, SIZE / 2, SIZE);
      drawImg(images[1], SIZE / 2, 0, SIZE / 2, SIZE);
    } else if (layout === 'stack' && images.length >= 2) {
      drawImg(images[0], 0, 0, SIZE, SIZE / 2);
      drawImg(images[1], 0, SIZE / 2, SIZE, SIZE / 2);
    } else if (layout === 'quad') {
      const gap = 4;
      const cellW = (SIZE - gap) / 2;
      const cellH = (SIZE - gap) / 2;
      drawImg(images[0], 0, 0, cellW, cellH);
      if (images[1]) drawImg(images[1], cellW + gap, 0, cellW, cellH);
      if (images[2]) drawImg(images[2], 0, cellH + gap, cellW, cellH);
      if (images[3]) drawImg(images[3], cellW + gap, cellH + gap, cellW, cellH);
    }
  }, [images, layout]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `collage_${layout}.jpg`, 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Photo Collage Maker" icon={<Layers className="w-5 h-5" />} onClose={onClose}>
      {images.length < 2 ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload 2-4 Photos</p>
          <p className="text-sm text-slate-500 mt-2">Create beautiful collages</p>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">Layout:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setLayout('side')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                    layout === 'side' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ▣▣
                  <div className="text-[10px] mt-0.5">Side</div>
                </button>
                <button
                  onClick={() => setLayout('stack')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                    layout === 'stack' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ▤
                  <div className="text-[10px] mt-0.5">Stack</div>
                </button>
                <button
                  onClick={() => setLayout('quad')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                    layout === 'quad' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ⊞
                  <div className="text-[10px] mt-0.5">Quad</div>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">{images.length} photos loaded</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImages([])} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 19: Face Center & Auto Crop
// ============================================
export const FaceCenterCropTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropSize, setCropSize] = useState(531);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
    setOffsetX(0);
    setOffsetY(0);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 413;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxOffsetX = Math.max(0, image.width - canvas.width);
    const maxOffsetY = Math.max(0, image.height - canvas.height);
    const sx = Math.max(0, Math.min(maxOffsetX, offsetX));
    const sy = Math.max(0, Math.min(maxOffsetY, offsetY));

    ctx.drawImage(image, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  }, [image, cropSize, offsetX, offsetY]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'centered_photo.jpg', 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Face Center & Auto Crop" icon={<User className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Photo</p>
          <p className="text-sm text-slate-500 mt-2">Manually center your face in the crop frame</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Crop Size:</label>
                <select
                  value={cropSize}
                  onChange={(e) => setCropSize(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={531}>Passport India (35×45mm)</option>
                  <option value={600}>US Visa (2×2 inch)</option>
                  <option value={590}>Schengen (35×50mm)</option>
                  <option value={480}>Square (40×40mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Horizontal: {offsetX}px</label>
                <input type="range" min="0" max={Math.max(0, image.width - 413)} value={offsetX} onChange={(e) => setOffsetX(+e.target.value)} className="w-full accent-blue-600" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Vertical: {offsetY}px</label>
                <input type="range" min="0" max={Math.max(0, image.height - cropSize)} value={offsetY} onChange={(e) => setOffsetY(+e.target.value)} className="w-full accent-blue-600" />
              </div>

              <button onClick={() => { setOffsetX(0); setOffsetY(0); }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold">
                Reset Position
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-2xl border-2 border-blue-500" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 20: Passport Photo Template (India 35x45mm)
// ============================================
export const PassportTemplateTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState<'white' | 'blue' | 'grey'>('white');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const COLORS = {
    white: '#FFFFFF',
    blue: '#BFDBFE',
    grey: '#E5E7EB',
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const W = 413;
    const H = 531;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = COLORS[bgColor];
    ctx.fillRect(0, 0, W, H);

    const ratio = Math.max(W / image.width, H / image.height);
    const newW = image.width * ratio;
    const newH = image.height * ratio;
    const x = (W - newW) / 2;
    const y = (H - newH) / 2;
    ctx.drawImage(image, x, y, newW, newH);
  }, [image, bgColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `passport_35x45_${bgColor}.jpg`, 'image/jpeg', 0.95);
  };

  return (
    <ToolWrapper title="Passport Photo Template (India)" icon={<CreditCard className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload Photo</p>
          <p className="text-sm text-slate-500 mt-2">Perfect 35×45mm Passport size output</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">Background Color:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBgColor('white')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition ${bgColor === 'white' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200'}`}
                >
                  ⬜ White
                </button>
                <button
                  onClick={() => setBgColor('blue')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition ${bgColor === 'blue' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200'}`}
                >
                  🟦 Blue
                </button>
                <button
                  onClick={() => setBgColor('grey')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition ${bgColor === 'grey' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200'}`}
                >
                  ⬛ Grey
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">Final size: 35 × 45 mm (413 × 531 px @ 300 DPI)</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-2xl border-4 border-white shadow-slate-400" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};
