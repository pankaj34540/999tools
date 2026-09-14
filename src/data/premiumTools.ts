// ============================================
// PREMIUM TOOLS — IDs must match toolsRegistry.ts
// Free users: 3 uses/day per premium tool
// Premium/VLE users: Unlimited access
// ============================================
export const DEFAULT_PREMIUM_TOOL_IDS: string[] = [
  'photo_target_kb_compressor',  // #002 Target KB Compressor
  'photo_sharpener',              // #009 Photo Sharpener
  'govt_exam_resizer',            // #012 Govt Exam Photo & Sign Resizer
];

export const isPremiumTool = (toolId: string, customPremiumList?: string[]): boolean => {
  const list = customPremiumList && customPremiumList.length > 0 
    ? customPremiumList 
    : DEFAULT_PREMIUM_TOOL_IDS;
  return list.includes(toolId);
};

export const FREE_USER_DAILY_LIMIT = 3;
