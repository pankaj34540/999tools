import { ToolDefinition, ToolCategory, ToolRequestItem } from '../types';

export const TOOL_CATEGORIES: { id: ToolCategory; label: string; count: number; description: string; icon: string }[] = [
  { id: 'photo_exam', label: '📸 Photo & Image', count: 10, description: 'Passport photo, resize, compress, convert', icon: 'Camera' },
  { id: 'pvc_print', label: '🆔 ID Card & Print', count: 0, description: 'Aadhaar, PAN, Voter ID formatters', icon: 'CreditCard' },
  { id: 'pdf_doc', label: '📄 PDF & Document', count: 4, description: 'Merge, split, compress PDF', icon: 'FileText' },
  { id: 'calculators', label: '🎓 Student & Exam', count: 0, description: 'Age calculator, bio-data, resume', icon: 'GraduationCap' },
  { id: 'cyber_business', label: '🏪 Cyber Cafe Business', count: 0, description: 'Billing, receipts, customer queue', icon: 'Store' },
  { id: 'generators_daily', label: '💰 Finance & Calculator', count: 0, description: 'EMI, GST, interest, tax', icon: 'IndianRupee' },
  { id: 'social_media', label: '📱 Social Media', count: 0, description: 'Instagram, Facebook resizers', icon: 'Share2' },
  { id: 'text_dev', label: '🔤 Text & Developer', count: 0, description: 'JSON, Base64, regex', icon: 'Code' },
  { id: 'qr_gen', label: '🎨 Generator Tools', count: 0, description: 'QR, barcode, password', icon: 'QrCode' },
  { id: 'security_util', label: '🔒 Security & Utility', count: 0, description: 'Hash, encryption, IP finder', icon: 'Shield' },
];

