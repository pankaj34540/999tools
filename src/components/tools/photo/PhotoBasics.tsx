import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Download, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Sun, Contrast, Droplet, Sparkles, Circle, Loader2, Check,
  Image as ImageIcon, ZoomIn, Crop, Sliders
} from 'lucide-react';

// ============================================
// SHARED UTILITIES
// ============================================
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string, format: string = 'image/png', quality: number = 0.92) => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, format, quality);
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

interface ToolProps {
  onClose: () => void;
}

// ============================================
// 🆕 FULL-SCREEN TOOL WRAPPER
// ============================================
const ToolWrapper: React.FC<{ title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }> = ({ title, icon, onClose, children }) => {
  // Esc key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-3">
      <div className="bg-white rounded-2xl w-full h-[97vh] max-w-[99vw] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              {icon}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">Full-Screen Workspace • Press ESC to close</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center shadow-sm hover:shadow-md transition"
            title="Close Tool (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TOOL 1: Image Format Converter
// ============================================
export const ImageFormatConverterTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [originalSize, setOriginalSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalSize(file.size);
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0);
  }, [image, format]);

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    downloadCanvas(canvasRef.current, `converted.${ext}`, format, quality / 100);
  };

  return (
    <ToolWrapper title="Image Format Converter" icon={<ImageIcon className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Click to upload image</p>
          <p className="text-sm text-slate-500 mt-2">JPG, PNG, WebP supported</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 h-full">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">Convert To:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image/jpeg', label: 'JPG' },
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/webp', label: 'WebP' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`p-4 rounded-xl border-2 font-bold text-sm transition ${
                      format === f.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {(format === 'image/jpeg' || format === 'image/webp') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Quality: <span className="text-blue-600 font-mono">{quality}%</span>
                </label>
                <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-blue-600" />
              </div>
            )}

            {originalSize > 0 && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Original:</span>
                    <span className="font-mono font-bold">{formatBytes(originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-mono font-bold">{image.width} × {image.height} px</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition">
                Change Image
              </button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 2: Target KB Compressor (PREMIUM)
// ============================================
export const ImageCompressorTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [targetKB, setTargetKB] = useState(50);
  const [quality, setQuality] = useState(92);
  const [currentSize, setCurrentSize] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalSize(file.size);
    const img = await loadImage(file);
    setImage(img);
  };

  const compressToTarget = async () => {
    if (!image) return;
    setCompressing(true);

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    let low = 10, high = 100, best = null;
    const targetBytes = targetKB * 1024;

    for (let i = 0; i < 8; i++) {
      const mid = Math.floor((low + high) / 2);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', mid / 100));
      if (!blob) break;

      if (blob.size <= targetBytes) {
        best = { quality: mid, size: blob.size };
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (best) {
      setQuality(best.quality);
      setCurrentSize(best.size);
      if (canvasRef.current) {
        canvasRef.current.width = image.width;
        canvasRef.current.height = image.height;
        const c = canvasRef.current.getContext('2d')!;
        c.fillStyle = '#FFFFFF';
        c.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        c.drawImage(image, 0, 0);
      }
    } else {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.1));
      if (blob) {
        setQuality(10);
        setCurrentSize(blob.size);
      }
    }
    setCompressing(false);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
  }, [image]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `compressed_${targetKB}KB.jpg`, 'image/jpeg', quality / 100);
  };

  return (
    <ToolWrapper title="Target KB Compressor" icon={<Sparkles className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to compress</p>
          <p className="text-sm text-slate-500 mt-2">Compress to exact KB for govt forms</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <label className="block text-sm font-bold text-amber-900 mb-3">Target File Size (KB)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={targetKB}
                  onChange={(e) => setTargetKB(parseInt(e.target.value) || 50)}
                  min="5"
                  max="2000"
                  className="flex-1 px-4 py-3 border border-amber-300 rounded-xl text-2xl font-black font-mono text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={compressToTarget}
                  disabled={compressing}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center gap-2"
                >
                  {compressing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {compressing ? 'Working' : 'Compress'}
                </button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {[20, 30, 50, 100, 200, 500].map((kb) => (
                  <button key={kb} onClick={() => setTargetKB(kb)} className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100">
                    {kb} KB
                  </button>
                ))}
              </div>
            </div>

            {originalSize > 0 && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Original:</span><span className="font-mono font-bold">{formatBytes(originalSize)}</span></div>
                {currentSize > 0 && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Compressed:</span><span className="font-mono font-bold text-emerald-700">{formatBytes(currentSize)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Saved:</span><span className="font-mono font-bold text-emerald-600">{Math.round((1 - currentSize / originalSize) * 100)}%</span></div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setImage(null); setCurrentSize(0); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} disabled={!currentSize} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 3: Image Resizer
// ============================================
export const ImageResizeTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
    setWidth(img.width);
    setHeight(img.height);
  };

  const handleWidthChange = (w: number) => {
    if (!image) return;
    setWidth(w);
    if (lockAspect) setHeight(Math.round((w / image.width) * image.height));
  };

  const handleHeightChange = (h: number) => {
    if (!image) return;
    setHeight(h);
    if (lockAspect) setWidth(Math.round((h / image.height) * image.width));
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
  }, [image, width, height]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `resized_${width}x${height}.png`);
  };

  return (
    <ToolWrapper title="Image Resizer" icon={<ZoomIn className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to resize</p>
          <p className="text-sm text-slate-500 mt-2">Custom dimensions with quick presets</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Width (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-xs font-bold text-slate-700">🔒 Lock Aspect Ratio</span>
              </label>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-700 mb-2.5">Quick Presets:</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Instagram Post', w: 1080, h: 1080 },
                  { label: 'Facebook Post', w: 1200, h: 630 },
                  { label: 'YouTube Thumb', w: 1280, h: 720 },
                  { label: 'WhatsApp DP', w: 500, h: 500 },
                  { label: 'Passport (India)', w: 413, h: 531 },
                  { label: 'A4 @ 300 DPI', w: 2480, h: 3508 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setWidth(p.w); setHeight(p.h); }}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold text-slate-700 hover:text-blue-700 transition text-left"
                  >
                    {p.label}<br /><span className="font-mono text-[9px] text-slate-500">{p.w}×{p.h}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 4: Photo Rotator
// ============================================
export const PhotoRotatorTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [angle, setAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
    setAngle(0);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const rad = (angle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    canvas.width = image.width * cos + image.height * sin;
    canvas.height = image.width * sin + image.height * cos;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
  }, [image, angle]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `rotated_${angle}deg.png`);
  };

  return (
    <ToolWrapper title="Photo Rotator" icon={<RotateCw className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to rotate</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">Quick Rotate:</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAngle((a) => a - 90)} className="p-3.5 bg-slate-100 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                  <RotateCcw className="w-4 h-4" /> -90°
                </button>
                <button onClick={() => setAngle((a) => a + 90)} className="p-3.5 bg-slate-100 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                  <RotateCw className="w-4 h-4" /> +90°
                </button>
                <button onClick={() => setAngle((a) => a + 180)} className="p-3.5 bg-slate-100 hover:bg-blue-100 rounded-xl text-xs font-bold transition">
                  180°
                </button>
                <button onClick={() => setAngle(0)} className="p-3.5 bg-slate-100 hover:bg-blue-100 rounded-xl text-xs font-bold transition">
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Custom Angle: <span className="text-blue-600 font-mono">{angle}°</span>
              </label>
              <input type="range" min="-180" max="180" value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full accent-blue-600" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 5: Photo Mirror & Flip
// ============================================
export const PhotoFlipTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }, [image, flipH, flipV]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'flipped.png');
  };

  return (
    <ToolWrapper title="Photo Mirror & Flip" icon={<FlipHorizontal className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to flip</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <button
                onClick={() => setFlipH(!flipH)}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition ${
                  flipH ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <FlipHorizontal className={`w-5 h-5 ${flipH ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">Mirror Horizontal</span>
              </button>
              <button
                onClick={() => setFlipV(!flipV)}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition ${
                  flipV ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <FlipVertical className={`w-5 h-5 ${flipV ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">Flip Vertical</span>
              </button>
              <button onClick={() => { setFlipH(false); setFlipV(false); }} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition">
                Reset Both
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 6: Brightness & Contrast
// ============================================
export const BrightnessContrastTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
    setBrightness(100); setContrast(100); setSaturation(100);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(image, 0, 0);
  }, [image, brightness, contrast, saturation]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'adjusted.png');
  };

  return (
    <ToolWrapper title="Brightness & Contrast" icon={<Sun className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to adjust</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Sun className="w-4 h-4 text-amber-500" /> Brightness: <span className="font-mono text-blue-600">{brightness}%</span>
                </label>
                <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(+e.target.value)} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Contrast className="w-4 h-4 text-blue-500" /> Contrast: <span className="font-mono text-blue-600">{contrast}%</span>
                </label>
                <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(+e.target.value)} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Droplet className="w-4 h-4 text-purple-500" /> Saturation: <span className="font-mono text-blue-600">{saturation}%</span>
                </label>
                <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(+e.target.value)} className="w-full accent-blue-600" />
              </div>
              <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition">
                Reset All
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 7: Black & White Converter
// ============================================
export const BlackWhiteTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [intensity, setIntensity] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = `grayscale(${intensity}%)`;
    ctx.drawImage(image, 0, 0);
  }, [image, intensity]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'bw.png');
  };

  return (
    <ToolWrapper title="Black & White Converter" icon={<Circle className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image for B&W conversion</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Grayscale Intensity: <span className="font-mono text-slate-700">{intensity}%</span>
              </label>
              <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-slate-700" />
              <div className="flex gap-2 mt-3">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button key={v} onClick={() => setIntensity(v)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold transition">{v}%</button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 8: Photo Blur
// ============================================
export const PhotoBlurTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [amount, setAmount] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = `blur(${amount}px)`;
    ctx.drawImage(image, 0, 0);
  }, [image, amount]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'blurred.png');
  };

  return (
    <ToolWrapper title="Photo Blur Tool" icon={<Droplet className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to blur</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Blur Amount: <span className="font-mono text-blue-600">{amount}px</span>
              </label>
              <input type="range" min="0" max="50" value={amount} onChange={(e) => setAmount(+e.target.value)} className="w-full accent-blue-600" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 9: Photo Sharpener (PREMIUM)
// ============================================
export const PhotoSharpenerTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [amount, setAmount] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;
    const strength = amount / 100;

    const original = new Uint8ClampedArray(data);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let ki = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * w + (x + kx)) * 4 + c;
              sum += original[idx] * kernel[ki++];
            }
          }
          const idx = (y * w + x) * 4 + c;
          data[idx] = Math.max(0, Math.min(255, original[idx] * (1 - strength) + sum * strength));
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [image, amount]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, 'sharpened.png');
  };

  return (
    <ToolWrapper title="Photo Sharpener" icon={<Sparkles className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload blurry photo</p>
          <p className="text-sm text-slate-500 mt-2">Enhance details and sharpness</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Sharpness: <span className="font-mono text-amber-600">{amount}%</span>
              </label>
              <input type="range" min="0" max="100" value={amount} onChange={(e) => setAmount(+e.target.value)} className="w-full accent-amber-600" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};

// ============================================
// TOOL 10: Photo Crop Tool
// ============================================
export const PhotoCropTool: React.FC<ToolProps> = ({ onClose }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16' | 'passport'>('free');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const RATIOS: Record<string, { w: number; h: number; label: string }> = {
    'free': { w: 1, h: 1, label: 'Free' },
    '1:1': { w: 1, h: 1, label: '1:1 Square' },
    '4:3': { w: 4, h: 3, label: '4:3' },
    '16:9': { w: 16, h: 9, label: '16:9' },
    '3:4': { w: 3, h: 4, label: '3:4' },
    '9:16': { w: 9, h: 16, label: '9:16 Story' },
    'passport': { w: 35, h: 45, label: 'Passport 35x45mm' },
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await loadImage(file);
    setImage(img);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const r = RATIOS[ratio];

    let newW = image.width;
    let newH = image.height;

    if (ratio !== 'free') {
      const targetRatio = r.w / r.h;
      const imgRatio = image.width / image.height;

      if (imgRatio > targetRatio) {
        newH = image.height;
        newW = image.height * targetRatio;
      } else {
        newW = image.width;
        newH = image.width / targetRatio;
      }
    }

    canvas.width = newW;
    canvas.height = newH;
    const sx = (image.width - newW) / 2;
    const sy = (image.height - newH) / 2;
    ctx.drawImage(image, sx, sy, newW, newH, 0, 0, newW, newH);
  }, [image, ratio]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `cropped_${ratio.replace(':', 'x')}.png`);
  };

  return (
    <ToolWrapper title="Photo Crop Tool" icon={<Crop className="w-5 h-5" />} onClose={onClose}>
      {!image ? (
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition max-w-3xl mx-auto mt-8">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-bold text-slate-700">Upload image to crop</p>
          <p className="text-sm text-slate-500 mt-2">7 aspect ratios including Passport</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 mb-3">Aspect Ratio:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(RATIOS).map(([key, r]) => (
                  <button
                    key={key}
                    onClick={() => setRatio(key as any)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition ${
                      ratio === key ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImage(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">Change</button>
              <button onClick={handleDownload} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] lg:min-h-[600px] p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};
