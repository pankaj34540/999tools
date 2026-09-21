import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  RefreshCw, Upload, Download, X, Loader2, Trash2,
  Image as ImageIcon, Maximize2,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  originalSize: number;
  processedSize: number;
}

interface ImageFormatConverterProps {
  onClose: () => void;
}

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const ImageFormatConverter: React.FC<ImageFormatConverterProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExtension = (fmt: OutputFormat) => {
    if (fmt === 'image/png') return 'png';
    if (fmt === 'image/webp') return 'webp';
    return 'jpg';
  };

  // ── Live preview: reprocess when format/quality changes ──
  useEffect(() => {
    if (images.length === 0) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      const updated = await Promise.all(
        images.map(async (item) => {
          return new Promise<ImageItem>((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (cancelled) return resolve(item);

              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return resolve(item);

              // White background for formats that don't support alpha
              if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }

              ctx.drawImage(img, 0, 0);

              if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);

              canvas.toBlob(
                (blob) => {
                  if (!blob || cancelled) return resolve(item);
                  resolve({
                    ...item,
                    processedBlob: blob,
                    processedUrl: URL.createObjectURL(blob),
                    processedSize: blob.size,
                  });
                },
                format,
                format === 'image/png' ? undefined : quality / 100
              );
            };
            img.onerror = () => resolve(item);
            img.src = item.originalUrl;
          });
        })
      );

      if (!cancelled) setImages(updated);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please upload valid image files');
        return;
      }

      const newItems: ImageItem[] = validFiles.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        originalUrl: URL.createObjectURL(f),
        processedBlob: null,
        processedUrl: null,
        originalSize: f.size,
        processedSize: f.size,
      }));

      setImages((prev) => [...prev, ...newItems]);
    } catch {
      setError('Failed to load images');
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = `${item.file.name.replace(/\.[^.]+$/, '')}.${getExtension(format)}`;
    link.click();
  };

  const downloadZip = async () => {
    const ready = images.filter((i) => i.processedBlob);
    if (ready.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      ready.forEach((img, idx) => {
        zip.file(
          `${idx + 1}_${img.file.name.replace(/\.[^.]+$/, '')}.${getExtension(format)}`,
          img.processedBlob!
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `converted_${getExtension(format)}_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('Failed to create ZIP');
    } finally {
      setIsZipping(false);
    }
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
    setFormat('image/jpeg');
    setQuality(92);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formats: { id: OutputFormat; label: string; desc: string; color: string }[] = [
    { id: 'image/jpeg', label: 'JPG', desc: 'Smallest, widely supported', color: 'amber' },
    { id: 'image/png', label: 'PNG', desc: 'Lossless, transparent support', color: 'blue' },
    { id: 'image/webp', label: 'WebP', desc: 'Modern, best compression', color: 'emerald' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Image Format Converter
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Convert JPG, PNG, WebP with live preview</p>
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

              {/* Settings */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Output Format</h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    ⚡ Live Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        format === f.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <div className={`text-lg font-bold ${format === f.id ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {f.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Quality slider (not for PNG) */}
                {format !== 'image/png' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300">Quality</label>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded">
                        {quality}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      disabled={images.length === 0}
                      className="w-full accent-cyan-500 disabled:opacity-40"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>10% (Smaller)</span>
                      <span>50%</span>
                      <span>100% (Best)</span>
                    </div>
                  </div>
                )}

                {format === 'image/png' && (
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300">
                    💡 PNG is lossless — quality slider not applicable.
                  </div>
                )}
              </div>

              {/* Upload */}
              {images.length === 0 ? (
                <div
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-cyan-400" />
                  </div>
                  <p className="text-white font-bold mb-1">Drop images here or click to upload</p>
                  <p className="text-xs text-slate-400">JPG, PNG, WebP • Multiple files supported</p>
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
                      <><Download className="w-4 h-4" /> Download All ({getExtension(format).toUpperCase()} ZIP)</>
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

              {/* Images with A4 preview */}
              {images.length > 0 && (
                <div className="space-y-6">
                  {images.map((img) => (
                    <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

                      {/* Header bar */}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <p className="text-xs text-white font-bold truncate">{img.file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">
                            → {getExtension(format).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
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

                      {/* A4 side-by-side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900">
                        {/* BEFORE */}
                        <div className="relative bg-white rounded-lg border-2 border-slate-700 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-600">
                            ORIGINAL
                          </div>
                          <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                            <img
                              src={img.originalUrl}
                              alt="original"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* AFTER */}
                        <div className="relative bg-white rounded-lg border-2 border-cyan-500 overflow-hidden shadow-lg">
                          <div className="absolute top-2 left-2 z-10 bg-cyan-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            {getExtension(format).toUpperCase()}
                          </div>
                          <div className="aspect-[1/1.414] flex items-center justify-center bg-white">
                            {img.processedUrl ? (
                              <img
                                src={img.processedUrl}
                                alt="processed"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Download */}
                      <div className="p-3 border-t border-slate-800">
                        <button
                          onClick={() => downloadSingle(img)}
                          disabled={!img.processedUrl}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                        >
                          <Download className="w-4 h-4" /> Download as {getExtension(format).toUpperCase()}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Live Preview:</strong> Change format or quality to see instant results. Click <Maximize2 className="w-3 h-3 inline" /> for fullscreen.
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
                <RefreshCw className="w-5 h-5 text-cyan-400" />
                <p className="text-sm text-white font-bold truncate max-w-md">
                  {fullscreenImg.file.name}
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
              className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-slate-950/90 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-slate-600">
                  ORIGINAL
                </div>
                <img
                  src={fullscreenImg.originalUrl}
                  alt="original"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="relative bg-white rounded-xl overflow-hidden border-2 border-cyan-500 flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-10 bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {getExtension(format).toUpperCase()}
                </div>
                {fullscreenImg.processedUrl ? (
                  <img
                    src={fullscreenImg.processedUrl}
                    alt="processed"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                )}
              </div>
            </div>

            <div className="flex justify-center mt-4 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSingle(fullscreenImg);
                }}
                disabled={!fullscreenImg.processedUrl}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl transition shadow-lg"
              >
                <Download className="w-4 h-4" /> Download {getExtension(format).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageFormatConverter;
