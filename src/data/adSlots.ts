// ============================================
// ADSTERRA AD CODES — GitHub Hardcoded
// Owner Panel se sirf ON/OFF toggle hoga
// Code change karne ke liye ye file GitHub mein edit karo
// ============================================

export interface AdSlotDefinition {
  key: string;
  label: string;
  size: string;
  description: string;
  html: string;
}

export const AD_SLOTS: Record<string, AdSlotDefinition> = {
  header: {
    key: 'header',
    label: 'Header Banner',
    size: '728x90',
    description: 'Top of page, below marquee',
    html: `<!-- Yahan Adsterra Header Banner (728x90) ka code paste karo -->`,
  },
  tool_banner: {
    key: 'tool_banner',
    label: 'Tool Workspace Banner',
    size: '300x250',
    description: 'Inside tool workspace',
    html: `<!-- Yahan Adsterra 300x250 ka code paste karo -->`,
  },
  sidebar: {
    key: 'sidebar',
    label: 'Sidebar Banner',
    size: '160x600',
    description: 'Sidebar in tools',
    html: `<!-- Yahan Adsterra 160x600 ka code paste karo -->`,
  },
  native_banner: {
    key: 'native_banner',
    label: 'Native Banner',
    size: 'Native',
    description: 'In-content native ad',
    html: `<!-- Yahan Adsterra Native Banner ka code paste karo -->`,
  },
  social_bar: {
    key: 'social_bar',
    label: 'Social Bar',
    size: 'Adsterra Social Bar',
    description: 'Sticky bottom social bar',
    html: `<!-- Yahan Adsterra Social Bar ka code paste karo -->`,
  },
  tool_sidebar_left: {
    key: 'tool_sidebar_left',
    label: 'Tool Sidebar — Left',
    size: '160x600',
    description: 'Left side of tool modal (desktop only)',
    html: `<!-- Yahan Adsterra 160x600 ka code paste karo -->`,
  },
  tool_sidebar_right: {
    key: 'tool_sidebar_right',
    label: 'Tool Sidebar — Right',
    size: '160x600',
    description: 'Right side of tool modal (desktop only)',
    html: `<!-- Yahan Adsterra 160x600 ka code paste karo -->`,
  },
  download_popup: {
    key: 'download_popup',
    label: 'Download Popup Ad',
    size: '300x250 / responsive',
    description: 'Shown when free user clicks Download (compulsory 5s wait)',
    html: `<!-- Yahan Adsterra Download Popup ka code paste karo -->`,
  },
};
