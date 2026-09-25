import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  RotateCw, Upload, Download, X, Trash2, Loader2,
  FileText, RotateCcw, Layers, Maximize2,
} from 'lucide-react';

interface PdfRotateProps {
  onClose: () => void;
}

const PdfRotate: React.FC<PdfRotateProps> = ({ onClose }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [pageAspect, setPageAspect] = useState(1);
  const [rotation, setRotation] = useState(90);
  const [customAngle, setCustomAngle] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle PDF upload ──
  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const file = files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }

    try {
      setProgress('Reading PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      setPdfFile(file);
      setPdfArrayBuffer(arrayBuffer);
      setPageCount(count);
      setProgress('');

      // Render first page preview
      await renderPreview(arrayBuffer);
    } catch {
      setError('Failed to read PDF. File may be encrypted or corrupted.');
      setProgress('');
    }
  };

  // ── Render first page as preview image ──
  const renderPreview = async (arrayBuffer: ArrayBuffer) => {
    setIsRendering(true);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
      const loadedPdf = await loadingTask.promise;
      const page = await loadedPdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Save aspect ratio for layout
      setPageAspect(canvas.height / canvas.width);

      canvas.toBlob((blob) => {
        if (blob) {
          if (pageImageUrl) URL.revokeObjectURL(pageImageUrl);
          setPageImageUrl(URL.createObjectURL(blob));
        }
        setIsRendering(false);
      }, 'image/jpeg', 0.85);
    } catch {
      setError('Failed to render preview');
      setIsRendering(false);
    }
  };

  // ── Rotate PDF ──
  const handleRotate = async () => {
    if (!pdfArrayBuffer || !pdfFile) return;
    setIsProcessing(true);
    setError(null);
    setProgress('Rotating pages...');

    try {
      const sourcePdf = await PDFDocument.load(pdfArrayBuffer, { ignoreEncryption: true });
      const pages = sourcePdf.getPages();

      const finalAngle = customAngle !== 0 ? customAngle : rotation;

      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + finalAngle) % 360;
        page.setRotation(degrees(newRotation));
      });

      setProgress('Generating PDF...');
      const bytes = await sourcePdf.save();

      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rotated_${pdfFile.name}`;
      link.click();
      URL.revokeObjectURL(link.href);

      setProgress('');
    } catch {
      setError('Failed to rotate PDF.');
      setProgress('');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Reset ──
  const resetAll = () => {
    if (pageImageUrl) URL.revokeObjectURL(pageImageUrl);
    setPdfFile(null);
    setPdfArrayBuffer(null);
    setPageCount(0);
    setPageImageUrl(null);
    setRotation(90);
    setCustomAngle(0);
    setError(null);
    setProgress('');
  };

  useEffect(() => {
    return () => {
      if (pageImageUrl) URL.revokeObjectURL(pageImageUrl);
    };
  }, [pageImageUrl]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const appliedAngle = customAngle !== 0 ? customAngle : rotation;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <RotateCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    PDF Rotate
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      LIVE PREVIEW
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Rotate PDF with real-time preview</p>
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

              {/* Upload */}
              {!pdfFile ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-white font-bold mb-1">Drop PDF file here or click to upload</p>
                  <p className="text-xs text-slate-400">Single .pdf file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => handleFile(e.target.files)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px] bg-slate-950 rounded-lg border border-slate-800 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-bold truncate">{pdfFile.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {formatSize(pdfFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-bold rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" /> Clear
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Main content — Preview + Controls */}
              {pdfFile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Preview Panel */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-400" />
                        Preview (Page 1 of {pageCount})
                      </h3>
                      {pageImageUrl && (
                        <button
                          onClick={() => setFullscreen(true)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Fullscreen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="bg-white rounded-lg border-2 border-slate-700 overflow-hidden">
                      <div
                        className="relative w-full flex items-center justify-center p-4 transition-all duration-300"
                        style={{
                          minHeight: '380px',
                          maxHeight: '500px',
                        }}
                      >
                        {isRendering || !pageImageUrl ? (
                          <div className="flex flex-col items-center gap-2 py-20">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                            <p className="text-xs text-slate-500">Loading preview...</p>
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center transition-transform duration-300 ease-out"
                            style={{
                              transform: `rotate(${appliedAngle}deg)`,
                              // For 90/270 deg, swap visible area
                              maxWidth: appliedAngle % 180 !== 0 ? '60%' : '100%',
                              maxHeight: appliedAngle % 180 !== 0 ? '60%' : '100%',
                            }}
                          >
                            <img
                              src={pageImageUrl}
                              alt="PDF page preview"
                              className="max-w-full max-h-full object-contain rounded shadow-md"
                              style={{ maxHeight: '450px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Rotation: <strong className="text-orange-400">{appliedAngle}°</strong>
                      </span>
                      <span className="text-slate-400">
                        Applies to <strong className="text-white">all {pageCount} page{pageCount === 1 ? '' : 's'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Controls Panel */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-orange-400" />
                      Rotation Settings
                    </h3>

                    {/* Quick Angles */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-2">Quick Angle</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { deg: 90, label: '90° CW', icon: <RotateCw className="w-4 h-4" /> },
                          { deg: 180, label: '180°', icon: <RotateCw className="w-4 h-4 rotate-180" /> },
                          { deg: 270, label: '90° CCW', icon: <RotateCcw className="w-4 h-4" /> },
                          { deg: 0, label: 'Reset (0°)', icon: <RotateCcw className="w-4 h-4" /> },
                        ].map((a) => (
                          <button
                            key={a.deg}
                            onClick={() => { setRotation(a.deg); setCustomAngle(0); }}
                            className={`p-3 rounded-lg border-2 transition flex items-center gap-2 justify-center ${
                              rotation === a.deg && customAngle === 0
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {a.icon}
                            <span className="text-xs font-bold">{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Angle Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-300">Custom Angle</label>
                        <span className="text-xs font-mono font-bold text-orange-400 bg-slate-900 px-2 py-0.5 rounded">
                          {customAngle}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={5}
                        value={customAngle}
                        onChange={(e) => setCustomAngle(Number(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>-180°</span>
                        <span>0° (off)</span>
                        <span>+180°</span>
                      </div>
                    </div>

                    {/* Applied rotation info */}
                    <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3 text-xs text-orange-200">
                      <strong>Applied rotation:</strong> {appliedAngle}°
                      {customAngle !== 0 && <span className="text-orange-400"> (custom)</span>}
                    </div>

                    {/* Rotate Button */}
                    <button
                      onClick={handleRotate}
                      disabled={isProcessing || appliedAngle === 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Processing...'}</>
                      ) : (
                        <><RotateCw className="w-4 h-4" /> Rotate & Download PDF</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Live Preview:</strong> Rotation applies in real-time. Downloaded PDF will have "rotated_" prefix. All {pageCount} pages will be rotated.
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      {fullscreen && pageImageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/98 backdrop-blur-md overflow-auto"
          onClick={() => setFullscreen(false)}
        >
          <div className="min-h-screen flex flex-col p-4">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <RotateCw className="w-5 h-5 text-orange-400" />
                <p className="text-sm text-white font-bold">
                  {pdfFile?.name} — Rotation: {appliedAngle}°
                </p>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 flex items-center justify-center bg-white rounded-xl overflow-hidden p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={pageImageUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out"
                style={{
                  transform: `rotate(${appliedAngle}deg)`,
                  maxHeight: '80vh',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PdfRotate;
