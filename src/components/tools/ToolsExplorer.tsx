import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X, 
  SlidersHorizontal, 
  Lightbulb, 
  Send, 
  ChevronRight, 
  Layers, 
  Store, 
  Zap,
  ExternalLink,
  Award,
  Filter
} from 'lucide-react';
import { ToolDefinition } from '../../types';
import { TOOLS_REGISTRY, TOOL_CATEGORIES, INITIAL_TOOL_REQUESTS } from '../../data/toolsRegistry';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

// Tool Components Imports
import { PassportPhotoMaker } from './PassportPhotoMaker';
import { PhotoSignResizer } from './PhotoSignResizer';
import { AadhaarCardFormatter } from './AadhaarCardFormatter';
import { ResumeMaker } from './ResumeMaker';
import { AgeCalculator } from './AgeCalculator';
import { DocumentCleanTool } from './DocumentCleanTool';
import { ReceiptGenerator } from './ReceiptGenerator';
import { WatermarkTool } from './WatermarkTool';

// Category 1 Extras
import { 
  PhotoNameDateTool, 
  SignatureWhiteBgTool, 
  TargetKbCompressorTool, 
  ImageFormatConverterTool, 
  DpiConverterTool, 
  ImageCropRotateTool, 
  BulkImageResizerTool, 
  PhotoBgColorizerTool 
} from './PhotoToolsExtra';

// Category 2 Extras
import { 
  PanCardFormatterTool, 
  AyushmanCardFormatterTool, 
  VoterIdFormatterTool, 
  DlRcFormatterTool, 
  CutGuideMarkerTool, 
  MultiCardA4Tool 
} from './PvcPrintToolsExtra';

// Category 3 Extras
import { 
  ImagesToPdfTool, 
  MergePdfTool, 
  PdfCompressorTool, 
  PdfToImagesTool, 
  SplitPdfTool, 
  RotatePdfTool, 
  PdfWatermarkTool, 
  PdfInfoTool 
} from './PdfDocumentTools';

// Category 4 Extras
import { 
  TypingSpeedTestTool, 
  HindiTransliterationTool, 
  CgpaPercentageCalcTool, 
  DateDifferenceCalcTool, 
  CaseConverterTool, 
  WordCharCounterTool 
} from './StudentFormCalculators';

// Category 5 Extras
import { 
  NumberToWordsTool, 
  ByajCalculatorTool, 
  GstCalculatorTool, 
  DiscountMarginTool, 
  RentAgreementDraftTool, 
  AffidavitFormatsTool, 
  TokenSlipMakerTool 
} from './BusinessBillingTools';

// Category 6 Extras
import { 
  QrCodeGeneratorTool,
  QrPaymentStandeeTool, 
  BarcodeGeneratorTool, 
  WifiQrTool, 
  SpeedTestTool, 
  IpFinderTool, 
  ColorPaletteTool, 
  WhatsappDirectTool 
} from './BarcodeWebTools';

interface ToolsExplorerProps {
  initialToolId?: string | null;
  onSelectTool?: (toolId: string | null) => void;
}

