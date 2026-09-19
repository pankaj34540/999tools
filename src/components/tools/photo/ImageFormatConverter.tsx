import React, { useState, useRef } from 'react';
import {
  X, Upload, Download, Image as ImageIcon, Check,
  Loader2, Trash2, FileArchive, AlertCircle, RefreshCw,
} from 'lucide-react';

interface ToolProps {
  onClose: () => void;
}

interface ConvertedImage {
  id: string;
  originalFile: File;
  originalPreview: string;
  originalSize: number;
  convertedBlob: Blob | null;
  convertedPreview: string;
  convertedSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  outputName: string;
}

type OutputFormat = 'jpeg' | 'png' | 'webp';

export const ImageFormatConverter: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // FORMAT HELPERS
  // ============================================
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getExtension = (format: OutputFormat): string => {
    if (format === 'jpeg') return 'jpg';
    return format;
  };

  const getMimeType = (format: OutputFormat): string => {
    if (format === 'jpeg') return 'image/jpeg';
    return `image/${format}`;
  };

  const getBaseName = (filename: string): string => {
    return filename.replace(/\.[^.]+$/, '');
  };

  // ============================================
  // LOAD IMAGE
  // ============================================
  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please upload a valid image file'));
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

  // ============================================
  // CONVERT SINGLE IMAGE
  // ============================================
  const convertImage = async (
    imageData: ConvertedImage,
    format: OutputFormat,
    quality: number
  ): Promise<ConvertedImage> => {
    try {
      const img = await loadImage(imageData.originalFile);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // For JPEG, fill white background (no transparency)
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeType = getMimeType(format);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, quality / 100);
      });

      if (!blob) throw new Error('Conversion failed');

      const convertedPreview = URL.createObjectURL(blob);
      const outputName = `${getBaseName(imageData.originalFile.name)}.${getExtension(format)}`;

      return {
        ...imageData,
        convertedBlob: blob,
        convertedPreview,
        convertedSize: blob.size,
        status: 'done',
        outputName,
      };
    } catch (err: any) {
      return {
        ...imageData,
        status: 'error',
        error: err.message || 'Conversion failed',
      };
    }
  };

  // ============================================
  // HANDLE FILE UPLOAD
  // ============================================
  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Please upload valid image files (JPG, PNG, WebP)');
      return;
    }

    const newImages: ConvertedImage[] = validFiles.map((file) => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalFile: file,
      originalPreview: URL.createObjectURL(file),
      originalSize: file.size,
      convertedBlob: null,
      convertedPreview: '',
      convertedSize: 0,
      status: 'pending',
      outputName: '',
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  // ============================================
  // REMOVE IMAGE
  // ============================================
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalPreview);
        if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalPreview);
      if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
    });
    setImages([]);
  };

  // ============================================
  // CONVERT ALL
  // ============================================
  const convertAll = async () => {
    if (images.length === 0) return;
    setBusy(true);

    setImages((prev) => prev.map((i) => ({ ...i, status: 'processing' })));

    const results: ConvertedImage[] = [];
    for (const img of images) {
      // Cleanup old preview
      if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
      const result = await convertImage(img, outputFormat, quality);
      results.push(result);
    }

    setImages(results);
    setBusy(false);
  };

  // ============================================
  // DOWNLOAD SINGLE
  // ============================================
  const downloadSingle = (img: ConvertedImage) => {
    if (!img.convertedBlob) return;
    const url = URL.createObjectURL(img.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  // ============================================
  // DOWNLOAD ALL AS ZIP
  // ============================================
  const downloadAllAsZip = async () => {
    const done = images.filter((i) => i.status === 'done' && i.convertedBlob);
    if (done.length === 0) return;

    setBusy(true);
    try {
      // Dynamic import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      done.forEach((img) => {
        if (img.convertedBlob) {
          zip.file(img.outputName, img.convertedBlob);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `999tools_converted_${Date.now()}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (err) {
      console.error('ZIP creation failed:', err);
      alert('Failed to create ZIP. Please download images individually.');
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // STATS
  // ============================================
  const totalOriginalSize = images.reduce((s, i) => s + i.originalSize, 0);
  const totalConvertedSize = images
    .filter((i) => i.status === 'done')
    .reduce((s, i) => s + i.convertedSize, 0);
  const doneCount = images.filter((i) => i.status === 'done').length;
  const sizeDiff = totalOriginalSize - totalConvertedSize;
  const sizeDiffPercent = totalOriginalSize > 0 ? (sizeDiff / totalOriginalSize) * 100 : 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Image Format Converter
            </h2>
            <p className="text-xs text-slate-500">
              JPG ↔ PNG ↔ WebP — convert in bulk
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ═══ SETTINGS ═══ */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Output Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Convert To:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['jpeg', 'png', 'webp'] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition border-2 ${
                    outputFormat === fmt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {getExtension(fmt)}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Quality: <span className="font-mono text-blue-600">{quality}%</span>
            </label>
            <input
              type="range"
              min={50}
              max={100}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              disabled={outputFormat === 'png'}
              className="w-full accent-blue-600 disabled:opacity-40"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {outputFormat === 'png'
                ? 'PNG is lossless — quality not applicable'
                : 'Higher quality = larger file'}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ UPLOAD AREA ═══ */}
      {images.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
        >
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-base font-black text-slate-800 mb-1">
            {dragActive ? 'Drop images here' : 'Upload Images'}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Click or drag & drop — Multiple images supported
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
            <ImageIcon className="w-4 h-4" />
            Choose Files
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            Supports: JPG, PNG, WebP, HEIC (max 20 MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {/* ═══ STATS BAR ═══ */}
          {doneCount > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Images</div>
                <div className="text-lg font-black text-slate-900">{doneCount}/{images.length}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Original</div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {formatBytes(totalOriginalSize)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Converted</div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {formatBytes(totalConvertedSize)}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${
                sizeDiff > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="text-[10px] font-bold uppercase text-slate-600">Size Change</div>
                <div className={`text-lg font-black font-mono ${
                  sizeDiff > 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {sizeDiff > 0 ? '−' : '+'}{Math.abs(sizeDiffPercent).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* ═══ ACTION BUTTONS ═══ */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Add More
            </button>
            <button
              onClick={convertAll}
              disabled={busy}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Convert All ({images.length})
                </>
              )}
            </button>
            {doneCount > 1 && (
              <button
                onClick={downloadAllAsZip}
                disabled={busy}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
              >
                <FileArchive className="w-3.5 h-3.5" />
                Download All (ZIP)
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={busy}
              className="ml-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>

          {/* ═══ IMAGES GRID ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${
                  img.status === 'error' ? 'border-rose-300' :
                  img.status === 'done' ? 'border-emerald-300' :
                  img.status === 'processing' ? 'border-blue-300' :
                  'border-slate-200'
                }`}
              >
                {/* Preview */}
                <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                  {img.status === 'done' && img.convertedPreview ? (
                    <img
                      src={img.convertedPreview}
                      alt="Converted"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={img.originalPreview}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Status overlay */}
                  {img.status === 'processing' && (
                    <div className="absolute inset-0 bg-blue-600/80 backdrop-blur flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}

                  {img.status === 'error' && (
                    <div className="absolute inset-0 bg-rose-600/80 backdrop-blur flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                      <p className="text-[10px] text-white font-bold">
                        {img.error}
                      </p>
                    </div>
                  )}

                  {img.status === 'done' && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      DONE
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 truncate">
                    {img.outputName || img.originalFile.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {formatBytes(img.originalSize)}
                    </span>
                    {img.status === 'done' && (
                      <>
                        <span className="text-slate-400">→</span>
                        <span className={`font-mono font-bold ${
                          img.convertedSize < img.originalSize
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}>
                          {formatBytes(img.convertedSize)}
                        </span>
                      </>
                    )}
                  </div>
                  {img.status === 'done' && (
                    <button
                      onClick={() => downloadSingle(img)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hidden file input for adding more */}
      {images.length > 0 && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      )}
    </div>
  );
};
