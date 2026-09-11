import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, ExternalLink, ShieldCheck } from 'lucide-react';

interface AdsterraBannerProps {
  slot: 'header' | 'tool_in_content' | 'sidebar' | 'social_bar';
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ slot, className = '' }) => {
  const { siteConfig } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteConfig.adsterra;

  // Determine active status and ad code based on slot
  let isActive = false;
  let adCode = '';
  let slotLabel = '';
  let recommendedSize = '';

  if (slot === 'header') {
    isActive = adConfig?.enabled && adConfig?.headerBannerActive;
    adCode = adConfig?.headerBannerCode || '';
    slotLabel = 'Header Banner (Leaderboard)';
    recommendedSize = '728x90 or Responsive Banner';
  } else if (slot === 'tool_in_content') {
    isActive = adConfig?.enabled && adConfig?.toolBannerActive;
    adCode = adConfig?.toolBannerCode || '';
    slotLabel = 'Tool Workspace Banner';
    recommendedSize = '468x60 / 300x250 Native or Banner';
  } else if (slot === 'sidebar') {
    isActive = adConfig?.enabled && adConfig?.sidebarAdActive;
    adCode = adConfig?.sidebarAdCode || '';
    slotLabel = 'Sidebar Banner';
    recommendedSize = '300x250 or 160x600 Skyscraper';
  } else if (slot === 'social_bar') {
    isActive = adConfig?.enabled && adConfig?.socialBarActive;
    adCode = adConfig?.socialBarCode || '';
    slotLabel = 'Social Bar / Push Notification Ad';
    recommendedSize = 'Adsterra Social Bar Script';
  }

  // Effect to safely inject raw script/html if provided
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Clear previous
    container.innerHTML = '';

    if (isActive && adCode.trim().length > 0) {
      try {
        // If it looks like a script tag, dynamically execute
        const range = document.createRange();
        range.selectNode(container);
        const fragment = range.createContextualFragment(adCode);
        container.appendChild(fragment);
      } catch (err) {
        console.warn('Adsterra code load fallback:', err);
        container.innerHTML = adCode;
      }
    }
  }, [isActive, adCode]);

  if (!isActive && !adConfig?.testMode) {
    return null;
  }

  // If active and has real code, render injected container
  if (isActive && adCode.trim().length > 0) {
    return (
      <div className={`adsterra-ad-container my-3 overflow-hidden text-center flex flex-col items-center justify-center ${className}`}>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Sponsored Advertisement</div>
        <div ref={containerRef} className="min-h-[60px] flex items-center justify-center w-full" />
      </div>
    );
  }

  // If in test mode or code is empty, show clean preview placeholder for admin/owner confidence
  return (
    <div className={`my-2.5 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-slate-800 text-center flex flex-col items-center justify-center gap-1 transition shadow-xs ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
        <Megaphone className="w-3.5 h-3.5 text-amber-600" />
        <span>Adsterra Ad Slot: {slotLabel}</span>
        <span className="text-[10px] font-semibold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-sm">
          {recommendedSize}
        </span>
      </div>
      <p className="text-[11px] text-slate-600 max-w-md">
        {adConfig?.enabled 
          ? 'Slot is active. Paste your Adsterra banner script in the Owner Panel → Adsterra Ads Manager to display live ads.'
          : 'Ad slot paused. You can activate this in the Owner Panel.'}
      </p>
    </div>
  );
};

// Helper hook for triggering Direct Link / Popunder Adsterra on key action
let clickCounter = 0;
export const useAdsterraDirectLink = () => {
  const { siteConfig } = useApp();

  const triggerDirectLink = () => {
    const config = siteConfig.adsterra;
    if (!config || !config.enabled || !config.directLinkActive || !config.directLinkUrl) {
      return;
    }

    clickCounter++;
    const freq = config.directLinkFrequency || 1;

    // Trigger according to frequency (e.g. 1 = every click, 2 = every 2nd click)
    if (clickCounter % freq === 0) {
      try {
        const win = window.open(config.directLinkUrl, '_blank');
        if (win) {
          win.blur();
          window.focus();
        }
      } catch (e) {
        console.log('Direct link triggered');
      }
    }
  };

  return { triggerDirectLink };
};
