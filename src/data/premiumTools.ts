// ============================================
// PREMIUM TOOLS — IDs must match toolsRegistry.ts
// Free users: 3 uses/day per premium tool
// Premium/VLE users: Unlimited access
// ============================================

export const DEFAULT_PREMIUM_TOOL_IDS: string[] = [
  'image_compressor',   // Tool #003 — actual live tool
  'photo_sharpener',    // Tool #009 — actual live tool
  'pdf_compress',       // Tool #014 — actual live tool
];

export const isPremiumTool = (toolId: string, customPremiumList?: string[]): boolean => {
  const list = customPremiumList && customPremiumList.length > 0 
    ? customPremiumList 
    : DEFAULT_PREMIUM_TOOL_IDS;
  return list.includes(toolId);
};

export const FREE_USER_DAILY_LIMIT = 3;
