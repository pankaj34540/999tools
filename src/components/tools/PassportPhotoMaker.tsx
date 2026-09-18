import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Printer, Download, RefreshCw, Sliders, Type, 
  Check, AlertCircle, Crosshair, Info
} from 'lucide-react';

interface PassportPhotoMakerProps {
  onClose?: () => void;
}

export const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({ onClose }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [paperSize, setPaperSize] = useState<'4x6' | 'a4'>('4x6');
  const [photoCount, setPhotoCount] = useState<number>(6);
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [includeNameDate, setIncludeNameDate] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('RAHUL KUMAR');
  const [photoDate, setPhotoDate] = useState<string>(new Date().toLocaleDateString('en-GB'));
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ============================================
  // DEFAULT SAMPLE PHOTO
  // ============================================
  useEffect(() => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 380;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 380);
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 380);

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(150, 140, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(150, 310, 110, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0c4a6e';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sample Passport Photo', 150, 240);
      ctx.font = '12px sans-serif';
      ctx.fillText('Upload Customer Photo', 150, 260);

      setImageSrc(tempCanvas.toDataURL());
    }
  }, []);

  // Update photo counts when paper size changes
  useEffect(() => {
    if (paperSize === '4x6') {
      if (photoCount !== 6 && photoCount !== 8) setPhotoCount(6);
    } else {
      if (photoCount !== 16 && photoCount !== 24 && photoCount !== 32) setPhotoCount(16);
    }
  }, [paperSize]);

  // Reset pan/zoom when new image is uploaded
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setZoom(1);
          setPanX(0);
          setPanY(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================
  // DRAW SHEET ON CANVAS
  // ============================================
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let sheetW = 1800;
      let sheetH = 1200;
      let cols = 3;
      let rows = 2;

      if (paperSize === '4x6') {
        sheetW = 1800;
        sheetH = 1200;
        if (photoCount === 8) { cols = 4; rows = 2; }
        else { cols = 3; rows = 2; }
      } else {
        sheetW = 2480;
        sheetH = 3508;
        if (photoCount === 32) { cols = 4; rows = 8; }
        else if (photoCount === 24) { cols = 4; rows = 6; }
        else { cols = 4; rows = 4; }
      }

      canvas.width = sheetW;
      canvas.height = sheetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, sheetW, sheetH);

      const marginX = Math.round(sheetW * 0.04);
      const marginY = Math.round(sheetH * 0.04);
      const availableW = sheetW - marginX * 2;
      const availableH = sheetH - marginY * 2;

      const cellW = availableW / cols;
      const cellH = availableH / rows;

      const PASSPORT_RATIO = 1.286;

      const photoPadding = Math.round(Math.min(cellW, cellH) * 0.04);
      const maxPhotoW = cellW - photoPadding * 2;
      const maxPhotoH = cellH - photoPadding * 2;

      let finalPhotoW = maxPhotoW;
      let finalPhotoH = finalPhotoW * PASSPORT_RATIO;
      if (finalPhotoH > maxPhotoH) {
        finalPhotoH = maxPhotoH;
        finalPhotoW = finalPhotoH / PASSPORT_RATIO;
      }

      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (count >= photoCount) break;

          const cellCenterX = marginX + c * cellW + cellW / 2;
          const cellCenterY = marginY + r * cellH + cellH / 2;
          const photoX = Math.round(cellCenterX - finalPhotoW / 2);
          const photoY = Math.round(cellCenterY - finalPhotoH / 2);

          ctx.save();

          ctx.beginPath();
          ctx.rect(photoX, photoY, finalPhotoW, finalPhotoH);
          ctx.clip();

          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

          const imgAspect = img.width / img.height;
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

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.filter = 'none';

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

          if (borderWidth > 0) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(photoX, photoY, finalPhotoW, finalPhotoH);
          }

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(photoX - 8, photoY); ctx.lineTo(photoX - 2, photoY);
          ctx.moveTo(photoX, photoY - 8); ctx.lineTo(photoX, photoY - 2);
          ctx.moveTo(photoX + finalPhotoW + 8, photoY); ctx.lineTo(photoX + finalPhotoW + 2, photoY);
          ctx.moveTo(photoX + finalPhotoW, photoY - 8); ctx.lineTo(photoX + finalPhotoW, photoY - 2);
          ctx.moveTo(photoX - 8, photoY + finalPhotoH); ctx.lineTo(photoX - 2, photoY + finalPhotoH);
          ctx.moveTo(photoX, photoY + finalPhotoH + 8); ctx.lineTo(photoX, photoY + finalPhotoH + 2);
          ctx.moveTo(photoX + finalPhotoW + 8, photoY + finalPhotoH); ctx.lineTo(photoX + finalPhotoW + 2, photoY + finalPhotoH);
          ctx.moveTo(photoX + finalPhotoW, photoY + finalPhotoH + 8); ctx.lineTo(photoX + finalPhotoW, photoY + finalPhotoH + 2);
          ctx.stroke();

          count++;
        }
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('999tools.store', sheetW - 30, sheetH - 20);
    };
  }, [imageSrc, paperSize, photoCount, borderWidth, zoom, panX, panY, brightness, contrast, includeNameDate, candidateName, photoDate]);

  // ============================================
  // MOUSE PAN HANDLERS
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
      setDragStart({
        x: e.touches[0].clientX - panX,
        y: e.touches[0].clientY - panY,
      });
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `999tools_Passport_${paperSize}_${photoCount}photos.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ============================================
  // PRINT
  // ============================================
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const pageSize = paperSize === '4x6'
      ? '152.4mm 101.6mm'
      : '210mm 297mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Passport Photo Sheet — 999tools</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: ${pageSize}; margin: 0; }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: 100vh;
              background: #fff;
            }
            img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="setTimeout(function(){ window.print(); }, 300);" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ============================================
  // PREVIEW DIMENSIONS
  // ============================================
  const previewStyle: React.CSSProperties = paperSize === '4x6'
    ? {
        aspectRatio: '3 / 2',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '65vh',
      }
    : {
        aspectRatio: '210 / 297',
        maxWidth: 'min(55%, 480px)',
        maxHeight: '65vh',
      };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div id="passport-photo-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Camera className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Passport Photo Sheet Maker</h2>
            <p className="text-xs text-blue-100">
              4x6 & A4 grid with face guide, cut borders & date stamp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg shadow-sm transition active:scale-95 text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 font-semibold rounded-lg shadow-sm transition active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            Save PNG
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* SIDEBAR */}
        <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 space-y-5 overflow-y-auto max-h-[85vh]">

          {/* 1. Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Customer Photo
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-xl text-blue-700 font-medium flex items-center justify-center gap-2 transition hover:bg-blue-50/50"
            >
              <Camera className="w-5 h-5 text-blue-600" />
              Upload Passport Photo
            </button>
            <p className="text-[11px] text-slate-500 mt-1">
              JPG, PNG, WEBP. Preview pe drag karke reposition karo.
            </p>
          </div>

          {/* 2. Paper & Count */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Paper & Photo Count
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaperSize('4x6')}
                className={`p-3 rounded-xl border text-left font-medium transition ${
                  paperSize === '4x6'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="text-sm font-bold">4 x 6 Inch</div>
                <div className="text-xs text-slate-500">Photo Lab Paper</div>
              </button>

              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`p-3 rounded-xl border text-left font-medium transition ${
                  paperSize === 'a4'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="text-sm font-bold">A4 Sheet</div>
                <div className="text-xs text-slate-500">Printer Page</div>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-600">Count:</span>
              {paperSize === '4x6' ? (
                <>
                  {[6, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPhotoCount(n)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        photoCount === n
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {n} Photos
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[16, 24, 32].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPhotoCount(n)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        photoCount === n
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {n} Photos
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 3. Face Guide Toggle */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFaceGuide}
                onChange={(e) => setShowFaceGuide(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600"
              />
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                Show Face Position Guide
              </span>
            </label>
            <p className="text-[10px] text-amber-700 mt-1.5 leading-relaxed">
              👑 <strong>Crown</strong> top 12% · 👁️ <strong>Eyes</strong> 45-55% · 🎯 <strong>Chin</strong> 70-75%
            </p>
          </div>

          {/* 4. Zoom & Position */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Zoom & Head Fit
              </span>
              <button
                onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Scale:</span>
                <span className="font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[11px] text-slate-500">Brightness: {brightness}%</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Contrast: {contrast}%</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg">
              <Info className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
              <span>Preview pe mouse/touch se drag karke photo position adjust karo</span>
            </div>
          </div>

          {/* 5. Border */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Cut Line / Border
            </label>
            <div className="flex items-center gap-3">
              {[
                { val: 0, label: 'None' },
                { val: 1, label: 'Thin' },
                { val: 2, label: 'Bold' },
              ].map((b) => (
                <label key={b.val} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="border"
                    checked={borderWidth === b.val}
                    onChange={() => setBorderWidth(b.val)}
                    className="accent-blue-600"
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          {/* 6. Name & Date */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNameDate}
                onChange={(e) => setIncludeNameDate(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-600" />
                Add Name & Date (Govt Exam Req.)
              </span>
            </label>

            {includeNameDate && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500">Candidate Name:</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="AMIT KUMAR"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs uppercase focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Date (DD/MM/YYYY):</label>
                  <input
                    type="text"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW AREA */}
        <div className="lg:col-span-8 p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[500px]">

          <div className="w-full flex flex-wrap items-center justify-between mb-3 text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Preview: {paperSize === '4x6' ? '4×6" Lab Paper' : 'A4 Sheet'} · {photoCount} Photos
            </span>
            <span>🖱️ Drag to reposition</span>
          </div>

          {/* Preview Wrapper with Face Guide */}
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
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {showFaceGuide && (
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line x1="0" y1="12" x2="100" y2="12" stroke="#f59e0b" strokeWidth="0.4" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="48" x2="100" y2="48" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#8b5cf6" strokeWidth="0.4" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1 2" vectorEffect="non-scaling-stroke" opacity="0.5" />
                </svg>
                <div className="absolute left-1 top-2 text-[8px] font-bold text-amber-600 bg-white/90 px-1 rounded">
                  👑 Crown
                </div>
                <div className="absolute left-1 text-[8px] font-bold text-blue-600 bg-white/90 px-1 rounded" style={{ top: '46%' }}>
                  👁️ Eyes
                </div>
                <div className="absolute left-1 text-[8px] font-bold text-purple-600 bg-white/90 px-1 rounded" style={{ top: '73%' }}>
                  🎯 Chin
                </div>
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
    </div>
  );
};
