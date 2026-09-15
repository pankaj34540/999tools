import React, { useState } from 'react';
import { 
  Upload, Download, X, Sparkles, Palette, RefreshCw, Droplets, 
  Coffee, Camera, Stamp, Type, Eraser, History 
} from 'lucide-react';

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

interface ToolProps { onClose: () => void; }

// ============================================
// SHARED UI
// ============================================
const ToolHeader: React.FC<{ title: string; onClose: () => void; icon?: React.ReactNode }> = ({ title, onClose, icon }) => (
  <div className="flex items-center justify-between border-b pb-3 mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-base font-black text-slate-900">{title}</h3>
    </div>
    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
      <X className="w-5 h-5" />
    </button>
  </div>
);

const UploadBox: React.FC<{ onFile: (f: File) => void; multiple?: boolean; label?: string }> = ({ onFile, multiple, label }) => (
  <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition">
    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
    <p className="text-sm font-bold text-slate-700">{label || 'Click to upload image'}</p>
    <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP supported</p>
    <input
      type="file"
      accept="image/*"
      multiple={multiple}
      className="hidden"
      onChange={(e) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(f => onFile(f));
      }}
    />
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
    return (
      <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
        {children}
      </button>
    );
  };

// ============================================
// #021 — BACKGROUND REMOVER
// ============================================
export const ImageBackgroundRemoverTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [tolerance, setTolerance] = useState(40);
  const [outputBg, setOutputBg] = useState<'transparent' | 'white'>('white');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;

      const corners = [
        0,
        (c.width - 1) * 4,
        ((c.height - 1) * c.width) * 4,
        ((c.height - 1) * c.width + (c.width - 1)) * 4,
      ];
      let rSum = 0, gSum = 0, bSum = 0;
      for (const off of corners) {
        rSum += d[off]; gSum += d[off + 1]; bSum += d[off + 2];
      }
      const bgR = rSum / 4, bgG = gSum / 4, bgB = bSum / 4;

      const t = tolerance * tolerance * 3;
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - bgR, dg = d[i + 1] - bgG, db = d[i + 2] - bgB;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < t) {
          if (outputBg === 'transparent') {
            d[i + 3] = 0;
          } else {
            d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255;
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL(outputBg === 'transparent' ? 'image/png' : 'image/jpeg', 0.95));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `bg-removed-${Date.now()}.${outputBg === 'transparent' ? 'png' : 'jpg'}`);
  };

  return (
    <div>
      <ToolHeader title="Background Remover (Smart)" icon={<Eraser className="w-4 h-4 text-purple-600" />} onClose={onClose} />
      {!src ? (
        <UploadBox onFile={handleFile} label="Upload photo or signature to remove background" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p>
              <img src={src} className="w-full rounded-xl border" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Result</p>
              {result ? (
                <div className={outputBg === 'transparent' ? 'bg-[linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%),linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] rounded-xl border overflow-hidden' : ''}>
                  <img src={result} className="w-full" />
                </div>
              ) : (
                <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Preview will appear here
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tolerance: {tolerance}</label>
              <input type="range" min={10} max={120} value={tolerance} onChange={(e) => setTolerance(+e.target.value)} className="w-full accent-blue-600" />
              <p className="text-[10px] text-slate-500 mt-0.5">Higher = removes more color range</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Output Background</label>
              <div className="flex gap-2">
                <button onClick={() => setOutputBg('white')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${outputBg === 'white' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>White</button>
                <button onClick={() => setOutputBg('transparent')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${outputBg === 'transparent' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Transparent (PNG)</button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}>
              <Sparkles className="w-4 h-4" /> {busy ? 'Processing...' : 'Remove Background'}
            </PrimaryBtn>
            {result && (
              <PrimaryBtn onClick={download} variant="success">
                <Download className="w-4 h-4" /> Download
              </PrimaryBtn>
            )}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
          <p className="text-[10px] text-slate-500">💡 Best for ID photos, signatures, and photos with solid white/blue backgrounds.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// #022 — PHOTO AUTO ENHANCER
// ============================================
export const PhotoAutoEnhancerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [strength, setStrength] = useState(70);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;

      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);
      for (let i = 0; i < d.length; i += 4) {
        histR[d[i]]++; histG[d[i + 1]]++; histB[d[i + 2]]++;
      }
      const findPct = (hist: number[], pct: number) => {
        const total = hist.reduce((a, b) => a + b, 0);
        const target = total * pct;
        let cum = 0;
        for (let i = 0; i < 256; i++) {
          cum += hist[i];
          if (cum >= target) return i;
        }
        return 255;
      };
      const loR = findPct(histR, 0.01), hiR = findPct(histR, 0.99);
      const loG = findPct(histG, 0.01), hiG = findPct(histG, 0.99);
      const loB = findPct(histB, 0.01), hiB = findPct(histB, 0.99);
      const k = strength / 100;

      for (let i = 0; i < d.length; i += 4) {
        const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2];
        const r1 = hiR > loR ? ((r0 - loR) / (hiR - loR)) * 255 : r0;
        const g1 = hiG > loG ? ((g0 - loG) / (hiG - loG)) * 255 : g0;
        const b1 = hiB > loB ? ((b0 - loB) / (hiB - loB)) * 255 : b0;
        d[i] = Math.max(0, Math.min(255, r0 * (1 - k) + r1 * k));
        d[i + 1] = Math.max(0, Math.min(255, g0 * (1 - k) + g1 * k));
        d[i + 2] = Math.max(0, Math.min(255, b0 * (1 - k) + b1 * k));
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `enhanced-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Photo Auto Enhancer (Smart)" icon={<Sparkles className="w-4 h-4 text-amber-600" />} onClose={onClose} />
      {!src ? (
        <UploadBox onFile={handleFile} label="Upload dull photo to auto-enhance" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p>
              <img src={src} className="w-full rounded-xl border" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Enhanced</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : (
                <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Enhance</div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Strength: {strength}%</label>
            <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(+e.target.value)} className="w-full accent-blue-600" />
          </div>

          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}>
              <Sparkles className="w-4 h-4" /> {busy ? 'Enhancing...' : 'Auto Enhance'}
            </PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #023 — OLD PHOTO RESTORER
// ============================================
export const OldPhotoRestorerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [strength, setStrength] = useState(60);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      const k = strength / 100;

      const w = c.width, h = c.height;
      const copy = new Uint8ClampedArray(d);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let ch = 0; ch < 3; ch++) {
            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                sum += copy[((y + dy) * w + (x + dx)) * 4 + ch];
              }
            }
            d[idx + ch] = sum / 9;
          }
        }
      }

      for (let i = 0; i < d.length; i += 4) {
        for (let ch = 0; ch < 3; ch++) {
          let v = d[i + ch];
          v = ((v - 128) * (1 + k * 0.3)) + 128;
          d[i + ch] = Math.max(0, Math.min(255, v));
        }
        d[i] = Math.min(255, d[i] + k * 8);
        d[i + 2] = Math.max(0, d[i + 2] - k * 6);
      }

      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `restored-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Old Photo Restorer" icon={<History className="w-4 h-4 text-amber-700" />} onClose={onClose} />
      {!src ? (
        <UploadBox onFile={handleFile} label="Upload old or faded photo" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Before</p>
              <img src={src} className="w-full rounded-xl border" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">After</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : (
                <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Restore</div>
              )}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Restoration Strength: {strength}%</label>
            <input type="range" min={20} max={100} value={strength} onChange={(e) => setStrength(+e.target.value)} className="w-full accent-amber-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Sparkles className="w-4 h-4" /> {busy ? 'Restoring...' : 'Restore Photo'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #024 — BACKGROUND COLORIZER
// ============================================
export const PhotoBackgroundColorizerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(45);
  const [busy, setBusy] = useState(false);

  const PRESETS = ['#ffffff', '#dbeafe', '#bfdbfe', '#fecaca', '#fef3c7', '#e5e7eb'];

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setResult('');
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      const corners = [0, (c.width - 1) * 4, ((c.height - 1) * c.width) * 4, ((c.height - 1) * c.width + (c.width - 1)) * 4];
      let rS = 0, gS = 0, bS = 0;
      for (const o of corners) { rS += d[o]; gS += d[o + 1]; bS += d[o + 2]; }
      const bgR = rS / 4, bgG = gS / 4, bgB = bS / 4;
      const target = hexToRgb(bgColor);
      const t = tolerance * tolerance * 3;
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - bgR, dg = d[i + 1] - bgG, db = d[i + 2] - bgB;
        if (dr * dr + dg * dg + db * db < t) {
          d[i] = target.r; d[i + 1] = target.g; d[i + 2] = target.b;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `bg-color-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Background Colorizer" icon={<Palette className="w-4 h-4 text-pink-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload ID/passport photo" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Result</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Apply</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Choose Background Color</label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESETS.map(c => (
                  <button key={c} onClick={() => setBgColor(c)} className={`w-9 h-9 rounded-lg border-2 ${bgColor === c ? 'border-blue-600 scale-110' : 'border-slate-300'}`} style={{ background: c }} />
                ))}
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-2 border-slate-300" />
                <span className="text-xs font-mono text-slate-600 ml-1">{bgColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tolerance: {tolerance}</label>
              <input type="range" min={10} max={120} value={tolerance} onChange={(e) => setTolerance(+e.target.value)} className="w-full accent-pink-600" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Palette className="w-4 h-4" /> {busy ? 'Working...' : 'Apply Color'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #025 — COLOR INVERTER (NEGATIVE)
// ============================================
export const PhotoColorInverterTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/png'));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `negative-${Date.now()}.png`);
  };

  return (
    <div>
      <ToolHeader title="Photo Color Inverter (Negative)" icon={<RefreshCw className="w-4 h-4 text-indigo-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Negative</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Invert</div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><RefreshCw className="w-4 h-4" /> {busy ? 'Inverting...' : 'Invert Colors'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #026 — SATURATION BOOSTER
// ============================================
export const PhotoSaturationBoosterTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [sat, setSat] = useState(150);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      const k = sat / 100;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        d[i] = Math.max(0, Math.min(255, gray + (r - gray) * k));
        d[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * k));
        d[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * k));
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `saturated-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Photo Saturation Booster" icon={<Droplets className="w-4 h-4 text-cyan-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Result</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Saturation: {sat}% {sat < 100 ? '(reduced)' : sat > 100 ? '(boosted)' : '(original)'}</label>
            <input type="range" min={0} max={300} value={sat} onChange={(e) => setSat(+e.target.value)} className="w-full accent-cyan-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Droplets className="w-4 h-4" /> Apply</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #027 — SEPIA EFFECT
// ============================================
export const PhotoSepiaTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [intensity, setIntensity] = useState(80);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      const k = intensity / 100;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        d[i] = Math.min(255, r * (1 - k) + sr * k);
        d[i + 1] = Math.min(255, g * (1 - k) + sg * k);
        d[i + 2] = Math.min(255, b * (1 - k) + sb * k);
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `sepia-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Photo Sepia Effect" icon={<Coffee className="w-4 h-4 text-amber-700" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sepia</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Intensity: {intensity}%</label>
            <input type="range" min={0} max={100} value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-amber-700" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Coffee className="w-4 h-4" /> Apply Sepia</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #028 — VINTAGE FILTER
// ============================================
export const PhotoVintageTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [intensity, setIntensity] = useState(70);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      const k = intensity / 100;
      const cx = c.width / 2, cy = c.height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const nr = Math.min(255, r * 1.08 + 15);
        const ng = Math.min(255, g * 1.02 + 5);
        const nb = Math.max(0, b * 0.92 - 5);
        const fr = nr * 0.9 + 25;
        const fg = ng * 0.9 + 25;
        const fb = nb * 0.9 + 25;

        const px = (i / 4) % c.width;
        const py = Math.floor((i / 4) / c.width);
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / maxDist;
        const vig = Math.max(0.5, 1 - dist * 0.6);

        d[i] = Math.min(255, r * (1 - k) + fr * vig * k);
        d[i + 1] = Math.min(255, g * (1 - k) + fg * vig * k);
        d[i + 2] = Math.min(255, b * (1 - k) + fb * vig * k);
      }
      ctx.putImageData(imageData, 0, 0);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `vintage-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Photo Vintage Filter" icon={<Camera className="w-4 h-4 text-orange-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Vintage</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Intensity: {intensity}%</label>
            <input type="range" min={0} max={100} value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-orange-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Camera className="w-4 h-4" /> Apply Vintage</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #029 — WATERMARK ADDER
// ============================================
export const PhotoWatermarkTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [text, setText] = useState('© 999tools.store');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(60);
  const [position, setPosition] = useState<'tl' | 'tr' | 'bl' | 'br' | 'center' | 'tile'>('br');
  const [color, setColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';

      const padding = 20;
      const metrics = ctx.measureText(text);
      const tw = metrics.width;

      if (position === 'tile') {
        ctx.save();
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.translate(-c.width / 2, -c.height / 2);
        for (let y = -c.height; y < c.height * 2; y += fontSize * 3) {
          for (let x = -c.width; x < c.width * 2; x += tw + 80) {
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore();
      } else {
        let x = padding, y = padding + fontSize / 2;
        if (position === 'tr') { x = c.width - tw - padding; }
        else if (position === 'bl') { y = c.height - padding - fontSize / 2; }
        else if (position === 'br') { x = c.width - tw - padding; y = c.height - padding - fontSize / 2; }
        else if (position === 'center') { x = (c.width - tw) / 2; y = c.height / 2; }
        ctx.fillText(text, x, y);
      }
      ctx.globalAlpha = 1;
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `watermarked-${Date.now()}.jpg`);
  };

  const POSITIONS: { id: typeof position; label: string }[] = [
    { id: 'tl', label: 'Top-Left' },
    { id: 'tr', label: 'Top-Right' },
    { id: 'bl', label: 'Bottom-Left' },
    { id: 'br', label: 'Bottom-Right' },
    { id: 'center', label: 'Center' },
    { id: 'tile', label: 'Tile Pattern' },
  ];

  return (
    <div>
      <ToolHeader title="Photo Watermark Adder" icon={<Stamp className="w-4 h-4 text-slate-700" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Watermarked</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Watermark Text</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Font Size: {fontSize}px</label>
                <input type="range" min={16} max={150} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-slate-700" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Opacity: {opacity}%</label>
                <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-slate-700" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map(p => (
                  <button key={p.id} onClick={() => setPosition(p.id)} className={`py-2 rounded-lg text-[10px] font-bold ${position === p.id ? 'bg-slate-900 text-white' : 'bg-white border'}`}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Stamp className="w-4 h-4" /> Add Watermark</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #030 — TEXT OVERLAY
// ============================================
export const PhotoTextOverlayTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [text, setText] = useState('Hello 999tools!');
  const [fontSize, setFontSize] = useState(72);
  const [color, setColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [position, setPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [bold, setBold] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      ctx.font = `${bold ? 'bold ' : ''}${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = color;

      const cx = c.width / 2;
      let cy = c.height - fontSize - 30;
      if (position === 'top') cy = fontSize + 30;
      else if (position === 'center') cy = c.height / 2;

      if (strokeWidth > 0) ctx.strokeText(text, cx, cy);
      ctx.fillText(text, cx, cy);
      setResult(c.toDataURL('image/jpeg', 0.95));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `text-overlay-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Photo Text Overlay" icon={<Type className="w-4 h-4 text-violet-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">With Text</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text..." className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-700 block mb-1">Size: {fontSize}px</label>
                <input type="range" min={16} max={200} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-violet-600" /></div>
              <div><label className="text-xs font-bold text-slate-700 block mb-1">Stroke: {strokeWidth}px</label>
                <input type="range" min={0} max={12} value={strokeWidth} onChange={(e) => setStrokeWidth(+e.target.value)} className="w-full accent-violet-600" /></div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div><label className="text-xs font-bold text-slate-700 block mb-1">Text Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" /></div>
              <div><label className="text-xs font-bold text-slate-700 block mb-1">Stroke Color</label>
                <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" /></div>
              <label className="flex items-center gap-2 mt-5">
                <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} className="accent-violet-600" />
                <span className="text-xs font-bold text-slate-700">Bold</span>
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {(['top', 'center', 'bottom'] as const).map(p => (
                  <button key={p} onClick={() => setPosition(p)} className={`py-2 rounded-lg text-xs font-bold capitalize ${position === p ? 'bg-violet-600 text-white' : 'bg-white border'}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Type className="w-4 h-4" /> Apply Text</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};
