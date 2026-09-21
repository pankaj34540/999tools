import React, { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Palette, Upload, Download, X, Loader2, Trash2,
  RotateCcw, Check, Image as ImageIcon, Contrast,
} from 'lucide-react';

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
  processedBlob: Blob;
  originalSize: number;
  processedSize: number;
}

interface BlackWhiteConverterProps {
  onClose: () => void;
}

type BWMode = 'grayscale' | 'high_contrast' | 'sepia' | 'inverted';

const BlackWhiteConverter: React.FC<BlackWhiteConverterProps> = ({ onClose }) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [mode, setMode] = useState<BWMode>('grayscale');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Apply B&W effect ──
  const processImage = useCallback(
    (file: File, m: BWMode): Promise<ProcessedImage> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Standard luminance formula
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            if (m === 'high_contrast') {
              // Boost contrast: push values away from middle
              gray = gray < 128 ? Math.max(0, gray - 40) : Math.min(255, gray + 40);
            } else if (m === 'sepia') {
              // Sepia tone
              data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
              data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
              data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
              continue;
            } else if (m === 'inverted') {
              // Inverted grayscale
              gray = 255 - gray;
            }

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Failed to process'));
              resolve({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                originalFile: file,
                originalUrl: url,
                processedUrl: URL.createObjectURL(blob),
                processedBlob: blob,
                originalSize: file.size,
                processedSize: blob.size,
              });
            },
            'image/jpeg',
            0.92
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      }),
    []
  );

  // ── Handle upload ──
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsProcessing(true);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please upload valid image files');
        setIsProcessing(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => processImage(f, mode)));
      setImages((prev) => [...prev, ...processed]);
    } catch (err) {
      setError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Reprocess with current mode ──
  const applyMode = async (newMode: BWMode) => {
    setMode(newMode);
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const reprocessed = await Promise.all(
        images.map(async (img) => {
          URL.revokeObjectURL(img.processedUrl);
          return processImage(img.originalFile, newMode);
        })
      );
      setImages(reprocessed);
    } catch {
      setError('Failed to apply mode');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (img: ProcessedImage) => {
    const link = document.createElement('a');
    link.href = img.processedUrl;
    link.download = `bw_${img.originalFile.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
  };

  const downloadZip = async () => {
    if (images.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      images.forEach((img, idx) => {
        zip.file(
          `bw_${idx + 1}_${img.originalFile.name.replace(/\.[^.]+$/, '')}.jpg`,
          img.processedBlob
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `black_white_${Date.now()}.zip`;
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
        URL.revokeObjectURL(img.processedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const resetAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    setMode('grayscale');
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const modes: { id: BWMode; label: string; icon: string }[] = [
    { id: 'grayscale', label: 'Grayscale', icon: '⚫' },
    { id: 'high_contrast', label: 'High Contrast B&W', icon: '◐' },
    { id: 'sepia', label: 'Sepia Tone', icon: '🟤' },
    { id: 'inverted', label: 'Inverted B&W', icon: '⚪' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Black & White Converter
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Convert photos to B&W with multiple styles</p>
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

            {/* Mode Selection */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Contrast className="w-4 h-4 text-purple-400" />
                Select B&W Style
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => applyMode(m.id)}
                    className={`p-3 rounded-lg border-2 transition text-left ${
                      mode === m.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className={`text-xs font-bold ${mode === m.id ? 'text-purple-300' : 'text-slate-300'}`}>
                      {m.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            {images.length === 0 ? (
              <div
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-12 text-center cursor-pointer transition bg-slate-950/50"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-purple-400" />
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

            {/* Images Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="grid grid-cols-2 aspect-square">
                      <div className="relative">
                        <img src={img.originalUrl} alt="original" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 text-[10px] font-bold bg-slate-950/80 text-slate-300 px-1.5 py-0.5 rounded">BEFORE</span>
                      </div>
                      <div className="relative">
                        <img src={img.processedUrl} alt="processed" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 text-[10px] font-bold bg-purple-600/90 text-white px-1.5 py-0.5 rounded">AFTER</span>
                      </div>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-white font-bold truncate mb-1">{img.originalFile.name}</p>
                      <p className="text-[10px] text-slate-400 mb-2">
                        {formatSize(img.originalSize)} → {formatSize(img.processedSize)}
                      </p>
                      <button
                        onClick={() => downloadSingle(img)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
              <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Tip:</strong> Choose a style first, then upload. Use "Apply" to change style after upload. All processing is 100% client-side.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackWhiteConverter;
