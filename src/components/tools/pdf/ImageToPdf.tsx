import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileImage, Upload, Download, X, Trash2, Loader2,
  Image as ImageIcon, FileText, GripVertical, ChevronUp, ChevronDown,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

interface ImageToPdfProps {
  onClose: () => void;
}

type PageSize = 'a4' | 'letter' | 'a3' | 'fit';
type Orientation = 'portrait' | 'landscape' | 'auto';

const PAGE_SIZES = {
  a4: { w: 210, h: 297, label: 'A4' },
  letter: { w: 215.9, h: 279.4, label: 'Letter' },
  a3: { w: 297, h: 420, label: 'A3' },
};

const ImageToPdf: React.FC<ImageToPdfProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState(10);
  const [quality, setQuality] = useState(92);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle file upload ──
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please upload valid image files (JPG, PNG, WebP)');
        return;
      }

      const newItems: ImageItem[] = await Promise.all(
        validFiles.map(
          (f) =>
            new Promise<ImageItem>((resolve) => {
              const img = new Image();
              const url = URL.createObjectURL(f);
              img.onload = () => {
                resolve({
                  id: `${f.name}-${Date.now()}-${Math.random()}`,
                  file: f,
                  url,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              };
              img.onerror = () => URL.revokeObjectURL(url);
              img.src = url;
            })
        )
      );

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  // ── Move image up/down ──
  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const updated = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  // ── Remove image ──
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  // ── Reset all ──
  const resetAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setError(null);
  };

  // ── Generate PDF ──
  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      let pdf: jsPDF | null = null;

      for (const item of images) {
        // Load image as data
        const imgData = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas error');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', quality / 100));
          };
          img.onerror = () => reject('Image load error');
          img.src = item.url;
        });

        // Determine page dimensions
        let pageW: number;
        let pageH: number;
        let pageFormat: string | [number, number] = 'a4';

        if (pageSize === 'fit') {
          // Fit page to image aspect ratio
          const pxToMm = 0.264583;
          const imgW = item.width * pxToMm;
          const imgH = item.height * pxToMm;
          pageW = imgW + margin * 2;
          pageH = imgH + margin * 2;
          pageFormat = [pageW, pageH];
        } else {
          const size = PAGE_SIZES[pageSize];
          let w = size.w;
          let h = size.h;

          // Auto orientation based on image aspect
          if (orientation === 'auto') {
            if (item.width > item.height && w < h) {
              [w, h] = [h, w];
            }
          } else if (orientation === 'landscape') {
            if (w < h) [w, h] = [h, w];
          }

          pageW = w;
          pageH = h;
          pageFormat = pageSize;
        }

        const isFirstPage = pdf === null;
        if (isFirstPage) {
          pdf = new jsPDF({
            orientation: pageW > pageH ? 'landscape' : 'portrait',
            unit: 'mm',
            format: pageFormat as any,
          });
        } else {
          if (pageSize === 'fit') {
            pdf!.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait');
          } else {
            pdf!.addPage(
              pageSize,
              orientation === 'auto'
                ? pageW > pageH
                  ? 'landscape'
                  : 'portrait'
                : orientation
            );
          }
        }

        // Calculate image placement (fit within page with margin)
        const usableW = pageW - margin * 2;
        const usableH = pageH - margin * 2;
        const imgAspect = item.width / item.height;
        const usableAspect = usableW / usableH;

        let drawW, drawH;
        if (imgAspect > usableAspect) {
          drawW = usableW;
          drawH = usableW / imgAspect;
        } else {
          drawH = usableH;
          drawW = usableH * imgAspect;
        }

        const drawX = margin + (usableW - drawW) / 2;
        const drawY = margin + (usableH - drawH) / 2;

        pdf!.addImage(imgData, 'JPEG', drawX, drawY, drawW, drawH);
      }

      if (pdf) {
        pdf.save(`images_${Date.now()}.pdf`);
      }
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Image to PDF
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Convert images to PDF with custom page sizes</p>
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
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                PDF Settings
              </h3>

              {/* Page Size */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Page Size</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'a4', label: 'A4', desc: '210×297mm' },
                    { id: 'letter', label: 'Letter', desc: '215×279mm' },
                    { id: 'a3', label: 'A3', desc: '297×420mm' },
                    { id: 'fit', label: 'Fit Image', desc: 'Auto size' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPageSize(p.id as PageSize)}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        pageSize === p.id
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <div className={`text-xs font-bold ${pageSize === p.id ? 'text-red-300' : 'text-slate-300'}`}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              {pageSize !== 'fit' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Orientation</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'portrait', label: 'Portrait' },
                      { id: 'landscape', label: 'Landscape' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setOrientation(o.id as Orientation)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition ${
                          orientation === o.id
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Margin & Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Margin</label>
                    <span className="text-xs font-mono font-bold text-red-400 bg-slate-900 px-2 py-0.5 rounded">
                      {margin}mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Image Quality</label>
                    <span className="text-xs font-mono font-bold text-red-400 bg-slate-900 px-2 py-0.5 rounded">
                      {quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Upload */}
            {images.length === 0 ? (
              <div
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-red-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-white font-bold mb-1">Drop images here or click to upload</p>
                <p className="text-xs text-slate-400">JPG, PNG, WebP • Multiple files → 1 PDF</p>
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
                  onClick={generatePdf}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Generate PDF ({images.length})</>
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

            {/* Image list */}
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Page Order ({images.length} {images.length === 1 ? 'page' : 'pages'})
                </div>
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 bg-slate-950 rounded-lg border border-slate-800 p-3"
                  >
                    <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded flex-shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={img.url}
                      alt={img.file.name}
                      className="w-12 h-12 rounded object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {img.width}×{img.height} · {formatSize(img.file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveImage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded transition"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveImage(idx, 'down')}
                        disabled={idx === images.length - 1}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded transition"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded transition"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
              <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Tip:</strong> Drag to reorder pages. Each image = 1 PDF page. Use "Fit Image" for exact image size, or A4 for standard size. All processing happens in your browser.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToPdf;
