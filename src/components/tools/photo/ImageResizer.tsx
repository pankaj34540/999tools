import React, { useState, useRef } from 'react';
import {
  X, Upload, Download, Image as ImageIcon, Check, Loader2,
  Trash2, FileArchive, AlertCircle, Maximize2, Lock, Unlock,
} from 'lucide-react';

interface ToolProps {
  onClose: () => void;
}

interface ResizedImage {
  id: string;
  originalFile: File;
  originalPreview: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  resizedBlob: Blob | null;
  resizedPreview: string;
  resizedWidth: number;
  resizedHeight: number;
  resizedSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  outputName: string;
}

type ResizeMode = 'fit' | 'fill' | 'stretch';

interface Preset {
  id: string;
  label: string;
  width: number;
  height: number;
  emoji: string;
}

const PRESETS: Preset[] = [
  { id: 'instagram_square', label: 'Instagram Post', width: 1080, height: 1080, emoji: '📷' },
  { id: 'instagram_story', label: 'Instagram Story', width: 1080, height: 1920, emoji: '📱' },
  { id: 'passport_india', label: 'Passport (India)', width: 413, height: 531, emoji: '🛂' },
  { id: 'facebook_post', label: 'Facebook Post', width: 1200, height: 630, emoji: '📘' },
  { id: 'twitter_post', label: 'Twitter/X Post', width: 1200, height: 675, emoji: '🐦' },
  { id: 'youtube_thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, emoji: '▶️' },
];

export const ImageResizer: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<ResizedImage[]>([]);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [keepAspect, setKeepAspect] = useState(true);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('fit');
  const [quality, setQuality] = useState(92);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // HELPERS
  // ============================================
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getBaseName = (filename: string): string => {
    return filename.replace(/\.[^.]+$/, '');
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file'));
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
  // PRESET HANDLER
  // ============================================
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
  };

  // ============================================
  // ASPECT RATIO HANDLERS
  // ============================================
  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    setSelectedPreset('');
    if (keepAspect && images.length > 0) {
      const firstImg = images[0];
      const ratio = firstImg.originalHeight / firstImg.originalWidth;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    setSelectedPreset('');
    if (keepAspect && images.length > 0) {
      const firstImg = images[0];
      const ratio = firstImg.originalWidth / firstImg.originalHeight;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  // ============================================
  // HANDLE FILES
  // ============================================
  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Please upload valid image files');
      return;
    }

    const newImages: ResizedImage[] = [];

    for (const file of validFiles) {
      try {
        const img = await loadImage(file);
        newImages.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalFile: file,
          originalPreview: URL.createObjectURL(file),
          originalWidth: img.width,
          originalHeight: img.height,
          originalSize: file.size,
          resizedBlob: null,
          resizedPreview: '',
          resizedWidth: 0,
          resizedHeight: 0,
          resizedSize: 0,
          status: 'pending',
          outputName: '',
        });
      } catch (err) {
        console.error('Failed to load:', file.name, err);
      }
    }

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

  // ============================================
  // RESIZE CALCULATION
  // ============================================
  const calculateDimensions = (
    imgW: number,
    imgH: number,
    targetW: number,
    targetH: number,
    mode: ResizeMode
  ): { drawW: number; drawH: number; offsetX: number; offsetY: number } => {
    if (mode === 'stretch') {
      return { drawW: targetW, drawH: targetH, offsetX: 0, offsetY: 0 };
    }

    const imgRatio = imgW / imgH;
    const targetRatio = targetW / targetH;

    if (mode === 'fit') {
      // Fit inside — letterbox (white bars)
      let drawW = targetW;
      let drawH = targetW / imgRatio;
      if (drawH > targetH) {
        drawH = targetH;
        drawW = targetH * imgRatio;
      }
      return {
        drawW,
        drawH,
        offsetX: (targetW - drawW) / 2,
        offsetY: (targetH - drawH) / 2,
      };
    } else {
      // Fill — crop to cover
      let drawW = targetW;
      let drawH = targetW / imgRatio;
      if (drawH < targetH) {
        drawH = targetH;
        drawW = targetH * imgRatio;
      }
      return {
        drawW,
        drawH,
        offsetX: (targetW - drawW) / 2,
        offsetY: (targetH - drawH) / 2,
      };
    }
  };

  // ============================================
  // RESIZE SINGLE IMAGE
  // ============================================
  const resizeImage = async (imageData: ResizedImage): Promise<ResizedImage> => {
    try {
      const img = await loadImage(imageData.originalFile);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // White background (for 'fit' letterbox)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { drawW, drawH, offsetX, offsetY } = calculateDimensions(
        img.width,
        img.height,
        width,
        height,
        resizeMode
      );

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality / 100);
      });

      if (!blob) throw new Error('Resize failed');

      const resizedPreview = URL.createObjectURL(blob);
      const outputName = `${getBaseName(imageData.originalFile.name)}_${width}x${height}.jpg`;

      return {
        ...imageData,
        resizedBlob: blob,
        resizedPreview,
        resizedWidth: width,
        resizedHeight: height,
        resizedSize: blob.size,
        status: 'done',
        outputName,
      };
    } catch (err: any) {
      return {
        ...imageData,
        status: 'error',
        error: err.message || 'Resize failed',
      };
    }
  };

  // ============================================
  // RESIZE ALL
  // ============================================
  const resizeAll = async () => {
    if (images.length === 0) return;
    setBusy(true);

    setImages((prev) => prev.map((i) => ({ ...i, status: 'processing' })));

    const results: ResizedImage[] = [];
    for (const img of images) {
      if (img.resizedPreview) URL.revokeObjectURL(img.resizedPreview);
      const result = await resizeImage(img);
      results.push(result);
    }

    setImages(results);
    setBusy(false);
  };

  // ============================================
  // REMOVE / CLEAR
  // ============================================
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalPreview);
        if (img.resizedPreview) URL.revokeObjectURL(img.resizedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalPreview);
      if (img.resizedPreview) URL.revokeObjectURL(img.resizedPreview);
    });
    setImages([]);
  };

  // ============================================
  // DOWNLOADS
  // ============================================
  const downloadSingle = (img: ResizedImage) => {
    if (!img.resizedBlob) return;
    const url = URL.createObjectURL(img.resizedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const downloadAllAsZip = async () => {
    const done = images.filter((i) => i.status === 'done' && i.resizedBlob);
    if (done.length === 0) return;

    setBusy(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      done.forEach((img) => {
        if (img.resizedBlob) zip.file(img.outputName, img.resizedBlob);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `999tools_resized_${width}x${height}_${Date.now()}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (err) {
      console.error('ZIP failed:', err);
      alert('ZIP failed. Download individually.');
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // STATS
  // ============================================
  const doneCount = images.filter((i) => i.status === 'done').length;
  const totalOriginalSize = images.reduce((s, i) => s + i.originalSize, 0);
  const totalResizedSize = images
    .filter((i) => i.status === 'done')
    .reduce((s, i) => s + i.resizedSize, 0);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Image Resizer</h2>
            <p className="text-xs text-slate-500">
              Resize single or multiple images to custom dimensions
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

      {/* SETTINGS */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
        {/* Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Quick Presets:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`p-2.5 rounded-xl border-2 text-left transition ${
                  selectedPreset === preset.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="text-[10px] font-bold flex items-center gap-1.5">
                  <span>{preset.emoji}</span>
                  <span>{preset.label}</span>
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${
                  selectedPreset === preset.id ? 'text-emerald-100' : 'text-slate-400'
                }`}>
                  {preset.width}×{preset.height}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Width (px):</label>
            <input
              type="number"
              min={10}
              max={10000}
              value={width}
              onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Height (px):</label>
            <input
              type="number"
              min={10}
              max={10000}
              value={height}
              onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Aspect Ratio Lock */}
        <button
          onClick={() => setKeepAspect(!keepAspect)}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            keepAspect
              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
              : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
          }`}
        >
          {keepAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{keepAspect ? 'Aspect Ratio: LOCKED' : 'Aspect Ratio: FREE'}</span>
        </button>

        {/* Resize Mode */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Resize Mode:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['fit', 'fill', 'stretch'] as ResizeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setResizeMode(mode)}
                className={`py-2.5 rounded-xl text-xs font-black uppercase transition border-2 ${
                  resizeMode === mode
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {resizeMode === 'fit' && '📐 Fits image inside — adds white bars if needed'}
            {resizeMode === 'fill' && '✂️ Fills the frame — crops overflow edges'}
            {resizeMode === 'stretch' && '⚠️ Stretches — may distort aspect ratio'}
          </p>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Quality: <span className="font-mono text-emerald-600">{quality}%</span>
          </label>
          <input
            type="range"
            min={50}
            max={100}
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>
      </div>

      {/* UPLOAD AREA */}
      {images.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
          }`}
        >
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-base font-black text-slate-800 mb-1">
            {dragActive ? 'Drop images here' : 'Upload Images'}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Click or drag & drop — Multiple images supported
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">
            <ImageIcon className="w-4 h-4" />
            Choose Files
          </div>
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
          {/* STATS */}
          {doneCount > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Resized</div>
                <div className="text-lg font-black text-slate-900">{doneCount}/{images.length}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Original</div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatBytes(totalOriginalSize)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Resized</div>
                <div className="text-sm font-black text-emerald-700 font-mono">
                  {formatBytes(totalResizedSize)}
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" /> Add More
            </button>
            <button
              onClick={resizeAll}
              disabled={busy || width <= 0 || height <= 0}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Resizing...
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  Resize All ({images.length})
                </>
              )}
            </button>
            {doneCount > 1 && (
              <button
                onClick={downloadAllAsZip}
                disabled={busy}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
              >
                <FileArchive className="w-3.5 h-3.5" /> Download All (ZIP)
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={busy}
              className="ml-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${
                  img.status === 'error' ? 'border-rose-300' :
                  img.status === 'done' ? 'border-emerald-300' :
                  img.status === 'processing' ? 'border-emerald-300' :
                  'border-slate-200'
                }`}
              >
                <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                  {img.status === 'done' && img.resizedPreview ? (
                    <img src={img.resizedPreview} alt="Resized" className="w-full h-full object-contain" />
                  ) : (
                    <img src={img.originalPreview} alt="Original" className="w-full h-full object-contain" />
                  )}

                  {img.status === 'processing' && (
                    <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}

                  {img.status === 'error' && (
                    <div className="absolute inset-0 bg-rose-600/80 backdrop-blur flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                      <p className="text-[10px] text-white font-bold">{img.error}</p>
                    </div>
                  )}

                  {img.status === 'done' && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> DONE
                    </div>
                  )}

                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 truncate">
                    {img.outputName || img.originalFile.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {img.originalWidth}×{img.originalHeight}
                    </span>
                    {img.status === 'done' && (
                      <>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {img.resizedWidth}×{img.resizedHeight}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {formatBytes(img.originalSize)}
                    </span>
                    {img.status === 'done' && (
                      <span className="font-mono font-bold text-emerald-700">
                        {formatBytes(img.resizedSize)}
                      </span>
                    )}
                  </div>
                  {img.status === 'done' && (
                    <button
                      onClick={() => downloadSingle(img)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition mt-2"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
