import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  ShieldAlert, 
  Crown, 
  Store, 
  User, 
  Wallet, 
  Wrench, 
  PhoneCall, 
  Layers,
  Lock,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { VleRegistrationModal } from '../vle/VleRegistrationModal';

export const Header: React.FC = () => {
  const { 
    role, 
    setRole, 
    siteConfig, 
    activeVle, 
    vles, 
    setActiveVle,
    setActiveTool,
    showNotification,
    ownerAuthenticated
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleRoleSelect = (targetRole: UserRole) => {
    setRole(targetRole);
    setShowRoleMenu(false);
    if (targetRole === 'owner') {
      showNotification('👑 Accessing Master Owner Command Center');
    } else {
      showNotification(`Switched to ${targetRole === 'vle' ? 'CSC VLE / Cyber Cafe Portal' : 'Public User Portal'}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        {/* Top Mini Info Bar */}
        <div className="bg-slate-950 px-4 py-1 text-[11px] flex flex-wrap items-center justify-between text-slate-400 border-b border-slate-900">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              🇮🇳 National Digital Services & VLE Utility Hub
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">Govt Exam Form Assist & Cyber Cafe Suite</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              Helpdesk: {siteConfig.supportPhone}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 font-mono">UPI: {siteConfig.upiId}</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setRole('user')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-md group-hover:scale-105 transition">
                999
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                    {siteConfig.siteName}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 rounded tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                  CSC VLE • Cyber Cafe • User Utility
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tools Launch Shortcuts */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTool('passport')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            >
              📷 Photo Sheet
            </button>
            <button
              onClick={() => setActiveTool('resizer')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            >
              📐 Exam Resizer
            </button>
            <button
              onClick={() => setActiveTool('aadhaar')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            >
              💳 CR80 Smart Card
            </button>
            <button
              onClick={() => setActiveTool('resume')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            >
              📄 Bio-Data
            </button>
            <button
              onClick={() => setActiveTool('age')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            >
              📅 Age Calc
            </button>
          </div>

          {/* Role Switcher & Operator Profile */}
          <div className="flex items-center gap-2.5">
            {/* VLE Registration CTA Button */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition"
              title="Apply for Lifetime CSC VLE / Cyber Cafe VIP Portal Access"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VLE Registration</span>
              <span className="sm:hidden">Join VLE</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] font-mono font-black">
                ₹{siteConfig.vleOneTimeFee || 299}
              </span>
            </button>

            {/* Owner Master Badge (if Owner role) */}
            {role === 'owner' && (
              <div className="hidden md:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-xs text-amber-300 font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Owner Master Control</span>
              </div>
            )}

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="role-switcher-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                  role === 'owner'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                    : role === 'vle'
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                    : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-750'
                }`}
              >
                {role === 'owner' && <Crown className="w-4 h-4" />}
                {role === 'vle' && <Store className="w-4 h-4" />}
                {role === 'user' && <User className="w-4 h-4" />}
                
                <span className="capitalize">
                  {role === 'owner' ? 'Owner Panel' : role === 'vle' ? 'CSC VLE Portal' : 'User Panel'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Role Dropdown Menu */}
              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Portal View
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      id="role-nav-user"
                      onClick={() => handleRoleSelect('user')}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition ${
                        role === 'user'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">User Panel</div>
                        <div className="text-[10px] text-slate-400">Public services & free tools</div>
                      </div>
                    </button>

                    <button
                      id="role-nav-vle"
                      onClick={() => handleRoleSelect('vle')}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition ${
                        role === 'vle'
                          ? 'bg-blue-900/60 border border-blue-500/40 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">CSC VLE / Cyber Cafe</div>
                        <div className="text-[10px] text-slate-400">Lifetime VIP tools & print suite</div>
                      </div>
                    </button>

                    <button
                      id="role-nav-owner"
                      onClick={() => handleRoleSelect('owner')}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition ${
                        role === 'owner'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          Owner Command Center <Lock className="w-3 h-3 text-amber-400" />
                        </div>
                        <div className="text-[10px] text-slate-400">Full website control, tools & security</div>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 mt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowRegisterModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Apply for VLE Registration (₹{siteConfig.vleOneTimeFee || 299})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* VLE Registration Modal */}
      <VleRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </>
  );
};