export const ToolsExplorer: React.FC<ToolsExplorerProps> = ({ initialToolId, onSelectTool }) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(initialToolId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vleOnlyMode, setVleOnlyMode] = useState(false);

  // Tool Request State
  const [toolRequests, setToolRequests] = useState(INITIAL_TOOL_REQUESTS);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqUserType, setReqUserType] = useState<'public' | 'vle_owner'>('vle_owner');
  const [reqSubmitted, setReqSubmitted] = useState(false);

  const { triggerDirectLink } = useAdsterraDirectLink();

  // Synchronize when parent updates
  const currentActiveTool = useMemo(() => {
    if (!activeToolId) return null;
    return TOOLS_REGISTRY.find((t) => t.id === activeToolId) || null;
  }, [activeToolId]);

  const handleOpenTool = (toolId: string) => {
    triggerDirectLink();
    setActiveToolId(toolId);
    if (onSelectTool) onSelectTool(toolId);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCloseTool = () => {
    setActiveToolId(null);
    if (onSelectTool) onSelectTool(null);
  };

  // Filter tools
  const filteredTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((tool) => {
      const matchSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.shortName && tool.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchVle = !vleOnlyMode || tool.vleEssential;

      return matchSearch && matchCat && matchVle;
    });
  }, [searchQuery, selectedCategory, vleOnlyMode]);

  // Handle User/VLE Request Submission
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
      category: (selectedCategory === 'all' ? 'cyber_business' : selectedCategory) as any,
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

  // Render Component Mapping
  const renderToolWorkspace = () => {
    if (!currentActiveTool) return null;

    switch (currentActiveTool.componentKey) {
      // Cat 1
      case 'PassportPhotoMaker':
        return <PassportPhotoMaker onClose={handleCloseTool} />;
      case 'PhotoSignResizer':
        return <PhotoSignResizer onClose={handleCloseTool} />;
      case 'PhotoNameDateTool':
        return <PhotoNameDateTool onClose={handleCloseTool} />;
      case 'SignatureWhiteBgTool':
        return <SignatureWhiteBgTool onClose={handleCloseTool} />;
      case 'TargetKbCompressorTool':
        return <TargetKbCompressorTool onClose={handleCloseTool} />;
      case 'ImageFormatConverterTool':
        return <ImageFormatConverterTool onClose={handleCloseTool} />;
      case 'DpiConverterTool':
        return <DpiConverterTool onClose={handleCloseTool} />;
      case 'ImageCropRotateTool':
        return <ImageCropRotateTool onClose={handleCloseTool} />;
      case 'BulkImageResizerTool':
        return <BulkImageResizerTool onClose={handleCloseTool} />;
      case 'PhotoBgColorizerTool':
        return <PhotoBgColorizerTool onClose={handleCloseTool} />;

      // Cat 2
      case 'AadhaarCardFormatter':
        return <AadhaarCardFormatter onClose={handleCloseTool} />;
      case 'PanCardFormatterTool':
        return <PanCardFormatterTool onClose={handleCloseTool} />;
      case 'AyushmanCardFormatterTool':
        return <AyushmanCardFormatterTool onClose={handleCloseTool} />;
      case 'VoterIdFormatterTool':
        return <VoterIdFormatterTool onClose={handleCloseTool} />;
      case 'DlRcFormatterTool':
        return <DlRcFormatterTool onClose={handleCloseTool} />;
      case 'DocumentCleanTool':
        return <DocumentCleanTool onClose={handleCloseTool} />;
      case 'CutGuideMarkerTool':
        return <CutGuideMarkerTool onClose={handleCloseTool} />;
      case 'MultiCardA4Tool':
        return <MultiCardA4Tool onClose={handleCloseTool} />;

      // Cat 3
      case 'ImagesToPdfTool':
        return <ImagesToPdfTool onClose={handleCloseTool} />;
      case 'MergePdfTool':
        return <MergePdfTool onClose={handleCloseTool} />;
      case 'PdfCompressorTool':
        return <PdfCompressorTool onClose={handleCloseTool} />;
      case 'PdfToImagesTool':
        return <PdfToImagesTool onClose={handleCloseTool} />;
      case 'SplitPdfTool':
        return <SplitPdfTool onClose={handleCloseTool} />;
      case 'RotatePdfTool':
        return <RotatePdfTool onClose={handleCloseTool} />;
      case 'WatermarkTool':
      case 'PdfWatermarkTool':
        return <WatermarkTool onClose={handleCloseTool} />;
      case 'PdfInfoTool':
        return <PdfInfoTool onClose={handleCloseTool} />;

      // Cat 4
      case 'AgeCalculator':
        return <AgeCalculator onClose={handleCloseTool} />;
      case 'ResumeMaker':
        return <ResumeMaker onClose={handleCloseTool} />;
      case 'TypingSpeedTestTool':
        return <TypingSpeedTestTool onClose={handleCloseTool} />;
      case 'HindiTransliterationTool':
        return <HindiTransliterationTool onClose={handleCloseTool} />;
      case 'CgpaPercentageCalcTool':
        return <CgpaPercentageCalcTool onClose={handleCloseTool} />;
      case 'DateDifferenceCalcTool':
        return <DateDifferenceCalcTool onClose={handleCloseTool} />;
      case 'CaseConverterTool':
        return <CaseConverterTool onClose={handleCloseTool} />;
      case 'WordCharCounterTool':
        return <WordCharCounterTool onClose={handleCloseTool} />;

      // Cat 5
      case 'ReceiptGenerator':
        return <ReceiptGenerator onClose={handleCloseTool} />;
      case 'NumberToWordsTool':
        return <NumberToWordsTool onClose={handleCloseTool} />;
      case 'ByajCalculatorTool':
        return <ByajCalculatorTool onClose={handleCloseTool} />;
      case 'GstCalculatorTool':
        return <GstCalculatorTool onClose={handleCloseTool} />;
      case 'DiscountMarginTool':
        return <DiscountMarginTool onClose={handleCloseTool} />;
      case 'RentAgreementDraftTool':
        return <RentAgreementDraftTool onClose={handleCloseTool} />;
      case 'AffidavitFormatsTool':
        return <AffidavitFormatsTool onClose={handleCloseTool} />;
      case 'TokenSlipMakerTool':
        return <TokenSlipMakerTool onClose={handleCloseTool} />;

      // Cat 6
      case 'QrCodeGeneratorTool':
      case 'QrGenerator':
        return <QrCodeGeneratorTool onClose={handleCloseTool} />;
      case 'QrPaymentStandeeTool':
        return <QrPaymentStandeeTool onClose={handleCloseTool} />;
      case 'BarcodeGeneratorTool':
        return <BarcodeGeneratorTool onClose={handleCloseTool} />;
      case 'WifiPosterMakerTool':
      case 'WifiQrTool':
        return <WifiQrTool onClose={handleCloseTool} />;
      case 'SpeedTestTool':
        return <SpeedTestTool onClose={handleCloseTool} />;
      case 'IpFinderTool':
        return <IpFinderTool onClose={handleCloseTool} />;
      case 'ColorPaletteTool':
        return <ColorPaletteTool onClose={handleCloseTool} />;
      case 'WhatsappDirectTool':
        return <WhatsappDirectTool onClose={handleCloseTool} />;

      default:
        return <div className="p-8 text-center text-slate-500">Tool component not found.</div>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 999TOOLS ROADMAP PROGRESS BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
                Phase 1 Active • 50/999 Online Tools Live
              </span>
              <span className="text-xs text-slate-400 font-medium">100% Free & Client-Side Safe</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              999tools Multi-Tool Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              India's all-in-one utility hub built specifically for students, normal users, and CSC VLE / Cyber Cafe operators.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Suggest a Tool (+1 to 999)</span>
            </button>
          </div>
        </div>

        {/* Progress Metric */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400">Total Live Catalog: <strong className="text-white">50 Tools</strong></span>
            <span className="text-amber-400 font-bold">Goal: 999 Tools (Roadmap Milestone 1 Complete)</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full"
              style={{ width: `${(50 / 999) * 100 * 3}%` }} // visually appealing progress
            />
          </div>
        </div>
      </div>

      {/* ACTIVE TOOL WORKSPACE VIEW IF OPENED */}
      {currentActiveTool && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-500 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                {currentActiveTool.id}
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900">{currentActiveTool.title}</h2>
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

          {/* Render Active Tool Content */}
          <div className="min-h-[350px]">{renderToolWorkspace()}</div>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tool name, number (e.g. #012), or tags (pan, ssc, pdf, typing)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Cyber Cafe Pro Mode Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
            <input
              type="checkbox"
              checked={vleOnlyMode}
              onChange={(e) => setVleOnlyMode(e.target.checked)}
              className="rounded accent-amber-600 w-4 h-4"
            />
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span>Cyber Cafe / CSC VLE Pro Mode</span>
            </div>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 50 Tools
          </button>
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* IN-CONTENT ADSTERRA BANNER */}
      <AdsterraBanner slot="header" />

      {/* TOOLS CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredTools.length} of {TOOLS_REGISTRY.length} Available Tools
          </span>
          {vleOnlyMode && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Filtering: VLE & Cyber Cafe Recommended Tools
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleOpenTool(tool.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-lg ${
                activeToolId === tool.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-blue-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800 transition">
                    #{String(tool.num).padStart(3, '0')}
                  </span>
                  {tool.vleEssential && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Store className="w-2.5 h-2.5" /> VLE
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {tool.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {tool.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Launch Tool</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUGGEST A TOOL MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Suggest a Tool for 999tools</h3>
                <p className="text-xs text-slate-500">Help us reach 999 tools! Request anything you need daily.</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reqSubmitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Tool Suggestion Submitted!</div>
                <p className="text-xs">Our team and developer will queue this up for the upcoming release.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Role:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReqUserType('vle_owner')}
                      className={`flex-1 py-2 rounded-xl font-bold border ${
                        reqUserType === 'vle_owner' ? 'bg-amber-500 text-slate-950' : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      CSC VLE / Cyber Cafe
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqUserType('public')}
                      className={`flex-1 py-2 rounded-xl font-bold border ${
                        reqUserType === 'public' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      General Student / Citizen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tool Name or Concept:</label>
                  <input
                    type="text"
                    required
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="e.g. Samagra ID Card Print, Kisan Credit Formatter..."
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">What should this tool do?</label>
                  <textarea
                    rows={3}
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    placeholder="Describe how it will save time for you or your customers..."
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit to 999tools Roadmap</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
