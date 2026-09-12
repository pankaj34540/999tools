export const DEFAULT_PREMIUM_TOOL_IDS: string[] = [
  'ai_bg_remover',
  'old_photo_restorer',
  'photo_auto_enhancer',
  'photo_spectacles_remover',
  'face_centering_auto_crop',
  'pdf_watermark_stamper',
  'pdf_protect_unlock',
  'pdf_metadata_inspector',
  'multi_card_a4_sheet',
  'card_border_lamination_guide',
  'photo_collage_maker',
  'photo_grid_maker',
  'polaroid_photo_maker',
  'album_page_maker',
  'heic_to_jpg',
  'raw_to_jpg',
  'gif_frame_extractor',
  'image_to_base64',
  'bulk_image_resizer',
  'bulk_photo_processor',
  'custom_qr_colors',
  'whatsapp_business_qr',
  'upi_standee_maker',
  'wifi_qr_poster_maker',
  'video_compressor',
  'video_to_mp3',
  'audio_cutter',
  'video_trimmer',
  'video_to_gif',
  'css_gradient_generator',
  'font_pair_preview',
  'color_palette_extractor',
  'json_formatter',
  'base64_encoder',
  'url_encoder',
  'html_encoder',
  'uuid_generator',
  'hash_generator',
  'cron_parser',
  'regex_tester',
  'strong_password_generator',
  'password_strength_checker',
  'encryption_tool',
  'income_tax_calculator',
  'loan_eligibility_calculator',
  'compound_interest_calculator',
];

export const isPremiumTool = (toolId: string, customPremiumList?: string[]): boolean => {
  const list = customPremiumList && customPremiumList.length > 0 
    ? customPremiumList 
    : DEFAULT_PREMIUM_TOOL_IDS;
  return list.includes(toolId);
};

export const FREE_USER_DAILY_LIMIT = 3;

export const PRICING_PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '700+ tools unlimited',
      '299 premium tools (3 uses/day)',
      'Basic customer support',
    ],
    premiumToolLimit: 3,
    showAds: true,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    monthlyPrice: 49,
    yearlyPrice: 399,
    features: [
      '999 tools unlimited',
      'No advertisements',
      'Priority support',
      'Early access to new tools',
    ],
    premiumToolLimit: -1,
    showAds: false,
  },
  {
    id: 'vle' as const,
    name: 'VLE / Cyber Cafe',
    monthlyPrice: 199,
    yearlyPrice: 1499,
    features: [
      '999 tools unlimited',
      'No advertisements',
      'Khatabook customer ledger',
      'Shop branding & watermark',
      'Customer job queue',
      'Priority support',
      'WhatsApp reminder system',
    ],
    premiumToolLimit: -1,
    showAds: false,
  },
];
