import { ToolDefinition, ToolCategory, ToolRequestItem } from '../types';

// ============================================
// CATEGORY DEFINITIONS
// ============================================
export const TOOL_CATEGORIES: { id: ToolCategory; label: string; count: number; description: string; icon: string }[] = [
  {
    id: 'photo_exam',
    label: '📸 Photo & Image',
    count: 20,
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
// TOOLS REGISTRY — 20 Tools (Batch 1 + 2)
// ============================================
export const TOOLS_REGISTRY: ToolDefinition[] = [
  // ============================================
  // 📸 BATCH 1: PHOTO BASICS (#001 - #010)
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

  // ============================================
  // 📸 BATCH 2: PASSPORT & ID (#011 - #020)
  // ============================================
  {
    num: 11,
    id: 'passport_photo_sheet',
    name: 'Passport Photo Sheet Maker',
    shortName: 'Photo Sheet',
    category: 'photo_exam',
    description: 'Print 4, 6, 8, 12, 16, 24, or 32 photos on 4x6" lab paper or A4 with cutting guides',
    badge: 'POPULAR',
    tags: ['passport', 'sheet', '4x6', 'a4', 'print', 'lab'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Camera',
    componentKey: 'PassportPhotoSheetTool',
    active: true,
  },
  {
    num: 12,
    id: 'govt_exam_resizer',
    name: 'Govt Exam Photo & Sign Resizer',
    shortName: 'Exam Resizer',
    category: 'photo_exam',
    description: 'Exact KB & pixel presets for SSC, UPSC, Railway, PAN, IBPS, and State Police forms',
    badge: 'PREMIUM',
    tags: ['ssc', 'upsc', 'railway', 'pan', 'ibps', 'police', 'resizer'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Maximize2',
    componentKey: 'GovtExamResizerTool',
    active: true,
  },
  {
    num: 13,
    id: 'signature_white_bg',
    name: 'Signature White Background Cleaner',
    shortName: 'Signature BG',
    category: 'photo_exam',
    description: 'Remove yellow tint, shadows, and paper creases from signature photos — pure white output',
    badge: 'POPULAR',
    tags: ['signature', 'white background', 'cleaner', 'scan'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Sparkles',
    componentKey: 'SignatureWhiteBgTool',
    active: true,
  },
  {
    num: 14,
    id: 'photo_name_date_stamp',
    name: 'Photo Name & Date (DOPO/DOB) Stamp',
    shortName: 'Name Date',
    category: 'photo_exam',
    description: 'Add candidate name and photo captured date banner on bottom of passport photo (UPSC/SSC requirement)',
    badge: 'POPULAR',
    tags: ['name', 'date', 'dopo', 'dob', 'stamp'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Stamp',
    componentKey: 'PhotoNameDateStampTool',
    active: true,
  },
  {
    num: 15,
    id: 'face_center_crop',
    name: 'Face Center & Auto Crop',
    shortName: 'Face Center',
    category: 'photo_exam',
    description: 'Manually center face in crop frame for Passport India, US Visa, Schengen standards',
    tags: ['face', 'center', 'crop', 'auto', 'visa'],
    vleEssential: true,
    isPremium: false,
    iconName: 'User',
    componentKey: 'FaceCenterCropTool',
    active: true,
  },
  {
    num: 16,
    id: 'multiple_photo_stitcher',
    name: 'Multiple Photo Stitcher',
    shortName: 'Stitcher',
    category: 'photo_exam',
    description: 'Join 2 or more photos vertically or horizontally with adjustable gap',
    tags: ['stitch', 'join', 'merge', 'combine', 'multi'],
    vleEssential: false,
    isPremium: false,
    iconName: 'Layers',
    componentKey: 'MultiplePhotoStitcherTool',
    active: true,
  },
  {
    num: 17,
    id: 'photo_grid_maker',
    name: 'Photo Grid Maker',
    shortName: 'Grid',
    category: 'photo_exam',
    description: 'Create 2x2, 3x3, or 4x4 grid of photos with equal spacing — perfect for bulk printing',
    tags: ['grid', '2x2', '3x3', '4x4', 'bulk'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Grid3x3',
    componentKey: 'PhotoGridMakerTool',
    active: true,
  },
  {
    num: 18,
    id: 'polaroid_maker',
    name: 'Polaroid Photo Maker',
    shortName: 'Polaroid',
    category: 'photo_exam',
    description: 'Create retro polaroid-style prints with custom captions and frame colors',
    tags: ['polaroid', 'retro', 'caption', 'vintage'],
    vleEssential: false,
    isPremium: false,
    iconName: 'Image',
    componentKey: 'PolaroidMakerTool',
    active: true,
  },
  {
    num: 19,
    id: 'photo_collage',
    name: 'Photo Collage Maker',
    shortName: 'Collage',
    category: 'photo_exam',
    description: 'Create beautiful 2-photo, 3-photo, or 4-photo collages in side, stack, or quad layouts',
    tags: ['collage', 'quad', 'stack', 'side'],
    vleEssential: false,
    isPremium: false,
    iconName: 'Layers',
    componentKey: 'PhotoCollageMakerTool',
    active: true,
  },
  {
    num: 20,
    id: 'passport_template_india',
    name: 'Passport Photo Template (India)',
    shortName: 'Passport 35x45',
    category: 'photo_exam',
    description: 'Perfect 35×45mm Indian Passport size output with White, Blue, or Grey background',
    tags: ['passport', '35x45', 'india', 'template'],
    vleEssential: true,
    isPremium: false,
    iconName: 'CreditCard',
    componentKey: 'PassportTemplateTool',
    active: true,
  },
];

// ============================================
// PREMIUM TOOLS LIST
// ============================================
export const PREMIUM_TOOL_IDS: string[] = [
  'photo_target_kb_compressor',  // #002
  'photo_sharpener',              // #009
  'govt_exam_resizer',            // #012
];

// ============================================
// VLE ESSENTIAL TOOLS
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
  'passport_photo_sheet',
  'govt_exam_resizer',
  'signature_white_bg',
  'photo_name_date_stamp',
  'face_center_crop',
  'photo_grid_maker',
  'passport_template_india',
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
// TOOL REQUESTS
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
