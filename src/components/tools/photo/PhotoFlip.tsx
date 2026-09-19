import React, { useState, useRef } from 'react';
import {
  X, Upload, Download, Image as ImageIcon, Check, Loader2,
  Trash2, FileArchive, AlertCircle, FlipHorizontal, FlipVertical,
  RefreshCw, RotateCw,
} from 'lucide-react';

interface ToolProps {
  onClose: () => void;
}

interface FlippedImage {
  id: string;
  originalFile: File;
  originalPreview: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  flippedBlob: Blob | null;
  flippedPreview: string;
  flippedSize: number;
  appliedFlip: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  outputName: string;
}

export const PhotoFlip: React.FC<ToolProps> = ({ onClose }) => {
  const [images, setImages] = useState<FlippedImage[]>([]);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
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

  const getFlipLabel = (h: boolean, v: boolean): string => {
    if (h && v) return '180° (Both)';
    if (h) return 'Horizontal';
    if (v) return 'Vertical';
    return 'None';
  };

  // ============================================
  // FLIP SINGLE IMAGE
  // ============================================
  const flipImage = async (
    imageData: FlippedImage,
    doHorizontal: boolean,
    doVertical: boolean
  ): Promise<FlippedImage> => {
    try {
      if (!doHorizontal && !doVertical) {
        throw new Error('Select at least one flip direction');
      }

      const img = await loadImage(imageData.originalFile);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Set up flip transform
      ctx.translate(
        doHorizontal ? canvas.width : 0,
        doVertical ? canvas.height : 0
      );
      ctx.scale(
        doHorizontal ? -1 : 1,
        doVertical ? -1 : 1
      );

      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) throw new Error('Flip failed');

      const flippedPreview = URL.createObjectURL(blob);
      const flipLabel = (doHorizontal ? 'H' : '') + (doVertical ? 'V' : '') || 'none';
      const outputName = `${getBaseName(imageData.originalFile.name)}_flip_${flipLabel}.jpg`;

      return {
        ...imageData,
        flippedBlob: blob,
        flippedPreview,
        flippedSize: blob.size,
        appliedFlip: getFlipLabel(doHorizontal, doVertical),
        status: 'done',
        outputName,
      };
    } catch (err: any) {
      return {
        ...imageData,
        status: 'error',
        error: err.message || 'Flip failed',
      };
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

    const newImages: FlippedImage[] = [];

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
          flippedBlob: null,
          flippedPreview: '',
          flippedSize: 0,
          appliedFlip: '',
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
  // QUICK ACTIONS
  // ============================================
  const handleMirrorH = () => {
    setFlipHorizontal(!flipHorizontal);
  };

  const handleFlipV = () => {
    setFlipVertical(!flipVertical);
  };

  const handleBoth = () => {
    setFlipHorizontal(true);
    setFlipVertical(true);
  };

  const handleReset = () => {
    setFlipHorizontal(false);
    setFlipVertical(false);
  };

  // ============================================
  // FLIP ALL
  // ============================================
  const flipAll = async () => {
    if (images.length === 0) return;
    if (!flipHorizontal && !flipVertical) {
      alert('Please select at least one flip direction');
      return;
    }

    setBusy(true);
    setImages((prev) => prev.map((i) => ({ ...i, status: 'processing' })));

    const results: FlippedImage[] = [];
    for (const img of images) {
      if (img.flippedPreview) URL.revokeObjectURL(img.flippedPreview);
      const result = await flipImage(img, flipHorizontal, flipVertical);
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
        if (img.flippedPreview) URL.revokeObjectURL(img.flippedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalPreview);
      if (img.flippedPreview) URL.revokeObjectURL(img.flippedPreview);
    });
    setImages([]);
  };

  // ============================================
  // DOWNLOADS
  // ============================================
  const downloadSingle = (img: FlippedImage) => {
    if (!img.flippedBlob) return;
    const url = URL.createObjectURL(img.flippedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const downloadAllAsZip = async () => {
    const done = images.filter((i) => i.status === 'done' && i.flippedBlob);
    if (done.length === 0) return;

    setBusy(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      done.forEach((img) => {
        if (img.flippedBlob) zip.file(img.outputName, img.flippedBlob);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `999tools_flipped_${Date.now()}.zip`;
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
  const totalFlippedSize = images
    .filter((i) => i.status === 'done')
    .reduce((s, i) => s + i.flippedSize, 0);
  const canFlip = flipHorizontal || flipVertical;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md">
            <FlipHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Photo Flip & Mirror</h2>
            <p className="text-xs text-slate-500">
              Mirror horizontally, flip vertically, or both
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
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-5 space-y-4">
        {/* Quick Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Quick Flip Options:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleMirrorH}
              className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                flipHorizontal
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-xs font-black">Mirror H</span>
            </button>
            <button
              onClick={handleFlipV}
              className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                flipVertical
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
              }`}
            >
              <FlipVertical className="w-4 h-4" />
              <span className="text-xs font-black">Flip V</span>
            </button>
            <button
              onClick={handleBoth}
              className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                flipHorizontal && flipVertical
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-xs font-black">Both (180°)</span>
            </button>
            <button
              onClick={handleReset}
              className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                !flipHorizontal && !flipVertical
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs font-black">Reset</span>
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Current Mode:</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
              canFlip ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {getFlipLabel(flipHorizontal, flipVertical)}
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>What each does:</strong><br />
            • <strong>Mirror H</strong> — Reverse left-right (like a mirror)<br />
            • <strong>Flip V</strong> — Reverse top-bottom (upside down)<br />
            • <strong>Both</strong> — 180° rotate effect
          </p>
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
              ? 'border-cyan-500 bg-cyan-50 scale-[1.01]'
              : 'border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/30'
          }`}
        >
          <div className="w-16 h-16 mx-auto bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-cyan-600" />
          </div>
          <h3 className="text-base font-black text-slate-800 mb-1">
            {dragActive ? 'Drop images here' : 'Upload Images'}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Click or drag & drop — Multiple images supported
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl">
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
                <div className="text-[10px] font-bold text-slate-500 uppercase">Flipped</div>
                <div className="text-lg font-black text-slate-900">{doneCount}/{images.length}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Original</div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatBytes(totalOriginalSize)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Flipped</div>
                <div className="text-sm font-black text-cyan-700 font-mono">
                  {formatBytes(totalFlippedSize)}
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
              onClick={flipAll}
              disabled={busy || !canFlip}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Flipping...
                </>
              ) : (
                <>
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  Flip All ({getFlipLabel(flipHorizontal, flipVertical)})
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
                  img.status === 'done' ? 'border-cyan-300' :
                  img.status === 'processing' ? 'border-cyan-300' :
                  'border-slate-200'
                }`}
              >
                <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                  {img.status === 'done' && img.flippedPreview ? (
                    <img src={img.flippedPreview} alt="Flipped" className="w-full h-full object-contain" />
                  ) : (
                    <img src={img.originalPreview} alt="Original" className="w-full h-full object-contain" />
                  )}

                  {img.status === 'processing' && (
                    <div className="absolute inset-0 bg-cyan-600/80 backdrop-blur flex items-center justify-center">
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
                    <div className="absolute top-2 left-2 bg-cyan-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> {img.appliedFlip}
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
                    <span className="text-slate-400">→</span>
                    <span className="font-mono font-bold text-cyan-700">
                      {img.originalWidth}×{img.originalHeight}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {formatBytes(img.originalSize)}
                    </span>
                    {img.status === 'done' && (
                      <span className="font-mono font-bold text-cyan-700">
                        {formatBytes(img.flippedSize)}
                      </span>
                    )}
                  </div>
                  {img.status === 'done' && (
                    <button
                      onClick={() => downloadSingle(img)}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition mt-2"
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
