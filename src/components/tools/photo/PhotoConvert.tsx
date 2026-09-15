import React, { useState } from 'react';
import { Upload, Download, X, Info, Printer, Layers, Archive, Code, Image as ImageIcon, Camera } from 'lucide-react';

// ============================================
// SHARED HELPERS
// ============================================
const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadImageFromSrc = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), type, quality);
  });
};

interface ToolProps { onClose: () => void; }

const ToolHeader: React.FC<{ title: string; onClose: () => void; icon?: React.ReactNode }> = ({ title, onClose, icon }) => (
  <div className="flex items-center justify-between border-b pb-3 mb-4">
    <div className="flex items-center gap-2">{icon}<h3 className="text-base font-black text-slate-900">{title}</h3></div>
    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
  </div>
);

const UploadBox: React.FC<{ onFile: (f: File) => void; multiple?: boolean; label?: string; accept?: string }> = ({ onFile, multiple, label, accept = 'image/*' }) => (
  <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition">
    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
    <p className="text-sm font-bold text-slate-700">{label || 'Click to upload image'}</p>
    <p className="text-xs text-slate-500 mt-1">Supported formats: JPG, PNG, WebP, HEIC</p>
    <input type="file" accept={accept} multiple={multiple} className="hidden"
      onChange={(e) => { const files = e.target.files; if (!files) return; Array.from(files).forEach(f => onFile(f)); }} />
  </label>
);

const PrimaryBtn: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; variant?: 'primary' | 'success' | 'ghost' }> = 
  ({ onClick, children, disabled, variant = 'primary' }) => {
    const base = 'px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const styles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
      ghost: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    };
    return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{children}</button>;
  };

// ============================================
// #031 — PHOTO METADATA VIEWER
// ============================================
export const PhotoMetadataViewerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [info, setInfo] = useState<any>(null);
  const [previewSrc, setPreviewSrc] = useState('');

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setPreviewSrc(img.src);
    setInfo({
      name: file.name, type: file.type || 'unknown', size: file.size,
      sizeKB: (file.size / 1024).toFixed(2),
      width: img.width, height: img.height,
      megapixels: ((img.width * img.height) / 1000000).toFixed(2),
      aspectRatio: (img.width / img.height).toFixed(3),
      lastModified: new Date(file.lastModified).toLocaleString('en-IN'),
    });
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(2)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div>
      <ToolHeader title="Photo Metadata Viewer" icon={<Info className="w-4 h-4 text-blue-600" />} onClose={onClose} />
      {!info ? <UploadBox onFile={handleFile} label="Upload photo to view details" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><img src={previewSrc} className="w-full rounded-xl border max-h-[400px] object-contain bg-slate-50" /></div>
            <div className="space-y-2">
              {[
                { label: 'File Name', value: info.name },
                { label: 'Format', value: info.type },
                { label: 'Dimensions', value: `${info.width} × ${info.height} px` },
                { label: 'Aspect Ratio', value: info.aspectRatio },
                { label: 'Megapixels', value: `${info.megapixels} MP` },
                { label: 'File Size', value: formatBytes(info.size) },
                { label: 'Size (KB)', value: `${info.sizeKB} KB` },
                { label: 'Last Modified', value: info.lastModified },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                  <span className="text-xs font-bold text-slate-600">{row.label}</span>
                  <span className="text-xs font-mono text-slate-900 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <PrimaryBtn onClick={() => { setInfo(null); setPreviewSrc(''); }} variant="ghost">New Image</PrimaryBtn>
        </div>
      )}
    </div>
  );
};

