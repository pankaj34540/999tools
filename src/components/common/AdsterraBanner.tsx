import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, ExternalLink } from 'lucide-react';

interface AdsterraBannerProps {
  slot: 'header' | 'tool_in_content' | 'sidebar' | 'native_banner' | 'social_bar';
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ slot, className = '' }) => {
  const { siteConfig } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteConfig.adsterra;

  let isActive = false;
  let adCode = '';
  let slotLabel = '';
  let recommendedSize = '';

  if (slot === 'header') {
    isActive = adConfig?.enabled && adConfig?.headerBannerActive;
    adCode = adConfig?.headerBannerCode || '';
    slotLabel = 'Header Banner (Leaderboard)';
    recommendedSize = '728x90';
  } else if (slot === 'tool_in_content') {
    isActive = adConfig?.enabled && adConfig?.toolBannerActive;
    adCode = adConfig?.toolBannerCode || '';
    slotLabel = 'Tool Workspace Banner';
    recommendedSize = '300x250';
  } else if (slot === 'sidebar') {
    isActive = adConfig?.enabled && adConfig?.sidebarAdActive;
    adCode = adConfig?.sidebarAdCode || '';
    slotLabel = 'Sidebar Banner';
    recommendedSize = '160x600';
  } else if (slot === 'native_banner') {
    isActive = adConfig?.enabled && adConfig?.nativeBannerActive;
    adCode = adConfig?.nativeBannerCode || '';
    slotLabel = 'Native Banner';
    recommendedSize = 'Native / Responsive';
  } else if (slot === 'social_bar') {
    isActive = adConfig?.enabled && adConfig?.socialBarActive;
    adCode = adConfig?.socialBarCode || '';
    slotLabel = 'Social Bar';
    recommendedSize = 'Adsterra Social Bar';
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    if (isActive && adCode.trim().length > 0) {
      try {
        const range = document.createRange();
        range.selectNode(container);
        const fragment = range.createContextualFragment(adCode);
        container.appendChild(fragment);
        console.log(`✅ ${slot} ad injected`);
      } catch (err) {
        console.warn(`${slot} ad fallback:`, err);
        container.innerHTML = adCode;
      }
    }
  }, [isActive, adCode, slot]);

  if (!isActive && !adConfig?.testMode) {
    return null;
  }

  if (isActive && adCode.trim().length > 0) {
    return (
      <div className={`adsterra-ad-container my-3 overflow-hidden text-center flex flex-col items-center justify-center ${className}`}>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Sponsored</div>
        <div ref={containerRef} className="min-h-[60px] flex items-center justify-center w-full" />
      </div>
    );
  }

  return (
    <div className={`my-2.5 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-slate-800 text-center flex flex-col items-center justify-center gap-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
        <Megaphone className="w-3.5 h-3.5 text-amber-600" />
        <span>Ad Slot: {slotLabel}</span>
        <span className="text-[10px] font-semibold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-sm">
          {recommendedSize}
        </span>
      </div>
      <p className="text-[11px] text-slate-600 max-w-md">
        {adConfig?.enabled
          ? 'Paste your Adsterra code in Owner Panel → Adsterra Ads Manager.'
          : 'Ad slot paused. Activate from Owner Panel.'}
      </p>
    </div>
  );
};

// ============================================
// SOCIAL BAR INJECTOR (Global — runs once)
// ============================================
export const SocialBarInjector: React.FC = () => {
  const { siteConfig } = useApp();
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;

    const config = siteConfig.adsterra;
    if (!config?.enabled || !config?.socialBarActive || !config?.socialBarCode) {
      return;
    }

    // Remove any existing social bar scripts
    document.querySelectorAll('script[data-999tools-socialbar]').forEach((el) => el.remove());

    try {
      // Extract script src from the code
      const temp = document.createElement('div');
      temp.innerHTML = config.socialBarCode;
      const scripts = temp.querySelectorAll('script');

      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        newScript.setAttribute('data-999tools-socialbar', 'true');
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = true;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        document.body.appendChild(newScript);
      });

      injected.current = true;
      console.log('✅ Social Bar injected globally');
    } catch (err) {
      console.error('Social Bar injection failed:', err);
    }
  }, [siteConfig.adsterra]);

  return null;
};

// ============================================
// DIRECT LINK (Optional — for future use)
// ============================================
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
