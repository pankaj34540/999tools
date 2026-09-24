import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Check, 
  X, 
  Lightbulb, 
  Send, 
  ChevronRight, 
  Store, 
  Zap,
  Crown,
  Lock,
  Star,
  Construction,
} from 'lucide-react';
import { ToolDefinition } from '../../types';
import { 
  TOOLS_REGISTRY, 
  TOOL_CATEGORIES, 
  INITIAL_TOOL_REQUESTS,
  PREMIUM_TOOL_IDS,
  isPremiumTool,
  isVleEssential 
} from '../../data/toolsRegistry';
import { FREE_USER_DAILY_LIMIT } from '../../data/premiumTools';
import { AdsterraBanner } from '../common/AdsterraBanner';
import { useApp } from '../../context/AppContext';
import { PricingModal } from '../user/PricingModal';
import { UpgradePaymentModal } from '../user/UpgradePaymentModal';

// ============================================
// 🆕 TOOL IMPORTS
// ============================================
import ImageFormatConverter from './photo/ImageFormatConverter';
import ImageResizer from './photo/ImageResizer';
import ImageCompressor from './photo/ImageCompressor';   // ← YE ADD KARO
import PhotoRotator from './photo/PhotoRotator';
import PhotoFlip from './photo/PhotoFlip';
import BrightnessContrast from './photo/BrightnessContrast';
import BlackWhiteConverter from './photo/BlackWhiteConverter';
import PhotoBlur from './photo/PhotoBlur';
import PhotoSharpener from './photo/PhotoSharpener';
import PhotoCrop from './photo/PhotoCrop';
import ImageToPdf from './pdf/ImageToPdf';
import PdfMerge from './pdf/PdfMerge';
import PdfSplit from './pdf/PdfSplit';
import PdfCompress from './pdf/PdfCompress';
import PdfToImage from './pdf/PdfToImage';

interface ToolsExplorerProps {
  initialToolId?: string | null;
  onSelectTool?: (toolId: string | null) => void;
}

interface ToolAccess {
  allowed: boolean;
  remaining: number;
  isPremium: boolean;
  limit: number;
}

