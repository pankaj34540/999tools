import { ToolDefinition, ToolCategory, ToolRequestItem } from '../types';

// ============================================
// CATEGORY DEFINITIONS
// ============================================
export const TOOL_CATEGORIES: { id: ToolCategory; label: string; count: number; description: string; icon: string }[] = [
  {
    id: 'photo_exam',
    label: '📸 Photo & Image',
    count: 10,
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
// ============================================
export const TOOLS_REGISTRY: ToolDefinition[] = [
  // ============================================
  // 📸 CATEGORY 1: PHOTO & IMAGE — Batch 1 (10 tools)
  // ============================================
  {
    num: 1,
    id: 'photo_format_converter',
    name: 'Image Format Converter',
    shortName: 'Format Convert',
    category: 'photo_exam',
    description: 'Convert images between JPG, PNG, and WebP formats with adjustable quality control',
    badge: 'POPULAR',
    tags: ['jpg', 'png', 'webp', 'convert', 'format'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Image',
    componentKey: 'ImageFormatConverterTool',
    active: true,
  },
  {
    num: 2,
    id: 'photo_target_kb_compressor',
    name: 'Target KB Compressor',
    shortName: 'KB Compress',
    category: 'photo_exam',
    description: 'Compress images to exact file size (20KB, 50KB, 100KB) for govt forms with binary search',
    badge: 'PREMIUM',
    tags: ['compress', 'kb', 'size', 'ssc', 'upsc', 'railway'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Sparkles',
    componentKey: 'ImageCompressorTool',
    active: true,
  },
  {
    num: 3,
    id: 'photo_resizer',
    name: 'Image Resizer',
    shortName: 'Resize',
    category: 'photo_exam',
    description: 'Resize images to custom dimensions with 6 quick presets (Instagram, Passport, Facebook, etc.)',
    badge: 'POPULAR',
    tags: ['resize', 'dimensions', 'instagram', 'facebook', 'passport'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'ZoomIn',
    componentKey: 'ImageResizeTool',
    active: true,
  },
  {
    num: 4,
    id: 'photo_rotator',
    name: 'Photo Rotator',
    shortName: 'Rotate',
    category: 'photo_exam',
    description: 'Rotate photos 90°, 180°, or any custom angle with automatic canvas resize',
    tags: ['rotate', 'angle', 'turn', 'sideways', 'orientation'],
    vleEssential: true,
    isPremium: false,
    iconName: 'RotateCw',
    componentKey: 'PhotoRotatorTool',
    active: true,
  },
  {
    num: 5,
    id: 'photo_flip_mirror',
    name: 'Photo Mirror & Flip',
    shortName: 'Flip',
    category: 'photo_exam',
    description: 'Mirror photos horizontally or flip vertically with one-click toggle',
    tags: ['flip', 'mirror', 'reverse', 'horizontal', 'vertical'],
    vleEssential: true,
    isPremium: false,
    iconName: 'FlipHorizontal',
    componentKey: 'PhotoFlipTool',
    active: true,
  },
  {
    num: 6,
    id: 'photo_brightness_contrast',
    name: 'Brightness & Contrast',
    shortName: 'Adjust',
    category: 'photo_exam',
    description: 'Adjust brightness, contrast, and saturation with live sliders and instant preview',
    badge: 'POPULAR',
    tags: ['brightness', 'contrast', 'saturation', 'adjust', 'enhance'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Sun',
    componentKey: 'BrightnessContrastTool',
    active: true,
  },
  {
    num: 7,
    id: 'photo_bw_converter',
    name: 'Black & White Converter',
    shortName: 'B&W',
    category: 'photo_exam',
    description: 'Convert color photos to grayscale with adjustable intensity from 0% to 100%',
    tags: ['black', 'white', 'grayscale', 'bw', 'monochrome'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Circle',
    componentKey: 'BlackWhiteTool',
    active: true,
  },
  {
    num: 8,
    id: 'photo_blur',
    name: 'Photo Blur Tool',
    shortName: 'Blur',
    category: 'photo_exam',
    description: 'Blur full photo or background with adjustable blur amount (0-50px)',
    tags: ['blur', 'background blur', 'gaussian', 'focus'],
    vleEssential: false,
    isPremium: false,
    iconName: 'Droplet',
    componentKey: 'PhotoBlurTool',
    active: true,
  },
  {
    num: 9,
    id: 'photo_sharpener',
    name: 'Photo Sharpener',
    shortName: 'Sharpen',
    category: 'photo_exam',
    description: 'Enhance blurry photos with kernel-based sharpening algorithm for crisp details',
    badge: 'PREMIUM',
    tags: ['sharpen', 'enhance', 'clear', 'blurry', 'crisp'],
    vleEssential: false,
    isPremium: true,
    iconName: 'Sparkles',
    componentKey: 'PhotoSharpenerTool',
    active: true,
  },
  {
    num: 10,
    id: 'photo_crop',
    name: 'Photo Crop Tool',
    shortName: 'Crop',
    category: 'photo_exam',
    description: 'Crop photos to 7 aspect ratios including 1:1, 16:9, 4:3, and Passport 35x45mm',
    badge: 'POPULAR',
    tags: ['crop', 'aspect ratio', '1:1', 'passport', 'square'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Crop',
    componentKey: 'PhotoCropTool',
    active: true,
  },
];

// ============================================
// PREMIUM TOOLS LIST
// Free users get 3 uses/day on these tools
// Premium/VLE users get unlimited access
// ============================================
export const PREMIUM_TOOL_IDS: string[] = [
  'photo_target_kb_compressor',
  'photo_sharpener',
];

// ============================================
// VLE ESSENTIAL TOOLS
// Tools that Cyber Cafe / CSC operators use daily
// ============================================
export const VLE_ESSENTIAL_IDS: string[] = [
  'photo_format_converter',
  'photo_target_kb_compressor',
  'photo_resizer',
  'photo_rotator',
  'photo_flip_mirror',
  'photo_brightness_contrast',
  'photo_bw_converter',
  'photo_crop',
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
