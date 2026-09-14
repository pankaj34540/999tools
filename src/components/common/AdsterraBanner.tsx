import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone } from 'lucide-react';

interface AdsterraBannerProps {
  slot: 'header' | 'tool_in_content' | 'sidebar' | 'native_banner' | 'social_bar';
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ slot, className = '' }) => {
  const { siteConfig, currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteConfig.adsterra;

  const shouldShowAds = () => {
    if (ownerAuthenticated) return false;
    if (currentUser?.plan === 'premium' && isUserPremium()) return false;
    if (currentUser?.plan === 'vle' || activeVle) return false;
    return true;
  };

  const userCanSeeAds = shouldShowAds();

  let isActive = false;
  let adCode = '';
  let slotLabel = '';
  let recommendedSize = '';

  if (slot === 'header') {
    isActive = adConfig?.enabled && adConfig?.headerBannerActive;
    adCode = adConfig?.headerBannerCode || '';
    slotLabel = 'Header Banner';
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
    recommendedSize = 'Native';
  } else if (slot === 'social_bar') {
    isActive = adConfig?.enabled && adConfig?.socialBarActive;
    adCode = adConfig?.socialBarCode || '';
    slotLabel = 'Social Bar';
    recommendedSize = 'Adsterra Social Bar';
  }

  // ============================================
  // ✅ Adsterra canonical script injection
  // ============================================
  useEffect(() => {
    if (!userCanSeeAds) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!isActive || !adCode.trim()) {
      console.log(`⏸️ [${slot}] Skipped (isActive: ${isActive}, code: ${adCode.length} chars)`);
      return;
    }

    try {
      // Parse the adCode with DOMParser (safe, no script execution yet)
      const doc = new DOMParser().parseFromString(
        `<div id="adsterra-root">${adCode}</div>`,
        'text/html'
      );
      const root = doc.getElementById('adsterra-root');

      if (!root) {
        console.warn(`⚠️ [${slot}] Could not parse adCode`);
        return;
      }

      const nodes = Array.from(root.childNodes);
      let scriptCount = 0;
      let inlineCount = 0;

      // Process in ORDER — atOptions must run BEFORE invoke.js
      nodes.forEach((node) => {
        if (node.nodeName === 'SCRIPT') {
          const oldScript = node as HTMLScriptElement;
          const newScript = document.createElement('script');

          // Copy all attributes
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.src) {
            // External script — make protocol-relative respect HTTPS
            let src = oldScript.src;
            if (src.startsWith('//')) {
              src = window.location.protocol + src;
            }
            newScript.src = src;
            newScript.async = true;
            console.log(`  📎 [${slot}] External: ${src}`);
          } else if (oldScript.textContent) {
            // Inline script (like atOptions) — browser will execute
            newScript.textContent = oldScript.textContent;
            console.log(`  📎 [${slot}] Inline: ${oldScript.textContent.trim().substring(0, 80)}...`);
          }

          newScript.setAttribute('data-999tools-ad', slot);
          container.appendChild(newScript);
          scriptCount++;
        } else if (node.nodeType === 1 || node.nodeType === 3) {
          // Element or text node — clone it
          container.appendChild(node.cloneNode(true));
          inlineCount++;
        }
      });

      console.log(`✅ [${slot}] Injected ${scriptCount} script(s) + ${inlineCount} node(s)`);
    } catch (err) {
      console.error(`❌ [${slot}] Injection failed:`, err);
    }
  }, [isActive, adCode, slot, userCanSeeAds]);

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
          ? 'Paste your Adsterra code in Owner Panel → Adsterra Ads Manager.'
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

  const shouldInject =
    !ownerAuthenticated &&
    !(currentUser?.plan === 'premium' && isUserPremium()) &&
    !(currentUser?.plan === 'vle' || activeVle);

  useEffect(() => {
    if (injected.current) return;
    if (!shouldInject) {
      console.log('✅ Social Bar skipped — user is paid/owner');
      return;
    }

    const config = siteConfig.adsterra;
    if (!config?.enabled || !config?.socialBarActive || !config?.socialBarCode) {
      return;
    }

    document.querySelectorAll('script[data-999tools-socialbar]').forEach((el) => el.remove());

    try {
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
    if (ownerAuthenticated) return;
    if (currentUser?.plan === 'premium' && isUserPremium()) return;
    if (currentUser?.plan === 'vle' || activeVle) return;

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