export const ToolsExplorer: React.FC<ToolsExplorerProps> = ({ initialToolId, onSelectTool }) => {
  const { 
    siteConfig,
    currentUser, 
    checkToolAccess, 
    recordUsage,
    isUserPremium,
    showNotification,
  } = useApp();

  const [activeToolId, setActiveToolId] = useState<string | null>(initialToolId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vleOnlyMode, setVleOnlyMode] = useState(false);
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'premium' | 'vle'>('premium');
  const [upgradeCycle, setUpgradeCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [toolAccessMap, setToolAccessMap] = useState<Record<string, ToolAccess>>({});

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqUserType, setReqUserType] = useState<'public' | 'vle_owner'>('vle_owner');
  const [reqSubmitted, setReqSubmitted] = useState(false);
  const [toolRequests, setToolRequests] = useState(INITIAL_TOOL_REQUESTS);

  const userPremium = isUserPremium();

  // ============================================
  // HELPERS
  // ============================================
  const isToolPremium = (toolId: string): boolean => {
    return PREMIUM_TOOL_IDS.includes(toolId);
  };

  const isToolLocked = (toolId: string): boolean => {
    if (!isToolPremium(toolId)) return false;
    if (userPremium) return false;
    const access = toolAccessMap[toolId];
    if (!access) return false;
    if (access.limit <= 0) return false;
    return !access.allowed || access.remaining <= 0;
  };

  const openTool = (toolId: string) => {
    setActiveToolId(toolId);
    if (onSelectTool) onSelectTool(toolId);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const promptUpgrade = (reason: string) => {
    showNotification(reason);
    setShowPricingModal(true);
  };

  useEffect(() => {
    const handler = () => setShowPricingModal(true);
    window.addEventListener('openPricingModal', handler);
    return () => window.removeEventListener('openPricingModal', handler);
  }, []);

  // ============================================
  // LOAD TOOL ACCESS MAP
  // ============================================
  useEffect(() => {
    const loadAccess = async () => {
      const map: Record<string, ToolAccess> = {};
      for (const tool of TOOLS_REGISTRY) {
        const isPremium = PREMIUM_TOOL_IDS.includes(tool.id);
        if (!isPremium) {
          map[tool.id] = { allowed: true, remaining: -1, isPremium: false, limit: -1 };
        } else {
          try {
            const access = await checkToolAccess(tool.id);
            if (!access || access.limit <= 0) {
              map[tool.id] = { allowed: true, remaining: FREE_USER_DAILY_LIMIT, isPremium: true, limit: FREE_USER_DAILY_LIMIT };
            } else {
              map[tool.id] = access;
            }
          } catch {
            map[tool.id] = { allowed: true, remaining: FREE_USER_DAILY_LIMIT, isPremium: true, limit: FREE_USER_DAILY_LIMIT };
          }
        }
      }
      setToolAccessMap(map);
    };
    loadAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.plan, currentUser?.subscriptionEnd, userPremium]);

  const currentActiveTool = useMemo(() => {
    if (!activeToolId) return null;
    return TOOLS_REGISTRY.find((t) => t.id === activeToolId) || null;
  }, [activeToolId]);

  // ============================================
  // OPEN TOOL
  // ============================================
  const handleOpenTool = async (toolId: string) => {
    const tool = TOOLS_REGISTRY.find(t => t.id === toolId);
    if (!tool) return;

    if (!isToolPremium(tool.id)) {
      openTool(toolId);
      return;
    }

    if (userPremium) {
      openTool(toolId);
      return;
    }

    let access = toolAccessMap[toolId];
    if (!access) {
      try {
        access = await checkToolAccess(toolId);
        if (!access || access.limit <= 0) {
          access = { allowed: true, remaining: FREE_USER_DAILY_LIMIT, isPremium: true, limit: FREE_USER_DAILY_LIMIT };
        }
      } catch {
        access = { allowed: true, remaining: FREE_USER_DAILY_LIMIT, isPremium: true, limit: FREE_USER_DAILY_LIMIT };
      }
    }

    if (!access.allowed || access.remaining <= 0) {
      promptUpgrade('❌ Daily free limit reached (3/day). Upgrade to Premium.');
      return;
    }

    try {
      await recordUsage(toolId);
    } catch (e) {
      console.error('recordUsage failed:', e);
    }

    const newRemaining = Math.max(0, access.remaining - 1);
    setToolAccessMap(prev => ({
      ...prev,
      [toolId]: { ...access!, remaining: newRemaining, allowed: newRemaining > 0 }
    }));

    openTool(toolId);
  };

  const handleCloseTool = () => {
    setActiveToolId(null);
    if (onSelectTool) onSelectTool(null);
  };

  // ============================================
  // FILTERED TOOLS
  // ============================================
  const filteredTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((tool) => {
      const matchSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.shortName && tool.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchVle = !vleOnlyMode || isVleEssential(tool.id) || tool.vleEssential;
      const matchPremium = !showOnlyPremium || PREMIUM_TOOL_IDS.includes(tool.id);
      return matchSearch && matchCat && matchVle && matchPremium;
    });
  }, [searchQuery, selectedCategory, vleOnlyMode, showOnlyPremium]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;
    const newItem = {
      id: `req_${Date.now()}`,
      toolName: reqTitle,
      description: reqDesc,
      requestedBy: reqUserType === 'vle_owner' ? 'CSC VLE Operator' : 'Citizen / Student',
      votes: 1,
      status: 'in_review' as const,
      category: (selectedCategory === 'all' ? 'photo_exam' : selectedCategory) as any,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setToolRequests([newItem, ...toolRequests]);
    setReqSubmitted(true);
    setTimeout(() => {
      setReqSubmitted(false);
      setShowRequestModal(false);
      setReqTitle('');
      setReqDesc('');
    }, 2000);
  };

  const renderPremiumBadge = (toolId: string) => {
    if (!isToolPremium(toolId)) return null;
    if (userPremium) {
      return (
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown className="w-2.5 h-2.5" /> PRO
        </span>
      );
    }
    const access = toolAccessMap[toolId];
    if (!access || access.limit <= 0) {
      return (
        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown className="w-2.5 h-2.5" /> {FREE_USER_DAILY_LIMIT}/{FREE_USER_DAILY_LIMIT}
        </span>
      );
    }
    if (access.remaining > 0) {
      return (
        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown className="w-2.5 h-2.5" /> {access.remaining}/{access.limit}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
        <Lock className="w-2.5 h-2.5" /> LOCKED
      </span>
    );
  };

  const getUpgradeAmount = () => {
    if (upgradePlan === 'premium') {
      return upgradeCycle === 'monthly' 
        ? (siteConfig.premiumMonthlyPrice || 49) 
        : (siteConfig.premiumYearlyPrice || 399);
    }
    return upgradeCycle === 'monthly' 
      ? (siteConfig.vleMonthlyPrice || 199) 
      : (siteConfig.vleYearlyPrice || 1499);
  };

  // ============================================
  // TOOL WORKSPACE SWITCH
  // ============================================
  const renderToolWorkspace = () => {
    if (!currentActiveTool) return null;

    switch (currentActiveTool.componentKey) {
      // Tool #001
      case 'ImageFormatConverter': return <ImageFormatConverter onClose={handleCloseTool} />;
      
      // Tool #002
      case 'ImageResizer': return <ImageResizer onClose={handleCloseTool} />;
      
        // Tool #003
      case 'ImageCompressor': return <ImageCompressor onClose={handleCloseTool} />;

        //Tool #004
      case 'PhotoRotator': return <PhotoRotator onClose={handleCloseTool} />; 

        //Tool #005
      case 'PhotoFlip': return <PhotoFlip onClose={handleCloseTool} />;

        //Tool #006
      case 'BrightnessContrast': return <BrightnessContrast onClose={handleCloseTool} />;

        //Tool #007
      case 'BlackWhiteConverter': return <BlackWhiteConverter onClose={handleCloseTool} />;

        //Tool #008
      case 'PhotoBlur': return <PhotoBlur onClose={handleCloseTool} />;

       //Tool #009
      case 'PhotoSharpener': return <PhotoSharpener onClose={handleCloseTool} />;

      //Tool #010
      case 'PhotoCrop': return <PhotoCrop onClose={handleCloseTool} />;

     //Tool #011
      case 'ImageToPdf': return <ImageToPdf onClose={handleCloseTool} />;

    //Tool #012
      case 'PdfMerge': return <PdfMerge onClose={handleCloseTool} />;

   //Tool #013
      case 'PdfSplit': return <PdfSplit onClose={handleCloseTool} />;

  //Tool #014
      case 'PdfCompress': return <PdfCompress onClose={handleCloseTool} />;

  //Tool #015
      case 'PdfToImage': return <PdfToImage onClose={handleCloseTool} />;

        
      // 🆕 Add new tools here

      default:
        return (
          <div className="p-12 text-center space-y-4">
            <Construction className="w-16 h-16 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-700">Tool under construction</p>
              <p className="text-xs text-slate-500 mt-1">
                Component: {currentActiveTool.componentKey}
              </p>
            </div>
          </div>
        );
    }
  };

  const totalTools = TOOLS_REGISTRY.length;
  const premiumCount = PREMIUM_TOOL_IDS.length;

  return (
    <div className="space-y-8">
      {/* ROADMAP PROGRESS BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
                🚀 Building • {totalTools}/999 Tools Live
              </span>
              <span className="text-xs text-slate-400 font-medium">100% Free & Client-Side Safe</span>
              {currentUser && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  userPremium 
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' 
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                }`}>
                  {userPremium ? '⚡ Premium Active' : `Free Plan • ${currentUser.name}`}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              999tools Multi-Tool Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              India's all-in-one utility hub built for students, cyber cafe operators, and everyday users.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && !userPremium && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Upgrade Premium</span>
              </button>
            )}
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Suggest a Tool</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400">
              Live: <strong className="text-white">{totalTools} Tools</strong> • 
              Free: <strong className="text-emerald-400">{totalTools - premiumCount}</strong> • 
              Premium: <strong className="text-amber-400">{premiumCount}</strong>
            </span>
            <span className="text-amber-400 font-bold">Goal: 999 Tools</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full transition-all"
              style={{ width: `${Math.max((totalTools / 999) * 100, 1)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ACTIVE TOOL WORKSPACE */}
      {currentActiveTool && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-500 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                #{String(currentActiveTool.num).padStart(3, '0')}
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900">{currentActiveTool.name}</h2>
                <p className="text-xs text-slate-500">{currentActiveTool.description}</p>
              </div>
            </div>
            <button
              onClick={handleCloseTool}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Close Tool</span>
            </button>
          </div>
          <div className="min-h-[350px]">{renderToolWorkspace()}</div>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, number (#001), or tags..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
              <input type="checkbox" checked={vleOnlyMode} onChange={(e) => setVleOnlyMode(e.target.checked)} className="rounded accent-amber-600 w-4 h-4" />
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>VLE Mode</span>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200">
              <input type="checkbox" checked={showOnlyPremium} onChange={(e) => setShowOnlyPremium(e.target.checked)} className="rounded accent-purple-600 w-4 h-4" />
              <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-purple-700" />
                <span>Premium Only</span>
              </div>
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tools ({totalTools})
          </button>
          {TOOL_CATEGORIES.filter(c => c.count > 0).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      <AdsterraBanner slot="header" />

      {/* TOOLS CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredTools.length} of {totalTools} Available Tools
          </span>
        </div>

        {filteredTools.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
            <Construction className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800 mb-2">
              🚀 Tools are being built!
            </h3>
            <p className="text-sm text-slate-500 mb-1">
              We're rebuilding our tools with better quality and features.
            </p>
            <p className="text-xs text-slate-400">
              5 new tools will be added daily. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const isVle = isVleEssential(tool.id) || tool.vleEssential;
              const locked = isToolLocked(tool.id);
              return (
                <div
                  key={tool.id}
                  onClick={() => handleOpenTool(tool.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-lg relative ${
                    activeToolId === tool.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : locked
                      ? 'border-rose-200 bg-rose-50/30 hover:border-rose-400'
                      : 'border-slate-200 bg-white hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800 transition">
                        #{String(tool.num).padStart(3, '0')}
                      </span>
                      <div className="flex items-center gap-1">
                        {renderPremiumBadge(tool.id)}
                        {isVle && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Store className="w-2.5 h-2.5" /> VLE
                          </span>
                        )}
                        {tool.badge === 'POPULAR' && !isToolPremium(tool.id) && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-2.5 h-2.5" /> Hot
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {tool.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold ${
                    locked ? 'border-rose-100 text-rose-600' : 'border-slate-100 text-blue-600 group-hover:text-blue-700'
                  }`}>
                    {locked ? (
                      <>
                        <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Upgrade to Unlock</span>
                        <Crown className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Launch Tool</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SUGGEST A TOOL MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Suggest a Tool for 999tools</h3>
                <p className="text-xs text-slate-500">Help us reach 999 tools!</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {reqSubmitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Tool Suggestion Submitted!</div>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Role:</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReqUserType('vle_owner')} className={`flex-1 py-2 rounded-xl font-bold border ${reqUserType === 'vle_owner' ? 'bg-amber-500 text-slate-950' : 'bg-slate-50 text-slate-700'}`}>CSC VLE / Cyber Cafe</button>
                    <button type="button" onClick={() => setReqUserType('public')} className={`flex-1 py-2 rounded-xl font-bold border ${reqUserType === 'public' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>General User</button>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tool Name:</label>
                  <input type="text" required value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="e.g. Video Compressor" className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">What should this tool do?</label>
                  <textarea rows={3} value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} className="w-full p-3 border rounded-xl" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit to Roadmap</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={(plan, cycle) => {
          setUpgradePlan(plan);
          setUpgradeCycle(cycle);
          setShowPricingModal(false);
          setShowUpgradeModal(true);
        }}
      />

      <UpgradePaymentModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onBack={() => {
          setShowUpgradeModal(false);
          setShowPricingModal(true);
        }}
        plan={upgradePlan}
        billingCycle={upgradeCycle}
        amount={getUpgradeAmount()}
        onSuccess={() => {
          setShowUpgradeModal(false);
          showNotification('✅ Payment request submitted!');
        }}
      />
    </div>
  );
};
