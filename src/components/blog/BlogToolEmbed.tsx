import React, { useState } from 'react';
import {
  Sparkles, X, ArrowRight, Zap, Crown, Loader2,
  FileImage, Scissors, FileText, Image as ImageIcon,
  Droplet, Palette, Sun, Crop, Maximize2, FlipHorizontal,
  RotateCw, FileArchive, FilePlus, Layers,
} from 'lucide-react';
import { TOOLS_REGISTRY, PREMIUM_TOOL_IDS } from '../../data/toolsRegistry';
import { useApp } from '../../context/AppContext';

// ── Tool component imports ──
import ImageFormatConverter from '../tools/photo/ImageFormatConverter';
import ImageResizer from '../tools/photo/ImageResizer';
import ImageCompressor from '../tools/photo/ImageCompressor';
import PhotoRotator from '../tools/photo/PhotoRotator';
import PhotoFlip from '../tools/photo/PhotoFlip';
import BrightnessContrast from '../tools/photo/BrightnessContrast';
import BlackWhiteConverter from '../tools/photo/BlackWhiteConverter';
import PhotoBlur from '../tools/photo/PhotoBlur';
import PhotoSharpener from '../tools/photo/PhotoSharpener';
import PhotoCrop from '../tools/photo/PhotoCrop';
import ImageToPdf from '../tools/pdf/ImageToPdf';
import PdfMerge from '../tools/pdf/PdfMerge';
import PdfSplit from '../tools/pdf/PdfSplit';
import PdfCompress from '../tools/pdf/PdfCompress';
import PdfToImage from '../tools/pdf/PdfToImage';
import PdfRotate from '../tools/pdf/PdfRotate';

interface BlogToolEmbedProps {
  toolId: string;
  heading?: string;
  description?: string;
}

// ── Icon mapping per tool ──
const TOOL_ICONS: Record<string, React.ReactNode> = {
  ImageFormatConverter: <ImageIcon className="w-7 h-7" />,
  ImageResizer: <Maximize2 className="w-7 h-7" />,
  ImageCompressor: <Zap className="w-7 h-7" />,
  PhotoRotator: <RotateCw className="w-7 h-7" />,
  PhotoFlip: <FlipHorizontal className="w-7 h-7" />,
  BrightnessContrast: <Sun className="w-7 h-7" />,
  BlackWhiteConverter: <Palette className="w-7 h-7" />,
  PhotoBlur: <Droplet className="w-7 h-7" />,
  PhotoSharpener: <Sparkles className="w-7 h-7" />,
  PhotoCrop: <Crop className="w-7 h-7" />,
  ImageToPdf: <FileImage className="w-7 h-7" />,
  PdfMerge: <FilePlus className="w-7 h-7" />,
  PdfSplit: <Scissors className="w-7 h-7" />,
  PdfCompress: <FileArchive className="w-7 h-7" />,
  PdfToImage: <Layers className="w-7 h-7" />,
  PdfRotate: <RotateCw className="w-7 h-7" />,
};

const BlogToolEmbed: React.FC<BlogToolEmbedProps> = ({
  toolId,
  heading,
  description,
}) => {
  const { checkToolAccess, recordUsage, isUserPremium, showNotification } = useApp();
  const [showTool, setShowTool] = useState(false);
  const [loading, setLoading] = useState(false);

  const tool = TOOLS_REGISTRY.find((t) => t.id === toolId);

  if (!tool) {
    console.warn(`⚠️ BlogToolEmbed: Tool not found — ${toolId}`);
    return null;
  }

  const isPremium = PREMIUM_TOOL_IDS.includes(toolId);
  const userPremium = isUserPremium();

  const handleTryTool = async () => {
    // Non-premium or paid user → open directly
    if (!isPremium || userPremium) {
      setShowTool(true);
      return;
    }

    // Premium tool + free user → check daily limit
    setLoading(true);
    try {
      const access = await checkToolAccess(toolId);
      if (!access.allowed || access.remaining <= 0) {
        showNotification('❌ Daily free limit reached (3/day). Upgrade to Premium.');
        window.dispatchEvent(new Event('openPricingModal'));
        return;
      }
      setShowTool(true);
    } catch (err) {
      console.error('BlogToolEmbed access check failed:', err);
      setShowTool(true); // fail open
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setShowTool(false);

  const renderToolComponent = () => {
    switch (tool.componentKey) {
      case 'ImageFormatConverter': return <ImageFormatConverter onClose={handleClose} />;
      case 'ImageResizer': return <ImageResizer onClose={handleClose} />;
      case 'ImageCompressor': return <ImageCompressor onClose={handleClose} />;
      case 'PhotoRotator': return <PhotoRotator onClose={handleClose} />;
      case 'PhotoFlip': return <PhotoFlip onClose={handleClose} />;
      case 'BrightnessContrast': return <BrightnessContrast onClose={handleClose} />;
      case 'BlackWhiteConverter': return <BlackWhiteConverter onClose={handleClose} />;
      case 'PhotoBlur': return <PhotoBlur onClose={handleClose} />;
      case 'PhotoSharpener': return <PhotoSharpener onClose={handleClose} />;
      case 'PhotoCrop': return <PhotoCrop onClose={handleClose} />;
      case 'ImageToPdf': return <ImageToPdf onClose={handleClose} />;
      case 'PdfMerge': return <PdfMerge onClose={handleClose} />;
      case 'PdfSplit': return <PdfSplit onClose={handleClose} />;
      case 'PdfCompress': return <PdfCompress onClose={handleClose} />;
      case 'PdfToImage': return <PdfToImage onClose={handleClose} />;
      case 'PdfRotate': return <PdfRotate onClose={handleClose} />;
      default:
        return (
          <div className="p-12 text-center text-slate-400">
            Tool component: {tool.componentKey} — not found
          </div>
        );
    }
  };

  return (
    <>
      {/* ── EMBED CARD ── */}
      <div className="my-8 rounded-3xl overflow-hidden border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 shadow-2xl relative">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
            {TOOL_ICONS[tool.componentKey] || <Zap className="w-7 h-7" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                🚀 Tool #{String(tool.num).padStart(3, '0')}
              </span>
              {isPremium && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  userPremium
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <Crown className="w-2.5 h-2.5" />
                  {userPremium ? 'PRO UNLOCKED' : 'PRO'}
                </span>
              )}
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                ⚡ 100% FREE
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white mb-2 leading-tight">
              {heading || `Try ${tool.name} — Live`}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {description || `${tool.description} Ye tool bilkul free hai — koi signup nahi, koi watermark nahi, 100% private (browser mein process hota hai).`}
            </p>

            <button
              onClick={handleTryTool}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Try {tool.shortName || tool.name} Now
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 mt-3">
              💡 Click karo → tool khulega → upload karo → download karo. Bas 3 steps.
            </p>
          </div>
        </div>
      </div>

      {/* ── TOOL MODAL (renders directly — tools already have full-screen modals) ── */}
      {showTool && renderToolComponent()}
    </>
  );
};

export default BlogToolEmbed;
