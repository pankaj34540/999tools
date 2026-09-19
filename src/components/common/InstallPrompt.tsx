import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('999tools_install_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);

    // Don't show if dismissed in last 24 hours
    if (hoursSinceDismissed < 24) return;

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    if (iOS && !standalone) {
      // iOS doesn't support beforeinstallprompt event
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // Android/Desktop - listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS instructions
      alert(
        'iPhone/iPad pe install karne ke liye:\n\n' +
        '1. Safari ke bottom mein "Share" button (⬆️) tap karo\n' +
        '2. "Add to Home Screen" option select karo\n' +
        '3. "Add" tap karo\n\n' +
        'Bas! Icon home screen pe aa jayega.'
      );
      handleDismiss();
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('999tools_install_dismissed', String(Date.now()));
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
          999
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Install App
            </span>
          </div>
          <h4 className="text-sm font-black text-white truncate">
            999tools ko install karo
          </h4>
          <p className="text-[11px] text-slate-400 truncate">
            Fast access — home screen pe icon
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIOS ? 'How' : 'Install'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
