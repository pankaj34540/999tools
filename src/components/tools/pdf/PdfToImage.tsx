import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  FileImage, Upload, Download, X, Loader2, Trash2,
  FileText, Image as ImageIcon, Maximize2, Layers,
} from 'lucide-react';

interface PageImage {
  pageNum: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}

interface PdfToImageProps {
  onClose: () => void;
}

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const PdfToImage: React.FC<PdfToImageProps> = ({ onClose }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<PageImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExtension = (fmt: OutputFormat) => {
    if (fmt === 'image/png') return 'png';
    if (fmt === 'image/webp') return 'webp';
    return 'jpg';
  };

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

      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
      const loadedPdf = await loadingTask.promise;

      setPdfFile(file);
      setPdfArrayBuffer(arrayBuffer);
      setPageCount(loadedPdf.numPages);
      setPages([]);
      setProgress('');
    } catch {
      setError('Failed to read PDF. File may be encrypted or corrupted.');
      setProgress('');
    }
  };

  // ── Convert PDF to images ──
  const convertToImages = async () => {
    if (!pdfArrayBuffer) return;
    setIsProcessing(true);
    setError(null);
    setPages([]);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjs.getDocument({ data: pdfArrayBuffer.slice(0) });
      const loadedPdf = await loadingTask.promise;

      const newPages: PageImage[] = [];

      for (let i = 1; i <= loadedPdf.numPages; i++) {
        setProgress(`Rendering page ${i}/${loadedPdf.numPages}...`);
        const page = await loadedPdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          if (format === 'image/png') {
            canvas.toBlob((b) => resolve(b), 'image/png');
          } else {
            canvas.toBlob((b) => resolve(b), format, quality / 100);
          }
        });

        if (blob) {
          newPages.push({
            pageNum: i,
            blob,
            url: URL.createObjectURL(blob),
            width: canvas.width,
            height: canvas.height,
            size: blob.size,
          });
          setPages([...newPages]); // Progressive update
        }
      }

      setProgress('');
    } catch {
      setError('Failed to convert PDF to images.');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  // ── Download single page ──
  const downloadSingle = (page: PageImage) => {
    const link = document.createElement('a');
    link.href = page.url;
    link.download = `${pdfFile?.name.replace(/\.pdf$/i, '')}_page_${String(page.pageNum).padStart(3, '0')}.${getExtension(format)}`;
    link.click();
  };

  // ── Download all as ZIP ──
  const downloadZip = async () => {
    if (pages.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const baseName = pdfFile?.name.replace(/\.pdf$/i, '') || 'pdf';
      pages.forEach((page) => {
        zip.file(
          `${baseName}_page_${String(page.pageNum).padStart(3, '0')}.${getExtension(format)}`,
          page.blob
        );
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${baseName}_images_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('Failed to create ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  // ── Reset ──
  const resetAll = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    setPdfFile(null);
    setPdfArrayBuffer(null);
    setPageCount(0);
    setPages([]);
    setError(null);
    setProgress('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalSize = pages.reduce((sum, p) => sum + p.size, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    PDF to Image
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Convert PDF pages to PNG, JPG, or WebP</p>
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
                  className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-pink-400" />
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

              {/* Settings */}
              {pdfFile && pages.length === 0 && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pink-400" />
                    Output Settings
                  </h3>

                  {/* Format */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Output Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'image/png', label: 'PNG', desc: 'Lossless' },
                        { id: 'image/jpeg', label: 'JPG', desc: 'Smaller' },
                        { id: 'image/webp', label: 'WebP', desc: 'Modern' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFormat(f.id as OutputFormat)}
                          className={`p-3 rounded-lg border-2 transition text-left ${
                            format === f.id
                              ? 'border-pink-500 bg-pink-500/10'
                              : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                          }`}
                        >
                          <div className={`text-sm font-bold ${format === f.id ? 'text-pink-300' : 'text-slate-300'}`}>
                            {f.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality (JPG/WebP only) */}
                  {format !== 'image/png' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-300">Quality</label>
                        <span className="text-xs font-mono font-bold text-pink-400 bg-slate-900 px-2 py-0.5 rounded">
                          {quality}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-pink-500"
                      />
                    </div>
                  )}

                  {/* Resolution Scale */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300">Resolution (Scale)</label>
                      <span className="text-xs font-mono font-bold text-pink-400 bg-slate-900 px-2 py-0.5 rounded">
                        {scale}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.5}
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>1x (72 DPI)</span>
                      <span>2x (144 DPI)</span>
                      <span>4x (288 DPI)</span>
                    </div>
                  </div>

                  {/* Convert Button */}
                  <button
                    onClick={convertToImages}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Converting...'}</>
                    ) : (
                      <><FileImage className="w-4 h-4" /> Convert {pageCount} Page(s)</>
                    )}
                  </button>
                </div>
              )}

              {/* Progress (during conversion) */}
              {isProcessing && pages.length > 0 && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                  <div className="flex items-center gap-2 text-xs text-pink-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progress}</span>
                  </div>
                </div>
              )}

              {/* Result Actions */}
              {pages.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={downloadZip}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                  >
                    {isZipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Zipping...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Download All ({pages.length} pages ZIP)</>
                    )}
                  </button>
                  <span className="text-xs text-slate-400">
                    {pages.length}/{pageCount} converted · {formatSize(totalSize)} total
                  </span>
                </div>
              )}

              {/* Pages Grid */}
              {pages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pages.map((page) => (
                    <div key={page.pageNum} className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden group">
                      <div className="relative aspect-[3/4]">
                        <img
                          src={page.url}
                          alt={`Page ${page.pageNum}`}
                          className="w-full h-full object-contain bg-white"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600">
                          PAGE {page.pageNum}
                        </div>
                        <button
                          onClick={() => setFullscreenImg(page)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-slate-950/90 hover:bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] text-slate-400 mb-1.5">
                          {page.width}×{page.height} · {formatSize(page.size)}
                        </p>
                        <button
                          onClick={() => downloadSingle(page)}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded transition"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Tip:</strong> Higher scale = better quality but larger files. 2x is good for most use cases. All processing happens locally.
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
                <FileImage className="w-5 h-5 text-pink-400" />
                <p className="text-sm text-white font-bold">
                  Page {fullscreenImg.pageNum} — {fullscreenImg.width}×{fullscreenImg.height}
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
              className="flex-1 flex items-center justify-center bg-white rounded-xl overflow-hidden p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullscreenImg.url}
                alt={`Page ${fullscreenImg.pageNum}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="flex justify-center mt-4 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSingle(fullscreenImg);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Page {fullscreenImg.pageNum}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PdfToImage;
