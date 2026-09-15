// ============================================
// PREMIUM TOOLS — IDs must match toolsRegistry.ts
// Free users: 3 uses/day per premium tool
// Premium/VLE users: Unlimited access
// ============================================
export const DEFAULT_PREMIUM_TOOL_IDS: string[] = [
  'photo_target_kb_compressor',  // #002
  'photo_sharpener',              // #009
  'govt_exam_resizer',            // #012
  'photo_bg_remover',             // #021
  'photo_auto_enhancer',          // #022
  'photo_old_restorer',           // #023
  'photo_bulk_resizer',           // #033
  'photo_bulk_compressor',        // #034
  'raw_to_jpg',                   // #040 ⭐ NEW
  'gif_frame_extractor',          // #041 ⭐ NEW
  'image_noise_remover',          // #049 ⭐ NEW
  'image_cartoonizer',            // #050 ⭐ NEW
];

export const isPremiumTool = (toolId: string, customPremiumList?: string[]): boolean => {
  const list = customPremiumList && customPremiumList.length > 0 
    ? customPremiumList 
    : DEFAULT_PREMIUM_TOOL_IDS;
  return list.includes(toolId);
};

export const FREE_USER_DAILY_LIMIT = 3;
