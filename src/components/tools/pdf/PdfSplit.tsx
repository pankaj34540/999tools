import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import {
  Scissors, Upload, Download, X, Trash2, Loader2,
  FileText, Check, Split, File,
} from 'lucide-react';

interface PdfInfo {
  file: File;
  pageCount: number;
  size: number;
  arrayBuffer: ArrayBuffer;
}

interface PdfSplitProps {
  onClose: () => void;
}

type SplitMode = 'range' | 'each' | 'custom';

const PdfSplit: React.FC<PdfSplitProps> = ({ onClose }) => {
  const [pdf, setPdf] = useState<PdfInfo | null>(null);
  const [mode, setMode] = useState<SplitMode>('range');
  const [rangeInput, setRangeInput] = useState('1-1');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
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
      const pageCount = pdfDoc.getPageCount();

      setPdf({ file, pageCount, size: file.size, arrayBuffer });
      setRangeInput(`1-${pageCount}`);
      setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i)));
      setProgress('');
    } catch {
      setError('Failed to read PDF. File may be encrypted or corrupted.');
      setProgress('');
    }
  };

  // ── Parse page range ──
  const parseRange = (input: string, maxPage: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end)) continue;
        for (let i = Math.max(1, start); i <= Math.min(maxPage, end); i++) {
          pages.push(i);
        }
      } else {
        const n = parseInt(part, 10);
        if (!isNaN(n) && n >= 1 && n <= maxPage) pages.push(n);
      }
    }

    return Array.from(new Set(pages)).sort((a, b) => a - b);
  };

  // ── Download single PDF ──
  const triggerDownload = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ── Split by range ──
  const splitByRange = async () => {
    if (!pdf) return;
    const pages = parseRange(rangeInput, pdf.pageCount);
    if (pages.length === 0) {
      setError('Invalid page range. Example: 1-3, 5, 7-9');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress('Splitting...');

    try {
      const sourcePdf = await PDFDocument.load(pdf.arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      const pageIndices = pages.map((p) => p - 1);
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const bytes = await newPdf.save();
      const baseName = pdf.file.name.replace(/\.pdf$/i, '');
      triggerDownload(bytes, `${baseName}_pages_${pages[0]}-${pages[pages.length - 1]}.pdf`);
    } catch {
      setError('Failed to split PDF');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  // ── Split each page (ZIP) ──
  const splitEachPage = async () => {
    if (!pdf) return;
    setIsProcessing(true);
    setError(null);
    setProgress('Splitting each page...');

    try {
      const sourcePdf = await PDFDocument.load(pdf.arrayBuffer, { ignoreEncryption: true });
      const zip = new JSZip();
      const baseName = pdf.file.name.replace(/\.pdf$/i, '');

      for (let i = 0; i < pdf.pageCount; i++) {
        setProgress(`Processing page ${i + 1}/${pdf.pageCount}...`);
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save();
        zip.file(`${baseName}_page_${String(i + 1).padStart(3, '0')}.pdf`, bytes);
      }

      setProgress('Creating ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${baseName}_split_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('Failed to split PDF');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  // ── Split selected pages (ZIP) ──
  const splitSelected = async () => {
    if (!pdf || selectedPages.size === 0) {
      setError('Please select at least one page');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setProgress('Creating PDFs...');

    try {
      const sourcePdf = await PDFDocument.load(pdf.arrayBuffer, { ignoreEncryption: true });
      const zip = new JSZip();
      const baseName = pdf.file.name.replace(/\.pdf$/i, '');
      const sorted = Array.from(selectedPages).sort((a, b) => a - b);

      for (let i = 0; i < sorted.length; i++) {
        const pageNum = sorted[i];
        setProgress(`Processing page ${i + 1}/${sorted.length}...`);
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save();
        zip.file(`${baseName}_page_${String(pageNum).padStart(3, '0')}.pdf`, bytes);
      }

      setProgress('Creating ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${baseName}_selected_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('Failed to split PDF');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  // ── Toggle page selection ──
  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  };

  const selectAll = () => {
    if (!pdf) return;
    setSelectedPages(new Set(Array.from({ length: pdf.pageCount }, (_, i) => i + 1)));
  };

  const deselectAll = () => setSelectedPages(new Set());

  // ── Reset ──
  const resetAll = () => {
    setPdf(null);
    setRangeInput('1-1');
    setSelectedPages(new Set());
    setError(null);
    setProgress('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const parsedRange = pdf ? parseRange(rangeInput, pdf.pageCount) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  PDF Split
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Extract pages or split into multiple PDFs</p>
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
                className="border-2 border-dashed border-slate-700 hover:border-violet-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-violet-400" />
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
                      {pdf.pageCount} {pdf.pageCount === 1 ? 'page' : 'pages'} · {formatSize(pdf.size)}
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

            {/* Split Options */}
            {pdf && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Split className="w-4 h-4 text-violet-400" />
                  Split Mode
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'range', label: 'Extract Range', desc: 'e.g. 1-3, 5, 7-9' },
                    { id: 'each', label: 'Split Each Page', desc: 'One PDF per page' },
                    { id: 'custom', label: 'Select Pages', desc: 'Click to choose' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as SplitMode)}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        mode === m.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <div className={`text-xs font-bold ${mode === m.id ? 'text-violet-300' : 'text-slate-300'}`}>
                        {m.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Range Mode */}
                {mode === 'range' && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Page Range (max: {pdf.pageCount})
                    </label>
                    <input
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="e.g. 1-3, 5, 7-9"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-violet-500 outline-none"
                    />
                    <div className="mt-2 text-xs text-slate-400">
                      {parsedRange.length > 0 ? (
                        <span className="text-emerald-400">
                          ✅ {parsedRange.length} pages selected: {parsedRange.slice(0, 10).join(', ')}
                          {parsedRange.length > 10 ? `...+${parsedRange.length - 10}` : ''}
                        </span>
                      ) : (
                        <span className="text-amber-400">⚠️ No valid pages</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Mode */}
                {mode === 'custom' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300">
                        Click pages to select ({selectedPages.size}/{pdf.pageCount})
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAll}
                          className="text-[10px] font-bold text-violet-400 hover:text-violet-300"
                        >
                          Select All
                        </button>
                        <button
                          onClick={deselectAll}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-900 rounded-lg border border-slate-800">
                      {Array.from({ length: pdf.pageCount }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => togglePage(p)}
                          className={`aspect-square rounded text-xs font-bold transition ${
                            selectedPages.has(p)
                              ? 'bg-violet-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Split Button */}
                <button
                  onClick={
                    mode === 'range'
                      ? splitByRange
                      : mode === 'each'
                      ? splitEachPage
                      : splitSelected
                  }
                  disabled={isProcessing || (mode === 'range' && parsedRange.length === 0)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Processing...'}</>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      {mode === 'range'
                        ? `Extract ${parsedRange.length} Page(s)`
                        : mode === 'each'
                        ? `Split into ${pdf.pageCount} PDFs (ZIP)`
                        : `Split ${selectedPages.size} Selected Page(s) (ZIP)`}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
              <File className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Tip:</strong> Use "Extract Range" for specific pages, "Split Each" for one PDF per page, or "Select Pages" to pick interactively. All processing is local — files never leave your device.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfSplit;