export const TOOLS_REGISTRY: ToolDefinition[] = [
  {
    num: 1,
    id: 'image_format_converter',
    name: 'Image Format Converter',
    shortName: 'Format Convert',
    category: 'photo_exam',
    description: 'Convert images between JPG, PNG, and WebP formats with adjustable quality. Supports batch conversion and ZIP download.',
    badge: 'POPULAR',
    tags: ['jpg', 'png', 'webp', 'convert', 'format', 'batch'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'RefreshCw',
    componentKey: 'ImageFormatConverter',
    active: true,
  },
  {
    num: 2,
    id: 'image_resizer',
    name: 'Image Resizer',
    shortName: 'Resize',
    category: 'photo_exam',
    description: 'Resize images to custom dimensions with 6 quick presets (Instagram, Passport, Facebook, YouTube). Aspect ratio lock and 3 resize modes.',
    badge: 'POPULAR',
    tags: ['resize', 'dimensions', 'instagram', 'passport', 'facebook'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Maximize2',
    componentKey: 'ImageResizer',
    active: true,
  },
  {
    num: 3,
    id: 'image_compressor',
    name: 'Image Compressor (Target KB)',
    shortName: 'Compress',
    category: 'photo_exam',
    description: 'Compress images to exact file size (20KB, 50KB, 100KB) for govt exam forms with smart binary search algorithm. Batch compression supported.',
    badge: 'PREMIUM',
    tags: ['compress', 'kb', 'size', 'ssc', 'upsc', 'railway', 'exam'],
    popular: true,
    vleEssential: true,
    isPremium: true,
    iconName: 'Zap',
    componentKey: 'ImageCompressor',
    active: true,
  },
  {
    num: 4,
    id: 'photo_rotator',
    name: 'Photo Rotator',
    shortName: 'Rotate',
    category: 'photo_exam',
    description: 'Rotate photos 90°, 180°, or any custom angle (-180° to +180°) with automatic canvas resize and white background fill.',
    tags: ['rotate', 'angle', 'turn', 'sideways', 'orientation'],
    vleEssential: true,
    isPremium: false,
    iconName: 'RotateCw',
    componentKey: 'PhotoRotator',
    active: true,
  },
  {
    num: 5,
    id: 'photo_flip_mirror',
    name: 'Photo Flip & Mirror',
    shortName: 'Flip',
    category: 'photo_exam',
    description: 'Mirror photos horizontally or flip vertically with one-click toggle. Perfect for correcting mirror selfies and orientation issues.',
    tags: ['flip', 'mirror', 'reverse', 'horizontal', 'vertical'],
    vleEssential: true,
    isPremium: false,
    iconName: 'FlipHorizontal',
    componentKey: 'PhotoFlip',
    active: true,
  },
  {
    num: 6,
    id: 'brightness_contrast',
    name: 'Brightness & Contrast',
    shortName: 'Brightness',
    category: 'photo_exam',
    description: 'Adjust brightness and contrast of photos with easy sliders. Perfect for fixing dark or washed-out images. Batch processing and ZIP download supported.',
    tags: ['brightness', 'contrast', 'light', 'dark', 'adjust', 'enhance'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Sun',
    componentKey: 'BrightnessContrast',
    active: true,
  },
  {
    num: 7,
    id: 'black_white_converter',
    name: 'Black & White Converter',
    shortName: 'B&W',
    category: 'photo_exam',
    description: 'Convert photos to black and white with multiple styles: grayscale, high contrast, sepia, and inverted. Batch processing supported.',
    tags: ['black', 'white', 'grayscale', 'sepia', 'bw', 'monochrome'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Palette',
    componentKey: 'BlackWhiteConverter',
    active: true,
  },
  {
    num: 8,
    id: 'photo_blur',
    name: 'Photo Blur',
    shortName: 'Blur',
    category: 'photo_exam',
    description: 'Apply blur effects with 4 styles: Gaussian, Box, Motion, and Radial. Adjustable intensity with real-time preview.',
    tags: ['blur', 'gaussian', 'motion', 'radial', 'soften', 'effect'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Droplet',
    componentKey: 'PhotoBlur',
    active: true,
  },
  {
    num: 9,
    id: 'photo_sharpener',
    name: 'Photo Sharpener',
    shortName: 'Sharpen',
    category: 'photo_exam',
    description: 'Enhance photo clarity with unsharp mask algorithm. Adjustable intensity and radius for professional-looking sharpening.',
    badge: 'PREMIUM',
    tags: ['sharpen', 'clarity', 'enhance', 'unsharp', 'detail', 'crisp'],
    vleEssential: true,
    isPremium: true,
    iconName: 'Sparkles',
    componentKey: 'PhotoSharpener',
    active: true,
  },
  {
    num: 10,
    id: 'photo_crop',
    name: 'Photo Crop',
    shortName: 'Crop',
    category: 'photo_exam',
    description: 'Interactive drag-and-crop tool with 8 aspect ratio presets (1:1, 4:3, 16:9, Passport, A4). Real-time preview with corner and edge handles.',
    badge: 'POPULAR',
    tags: ['crop', 'cut', 'trim', 'resize', 'aspect', 'ratio'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'Crop',
    componentKey: 'PhotoCrop',
    active: true,
  },
  {
    num: 11,
    id: 'image_to_pdf',
    name: 'Image to PDF',
    shortName: 'Img→PDF',
    category: 'pdf_doc',
    description: 'Convert multiple images (JPG, PNG, WebP) into a single PDF. Custom page sizes (A4, Letter, A3, Fit), orientation, margin, and quality control.',
    badge: 'POPULAR',
    tags: ['pdf', 'image', 'jpg', 'png', 'convert', 'document'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'FileImage',
    componentKey: 'ImageToPdf',
    active: true,
  },
  {
    num: 12,
    id: 'pdf_merge',
    name: 'PDF Merge',
    shortName: 'Merge PDF',
    category: 'pdf_doc',
    description: 'Combine multiple PDF files into a single PDF. Reorder files, see page count, and merge with one click. All processing is client-side.',
    badge: 'POPULAR',
    tags: ['pdf', 'merge', 'combine', 'join', 'document'],
    popular: true,
    vleEssential: true,
    isPremium: false,
    iconName: 'FilePlus',
    componentKey: 'PdfMerge',
    active: true,
  },
  {
    num: 13,
    id: 'pdf_split',
    name: 'PDF Split',
    shortName: 'Split PDF',
    category: 'pdf_doc',
    description: 'Split PDF into multiple files. Extract page ranges (1-3, 5, 7-9), split each page individually, or select pages interactively. ZIP download supported.',
    tags: ['pdf', 'split', 'extract', 'separate', 'pages', 'document'],
    vleEssential: true,
    isPremium: false,
    iconName: 'Scissors',
    componentKey: 'PdfSplit',
    active: true,
  },
  {
    num: 14,
    id: 'pdf_compress',
    name: 'PDF Compress',
    shortName: 'Compress PDF',
    category: 'pdf_doc',
    description: 'Reduce PDF file size with two modes: Smart (metadata cleanup, safe) and Deep (image recompression, heavy). Adjustable quality and render scale.',
    badge: 'PREMIUM',
    tags: ['pdf', 'compress', 'reduce', 'size', 'optimize', 'document'],
    vleEssential: true,
    isPremium: true,
    iconName: 'FileArchive',
    componentKey: 'PdfCompress',
    active: true,
  },
];

export const PREMIUM_TOOL_IDS: string[] = [
  'image_compressor',
  'photo_sharpener',
  'pdf_compress',
                          // ← YE ADD KARO
];
export const VLE_ESSENTIAL_IDS: string[] = [
  'image_format_converter',
  'image_resizer',
  'image_compressor',
  'photo_rotator',
  'photo_flip_mirror',
  'brightness_contrast',
  'black_white_converter',
  'photo_blur',
  'photo_crop',
  'image_to_pdf',
  'pdf_merge',
  'pdf_split',
  'pdf_compress',
];

export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] =>
  TOOLS_REGISTRY.filter((tool) => tool.category === category);

export const getToolById = (id: string): ToolDefinition | undefined =>
  TOOLS_REGISTRY.find((tool) => tool.id === id);

export const getToolByNum = (num: number): ToolDefinition | undefined =>
  TOOLS_REGISTRY.find((tool) => tool.num === num);

export const searchTools = (query: string): ToolDefinition[] => {
  const q = query.toLowerCase().trim();
  if (!q) return TOOLS_REGISTRY;
  return TOOLS_REGISTRY.filter((tool) =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.id.toLowerCase().includes(q) ||
    tool.num.toString().includes(q)
  );
};

export const isPremiumTool = (toolId: string): boolean => PREMIUM_TOOL_IDS.includes(toolId);
export const isVleEssential = (toolId: string): boolean => VLE_ESSENTIAL_IDS.includes(toolId);
export const getTotalToolCount = (): number => TOOLS_REGISTRY.length;
export const getPremiumToolCount = (): number => PREMIUM_TOOL_IDS.length;
export const getFreeToolCount = (): number => TOOLS_REGISTRY.length - PREMIUM_TOOL_IDS.length;

export const INITIAL_TOOL_REQUESTS: ToolRequestItem[] = [];
