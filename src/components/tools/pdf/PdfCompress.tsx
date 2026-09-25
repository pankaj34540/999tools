import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  FileArchive, Upload, Download, X, Trash2, Loader2,
  FileText, Crown, Zap, TrendingDown, AlertCircle,
} from 'lucide-react';

interface PdfInfo {
  file: File;
  pageCount: number;
  size: number;
  arrayBuffer: ArrayBuffer;
  compressedBlob: Blob | null;
  compressedSize: number;
  isProcessing: boolean;
}

interface PdfCompressProps {
  onClose: () => void;
}

type CompressMode = 'smart' | 'deep';

const PdfCompress: React.FC<PdfCompressProps> = ({ onClose }) => {
  const [pdf, setPdf] = useState<PdfInfo | null>(null);
  const [mode, setMode] = useState<CompressMode>('smart');
  const [quality, setQuality] = useState(75);
  const [scale, setScale] = useState(1.5);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle file upload ──
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
      const pageCount = pdfDoc.getPageCount();

      setPdf({
        file,
        pageCount,
        size: file.size,
        arrayBuffer,
        compressedBlob: null,
        compressedSize: file.size,
        isProcessing: false,
      });
      setProgress('');
    } catch {
      setError('Failed to read PDF. File may be encrypted or corrupted.');
      setProgress('');
    }
  };

  // ── Smart Mode: Metadata cleanup + optimization ──
  const compressSmart = async (): Promise<Blob> => {
    if (!pdf) throw new Error('No PDF');

    const sourcePdf = await PDFDocument.load(pdf.arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    // Clean metadata
    sourcePdf.setTitle('');
    sourcePdf.setAuthor('');
    sourcePdf.setSubject('');
    sourcePdf.setKeywords([]);
    sourcePdf.setProducer('999tools');
    sourcePdf.setCreator('999tools PDF Compressor');
    sourcePdf.setCreationDate(new Date());
    sourcePdf.setModificationDate(new Date());

    // Save with object streams (better compression)
    const bytes = await sourcePdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  };

  // ── Deep Mode: Render pages → compress as images ──
  const compressDeep = async (): Promise<Blob> => {
    if (!pdf) throw new Error('No PDF');

    // Dynamically import pdfjs
    const pdfjs = await import('pdfjs-dist');
    // Set worker
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const loadingTask = pdfjs.getDocument({ data: pdf.arrayBuffer.slice(0) });
    const loadedPdf = await loadingTask.promise;

    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= loadedPdf.numPages; i++) {
      setProgress(`Rendering page ${i}/${loadedPdf.numPages}...`);
      const page = await loadedPdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Convert to JPEG
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
      const jpegBase64 = jpegDataUrl.split(',')[1];
      const jpegBytes = Uint8Array.from(atob(jpegBase64), (c) => c.charCodeAt(0));

      const jpegImage = await newPdf.embedJpg(jpegBytes);

      // A4 page size in points
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      const newPage = newPdf.addPage([pageWidth, pageHeight]);

      // Fit image into A4 page
      const imgAspect = jpegImage.width / jpegImage.height;
      const pageAspect = pageWidth / pageHeight;

      let drawW, drawH;
      if (imgAspect > pageAspect) {
        drawW = pageWidth;
        drawH = pageWidth / imgAspect;
      } else {
        drawH = pageHeight;
        drawW = pageHeight * imgAspect;
      }

      const drawX = (pageWidth - drawW) / 2;
      const drawY = (pageHeight - drawH) / 2;

      newPage.drawImage(jpegImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    }

    const bytes = await newPdf.save({
      useObjectStreams: true,
    });

    return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  };

  // ── Compress ──
  const handleCompress = async () => {
    if (!pdf) return;
    setError(null);
    setPdf({ ...pdf, isProcessing: true });
    setProgress('Compressing...');

    try {
      const blob = mode === 'smart' ? await compressSmart() : await compressDeep();

      setPdf((prev) =>
        prev
          ? {
              ...prev,
              compressedBlob: blob,
              compressedSize: blob.size,
              isProcessing: false,
            }
          : null
      );
      setProgress('');
    } catch (err) {
      setError('Failed to compress PDF. File may be too complex.');
      setPdf((prev) => (prev ? { ...prev, isProcessing: false } : null));
      setProgress('');
    }
  };

  // ── Download compressed ──
  const downloadCompressed = () => {
    if (!pdf?.compressedBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdf.compressedBlob);
    link.download = `compressed_${pdf.file.name}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ── Reset ──
  const resetAll = () => {
    setPdf(null);
    setError(null);
    setProgress('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getSavings = () => {
    if (!pdf?.compressedBlob) return 0;
    return Math.round(((pdf.size - pdf.compressedSize) / pdf.size) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FileArchive className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  PDF Compress
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> PREMIUM
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Reduce PDF file size with two compression modes</p>
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
            {!pdf ? (
              <div
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-emerald-400" />
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
                    <p className="text-xs text-white font-bold truncate">{pdf.file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {pdf.pageCount} pages · {formatSize(pdf.size)}
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

            {/* Mode Selection */}
            {pdf && !pdf.compressedBlob && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                <h3 className="text-sm font-bold text-white">Compression Mode</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Smart Mode */}
                  <button
                    onClick={() => setMode('smart')}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      mode === 'smart'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={`w-5 h-5 ${mode === 'smart' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${mode === 'smart' ? 'text-emerald-300' : 'text-slate-300'}`}>
                        Smart Compress
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Metadata cleanup + object optimization. <strong>10-30% size reduction</strong>. Text stays selectable. Fast.
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Safe • No quality loss
                    </div>
                  </button>

                  {/* Deep Mode */}
                  <button
                    onClick={() => setMode('deep')}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      mode === 'deep'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className={`w-5 h-5 ${mode === 'deep' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${mode === 'deep' ? 'text-amber-300' : 'text-slate-300'}`}>
                        Deep Compress
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Re-renders pages as compressed images. <strong>50-80% size reduction</strong>. Text becomes image. Slower.
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Heavy • Quality loss possible
                    </div>
                  </button>
                </div>

                {/* Deep Mode Settings */}
                {mode === 'deep' && (
                  <div className="bg-amber-900/10 border border-amber-800/40 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-2 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Warning:</strong> Text will become non-selectable images. Best for scans, photo-heavy PDFs.
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-300">Image Quality</label>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded">
                          {quality}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={95}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>30% (Smallest)</span>
                        <span>95% (Best)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-300">Render Scale</label>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded">
                          {scale}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={2.5}
                        step={0.1}
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>1x (Fast)</span>
                        <span>2.5x (Sharp)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compress Button */}
                <button
                  onClick={handleCompress}
                  disabled={pdf.isProcessing}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition ${
                    mode === 'smart'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {pdf.isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Compressing...'}</>
                  ) : (
                    <><FileArchive className="w-4 h-4" /> Compress PDF ({mode === 'smart' ? 'Smart' : 'Deep'})</>
                  )}
                </button>
              </div>
            )}

            {/* Result */}
            {pdf?.compressedBlob && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Compression Result
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Original</div>
                    <div className="text-lg font-bold text-slate-300">{formatSize(pdf.size)}</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Compressed</div>
                    <div className="text-lg font-bold text-emerald-400">{formatSize(pdf.compressedSize)}</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg border border-emerald-500/50 p-3 text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Savings</div>
                    <div className={`text-lg font-bold ${getSavings() > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {getSavings() > 0 ? `-${getSavings()}%` : '0%'}
                    </div>
                  </div>
                </div>

                {getSavings() <= 0 && (
                  <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-300 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Note:</strong> File size did not reduce. This PDF is already optimized. Try Deep Compress mode.
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={downloadCompressed}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
                  >
                    <Download className="w-4 h-4" /> Download Compressed PDF
                  </button>
                  <button
                    onClick={() => setPdf({ ...pdf, compressedBlob: null, compressedSize: pdf.size })}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200 flex gap-2">
              <Crown className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Premium Tool:</strong> Free users get <strong>3 uses/day</strong>. Upgrade for unlimited compression.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfCompress;