// ============================================
// #032 — DPI CONVERTER
// ============================================
export const PhotoDpiConverterTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [dpi, setDpi] = useState(300);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(c, 'image/png');
      downloadBlob(blob, `dpi-${dpi}-${Date.now()}.png`);
    } finally { setBusy(false); }
  };

  const PRESETS = [72, 96, 150, 300, 600];

  return (
    <div>
      <ToolHeader title="Photo DPI Converter" icon={<Printer className="w-4 h-4 text-emerald-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload photo to set DPI" /> : (
        <div className="space-y-4">
          <img src={src} className="w-full max-h-[300px] object-contain rounded-xl border bg-slate-50" />
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <label className="text-xs font-bold text-slate-700 block">Select DPI</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p} onClick={() => setDpi(p)} className={`px-3 py-2 rounded-lg text-xs font-bold ${dpi === p ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>{p} DPI</button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Custom: {dpi}</label>
              <input type="range" min={50} max={1200} value={dpi} onChange={(e) => setDpi(+e.target.value)} className="w-full accent-emerald-600" />
            </div>
            <p className="text-[10px] text-slate-500">💡 300 DPI = print quality | 72 DPI = web/screen</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Download className="w-4 h-4" /> {busy ? 'Processing...' : `Save as ${dpi} DPI`}</PrimaryBtn>
            <PrimaryBtn onClick={() => setSrc('')} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #033 — BULK IMAGE RESIZER
// ============================================
export const BulkImageResizerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [keepAspect, setKeepAspect] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (f: File) => setFiles(prev => [...prev, f]);

  const downloadZip = async () => {
    if (!files.length) return;
    setBusy(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const img = await loadImageFromFile(file);
        const c = document.createElement('canvas');
        let w = width, h = height;
        if (keepAspect) {
          const ratio = img.width / img.height;
          h = Math.round(width / ratio);
          w = width;
        }
        c.width = w; c.height = h;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
        downloadBlob(blob, `resized-${i + 1}-${file.name.replace(/\.[^.]+$/, '')}.jpg`);
        setProgress(i + 1);
        await new Promise(r => setTimeout(r, 300));
      }
    } finally { setBusy(false); }
  };

  return (
    <div>
      <ToolHeader title="Bulk Image Resizer" icon={<Layers className="w-4 h-4 text-indigo-600" />} onClose={onClose} />
      <div className="space-y-4">
        <UploadBox onFile={handleFile} multiple label="Upload multiple images (click multiple times or select all)" />
        {files.length > 0 && (
          <>
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-700">{files.length} image(s) queued</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Width (px)</label>
                  <input type="number" value={width} onChange={(e) => setWidth(+e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Height (px)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" disabled={keepAspect} />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} className="accent-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Keep aspect ratio</span>
              </label>
            </div>
            <div className="max-h-40 overflow-y-auto bg-white border rounded-lg p-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-1.5 px-2 hover:bg-slate-50 rounded">
                  <span className="truncate flex-1">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {busy && <div className="text-xs text-center text-slate-600">Processing {progress}/{files.length}...</div>}
            <div className="flex flex-wrap gap-2">
              <PrimaryBtn onClick={downloadZip} disabled={busy}>
                <Download className="w-4 h-4" /> {busy ? 'Processing...' : `Resize All (${files.length})`}
              </PrimaryBtn>
              <PrimaryBtn onClick={() => setFiles([])} variant="ghost">Clear All</PrimaryBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// #034 — BULK IMAGE COMPRESSOR
// ============================================
export const BulkImageCompressorTool: React.FC<ToolProps> = ({ onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(70);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (f: File) => setFiles(prev => [...prev, f]);

  const compressAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const img = await loadImageFromFile(file);
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const blob = await canvasToBlob(c, 'image/jpeg', quality / 100);
        downloadBlob(blob, `compressed-${i + 1}-${file.name.replace(/\.[^.]+$/, '')}.jpg`);
        setProgress(i + 1);
        await new Promise(r => setTimeout(r, 300));
      }
    } finally { setBusy(false); }
  };

  return (
    <div>
      <ToolHeader title="Bulk Image Compressor" icon={<Archive className="w-4 h-4 text-orange-600" />} onClose={onClose} />
      <div className="space-y-4">
        <UploadBox onFile={handleFile} multiple label="Upload multiple images to compress" />
        {files.length > 0 && (
          <>
            <div className="bg-slate-50 p-4 rounded-xl">
              <label className="text-xs font-bold text-slate-700 block mb-1">Quality: {quality}% (lower = smaller file)</label>
              <input type="range" min={10} max={95} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-orange-600" />
            </div>
            <div className="max-h-40 overflow-y-auto bg-white border rounded-lg p-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-1.5 px-2 hover:bg-slate-50 rounded">
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{(f.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {busy && <div className="text-xs text-center text-slate-600">Compressing {progress}/{files.length}...</div>}
            <div className="flex flex-wrap gap-2">
              <PrimaryBtn onClick={compressAll} disabled={busy}>
                <Download className="w-4 h-4" /> {busy ? 'Processing...' : `Compress All (${files.length})`}
              </PrimaryBtn>
              <PrimaryBtn onClick={() => setFiles([])} variant="ghost">Clear All</PrimaryBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// #035 — IMAGE TO BASE64
// ============================================
export const ImageToBase64Tool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [base64, setBase64] = useState('');
  const [includePrefix, setIncludePrefix] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const dataUrl = c.toDataURL('image/png');
    setBase64(includePrefix ? dataUrl : dataUrl.split(',')[1]);
  };

  const copy = () => {
    if (!base64) return;
    navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadTxt = () => {
    if (!base64) return;
    const blob = new Blob([base64], { type: 'text/plain' });
    downloadBlob(blob, `base64-${Date.now()}.txt`);
  };

  return (
    <div>
      <ToolHeader title="Image to Base64 Converter" icon={<Code className="w-4 h-4 text-slate-700" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload image to convert to Base64" /> : (
        <div className="space-y-4">
          <img src={src} className="w-full max-h-[250px] object-contain rounded-xl border bg-slate-50" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includePrefix} onChange={(e) => setIncludePrefix(e.target.checked)} className="accent-slate-700" />
            <span className="text-xs font-bold text-slate-700">Include data:image/... prefix</span>
          </label>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Base64 Output ({base64.length} chars)</label>
            <textarea readOnly value={base64} className="w-full h-40 p-3 font-mono text-[10px] border rounded-lg bg-slate-50" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={copy} variant={copied ? 'success' : 'primary'}>
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </PrimaryBtn>
            <PrimaryBtn onClick={downloadTxt} variant="ghost"><Download className="w-4 h-4" /> Download .txt</PrimaryBtn>
            <PrimaryBtn onClick={() => { setSrc(''); setBase64(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #036 — BASE64 TO IMAGE
// ============================================
export const Base64ToImageTool: React.FC<ToolProps> = ({ onClose }) => {
  const [base64Input, setBase64Input] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleConvert = () => {
    setError('');
    let cleaned = base64Input.trim();
    if (!cleaned) { setError('Please paste Base64 string'); return; }

    // Auto-add prefix if missing
    if (!cleaned.startsWith('data:')) {
      if (cleaned.startsWith('/9j/')) cleaned = 'data:image/jpeg;base64,' + cleaned;
      else if (cleaned.startsWith('iVBOR')) cleaned = 'data:image/png;base64,' + cleaned;
      else if (cleaned.startsWith('UklGR')) cleaned = 'data:image/webp;base64,' + cleaned;
      else cleaned = 'data:image/png;base64,' + cleaned;
    }

    const img = new Image();
    img.onload = () => setResult(cleaned);
    img.onerror = () => setError('❌ Invalid Base64 image data');
    img.src = cleaned;
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    const ext = result.includes('image/png') ? 'png' : result.includes('image/webp') ? 'webp' : 'jpg';
    downloadBlob(blob, `decoded-${Date.now()}.${ext}`);
  };

  return (
    <div>
      <ToolHeader title="Base64 to Image Converter" icon={<Code className="w-4 h-4 text-slate-700" />} onClose={onClose} />
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Paste Base64 string or data URL</label>
          <textarea
            value={base64Input}
            onChange={(e) => setBase64Input(e.target.value)}
            placeholder="Paste your Base64 image data here (with or without data:image/... prefix)"
            className="w-full h-40 p-3 font-mono text-[10px] border rounded-lg bg-slate-50"
          />
        </div>
        {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold">{error}</div>}
        {result && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700">Preview:</p>
            <div className="flex justify-center">
              <img src={result} className="max-h-[300px] rounded-xl border bg-slate-50" />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <PrimaryBtn onClick={handleConvert}><ImageIcon className="w-4 h-4" /> Convert to Image</PrimaryBtn>
          {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download Image</PrimaryBtn>}
          {result && <PrimaryBtn onClick={() => { setBase64Input(''); setResult(''); setError(''); }} variant="ghost">Clear</PrimaryBtn>}
        </div>
      </div>
    </div>
  );
};

// ============================================
// #037 — HEIC TO JPG
// ============================================
export const HeicToJpgTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setBusy(true);
    setError('');
    setResult('');
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality / 100,
      });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const url = URL.createObjectURL(blob);
      setSrc(url);
      setResult(url);
    } catch (e: any) {
      console.error(e);
      setError('❌ Failed to convert HEIC. Make sure the file is a valid HEIC/HEIF image.');
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `heic-converted-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="HEIC to JPG Converter" icon={<ImageIcon className="w-4 h-4 text-blue-600" />} onClose={onClose} />
      {!src ? (
        <>
          <UploadBox onFile={handleFile} label="Upload HEIC/HEIF image from iPhone" accept="image/*,.heic,.heif" />
          {busy && <div className="mt-3 text-center text-xs text-slate-600">Converting HEIC...</div>}
          {error && <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold">{error}</div>}
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">HEIC (Converted)</p>
              <img src={src} className="w-full rounded-xl border" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">JPG Ready</p>
              <img src={result} className="w-full rounded-xl border" />
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Output Quality: {quality}%</label>
            <input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-blue-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download JPG</PrimaryBtn>
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); setError(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
          <p className="text-[10px] text-slate-500">💡 Supports .heic and .heif files from iPhone, iPad, and modern cameras.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// #038 — PNG TO JPG
// ============================================
export const PngToJpgTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [quality, setQuality] = useState(92);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setResult('');
  };

  const convert = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(c, 'image/jpeg', quality / 100);
      const url = URL.createObjectURL(blob);
      setResult(url);
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `png-to-jpg-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="PNG to JPG Converter" icon={<ImageIcon className="w-4 h-4 text-emerald-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload PNG image" accept="image/png,image/*" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original PNG</p><img src={src} className="w-full rounded-xl border bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%),linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">JPG Result</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Convert</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Quality: {quality}%</label>
              <input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-emerald-600" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Background Color (for transparency)</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={convert} disabled={busy}><ImageIcon className="w-4 h-4" /> {busy ? 'Converting...' : 'Convert to JPG'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download JPG</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #039 — WEBP TO JPG
// ============================================
export const WebpToJpgTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setResult('');
  };

  const convert = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(c, 'image/jpeg', quality / 100);
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `webp-to-jpg-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="WebP to JPG Converter" icon={<ImageIcon className="w-4 h-4 text-violet-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload WebP image" accept="image/webp,image/*" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original WebP</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">JPG Result</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Convert</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Quality: {quality}%</label>
            <input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-violet-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={convert} disabled={busy}><ImageIcon className="w-4 h-4" /> {busy ? 'Converting...' : 'Convert to JPG'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download JPG</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #040 — RAW TO JPG (Premium)
// ============================================
export const RawToJpgTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      // Browser natively can't decode RAW, but we can extract embedded JPEG preview
      // Most RAW files have a JPEG preview embedded in the first few KB
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Find JPEG SOI marker (0xFFD8) and EOI marker (0xFFD9)
      let start = -1, end = -1;
      for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
          start = i;
          break;
        }
      }
      if (start >= 0) {
        for (let i = bytes.length - 2; i > start; i--) {
          if (bytes[i] === 0xFF && bytes[i + 1] === 0xD9) {
            end = i + 2;
            break;
          }
        }
      }

      if (start >= 0 && end > start) {
        const jpegBytes = bytes.slice(start, end);
        const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setSrc(url);
        setResult(url);
      } else {
        setError('❌ Could not extract preview from this RAW file. Try a different RAW format (CR2, NEF, ARW, DNG).');
      }
    } catch (e) {
      console.error(e);
      setError('❌ Failed to process RAW file');
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `raw-preview-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="RAW to JPG Converter" icon={<Camera className="w-4 h-4 text-amber-600" />} onClose={onClose} />
      {!src ? (
        <>
          <UploadBox onFile={handleFile} label="Upload RAW file (CR2, NEF, ARW, DNG)" accept=".cr2,.nef,.arw,.dng,.raf,.rw2,.orf,.pef,image/*" />
          {busy && <div className="mt-3 text-center text-xs text-slate-600">Extracting preview...</div>}
          {error && <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold">{error}</div>}
        </>
      ) : (
        <div className="space-y-4">
          <img src={result} className="w-full max-h-[400px] object-contain rounded-xl border bg-slate-50" />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
            ℹ️ Extracted embedded JPEG preview from RAW file. For full RAW processing, use desktop software.
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download JPG</PrimaryBtn>
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); setError(''); }} variant="ghost">New File</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};
