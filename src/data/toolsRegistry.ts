import { ToolDefinition, ToolCategory, ToolRequestItem } from '../types';

// ============================================
// CATEGORY DEFINITIONS
// ============================================
export const TOOL_CATEGORIES: { id: ToolCategory; label: string; count: number; description: string; icon: string }[] = [
  {
    id: 'photo_exam',
    label: '📸 Photo & Image',
    count: 0,
    description: 'Passport photo, resize, compress, convert, background remove',
    icon: 'Camera',
  },
  {
    id: 'pdf_doc',
    label: '📄 PDF & Document',
    count: 0,
    description: 'Merge, split, compress, convert, watermark PDF files',
    icon: 'FileText',
  },
  {
    id: 'pvc_print',
    label: '🆔 ID Card & Print',
    count: 0,
    description: 'Aadhaar, PAN, Voter ID, DL, RC card formatters',
    icon: 'CreditCard',
  },
  {
    id: 'calculators',
    label: '🎓 Student & Exam',
    count: 0,
    description: 'Age calculator, bio-data, resume, typing test',
    icon: 'GraduationCap',
  },
  {
    id: 'cyber_business',
    label: '🏪 Cyber Cafe Business',
    count: 0,
    description: 'Billing, receipts, customer queue, print formats',
    icon: 'Store',
  },
  {
    id: 'generators_daily',
    label: '💰 Finance & Calculator',
    count: 0,
    description: 'EMI, GST, interest, tax, loan, SIP calculators',
    icon: 'IndianRupee',
  },
  {
    id: 'social_media',
    label: '📱 Social Media',
    count: 0,
    description: 'Instagram, Facebook, YouTube resizers & makers',
    icon: 'Share2',
  },
  {
    id: 'text_dev',
    label: '🔤 Text & Developer',
    count: 0,
    description: 'JSON, Base64, URL encode, regex, HTML tools',
    icon: 'Code',
  },
  {
    id: 'qr_gen',
    label: '🎨 Generator Tools',
    count: 0,
    description: 'QR code, barcode, password, color palette, UUID',
    icon: 'QrCode',
  },
  {
    id: 'security_util',
    label: '🔒 Security & Utility',
    count: 0,
    description: 'Hash, encryption, IP finder, speed test, converters',
    icon: 'Shield',
  },
];

// ============================================
// TOOLS REGISTRY
// Fresh start — Tools will be added category-wise
// ============================================
export const TOOLS_REGISTRY: ToolDefinition[] = [];

// ============================================
// PREMIUM TOOLS LIST
// 299 premium tools — free users get 3 uses/day
// ============================================
export const PREMIUM_TOOL_IDS: string[] = [
  // Will be populated as we add tools
];

// ============================================
// VLE ESSENTIAL TOOLS
// Tools that Cyber Cafe / CSC operators use daily
// ============================================
export const VLE_ESSENTIAL_IDS: string[] = [
  // Will be populated as we add tools
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] => {
  return TOOLS_REGISTRY.filter((tool) => tool.category === category);
};

export const getToolById = (id: string): ToolDefinition | undefined => {
  return TOOLS_REGISTRY.find((tool) => tool.id === id);
};

export const getToolByNum = (num: number): ToolDefinition | undefined => {
  return TOOLS_REGISTRY.find((tool) => tool.num === num);
};

export const searchTools = (query: string): ToolDefinition[] => {
  const q = query.toLowerCase().trim();
  if (!q) return TOOLS_REGISTRY;

  return TOOLS_REGISTRY.filter((tool) =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.id.toLowerCase().includes(q) ||
    tool.num.toString().includes(q) ||
    (tool.tags && tool.tags.some((tag) => tag.toLowerCase().includes(q)))
  );
};

export const isPremiumTool = (toolId: string): boolean => {
  return PREMIUM_TOOL_IDS.includes(toolId);
};

export const isVleEssential = (toolId: string): boolean => {
  return VLE_ESSENTIAL_IDS.includes(toolId);
};

export const getTotalToolCount = (): number => {
  return TOOLS_REGISTRY.length;
};

export const getPremiumToolCount = (): number => {
  return PREMIUM_TOOL_IDS.length;
};

export const getFreeToolCount = (): number => {
  return TOOLS_REGISTRY.length - PREMIUM_TOOL_IDS.length;
};

// ============================================
// TOOL REQUESTS (User Suggestions)
// ============================================
export const INITIAL_TOOL_REQUESTS: ToolRequestItem[] = [
  {
    id: 'req_1',
    toolName: 'Video Compressor',
    description: 'Compress large video files for WhatsApp and email sharing',
    requestedBy: 'CSC VLE Operator',
    votes: 12,
    status: 'planned',
    category: 'photo_exam',
    createdAt: '2026-09-10',
  },
  {
    id: 'req_2',
    toolName: 'PAN Card Photo Signature Extractor',
    description: 'Extract photo and signature from existing PAN card',
    requestedBy: 'CSC VLE Operator',
    votes: 8,
    status: 'in_review',
    category: 'pvc_print',
    createdAt: '2026-09-11',
  },
  {
    id: 'req_3',
    toolName: 'Ayushman Card PVC Formatter',
    description: 'Format Ayushman Bharat card for CR80 PVC printing',
    requestedBy: 'Cyber Cafe Owner',
    votes: 15,
    status: 'planned',
    category: 'pvc_print',
    createdAt: '2026-09-12',
  },
];
