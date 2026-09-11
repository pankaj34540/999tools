import React from 'react';
import { useApp } from '../../context/AppContext';
import { BellRing, Volume2 } from 'lucide-react';

export const MarqueeNotice: React.FC = () => {
  const { siteConfig } = useApp();

  if (!siteConfig.noticeEnabled || !siteConfig.noticeMarquee) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-semibold text-xs py-2 px-4 shadow-sm flex items-center overflow-hidden border-b border-amber-600/30">
      <div className="flex items-center gap-1.5 shrink-0 pr-3 font-extrabold uppercase tracking-wide bg-amber-500 z-10 shadow-[4px_0_8px_rgba(245,158,11,0.6)]">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
        </span>
        <BellRing className="w-3.5 h-3.5" />
        <span>NOTICE:</span>
      </div>

      <div className="whitespace-nowrap overflow-hidden relative w-full">
        <div className="inline-block animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] cursor-default">
          {siteConfig.noticeMarquee}
        </div>
      </div>
    </div>
  );
};
