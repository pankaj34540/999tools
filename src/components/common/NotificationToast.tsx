import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification } = useApp();

  if (!notification) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] bg-slate-900 text-white border border-amber-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 text-xs font-semibold max-w-sm">
      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
      <span>{notification}</span>
    </div>
  );
};
