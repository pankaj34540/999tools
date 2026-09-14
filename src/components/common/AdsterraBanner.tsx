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

  // 🆕 Check if user should see ads
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
  // ✅ FIXED INJECTION LOGIC
  // ============================================
  useEffect(() => {
    if (!userCanSeeAds) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!isActive || !adCode.trim()) return;

    try {
      // ── STEP 1: Try to parse Adsterra iframe format ──
      let keyMatch = adCode.match(/'key'\s*:\s*'([^']+)'/);
      let widthMatch = adCode.match(/'width'\s*:\s*(\d+)/);
      let heightMatch = adCode.match(/'height'\s*:\s*(\d+)/);
      let formatMatch = adCode.match(/'format'\s*:\s*'([^']+)'/);

      // Fallback: extract key from invoke.js URL if not in atOptions
      if (!keyMatch) {
        const urlMatch = adCode.match(/highperformanceformat\.com\/([a-f0-9]+)\/invoke\.js/i);
        if (urlMatch) {
          keyMatch = [urlMatch[0], urlMatch[1]];
        }
      }

      // ── STEP 2: If iframe format detected, render iframe directly ──
      if (keyMatch && keyMatch[1] && (!formatMatch || formatMatch[1] === 'iframe')) {
        const adKey = keyMatch[1];
        const width = widthMatch ? widthMatch[1] : '728';
        const height = heightMatch ? heightMatch[1] : '90';

        const iframe = document.createElement('iframe');
        iframe.src = `//www.highperformanceformat.com/${adKey}/invoke.html`;
        iframe.width = width;
        iframe.height = height;
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.margin = '0 auto';
        iframe.style.maxWidth = '100%';
        iframe.setAttribute('data-999tools-ad', slot);
        iframe.setAttribute('title', `${slotLabel} Ad`);

        container.appendChild(iframe);
        console.log(`✅ [${slot}] iframe ad injected (${width}x${height}, key: ${adKey.substring(0, 8)}...)`);
        return;
      }

      // ── STEP 3: Fallback — re-create scripts manually (innerHTML scripts don't run) ──
      console.log(`⚙️ [${slot}] Using script re-creation fallback`);

      // Extract scripts from adCode using DOMParser (safer)
      const parser = new DOMParser();
      const doc = parser.parseFromString(adCode, 'text/html');
      const scripts = doc.querySelectorAll('script');
      const nonScriptNodes: Node[] = [];
      doc.body.childNodes.forEach((node) => {
        if (node.nodeName !== 'SCRIPT') {
          nonScriptNodes.push(node.cloneNode(true));
        }
      });

      // Add non-script nodes first (like divs with class)
      nonScriptNodes.forEach((node) => container.appendChild(node));

      // Add scripts one-by-one, browser WILL execute these
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = true;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        // Copy all attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.setAttribute('data-999tools-ad', slot);
        container.appendChild(newScript);
      });

      console.log(`✅ [${slot}] script ad injected (${scripts.length} script(s))`);
    } catch (err) {
      console.warn(`❌ [${slot}] ad injection failed:`, err);
      // Last-resort fallback
      container.innerHTML = adCode;
    }
  }, [isActive, adCode, slot, userCanSeeAds]);

  // ✅ NOW safe to return null — after all hooks
  if (!userCanSeeAds) {
    return null;
  }

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
// SOCIAL BAR INJECTOR
// ============================================
export const SocialBarInjector: React.FC = () => {
  const { siteConfig, currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const injected = useRef(false);

  // ✅ Compute values BEFORE hooks
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
