import React, { useState, useRef, useEffect } from 'react';
import { Camera, Printer, Download, RefreshCw, Sliders, Type, Check, AlertCircle } from 'lucide-react';

interface PassportPhotoMakerProps {
  onClose?: () => void;
}

export const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({ onClose }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [paperSize, setPaperSize] = useState<'4x6' | 'a4'>('4x6');
  const [photoCount, setPhotoCount] = useState<number>(6); // 6 or 8 for 4x6; 16 or 32 for A4
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default sample image if none uploaded
  useEffect(() => {
    // Generate a default pleasant portrait placeholder canvas so user sees the sheet immediately!
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 380;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 380);
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 380);

      // Simple avatar placeholder
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(150, 140, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(150, 310, 110, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Text hint
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
      if (photoCount !== 6 && photoCount !== 8) {
        setPhotoCount(6);
      }
    } else {
      if (photoCount !== 16 && photoCount !== 32) {
        setPhotoCount(16);
      }
    }
  }, [paperSize]);

  // Handle file upload
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

  // Draw the Passport Photo Sheet on Canvas
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Dimensions in high-res pixels (300 DPI equivalent)
      // 4x6 inch = 1200 x 1800 px (or 1800 x 1200 landscape)
      // A4 = 2480 x 3508 px
      let sheetW = 1800;
      let sheetH = 1200;
      let cols = 3;
      let rows = 2;

      if (paperSize === '4x6') {
        if (photoCount === 8) {
          // 4x2 grid
          sheetW = 1800;
          sheetH = 1200;
          cols = 4;
          rows = 2;
        } else {
          // 3x2 grid (6 photos)
          sheetW = 1800;
          sheetH = 1200;
          cols = 3;
          rows = 2;
        }
      } else {
        // A4 sheet
        sheetW = 2480;
        sheetH = 3508;
        if (photoCount === 32) {
          cols = 4;
          rows = 8;
        } else {
          cols = 4;
          rows = 4; // 16 photos
        }
      }

      canvas.width = sheetW;
      canvas.height = sheetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill pure white paper
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, sheetW, sheetH);

      // Passport standard aspect ratio is 3.5cm : 4.5cm approx 1 : 1.285
      const marginX = sheetW * 0.05;
      const marginY = sheetH * 0.05;
      const availableW = sheetW - marginX * 2;
      const availableH = sheetH - marginY * 2;

      const cellW = availableW / cols;
      const cellH = availableH / rows;

      // Photo size inside cell
      const photoPadding = 18;
      const targetPhotoW = cellW - photoPadding * 2;
      const targetPhotoH = targetPhotoW * 1.285;

      const finalPhotoH = Math.min(targetPhotoH, cellH - photoPadding * 2);
      const finalPhotoW = finalPhotoH / 1.285;

      // Render each photo
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (count >= photoCount) break;

          const centerX = marginX + c * cellW + cellW / 2;
          const centerY = marginY + r * cellH + cellH / 2;
          const photoX = centerX - finalPhotoW / 2;
          const photoY = centerY - finalPhotoH / 2;

          ctx.save();

          // Clip to photo rectangle
          ctx.beginPath();
          ctx.rect(photoX, photoY, finalPhotoW, finalPhotoH);
          ctx.clip();

          // Apply brightness & contrast filters
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

          // Draw the adjusted user image centered with zoom & pan
          const imgAspect = img.width / img.height;
          const photoAspect = finalPhotoW / finalPhotoH;
          let drawW = finalPhotoW * zoom;
          let drawH = finalPhotoH * zoom;

          if (imgAspect > photoAspect) {
            drawW = finalPhotoH * imgAspect * zoom;
          } else {
            drawH = (finalPhotoW / imgAspect) * zoom;
          }

          const drawX = photoX + (finalPhotoW - drawW) / 2 + panX;
          const drawY = photoY + (finalPhotoH - drawH) / 2 + panY;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Reset filter
          ctx.filter = 'none';

          // If include candidate name and date at bottom
          if (includeNameDate) {
            const stripH = finalPhotoH * 0.22;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(photoX, photoY + finalPhotoH - stripH, finalPhotoW, stripH);

            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.font = `bold ${Math.round(stripH * 0.38)}px Arial`;
            ctx.fillText(candidateName.toUpperCase(), photoX + finalPhotoW / 2, photoY + finalPhotoH - stripH * 0.52);

            ctx.font = `${Math.round(stripH * 0.32)}px Arial`;
            ctx.fillText(photoDate, photoX + finalPhotoW / 2, photoY + finalPhotoH - stripH * 0.16);
          }

          ctx.restore();

          // Draw cutting border around photo
          if (borderWidth > 0) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = borderWidth * 2;
            ctx.strokeRect(photoX, photoY, finalPhotoW, finalPhotoH);
          }

          // Draw light corner cut guide dots around the photo for scissors
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(photoX - 8, photoY); ctx.lineTo(photoX - 2, photoY);
          ctx.moveTo(photoX, photoY - 8); ctx.lineTo(photoX, photoY - 2);
          // Top-right
          ctx.moveTo(photoX + finalPhotoW + 8, photoY); ctx.lineTo(photoX + finalPhotoW + 2, photoY);
          ctx.moveTo(photoX + finalPhotoW, photoY - 8); ctx.lineTo(photoX + finalPhotoW, photoY - 2);
          // Bottom-left
          ctx.moveTo(photoX - 8, photoY + finalPhotoH); ctx.lineTo(photoX - 2, photoY + finalPhotoH);
          ctx.moveTo(photoX, photoY + finalPhotoH + 8); ctx.lineTo(photoX, photoY + finalPhotoH + 2);
          // Bottom-right
          ctx.moveTo(photoX + finalPhotoW + 8, photoY + finalPhotoH); ctx.lineTo(photoX + finalPhotoW + 2, photoY + finalPhotoH);
          ctx.moveTo(photoX + finalPhotoW, photoY + finalPhotoH + 8); ctx.lineTo(photoX + finalPhotoW, photoY + finalPhotoH + 2);
          ctx.stroke();

          count++;
        }
      }

      // Small footer watermark for cyber cafe branding
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('999tools - Smart Cyber Cafe Passport Print Sheet', sheetW - 40, sheetH - 25);
    };
  }, [imageSrc, paperSize, photoCount, borderWidth, zoom, panX, panY, brightness, contrast, includeNameDate, candidateName, photoDate]);

  // Mouse pan handlers for preview
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `999tools_Passport_Sheet_${paperSize}_${photoCount}photos.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Print Sheet directly
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Passport Photo Sheet - 999tools</title>
            <style>
              @page { size: ${paperSize === '4x6' ? '6in 4in' : 'A4'}; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
              img { width: 100vw; height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div id="passport-photo-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Tool Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Camera className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Passport Photo Sheet Maker</h2>
            <p className="text-xs text-blue-100">
              Auto 4x6 & A4 Multi-Photo Grid with Exact Cut Borders & Govt Date Stamp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="passport-btn-print"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg shadow-sm transition active:scale-95 text-sm"
          >
            <Printer className="w-4 h-4" />
            Direct Print
          </button>
          <button
            id="passport-btn-download"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 font-semibold rounded-lg shadow-sm transition active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            Download (300 DPI)
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

      {/* Main Studio Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Control Sidebar */}
        <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 space-y-5 overflow-y-auto max-h-[85vh]">
          {/* Upload Button */}
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
              id="passport-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-xl text-blue-700 font-medium flex items-center justify-center gap-2 transition hover:bg-blue-50/50"
            >
              <Camera className="w-5 h-5 text-blue-600" />
              Upload Passport Photo
            </button>
            <p className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP. Drag photo on preview to reposition.</p>
          </div>

          {/* Paper Size & Layout */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Paper Size & Photo Count
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
                <div className="text-xs text-slate-500">Standard Photo Lab Paper</div>
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
                <div className="text-sm font-bold">A4 Full Sheet</div>
                <div className="text-xs text-slate-500">Standard Printer Page</div>
              </button>
            </div>

            {/* Photo count pills */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-600">Quantity:</span>
              {paperSize === '4x6' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoCount(6)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      photoCount === 6
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    6 Photos (3x2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoCount(8)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      photoCount === 8
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    8 Photos (4x2)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoCount(16)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      photoCount === 16
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    16 Photos (4x4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoCount(32)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      photoCount === 32
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    32 Photos (4x8)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Zoom & Positioning */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Zoom & Head Fit
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPanX(0);
                  setPanY(0);
                }}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Scale:</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
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
          </div>

          {/* Border Style */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Cut Line / Outer Border
            </label>
            <div className="flex items-center gap-3">
              {[
                { val: 0, label: 'None' },
                { val: 1, label: 'Thin (1px)' },
                { val: 2, label: 'Solid (2px)' },
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

          {/* Govt Exam Name & Date Strip */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNameDate}
                onChange={(e) => setIncludeNameDate(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-600" />
                Add Name & Date of Photo (Govt Exam Requirement)
              </span>
            </label>

            {includeNameDate && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500">Candidate Full Name:</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. AMIT KUMAR"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs uppercase focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Date of Photo (DD/MM/YYYY):</label>
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

        {/* Right Canvas Preview Area */}
        <div className="lg:col-span-8 p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sheet Preview: {paperSize === '4x6' ? '4x6" Lab Paper' : 'A4 Document Paper'} ({photoCount} Photos)
            </span>
            <span>💡 Click and drag photo to adjust head position</span>
          </div>

          <div
            className="border-4 border-slate-300 rounded-lg bg-white shadow-2xl overflow-hidden cursor-move max-w-full max-h-[70vh] flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[68vh] object-contain shadow-sm"
            />
          </div>

          {/* Cyber Cafe Quick Print Specs Tip */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700">Recommended Printer Settings:</span>
            <span>• Paper Type: Glossy Photo Paper</span>
            <span>• Quality: High / Best</span>
            <span>• Borderless: Off / 100% Scale</span>
          </div>
        </div>
      </div>
    </div>
  );
};
