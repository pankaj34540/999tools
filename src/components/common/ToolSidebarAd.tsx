import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AD_SLOTS } from '../../data/adSlots';
import { injectAdCode, shouldShowAdsToUser } from './AdsterraBanner';

interface ToolSidebarAdProps {
  slotKey: 'tool_sidebar_left' | 'tool_sidebar_right';
}

const ToolSidebarAd: React.FC<ToolSidebarAdProps> = ({ slotKey }) => {
  const { siteConfig, currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const ref = useRef<HTMLDivElement | null>(null);

  const userCanSeeAds = shouldShowAdsToUser(
    ownerAuthenticated,
    currentUser,
    isUserPremium,
    activeVle
  );

  const adConfig = siteConfig.adsterra;
  const isActive = adConfig?.enabled && adConfig?.toolSidebarActive;
  const slot = AD_SLOTS[slotKey];

  useEffect(() => {
    if (!userCanSeeAds) return;
    if (!isActive || !slot?.html?.trim() || !ref.current) return;
    injectAdCode(ref.current, slot.html, slotKey);
  }, [userCanSeeAds, isActive, slot, slotKey]);

  if (!userCanSeeAds || !isActive || !slot) return null;

  return (
    <aside className="hidden xl:flex flex-col items-center gap-2 w-[160px] shrink-0">
      <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sponsored</div>
      <div
        ref={ref}
        className="w-[160px] min-h-[600px] bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden"
      />
    </aside>
  );
};

export default ToolSidebarAd;
