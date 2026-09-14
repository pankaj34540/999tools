import { ToolDefinition, ToolCategory, ToolRequestItem } from '../types';

// ============================================
// CATEGORY DEFINITIONS
// ============================================
export const TOOL_CATEGORIES: { id: ToolCategory; label: string; count: number; description: string; icon: string }[] = [
  {
    id: 'photo_exam',
    label: '📸 Photo & Image',
    count: 35,
    description: 'Passport photo, resize, compress, convert, background remove, filters',
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
// TOOLS REGISTRY — 35 Tools (Batch 1 + 2 + 3)
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

  // ============================================
  // 📸 BATCH 3: PHOTO ADVANCED (#021 - #035)
  // ============================================
  {
    num: 21,
    id: 'photo_bg_remover',
    name: 'Background Remover (Smart)',
    shortName: 'BG Remove',
    category: 'photo_exam',
    description: 'Remove solid color backgrounds from photos & signatures — perfect for ID photos with clean white/transparent output',
    badge: 'PREMIUM',
    tags: ['background', 'remove', 'transparent', 'bg', 'id photo'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Eraser',
    componentKey: 'ImageBackgroundRemoverTool',
    active: true,
  },
  {
    num: 22,
    id: 'photo_auto_enhancer',
    name: 'Photo Auto Enhancer (Smart)',
    shortName: 'Auto Enhance',
    category: 'photo_exam',
    description: 'One-click enhancement — auto contrast, white balance, and color boost for dull photos',
    badge: 'PREMIUM',
    tags: ['enhance', 'auto', 'contrast', 'brightness', 'improve'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Sparkles',
    componentKey: 'PhotoAutoEnhancerTool',
    active: true,
  },
  {
    num: 23,
    id: 'photo_old_restorer',
    name: 'Old Photo Restorer',
    shortName: 'Restore',
    category: 'photo_exam',
    description: 'Revive faded old photos with denoise, color correction, and contrast repair',
    badge: 'PREMIUM',
    tags: ['restore', 'old', 'denoise', 'repair', 'faded'],
    vleEssential: false,
    isPremium: true,
    iconName: 'History',
    componentKey: 'OldPhotoRestorerTool',
    active: true,
  },
  {
    num: 24,
    id: 'photo_bg_colorizer',
    name: 'Background Colorizer',
    shortName: 'BG Color',
    category: 'photo_exam',
    description: 'Replace photo background with any solid color — White, Blue, Grey, Red for passport/ID standards',
    tags: ['background', 'color', 'replace', 'passport', 'blue', 'white'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Palette',
    componentKey: 'PhotoBackgroundColorizerTool',
    active: true,
  },
  {
    num: 25,
    id: 'photo_color_inverter',
    name: 'Photo Color Inverter (Negative)',
    shortName: 'Invert',
    category: 'photo_exam',
    description: 'Convert photo to negative — invert all colors instantly for artistic effect',
    tags: ['invert', 'negative', 'reverse', 'color'],
    vleEssential: true,
    isPremium: false,
    iconName: 'RefreshCw',
    componentKey: 'PhotoColorInverterTool',
    active: true,
  },
  {
    num: 26,
    id: 'photo_saturation_booster',
    name: 'Photo Saturation Booster',
    shortName: 'Saturate',
    category: 'photo_exam',
    description: 'Boost or reduce color intensity with live saturation slider (0% to 300%)',
    tags: ['saturation', 'vibrant', 'color', 'boost'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Droplets',
    componentKey: 'PhotoSaturationBoosterTool',
    active: true,
  },
  {
    num: 27,
    id: 'photo_sepia',
    name: 'Photo Sepia Effect',
    shortName: 'Sepia',
    category: 'photo_exam',
    description: 'Classic sepia tone with adjustable intensity for vintage look',
    tags: ['sepia', 'vintage', 'old', 'tone'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Coffee',
    componentKey: 'PhotoSepiaTool',
    active: true,
  },
  {
    num: 28,
    id: 'photo_vintage',
    name: 'Photo Vintage Filter',
    shortName: 'Vintage',
    category: 'photo_exam',
    description: 'Retro film look with warm tint, faded tones, and vignette',
    tags: ['vintage', 'retro', 'filter', 'vignette', 'film'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Camera',
    componentKey: 'PhotoVintageTool',
    active: true,
  },
  {
    num: 29,
    id: 'photo_watermark',
    name: 'Photo Watermark Adder',
    shortName: 'Watermark',
    category: 'photo_exam',
    description: 'Add text watermark with customizable position, size, opacity, and rotation',
    tags: ['watermark', 'text', 'copyright', 'brand'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Stamp',
    componentKey: 'PhotoWatermarkTool',
    active: true,
  },
  {
    num: 30,
    id: 'photo_text_overlay',
    name: 'Photo Text Overlay',
    shortName: 'Text Overlay',
    category: 'photo_exam',
    description: 'Add stylized text on photos with font, size, color, and stroke options',
    tags: ['text', 'overlay', 'caption', 'font'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Type',
    componentKey: 'PhotoTextOverlayTool',
    active: true,
  },
  {
    num: 31,
    id: 'photo_metadata_viewer',
    name: 'Photo Metadata Viewer',
    shortName: 'Metadata',
    category: 'photo_exam',
    description: 'View image details — dimensions, file size, aspect ratio, DPI estimation',
    tags: ['metadata', 'exif', 'info', 'details'],
    vleEssential: false,
    isPremium: false,
    iconName: 'Info',
    componentKey: 'PhotoMetadataViewerTool',
    active: true,
  },
  {
    num: 32,
    id: 'photo_dpi_converter',
    name: 'Photo DPI Converter',
    shortName: 'DPI',
    category: 'photo_exam',
    description: 'Set or convert DPI metadata (72, 96, 150, 300) for print-ready output',
    tags: ['dpi', 'ppi', 'print', 'resolution'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Printer',
    componentKey: 'PhotoDpiConverterTool',
    active: true,
  },
  {
    num: 33,
    id: 'photo_bulk_resizer',
    name: 'Bulk Image Resizer',
    shortName: 'Bulk Resize',
    category: 'photo_exam',
    description: 'Resize multiple images at once to same dimensions — download all as ZIP',
    badge: 'PREMIUM',
    tags: ['bulk', 'batch', 'multiple', 'resize', 'zip'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Layers',
    componentKey: 'BulkImageResizerTool',
    active: true,
  },
  {
    num: 34,
    id: 'photo_bulk_compressor',
    name: 'Bulk Image Compressor',
    shortName: 'Bulk Compress',
    category: 'photo_exam',
    description: 'Compress multiple images to target quality — download all as ZIP',
    badge: 'PREMIUM',
    tags: ['bulk', 'batch', 'compress', 'zip'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Archive',
    componentKey: 'BulkImageCompressorTool',
    active: true,
  },
  {
    num: 35,
    id: 'image_to_base64',
    name: 'Image to Base64 Converter',
    shortName: 'To Base64',
    category: 'photo_exam',
    description: 'Convert image to Base64 data URL — perfect for embedding in HTML/CSS',
    tags: ['base64', 'encode', 'data url', 'embed'],
    vleEssential: false,
    isPremium: false,
    iconName: 'Code',
    componentKey: 'ImageToBase64Tool',
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
  'photo_bg_remover',             // #021
  'photo_auto_enhancer',          // #022
  'photo_old_restorer',           // #023
  'photo_bulk_resizer',           // #033
  'photo_bulk_compressor',        // #034
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
  // 🆕 Batch 3
  'photo_bg_remover',
  'photo_auto_enhancer',
  'photo_bg_colorizer',
  'photo_color_inverter',
  'photo_saturation_booster',
  'photo_sepia',
  'photo_vintage',
  'photo_watermark',
  'photo_text_overlay',
  'photo_dpi_converter',
  'photo_bulk_resizer',
  'photo_bulk_compressor',
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
// TOOL REQUESTS — Clean slate (demo data hata diya)
// ============================================
export const INITIAL_TOOL_REQUESTS: ToolRequestItem[] = [];
