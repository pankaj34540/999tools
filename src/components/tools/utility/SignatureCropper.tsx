import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  PenTool, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2, Sparkles, Target,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface SignatureItem {
  id: string;
  file: File;
  originalUrl: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  originalSize: number;
  processedSize: number;
  originalWidth: number;
  originalHeight: number;
  croppedWidth: number;
  croppedHeight: number;
}

interface SignatureCropperProps {
  onClose: () => void;
}

const TARGET_KB_PRESETS = [10, 20, 30, 50, 100];

const SignatureCropper: React.FC<SignatureCropperProps> = ({ onClose }) => {
  const { currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const [images, setImages] = useState<SignatureItem[]>([]);
  const [targetKB, setTargetKB] = useState(20);
  const [customKB, setCustomKB] = useState('');
  const [threshold, setThreshold] = useState(200);
  const [padding, setPadding] = useState(10);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<SignatureItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingDownload, setPendingDownload] = useState<{ label: string; action: () => void } | null>(null);

  const shouldShowAds = () => {
    if (ownerAuthenticated) return false;
    if (currentUser?.plan === 'premium' && isUserPremium()) return false;
    if (currentUser?.plan === 'vle' || activeVle) return false;
    return true;
  };
  const isPaidUser = !shouldShowAds();

  const requestDownload = (label: string, action: () => void) => {
    if (isPaidUser) {
      action();
      return;
    }
    setPendingDownload({ label, action });
  };

  const processSignature = (img: HTMLImageElement): Promise<{
    canvas: HTMLCanvasElement;
    croppedW: number;
    croppedH: number;
  }> => {
    return new Promise((resolve) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        resolve({ canvas: tempCanvas, croppedW: 0, croppedH: 0 });
        return;
      }

      tempCtx.drawImage(img, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      const w = tempCanvas.width;
      const h = tempCanvas.height;

      let minX = w, minY = h, maxX = 0, maxY = 0;
      let found = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < threshold) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!found) {
        resolve({ canvas: tempCanvas, croppedW: w, croppedH: h });
        return;
      }

      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(w - 1, maxX + padding);
      maxY = Math.min(h - 1, maxY + padding);

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        resolve({ canvas: tempCanvas, croppedW: w, croppedH: h });
        return;
      }

      cropCtx.fillStyle = '#ffffff';
      cropCtx.fillRect(0, 0, cropW, cropH);
      cropCtx.drawImage(
        tempCanvas,
        minX, minY, cropW, cropH,
        0, 0, cropW, cropH
      );

      const cleanedData = cropCtx.getImageData(0, 0, cropW, cropH);
      const cData = cleanedData.data;
      for (let i = 0; i < cData.length; i += 4) {
        const lum = 0.299 * cData[i] + 0.587 * cData[i + 1] + 0.114 * cData[i + 2];
        if (lum > threshold - 30) {
          cData[i] = 255;
          cData[i + 1] = 255;
          cData[i + 2] = 255;
        }
      }
      cropCtx.putImageData(cleanedData, 0, 0);

      resolve({ canvas: cropCanvas, croppedW: cropW, croppedH: cropH });
    });
  };

  const compressToTarget = async (canvas: HTMLCanvasElement, targetBytes: number): Promise<Blob> => {
    let minQ = 0.3;
    let maxQ = 0.95;
    let bestBlob: Blob | null = null;

    for (let i = 0; i < 10; i++) {
      const midQ = (minQ + maxQ) / 2;
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', midQ);
      });
      if (!blob) break;

      if (blob.size <= targetBytes) {
        bestBlob = blob;
        minQ = midQ;
        if (blob.size >= targetBytes * 0.85) break;
      } else {
        maxQ = midQ;
      }
      if (maxQ - minQ < 0.02) break;
    }

    if (!bestBlob) {
      const fallback = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.3);
      });
      if (!fallback) throw new Error('Compression failed');
      return fallback;
    }
    return bestBlob;
  };

  const processImage = async (item: SignatureItem): Promise<SignatureItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const { canvas, croppedW, croppedH } = await processSignature(img);
          const targetBytes = targetKB * 1024;
          const blob = await compressToTarget(canvas, targetBytes);

          if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);

          resolve({
            ...item,
            processedBlob: blob,
            processedUrl: URL.createObjectURL(blob),
            processedSize: blob.size,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            croppedWidth: croppedW,
            croppedHeight: croppedH,
          });
        } catch {
          resolve(item);
        }
      };
      img.onerror = () => resolve(item);
      img.src = item.originalUrl;
    });
  };

  useEffect(() => {
    if (images.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const updated = await Promise.all(
        images.map(async (img) => {
          const result = await processImage(img);
          return cancelled ? img : result;
        })
      );
      if (!cancelled) setImages(updated);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, padding, targetKB]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please upload valid image files');
        return;
      }

      const newItems: SignatureItem[] = await Promise.all(
        validFiles.map(
          (f) =>
            new Promise<SignatureItem>((resolve) => {
              const img = new Image();
              const url = URL.createObjectURL(f);
              img.onload = () => {
                resolve({
                  id: `${f.name}-${Date.now()}-${Math.random()}`,
                  file: f,
                  originalUrl: url,
                  processedBlob: null,
                  processedUrl: null,
                  originalSize: f.size,
                  processedSize: f.size,
                  originalWidth: img.naturalWidth,
                  originalHeight: img.naturalHeight,
                  croppedWidth: 0,
                  croppedHeight: 0,
                });
              };
              img.onerror = () => URL.revokeObjectURL(url);
              img.src = url;
            })
        )
      );

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  const actualDownloadSingle = (item: SignatureItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `signature_${item.file.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
  };

  const downloadSingle = (item: SignatureItem) => {
    requestDownload(item.file.name, () => actualDownloadSingle(item));
  };

  const actualDownloadZip = async () => {
    const ready = images.filter((i) => i.processedBlob);
    if (ready.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      ready.forEach((img, idx) => {
        zip.file(
          `signature_${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `signatures_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('Failed to create ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  const downloadZip = () => {
    const ready = images.filter((i) => i.processedBlob);
    if (ready.length === 0) return;
    requestDownload(`All ${ready.length} signatures (ZIP)`, actualDownloadZip);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const resetAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    const n = Number(customKB);
    if (n > 0 && n <= 1000) setTargetKB(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customKB]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Signature Cropper
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      AUTO-CROP
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Sign photo → exact signature in target KB</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    Auto-Crop Settings
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    ⚡ Live Preview
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Target File Size (KB)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TARGET_KB_PRESETS.map((kb) => (
                      <button
                        key={kb}
                        onClick={() => { setTargetKB(kb); setCustomKB(''); }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition ${
                          targetKB === kb && !customKB
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={customKB}
                      onChange={(e) => setCustomKB(e.target.value)}
                      placeholder="Custom KB (e.g. 25)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Background Cleanup (Threshold)</label>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-slate-900 px-2 py-0.5 rounded">
                      {threshold}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={250}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    disabled={images.length === 0}
                    className="w-full accent-blue-500 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>100 (Aggressive)</span>
                    <span>200 (Balanced)</span>
                    <span>250 (Loose)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    💡 Higher value = more pixels become white. Use 220+ if paper has shadows.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">Padding Around Signature</label>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-slate-900 px-2 py-0.5 rounded">
                      {padding}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    disabled={images.length === 0}
                    className="w-full accent-blue-500 disabled:opacity-40"
                  />
                </div>

                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 flex gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Auto-crop:</strong> Signature automatically detect hoti hai (dark pixels) aur crop ho jaati hai. Background white ho jaata hai.
                  </div>
                </div>
              </div>

              {images.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-white font-bold mb-1">Drop signature photo here or click</p>
                  <p className="text-xs text-slate-400">White paper pe sign karo → photo khincho → upload karo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
                    <Upload className="w-4 h-4" /> Add More
                  </button>
                  <button
                    onClick={downloadZip}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-lg transition"
                  >
                    {isZipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Zipping...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Download All (ZIP)</>
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
                    accept="image/*"
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

              {images.length > 0 && (
                <div className="space-y-6">
                  {images.map((img) => (
                    <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {formatSize(img.originalSize)} → {formatSize(img.processedSize)}
                          </span>
                          <button
                            onClick={() => setFullscreenImg(img)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Fullscreen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="p-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900">
                        <div className="relative bg-white rounded-lg border-2 border-slate-700 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-600">
                            ORIGINAL
                          </div>
                          <div className="aspect-[3/1] flex items-center justify-center bg-white">
                            <img src={img.originalUrl} alt="original" className="max-w-full max-h-full object-contain" />
                          </div>
                        </div>

                        <div className="relative bg-white rounded-lg border-2 border-blue-500 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            CROPPED
                          </div>
                          <div className="aspect-[3/1] flex items-center justify-center bg-white">
                            {img.processedUrl ? (
                              <img src={img.processedUrl} alt="processed" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-800 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {img.croppedWidth}×{img.croppedHeight}px · {formatSize(img.processedSize)}
                        </span>
                        <button
                          onClick={() => downloadSingle(img)}
                          disabled={!img.processedUrl}
                          className="ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                        >
                          <Download className="w-4 h-4" /> Download Signature
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <PenTool className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Tip:</strong> White paper pe blue/black pen se sign karo → natural light mein photo → upload. Auto-crop signature detect karke crop karega.
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {fullscreenImg && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/98 backdrop-blur-md overflow-auto"
          onClick={() => setFullscreenImg(null)}
        >
          <div className="min-h-screen flex flex-col p-4">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <PenTool className="w-5 h-5 text-blue-400" />
                <p className="text-sm text-white font-bold truncate max-w-md">{fullscreenImg.file.name}</p>
              </div>
              <button onClick={() => setFullscreenImg(null)} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-slate-950/90 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-slate-600">
                  ORIGINAL
                </div>
                <img src={fullscreenImg.originalUrl} alt="original" className="max-w-full max-h-full object-contain" />
              </div>

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-blue-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  CROPPED
                </div>
                {fullscreenImg.processedUrl ? (
                  <img src={fullscreenImg.processedUrl} alt="processed" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                )}
              </div>
            </div>

            <div className="flex justify-center mt-4 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); downloadSingle(fullscreenImg); }}
                disabled={!fullscreenImg.processedUrl}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl transition shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {!isPaidUser && pendingDownload && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-2">Download Ready</h3>
            <p className="text-slate-400 text-sm mb-4">Click below to download "{pendingDownload.label}"</p>
            <button
              onClick={() => {
                pendingDownload.action();
                setPendingDownload(null);
              }}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition"
            >
              <Download className="w-4 h-4 inline mr-2" /> Download Now
            </button>
            <button onClick={() => setPendingDownload(null)} className="mt-3 text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureCropper;
