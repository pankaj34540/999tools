import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone } from 'lucide-react';
import { AD_SLOTS } from '../../data/adSlots';

interface AdsterraBannerProps {
  slot: 'header' | 'tool_in_content' | 'sidebar' | 'native_banner' | 'social_bar';
  className?: string;
}

// ── Shared helper: inject Adsterra code safely ──
export const injectAdCode = (container: HTMLElement, html: string, slotKey: string) => {
  container.innerHTML = '';
  if (!html.trim()) return;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="ad-root">${html}</div>`, 'text/html');
    const root = doc.getElementById('ad-root');
    if (!root) return;

    const scripts = Array.from(root.querySelectorAll('script'));
    const nonScripts = Array.from(root.childNodes).filter(n => n.nodeName !== 'SCRIPT');
    nonScripts.forEach(n => container.appendChild(n.cloneNode(true)));

    scripts.forEach(oldScript => {
      const s = document.createElement('script');
      s.setAttribute('data-999tools-ad', slotKey);
      Array.from(oldScript.attributes).forEach(a => s.setAttribute(a.name, a.value));
      if (oldScript.src) {
        let src = oldScript.src;
        if (src.startsWith('//')) src = window.location.protocol + src;
        s.src = src;
        s.async = true;
      } else if (oldScript.textContent) {
        s.textContent = oldScript.textContent;
      }
      container.appendChild(s);
    });
  } catch (err) {
    console.error(`❌ [${slotKey}] Ad injection failed:`, err);
  }
};

// ── Shared helper: check if ads should show ──
export const shouldShowAdsToUser = (
  ownerAuthenticated: boolean,
  currentUser: any,
  isUserPremium: () => boolean,
  activeVle: any
): boolean => {
  if (ownerAuthenticated) return false;
  if (currentUser?.plan === 'premium' && isUserPremium()) return false;
  if (currentUser?.plan === 'vle' || activeVle) return false;
  return true;
};

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ slot, className = '' }) => {
  const { siteConfig, currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteConfig.adsterra;
  const userCanSeeAds = shouldShowAdsToUser(
    ownerAuthenticated,
    currentUser,
    isUserPremium,
    activeVle
  );

  let isActive = false;
  let slotKey = '';
  let slotLabel = '';
  let recommendedSize = '';

  if (slot === 'header') {
    isActive = adConfig?.enabled && adConfig?.headerBannerActive;
    slotKey = 'header';
    slotLabel = 'Header Banner';
    recommendedSize = '728x90';
  } else if (slot === 'tool_in_content') {
    isActive = adConfig?.enabled && adConfig?.toolBannerActive;
    slotKey = 'tool_banner';
    slotLabel = 'Tool Workspace Banner';
    recommendedSize = '300x250';
  } else if (slot === 'sidebar') {
    isActive = adConfig?.enabled && adConfig?.sidebarAdActive;
    slotKey = 'sidebar';
    slotLabel = 'Sidebar Banner';
    recommendedSize = '160x600';
  } else if (slot === 'native_banner') {
    isActive = adConfig?.enabled && adConfig?.nativeBannerActive;
    slotKey = 'native_banner';
    slotLabel = 'Native Banner';
    recommendedSize = 'Native';
  } else if (slot === 'social_bar') {
    isActive = adConfig?.enabled && adConfig?.socialBarActive;
    slotKey = 'social_bar';
    slotLabel = 'Social Bar';
    recommendedSize = 'Adsterra Social Bar';
  }

  const adCode = AD_SLOTS[slotKey]?.html || '';

  useEffect(() => {
    if (!userCanSeeAds) return;
    if (!containerRef.current) return;
    if (!isActive || !adCode.trim()) {
      if (containerRef.current) containerRef.current.innerHTML = '';
      return;
    }
    injectAdCode(containerRef.current, adCode, slotKey);
  }, [isActive, adCode, slotKey, userCanSeeAds]);

  if (!userCanSeeAds) return null;
  if (!isActive && !adConfig?.testMode) return null;

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
          ? 'Add Adsterra code in src/data/adSlots.ts (GitHub)'
          : 'Ad slot paused. Activate from Owner Panel.'}
      </p>
    </div>
  );
};

// ============================================
// SOCIAL BAR INJECTOR
// ============================================
export const SocialBarInjector: React.FC = () => {
  const { siteConfig, currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const injected = useRef(false);

  const shouldInject = shouldShowAdsToUser(
    ownerAuthenticated,
    currentUser,
    isUserPremium,
    activeVle
  );

  useEffect(() => {
    if (injected.current) return;
    if (!shouldInject) {
      console.log('✅ Social Bar skipped — user is paid/owner');
      return;
    }

    const config = siteConfig.adsterra;
    if (!config?.enabled || !config?.socialBarActive) return;

    const code = AD_SLOTS.social_bar?.html || '';
    if (!code.trim()) return;

    document.querySelectorAll('script[data-999tools-socialbar]').forEach(el => el.remove());

    try {
      const temp = document.createElement('div');
      temp.innerHTML = code;
      const scripts = temp.querySelectorAll('script');

      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.setAttribute('data-999tools-socialbar', 'true');
        if (oldScript.src) {
          let src = oldScript.src;
          if (src.startsWith('//')) src = window.location.protocol + src;
          newScript.src = src;
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
  }, [siteConfig.adsterra, shouldInject]);

  return null;
};

// ============================================
// DIRECT LINK (Optional)
// ============================================
let clickCounter = 0;
export const useAdsterraDirectLink = () => {
  const { siteConfig, currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();

  const triggerDirectLink = () => {
    if (!shouldShowAdsToUser(ownerAuthenticated, currentUser, isUserPremium, activeVle)) return;

    const config = siteConfig.adsterra;
    if (!config || !config.enabled || !config.directLinkActive || !config.directLinkUrl) return;

    clickCounter++;
    const freq = config.directLinkFrequency || 1;

    if (clickCounter % freq === 0) {
      try {
        const win = window.open(config.directLinkUrl, '_blank');
        if (win) { win.blur(); window.focus(); }
      } catch {}
    }
  };

  return { triggerDirectLink };
};
