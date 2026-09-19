import { ToolDefinition, ToolCategory, ToolRequestItem } from '../types';

export const TOOL_CATEGORIES: { id: ToolCategory; label: string; count: number; description: string; icon: string }[] = [
  { id: 'photo_exam', label: '📸 Photo & Image', count: 4, description: 'Passport photo, resize, compress, convert', icon: 'Camera' },
  { id: 'pvc_print', label: '🆔 ID Card & Print', count: 0, description: 'Aadhaar, PAN, Voter ID formatters', icon: 'CreditCard' },
  { id: 'pdf_doc', label: '📄 PDF & Document', count: 0, description: 'Merge, split, compress PDF', icon: 'FileText' },
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
];

export const PREMIUM_TOOL_IDS: string[] = [
  'image_compressor',                  // ← YE ADD KARO
];
export const VLE_ESSENTIAL_IDS: string[] = [
  'image_format_converter',
  'image_resizer',
  'image_compressor',
  'photo_rotator',
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
