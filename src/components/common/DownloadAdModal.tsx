import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AD_SLOTS } from '../../data/adSlots';
import { injectAdCode } from './AdsterraBanner';
import { getRandomPromotion } from '../../services/promotionService';
import { Promotion } from '../../types';

interface DownloadAdModalProps {
  onComplete: () => void;
  onCancel: () => void;
  fileName?: string;
  skipDelaySeconds?: number;
}

const DownloadAdModal: React.FC<DownloadAdModalProps> = ({
  onComplete,
  onCancel,
  fileName,
  skipDelaySeconds = 5,
}) => {
  const { siteConfig } = useApp();
  const [countdown, setCountdown] = useState(skipDelaySeconds);
  const [canSkip, setCanSkip] = useState(false);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteConfig.adsterra;
  const adActive = adConfig?.enabled && adConfig?.downloadPopupActive;
  const adHtml = AD_SLOTS.download_popup?.html || '';

  // Fetch random promotion on mount
  useEffect(() => {
    let cancelled = false;
    getRandomPromotion().then((promo) => {
      if (!cancelled) setPromotion(promo);
    });
    return () => { cancelled = true; };
  }, []);

  // Inject Adsterra ad
  useEffect(() => {
    if (!adActive || !adHtml.trim() || !containerRef.current) return;
    injectAdCode(containerRef.current, adHtml, 'download_popup');
  }, [adActive, adHtml]);

  // Countdown
  useEffect(() => {
    if (!adActive && !promotion) {
      setCanSkip(true);
      return;
    }
    setCountdown(skipDelaySeconds);
    setCanSkip(false);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [adActive, promotion, skipDelaySeconds]);

  const hasAd = adActive && adHtml.trim().length > 0;
  const hasPromo = !!promotion;
  const showSideBySide = hasAd && hasPromo;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full overflow-hidden my-4 ${showSideBySide ? 'max-w-4xl' : 'max-w-2xl'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-sm">
              {canSkip ? '✅ You can download now' : `⏳ Please wait ${countdown}s`}
            </span>
          </div>
          {canSkip && (
            <button
              onClick={onComplete}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
            >
              Skip Ad →
            </button>
          )}
        </div>

        {/* Body */}
        <div className={`p-5 bg-slate-950 ${showSideBySide ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex items-center justify-center'} min-h-[340px]`}>

          {/* Adsterra Ad (Left or Center) */}
          {hasAd && (
            <div className={`flex flex-col ${showSideBySide ? '' : 'w-full items-center'}`}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
                Sponsored
              </div>
              <div
                ref={containerRef}
                className={`min-h-[250px] flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-lg w-full ${showSideBySide ? '' : 'max-w-md'}`}
              />
            </div>
          )}

          {/* Promotion Card (Right or Center) */}
          {hasPromo && (
            <div className={`flex flex-col ${showSideBySide ? '' : 'w-full items-center'}`}>
              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider text-center mb-2 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Featured
              </div>
              <a
                href={promotion!.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950 border-2 border-pink-500/40 hover:border-pink-500 rounded-xl overflow-hidden transition-all hover:scale-[1.02] w-full ${showSideBySide ? '' : 'max-w-md'}`}
              >
                {/* Image */}
                {promotion!.imageUrl ? (
                  <div className="h-32 bg-slate-900 overflow-hidden">
                    <img
                      src={promotion!.imageUrl}
                      alt={promotion!.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white/50" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h4 className="text-white font-bold text-sm leading-tight group-hover:text-pink-300 transition">
                    {promotion!.title}
                  </h4>
                  {promotion!.description && (
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                      {promotion!.description}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-lg mt-2 group-hover:from-pink-400 group-hover:to-purple-500 transition">
                    <span>{promotion!.ctaText || 'Learn More'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            </div>
          )}

          {/* Fallback: Nothing configured */}
          {!hasAd && !hasPromo && (
            <div className="text-center text-slate-400 text-sm max-w-md">
              <p className="font-bold text-white mb-2 text-base">⚠️ Nothing configured</p>
              <p className="text-xs leading-relaxed">
                Owner: Configure Adsterra download popup or add a promotion in Owner Panel.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-400 truncate max-w-xs">
            {fileName && <span>📄 {fileName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={onComplete}
              disabled={!canSkip}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition shadow-lg"
            >
              {canSkip ? (
                <>
                  <Download className="w-3.5 h-3.5" /> Download Now
                </>
              ) : (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Wait {countdown}s...
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DownloadAdModal;
