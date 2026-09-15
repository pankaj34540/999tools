import React, { useState, useRef } from 'react';
import { Upload, Download, X, Palette, Square, Circle, Layers, FlipHorizontal, Grid3x3, Sparkles, Play, Copy } from 'lucide-react';

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
    <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP supported</p>
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
// #041 — GIF FRAME EXTRACTOR (Premium)
// ============================================
export const GifFrameExtractorTool: React.FC<ToolProps> = ({ onClose }) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [gifSrc, setGifSrc] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setBusy(true);
    setError('');
    setFrames([]);
    try {
      const gifuct = await import('gifuct-js');
      const buffer = await file.arrayBuffer();
      const gif = gifuct.parseGIF(buffer);
      const frames = gifuct.decompressFrames(gif, true);

      const tempCanvas = document.createElement('canvas');
      const gifWidth = gif.lsd.width;
      const gifHeight = gif.lsd.height;
      tempCanvas.width = gifWidth;
      tempCanvas.height = gifHeight;
      const tempCtx = tempCanvas.getContext('2d')!;

      const patchCanvas = document.createElement('canvas');
      const patchCtx = patchCanvas.getContext('2d')!;

      const resultFrames: string[] = [];
      for (let i = 0; i < Math.min(frames.length, 50); i++) {
        const frame = frames[i];
        patchCanvas.width = frame.dims.width;
        patchCanvas.height = frame.dims.height;
        const imageData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
        imageData.data.set(frame.patch);
        patchCtx.putImageData(imageData, 0, 0);

        tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

        // Save snapshot
        const snapshot = document.createElement('canvas');
        snapshot.width = gifWidth;
        snapshot.height = gifHeight;
        snapshot.getContext('2d')!.drawImage(tempCanvas, 0, 0);
        resultFrames.push(snapshot.toDataURL('image/png'));
      }

      setFrames(resultFrames);
      setGifSrc(URL.createObjectURL(file));
    } catch (e: any) {
      console.error(e);
      setError('❌ Failed to parse GIF. Make sure it is a valid animated GIF file.');
    } finally { setBusy(false); }
  };

  const downloadFrame = async (dataUrl: string, index: number) => {
    const blob = await (await fetch(dataUrl)).blob();
    downloadBlob(blob, `frame-${index + 1}.png`);
  };

  return (
    <div>
      <ToolHeader title="GIF Frame Extractor" icon={<Play className="w-4 h-4 text-pink-600" />} onClose={onClose} />
      {!gifSrc ? (
        <>
          <UploadBox onFile={handleFile} label="Upload animated GIF" accept="image/gif,image/*" />
          {busy && <div className="mt-3 text-center text-xs text-slate-600">Extracting frames...</div>}
          {error && <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold">{error}</div>}
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-700">Original GIF:</p>
            <img src={gifSrc} className="max-h-[200px] rounded-lg border mt-2" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 mb-3">Extracted Frames ({frames.length}):</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-1">
              {frames.map((f, i) => (
                <div key={i} className="relative group">
                  <img src={f} className="w-full rounded-lg border bg-slate-50" />
                  <button
                    onClick={() => downloadFrame(f, i)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg text-white text-xs font-bold"
                  >
                    <Download className="w-4 h-4 mr-1" /> Frame {i + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <PrimaryBtn onClick={() => { setGifSrc(''); setFrames([]); setError(''); }} variant="ghost">New GIF</PrimaryBtn>
        </div>
      )}
    </div>
  );
};

// ============================================
// #042 — IMAGE COLOR PICKER
// ============================================
export const ImageColorPickerTool: React.FC<ToolProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [src, setSrc] = useState('');
  const [pickedColors, setPickedColors] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [copied, setCopied] = useState('');

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src);
    setPickedColors([]);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 800;
      const ratio = Math.min(1, maxW / img.width);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }, 100);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + [data[0], data[1], data[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    setCurrentColor(hex);
    setPickedColors(prev => [hex, ...prev.filter(c => c !== hex)].slice(0, 12));
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(''), 1200);
  };

  const rgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div>
      <ToolHeader title="Image Color Picker" icon={<Palette className="w-4 h-4 text-pink-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload image to pick colors" /> : (
        <div className="space-y-4">
          <div className="relative inline-block w-full">
            <canvas
              ref={canvasRef}
              onClick={handleClick}
              className="w-full rounded-xl border cursor-crosshair max-h-[500px] object-contain bg-slate-50"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border-2 border-slate-300" style={{ background: currentColor }} />
              <div>
                <p className="text-xs font-bold text-slate-700">Current: <span className="font-mono">{currentColor}</span></p>
                <p className="text-xs text-slate-500 font-mono">{rgb(currentColor)}</p>
                <button onClick={() => copyColor(currentColor)} className="text-[10px] font-bold text-blue-600 mt-1 hover:underline">
                  {copied === currentColor ? '✓ Copied!' : 'Copy HEX'}
                </button>
              </div>
            </div>
            {pickedColors.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Recent Colors:</p>
                <div className="flex flex-wrap gap-2">
                  {pickedColors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => copyColor(c)}
                      className="w-10 h-10 rounded-lg border-2 border-slate-300 hover:scale-110 transition"
                      style={{ background: c }}
                      title={`${c} — click to copy`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <PrimaryBtn onClick={() => { setSrc(''); setPickedColors([]); }} variant="ghost">New Image</PrimaryBtn>
          <p className="text-[10px] text-slate-500">💡 Click anywhere on the image to pick that color.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// #043 — IMAGE BORDER ADDER
// ============================================
export const ImageBorderAdderTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [borderWidth, setBorderWidth] = useState(20);
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed' | 'double'>('solid');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const w = img.width + borderWidth * 2;
      const h = img.height + borderWidth * 2;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;

      ctx.fillStyle = borderColor;
      if (borderStyle === 'solid') {
        ctx.fillRect(0, 0, w, h);
      } else if (borderStyle === 'dashed') {
        const dashLen = borderWidth;
        for (let i = 0; i < w; i += dashLen * 2) ctx.fillRect(i, 0, dashLen, borderWidth);
        for (let i = 0; i < w; i += dashLen * 2) ctx.fillRect(i, h - borderWidth, dashLen, borderWidth);
        for (let i = 0; i < h; i += dashLen * 2) ctx.fillRect(0, i, borderWidth, dashLen);
        for (let i = 0; i < h; i += dashLen * 2) ctx.fillRect(w - borderWidth, i, borderWidth, dashLen);
      } else {
        // double
        const half = Math.floor(borderWidth / 3);
        ctx.fillRect(0, 0, w, borderWidth);
        ctx.fillRect(0, 0, borderWidth, h);
        ctx.fillRect(w - borderWidth, 0, borderWidth, h);
        ctx.fillRect(0, h - borderWidth, w, borderWidth);
        // Inner gap
        ctx.clearRect(borderWidth, borderWidth, w - borderWidth * 2, h - borderWidth * 2);
        ctx.fillStyle = borderColor;
        ctx.fillRect(borderWidth, borderWidth, w - borderWidth * 2, half);
        ctx.fillRect(borderWidth, h - borderWidth - half, w - borderWidth * 2, half);
        ctx.fillRect(borderWidth, borderWidth, half, h - borderWidth * 2);
        ctx.fillRect(w - borderWidth - half, borderWidth, half, h - borderWidth * 2);
        ctx.clearRect(borderWidth + half, borderWidth + half, w - borderWidth * 2 - half * 2, h - borderWidth * 2 - half * 2);
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, w, borderWidth);
        ctx.fillRect(0, 0, borderWidth, h);
        ctx.fillRect(w - borderWidth, 0, borderWidth, h);
        ctx.fillRect(0, h - borderWidth, w, borderWidth);
      }

      ctx.drawImage(img, borderWidth, borderWidth);
      const blob = await canvasToBlob(c, 'image/png');
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `bordered-${Date.now()}.png`);
  };

  return (
    <div>
      <ToolHeader title="Image Border Adder" icon={<Square className="w-4 h-4 text-slate-700" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">With Border</p>
              {result ? <img src={result} className="w-full rounded-xl border bg-slate-50" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Border Width: {borderWidth}px</label>
              <input type="range" min={2} max={100} value={borderWidth} onChange={(e) => setBorderWidth(+e.target.value)} className="w-full accent-slate-700" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Border Color</label>
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Border Style</label>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'double'] as const).map(s => (
                  <button key={s} onClick={() => setBorderStyle(s)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${borderStyle === s ? 'bg-slate-900 text-white' : 'bg-white border'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Square className="w-4 h-4" /> Apply Border</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #044 — IMAGE ROUNDED CORNERS
// ============================================
export const ImageRoundedCornersTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [radius, setRadius] = useState(40);
  const [bgColor, setBgColor] = useState('#ffffff');
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
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, c.width, c.height);

      const r = Math.min(radius, Math.min(img.width, img.height) / 2);
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(c.width - r, 0);
      ctx.quadraticCurveTo(c.width, 0, c.width, r);
      ctx.lineTo(c.width, c.height - r);
      ctx.quadraticCurveTo(c.width, c.height, c.width - r, c.height);
      ctx.lineTo(r, c.height);
      ctx.quadraticCurveTo(0, c.height, 0, c.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);

      const blob = await canvasToBlob(c, 'image/png');
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `rounded-${Date.now()}.png`);
  };

  return (
    <div>
      <ToolHeader title="Image Rounded Corners" icon={<Circle className="w-4 h-4 text-teal-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Rounded</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Corner Radius: {radius}px</label>
              <input type="range" min={0} max={200} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-teal-600" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Background Color (for transparent PNGs)</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Circle className="w-4 h-4" /> Round Corners</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #045 — IMAGE SHADOW EFFECT
// ============================================
export const ImageShadowEffectTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [offsetX, setOffsetX] = useState(15);
  const [offsetY, setOffsetY] = useState(15);
  const [blur, setBlur] = useState(20);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const padding = Math.max(Math.abs(offsetX), Math.abs(offsetY)) + blur + 20;
      const w = img.width + padding * 2;
      const h = img.height + padding * 2;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      ctx.shadowColor = shadowColor;
      ctx.shadowOffsetX = offsetX;
      ctx.shadowOffsetY = offsetY;
      ctx.shadowBlur = blur;
      ctx.drawImage(img, padding, padding);

      const blob = await canvasToBlob(c, 'image/png');
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `shadow-${Date.now()}.png`);
  };

  return (
    <div>
      <ToolHeader title="Image Shadow Effect" icon={<Layers className="w-4 h-4 text-violet-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Shadow</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Offset X: {offsetX}</label>
                <input type="range" min={-50} max={50} value={offsetX} onChange={(e) => setOffsetX(+e.target.value)} className="w-full accent-violet-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Offset Y: {offsetY}</label>
                <input type="range" min={-50} max={50} value={offsetY} onChange={(e) => setOffsetY(+e.target.value)} className="w-full accent-violet-600" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Blur: {blur}px</label>
              <input type="range" min={0} max={100} value={blur} onChange={(e) => setBlur(+e.target.value)} className="w-full accent-violet-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Shadow Color</label>
                <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Background</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Layers className="w-4 h-4" /> Add Shadow</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #046 — IMAGE REFLECTION EFFECT
// ============================================
export const ImageReflectionTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [opacity, setOpacity] = useState(40);
  const [gap, setGap] = useState(10);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const reflectionHeight = img.height;
      const w = img.width;
      const h = img.height + gap + reflectionHeight;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // Draw original
      ctx.drawImage(img, 0, 0);

      // Draw flipped reflection
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.translate(0, img.height + gap + reflectionHeight);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // Gradient fade on reflection
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const grad = ctx.createLinearGradient(0, img.height + gap, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, img.height + gap, w, reflectionHeight);
      ctx.restore();

      const blob = await canvasToBlob(c, 'image/png');
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `reflection-${Date.now()}.png`);
  };

  return (
    <div>
      <ToolHeader title="Image Reflection Effect" icon={<FlipHorizontal className="w-4 h-4 text-cyan-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reflection</p>
              {result ? <img src={result} className="w-full rounded-xl border" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reflection Opacity: {opacity}%</label>
              <input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-cyan-600" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Gap: {gap}px</label>
              <input type="range" min={0} max={50} value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-cyan-600" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Background Color</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-8 rounded border cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><FlipHorizontal className="w-4 h-4" /> Add Reflection</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #047 — IMAGE PIXELATE TOOL
// ============================================
export const ImagePixelateTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [pixelSize, setPixelSize] = useState(12);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    const img = await loadImageFromFile(file);
    setSrc(img.src); setResult('');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const img = await loadImageFromSrc(src);
      const smallW = Math.max(1, Math.floor(img.width / pixelSize));
      const smallH = Math.max(1, Math.floor(img.height / pixelSize));

      const temp = document.createElement('canvas');
      temp.width = smallW; temp.height = smallH;
      const tctx = temp.getContext('2d')!;
      tctx.drawImage(img, 0, 0, smallW, smallH);

      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(temp, 0, 0, smallW, smallH, 0, 0, c.width, c.height);

      const blob = await canvasToBlob(c, 'image/png');
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `pixelated-${Date.now()}.png`);
  };

  return (
    <div>
      <ToolHeader title="Image Pixelate Tool" icon={<Grid3x3 className="w-4 h-4 text-slate-700" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pixelated</p>
              {result ? <img src={result} className="w-full rounded-xl border bg-slate-50" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Pixel Size: {pixelSize}px</label>
            <input type="range" min={2} max={60} value={pixelSize} onChange={(e) => setPixelSize(+e.target.value)} className="w-full accent-slate-700" />
            <p className="text-[10px] text-slate-500 mt-1">Higher = more pixelated</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Grid3x3 className="w-4 h-4" /> Pixelate</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #048 — IMAGE NOISE ADDER
// ============================================
export const ImageNoiseAdderTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [intensity, setIntensity] = useState(40);
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
      const strength = intensity * 2.55;

      for (let i = 0; i < d.length; i += 4) {
        const noise = (Math.random() - 0.5) * strength;
        d[i] = Math.max(0, Math.min(255, d[i] + noise));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);
      const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `noise-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Image Noise Adder" icon={<Sparkles className="w-4 h-4 text-amber-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">With Noise</p>
              {result ? <img src={result} className="w-full rounded-xl border bg-slate-50" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Preview</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Noise Intensity: {intensity}%</label>
            <input type="range" min={5} max={100} value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-amber-600" />
            <p className="text-[10px] text-slate-500 mt-1">Film grain effect — great for retro/vintage look</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Sparkles className="w-4 h-4" /> Add Noise</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #049 — IMAGE NOISE REMOVER (Premium)
// ============================================
export const ImageNoiseRemoverTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [strength, setStrength] = useState(3);
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

      // Median filter (window size = strength)
      const w = c.width, h = c.height;
      const src2 = new Uint8ClampedArray(d);
      const half = Math.floor(strength / 2);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          for (let ch = 0; ch < 3; ch++) {
            const values: number[] = [];
            for (let dy = -half; dy <= half; dy++) {
              for (let dx = -half; dx <= half; dx++) {
                const ny = Math.max(0, Math.min(h - 1, y + dy));
                const nx = Math.max(0, Math.min(w - 1, x + dx));
                values.push(src2[(ny * w + nx) * 4 + ch]);
              }
            }
            values.sort((a, b) => a - b);
            d[idx + ch] = values[Math.floor(values.length / 2)];
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `denoised-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Image Noise Remover" icon={<Sparkles className="w-4 h-4 text-emerald-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload noisy photo (low-light, high ISO)" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Noisy Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Denoised</p>
              {result ? <img src={result} className="w-full rounded-xl border bg-slate-50" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Denoise</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-700 block mb-1">Filter Strength: {strength}×{strength}</label>
            <input type="range" min={3} max={9} step={2} value={strength} onChange={(e) => setStrength(+e.target.value)} className="w-full accent-emerald-600" />
            <p className="text-[10px] text-slate-500 mt-1">💡 Higher = smoother but slower. Processing may take 5-15 sec for large images.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Sparkles className="w-4 h-4" /> {busy ? 'Processing...' : 'Remove Noise'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// #050 — IMAGE CARTOONIZER (Premium)
// ============================================
export const ImageCartoonizerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [levels, setLevels] = useState(6);
  const [edgeIntensity, setEdgeIntensity] = useState(30);
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
      const step = Math.floor(255 / levels);

      // Posterize + boost saturation
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Posterize
        const pr = Math.round(r / step) * step;
        const pg = Math.round(g / step) * step;
        const pb = Math.round(b / step) * step;
        // Boost saturation
        const gray = 0.299 * pr + 0.587 * pg + 0.114 * pb;
        d[i] = Math.max(0, Math.min(255, gray + (pr - gray) * 1.4));
        d[i + 1] = Math.max(0, Math.min(255, gray + (pg - gray) * 1.4));
        d[i + 2] = Math.max(0, Math.min(255, gray + (pb - gray) * 1.4));
      }

      // Simple edge detection (Sobel-ish)
      const w = c.width, h = c.height;
      const src2 = new Uint8ClampedArray(d);
      const edgeThreshold = (100 - edgeIntensity) * 2;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          let gxR = 0, gyR = 0;
          // Rough gradient
          const tl = src2[((y - 1) * w + (x - 1)) * 4];
          const tc = src2[((y - 1) * w + x) * 4];
          const tr = src2[((y - 1) * w + (x + 1)) * 4];
          const ml = src2[(y * w + (x - 1)) * 4];
          const mr = src2[(y * w + (x + 1)) * 4];
          const bl = src2[((y + 1) * w + (x - 1)) * 4];
          const bc = src2[((y + 1) * w + x) * 4];
          const br = src2[((y + 1) * w + (x + 1)) * 4];

          gxR = -tl - 2 * ml - bl + tr + 2 * mr + br;
          gyR = -tl - 2 * tc - tr + bl + 2 * bc + br;
          const mag = Math.sqrt(gxR * gxR + gyR * gyR);

          if (mag > edgeThreshold) {
            d[idx] = 0;
            d[idx + 1] = 0;
            d[idx + 2] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
      setResult(URL.createObjectURL(blob));
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    const blob = await (await fetch(result)).blob();
    downloadBlob(blob, `cartoon-${Date.now()}.jpg`);
  };

  return (
    <div>
      <ToolHeader title="Image Cartoonizer" icon={<Palette className="w-4 h-4 text-pink-600" />} onClose={onClose} />
      {!src ? <UploadBox onFile={handleFile} label="Upload photo to convert into cartoon" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Original</p><img src={src} className="w-full rounded-xl border bg-slate-50" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cartoon</p>
              {result ? <img src={result} className="w-full rounded-xl border bg-slate-50" /> : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Click Cartoonize</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Color Levels: {levels}</label>
              <input type="range" min={3} max={10} value={levels} onChange={(e) => setLevels(+e.target.value)} className="w-full accent-pink-600" />
              <p className="text-[10px] text-slate-500 mt-0.5">Lower = more cartoon-like, flat colors</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Edge Intensity: {edgeIntensity}%</label>
              <input type="range" min={10} max={90} value={edgeIntensity} onChange={(e) => setEdgeIntensity(+e.target.value)} className="w-full accent-pink-600" />
              <p className="text-[10px] text-slate-500 mt-0.5">Higher = more black outlines</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={apply} disabled={busy}><Palette className="w-4 h-4" /> {busy ? 'Processing...' : 'Cartoonize'}</PrimaryBtn>
            {result && <PrimaryBtn onClick={download} variant="success"><Download className="w-4 h-4" /> Download</PrimaryBtn>}
            <PrimaryBtn onClick={() => { setSrc(''); setResult(''); }} variant="ghost">New Image</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};
