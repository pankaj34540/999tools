import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  FilePlus, Upload, Download, X, Trash2, Loader2,
  FileText, GripVertical, ChevronUp, ChevronDown, Layers,
} from 'lucide-react';

interface PdfItem {
  id: string;
  file: File;
  pageCount: number;
  size: number;
  previewUrl: string | null;
}

interface PdfMergeProps {
  onClose: () => void;
}

const PdfMerge: React.FC<PdfMergeProps> = ({ onClose }) => {
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle PDF upload ──
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    try {
      const validFiles = Array.from(files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (validFiles.length === 0) {
        setError('Please upload valid PDF files');
        return;
      }

      setProgress('Reading PDFs...');

      const newItems: PdfItem[] = await Promise.all(
        validFiles.map(
          (f) =>
            new Promise<PdfItem>((resolve) => {
              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  const arrayBuffer = reader.result as ArrayBuffer;
                  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                  const pageCount = pdfDoc.getPageCount();

                  // Generate first-page preview (as image via PDF.js is complex;
                  // Instead we show page count and file info only)
                  resolve({
                    id: `${f.name}-${Date.now()}-${Math.random()}`,
                    file: f,
                    pageCount,
                    size: f.size,
                    previewUrl: null,
                  });
                } catch {
                  setError(`Failed to read "${f.name}" — may be encrypted or corrupted`);
                  resolve({
                    id: `${f.name}-${Date.now()}-${Math.random()}`,
                    file: f,
                    pageCount: 0,
                    size: f.size,
                    previewUrl: null,
                  });
                }
              };
              reader.readAsArrayBuffer(f);
            })
        )
      );

      setPdfs((prev) => [...prev, ...newItems.filter((p) => p.pageCount > 0)]);
      setProgress('');
    } catch {
      setError('Failed to load PDFs');
      setProgress('');
    }
  };

  // ── Move up/down ──
  const movePdf = (index: number, direction: 'up' | 'down') => {
    setPdfs((prev) => {
      const updated = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  // ── Remove PDF ──
  const removePdf = (id: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Reset all ──
  const resetAll = () => {
    setPdfs([]);
    setError(null);
    setProgress('');
  };

  // ── Merge PDFs ──
  const mergePdfs = async () => {
    if (pdfs.length < 2) {
      setError('Please add at least 2 PDFs to merge');
      return;
    }

    setIsMerging(true);
    setError(null);
    setProgress('Merging PDFs...');

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfs.length; i++) {
        setProgress(`Processing ${i + 1}/${pdfs.length}...`);
        const item = pdfs[i];

        const arrayBuffer = await item.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      setProgress('Generating final PDF...');
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

      setProgress('');
    } catch (err) {
      setError('Failed to merge PDFs. Some files may be encrypted or corrupted.');
      setProgress('');
    } finally {
      setIsMerging(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalPages = pdfs.reduce((sum, p) => sum + p.pageCount, 0);
  const totalSize = pdfs.reduce((sum, p) => sum + p.size, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FilePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  PDF Merge
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Combine multiple PDFs into one</p>
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

            {/* Info */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-blue-400" />
                How It Works
              </h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>1️⃣ Upload 2 or more PDF files (or drag & drop)</li>
                <li>2️⃣ Reorder using ↑ ↓ buttons</li>
                <li>3️⃣ Click "Merge PDFs" to combine them</li>
                <li>4️⃣ Downloaded PDF will have all pages in order</li>
              </ul>
            </div>

            {/* Upload */}
            {pdfs.length === 0 ? (
              <div
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-white font-bold mb-1">Drop PDF files here or click to upload</p>
                <p className="text-xs text-slate-400">.pdf files • Multiple supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
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
                  <Upload className="w-4 h-4" /> Add More PDFs
                </button>
                <button
                  onClick={mergePdfs}
                  disabled={isMerging || pdfs.length < 2}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                >
                  {isMerging ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Merging...'}</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Merge {pdfs.length} PDFs</>
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
                  accept="application/pdf,.pdf"
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

            {/* Stats */}
            {pdfs.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">{pdfs.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">PDF Files</div>
                </div>
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 text-center">
                  <div className="text-lg font-bold text-emerald-400">{totalPages}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Pages</div>
                </div>
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">{formatSize(totalSize)}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Size</div>
                </div>
              </div>
            )}

            {/* PDF List */}
            {pdfs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Merge Order ({pdfs.length} files)
                </div>
                {pdfs.map((pdf, idx) => (
                  <div
                    key={pdf.id}
                    className="flex items-center gap-3 bg-slate-950 rounded-lg border border-slate-800 p-3"
                  >
                    <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-12 h-12 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-bold truncate">{pdf.file.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {pdf.pageCount} {pdf.pageCount === 1 ? 'page' : 'pages'} · {formatSize(pdf.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => movePdf(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded transition"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePdf(idx, 'down')}
                        disabled={idx === pdfs.length - 1}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded transition"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removePdf(pdf.id)}
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
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Tip:</strong> Reorder PDFs before merging. Pages will appear in listed order. All processing happens locally — your files never leave your device.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfMerge;
