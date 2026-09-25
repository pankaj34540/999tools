import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Clock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AD_SLOTS } from '../../data/adSlots';
import { injectAdCode } from './AdsterraBanner';

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteConfig.adsterra;
  const adActive = adConfig?.enabled && adConfig?.downloadPopupActive;
  const adHtml = AD_SLOTS.download_popup?.html || '';

  // Inject ad
  useEffect(() => {
    if (!adActive || !adHtml.trim() || !containerRef.current) return;
    injectAdCode(containerRef.current, adHtml, 'download_popup');
  }, [adActive, adHtml]);

  // Countdown
  useEffect(() => {
    if (!adActive) {
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
  }, [adActive, skipDelaySeconds]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden">

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

        {/* Ad body */}
        <div className="p-6 bg-slate-950 min-h-[340px] flex items-center justify-center">
          {adActive && adHtml.trim() ? (
            <div ref={containerRef} className="w-full flex items-center justify-center" />
          ) : (
            <div className="text-center text-slate-400 text-sm max-w-md">
              <p className="font-bold text-white mb-2 text-base">⚠️ Ad not configured</p>
              <p className="text-xs leading-relaxed">
                Owner: Paste Adsterra Download Popup code in{' '}
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                  src/data/adSlots.ts
                </code>{' '}
                → <code className="text-amber-300">download_popup.html</code>
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
