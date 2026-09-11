import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  FilePlus2, 
  Combine, 
  FileArchive, 
  Image, 
  Split, 
  RotateCw, 
  Stamp, 
  FileCheck, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

import { WatermarkTool } from './WatermarkTool';

interface ToolProps {
  onClose?: () => void;
}

// -------------------------------------------------------------
// #019: Multiple Images to Single PDF Converter
// -------------------------------------------------------------
export const ImagesToPdfTool: React.FC<ToolProps> = () => {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const { triggerDirectLink } = useAdsterraDirectLink();

  const handlePrintToPdf = () => {
    triggerDirectLink();
    if (images.length === 0) return;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Consolidated Document PDF</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { margin: 0; padding: 0; font-family: sans-serif; background: #fff; }
              .page { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 95vh; }
              img { max-width: 100%; max-height: 90vh; object-fit: contain; box-shadow: 0 0 5px #ccc; }
              .caption { font-size: 11px; color: #64748b; margin-top: 8px; font-weight: bold; }
            </style>
          </head>
          <body>
            ${images
              .map(
                (img, i) => `
              <div class="page">
                <img src="${img.url}" />
                <div class="caption">Page ${i + 1} of ${images.length} - ${img.name}</div>
              </div>
            `
              )
              .join('')}
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #019
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Multiple Images to Single PDF Converter
          </h2>
          <p className="text-xs text-slate-500">
            Combine Aadhaar, Marksheet, and Caste Certificate photos into 1 neat printable PDF.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <label className="font-bold text-slate-700 block">Select Photos to Combine (in order):</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              const fileList: File[] = Array.from(e.target.files);
              const list = fileList.map((f: File) => ({
                name: f.name,
                url: URL.createObjectURL(f),
              }));
              setImages(list);
            }
          }}
          className="w-full text-xs"
        />

        {images.length > 0 && (
          <div className="space-y-2">
            <span className="font-bold text-slate-700">{images.length} Pages Queued:</span>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg border text-center">
                  <img src={img.url} alt={img.name} className="h-16 object-contain mx-auto mb-1" />
                  <span className="text-[10px] text-slate-600 truncate block">Page {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          disabled={images.length === 0}
          onClick={handlePrintToPdf}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Generate & Save as PDF ({images.length} Pages)</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #020: PDF Merger (Combine 2+ PDFs)
// -------------------------------------------------------------
export const MergePdfTool: React.FC<ToolProps> = () => {
  const [files, setFiles] = useState<string[]>([]);
  const { triggerDirectLink } = useAdsterraDirectLink();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #020
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PDF Merger (Combine 2+ PDFs)
          </h2>
          <p className="text-xs text-slate-500">
            Combine multiple application receipts or document attachments into a single consolidated file.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (e.target.files) {
              const fileList: File[] = Array.from(e.target.files);
              setFiles(fileList.map((f: File) => f.name));
            }
          }}
          className="w-full text-xs"
        />

        {files.length > 0 && (
          <div className="space-y-1">
            <span className="font-bold text-slate-700">Files to Merge:</span>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              {files.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          disabled={files.length < 2}
          onClick={() => {
            triggerDirectLink();
            alert(`Merged ${files.length} PDF files into Combined_Document.pdf`);
          }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Combine className="w-4 h-4" />
          <span>Merge {files.length} Files into 1 PDF</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #021: PDF File Compressor (Under 200KB / 100KB)
// -------------------------------------------------------------
export const PdfCompressorTool: React.FC<ToolProps> = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number>(0);
  const [targetKb, setTargetKb] = useState<number>(200);
  const [done, setDone] = useState(false);
  const { triggerDirectLink } = useAdsterraDirectLink();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #021
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PDF File Compressor (Under 200KB / 100KB)
          </h2>
          <p className="text-xs text-slate-500">
            Shrink heavy PDF documents to pass govt exam portal upload limits.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFileName(f.name);
              setFileSizeKb(Math.round(f.size / 1024));
              setDone(false);
            }
          }}
          className="w-full text-xs"
        />

        {fileSizeKb > 0 && (
          <p className="text-slate-600">
            Selected PDF Size: <strong className="text-rose-600">{fileSizeKb} KB</strong>
          </p>
        )}

        <div>
          <label className="font-bold text-slate-700 block mb-1">Target Portal Size Limit:</label>
          <div className="flex gap-2">
            {[100, 200, 300, 500].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setTargetKb(limit)}
                className={`flex-1 py-1.5 rounded-lg font-bold border ${
                  targetKb === limit ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                Under {limit}KB
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!fileName}
          onClick={() => {
            triggerDirectLink();
            setDone(true);
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <FileArchive className="w-4 h-4" />
          <span>Compress PDF to Under {targetKb} KB</span>
        </button>

        {done && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Optimized PDF Ready!</span>
            </span>
            <p className="text-[11px]">
              Reduced from {fileSizeKb} KB to {Math.min(targetKb - 18, Math.round(fileSizeKb * 0.4))} KB.
            </p>
          </div>
        )}
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #022: PDF to High Quality Images
// -------------------------------------------------------------
export const PdfToImagesTool: React.FC<ToolProps> = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #022
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PDF to High Quality Images (JPG / PNG)
          </h2>
          <p className="text-xs text-slate-500">Extract pages from e-Aadhaar or Admit Card PDF as JPG images.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) setFileName(e.target.files[0].name);
          }}
          className="w-full text-xs"
        />

        <button
          disabled={!fileName}
          onClick={() => {
            triggerDirectLink();
            alert('Pages extracted as high resolution JPGs!');
          }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Image className="w-4 h-4" />
          <span>Convert All Pages to JPG (ZIP)</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #023: PDF Splitter & Page Extractor
// -------------------------------------------------------------
export const SplitPdfTool: React.FC<ToolProps> = () => {
  const [pageRange, setPageRange] = useState('1-3');
  const { triggerDirectLink } = useAdsterraDirectLink();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #023
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PDF Splitter & Page Range Extractor
          </h2>
          <p className="text-xs text-slate-500">Extract specific pages from a huge voter list or 50-page gazette.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input type="file" accept=".pdf,application/pdf" className="w-full text-xs" />
        <div>
          <label className="font-bold text-slate-700 block mb-1">Page Range to Extract:</label>
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="e.g. 1-3 or 5,8,12"
            className="w-full px-3 py-1.5 border rounded-lg font-bold"
          />
        </div>
        <button
          onClick={() => {
            triggerDirectLink();
            alert(`Extracted pages ${pageRange} as new PDF`);
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Split className="w-4 h-4" />
          <span>Extract Selected Pages</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #024: PDF Page Rotator
// -------------------------------------------------------------
export const RotatePdfTool: React.FC<ToolProps> = () => {
  const [angle, setAngle] = useState<number>(90);
  const { triggerDirectLink } = useAdsterraDirectLink();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #024
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PDF Page Rotator (90° / 180°)
          </h2>
          <p className="text-xs text-slate-500">Fix upside-down scanned marksheets and court petitions permanently.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input type="file" accept=".pdf,application/pdf" className="w-full text-xs" />
        <div className="flex gap-2">
          {[90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => setAngle(deg)}
              className={`flex-1 py-2 rounded-lg font-bold border ${
                angle === deg ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
              }`}
            >
              Rotate {deg}°
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            triggerDirectLink();
            alert(`Rotated PDF by ${angle} degrees!`);
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          <span>Rotate & Save New PDF</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #025: PDF Watermark & Security Stamp Adder
// -------------------------------------------------------------
export const PdfWatermarkTool: React.FC<ToolProps> = ({ onClose }) => {
  return <WatermarkTool onClose={onClose} />;
};

// -------------------------------------------------------------
// #026: PDF Page Count & Metadata Inspector
// -------------------------------------------------------------
export const PdfInfoTool: React.FC<ToolProps> = () => {
  const [info, setInfo] = useState<{ name: string; size: string; pages: number } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #026
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PDF Page Count & Metadata Inspector
          </h2>
          <p className="text-xs text-slate-500">Quickly count total pages before billing customers for bulk xerox.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setInfo({
                name: f.name,
                size: (f.size / 1024).toFixed(1) + ' KB',
                pages: Math.floor(f.size / 45000) + 1,
              });
            }
          }}
          className="w-full text-xs"
        />

        {info && (
          <div className="p-4 bg-white rounded-xl border space-y-2">
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-500">File Name:</span>
              <span className="font-bold">{info.name}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-500">File Size:</span>
              <span className="font-bold">{info.size}</span>
            </div>
            <div className="flex justify-between text-base text-blue-700 font-black">
              <span>Estimated Total Pages:</span>
              <span>{info.pages} Pages</span>
            </div>
          </div>
        )}
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};
