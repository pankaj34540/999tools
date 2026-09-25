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
  // ─────────────────────────────────────────
  // 1. HEADER BANNER (728x90)
  // ─────────────────────────────────────────
  header: {
    key: 'header',
    label: 'Header Banner',
    size: '728x90',
    description: 'Top of page, below marquee',
    html: `<script type="text/javascript">
  atOptions = {
    'key' : '88813634d8cea941909d313392767bad',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/88813634d8cea941909d313392767bad/invoke.js"></script>`,
  },

  // ─────────────────────────────────────────
  // 2. TOOL WORKSPACE BANNER (300x250)
  // ─────────────────────────────────────────
  tool_banner: {
    key: 'tool_banner',
    label: 'Tool Workspace Banner',
    size: '300x250',
    description: 'Inside tool workspace',
    html: `<script type="text/javascript">
  atOptions = {
    'key' : '2ef8505895f174f8c060ae2dde6e969a',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/2ef8505895f174f8c060ae2dde6e969a/invoke.js"></script>`,
  },

  // ─────────────────────────────────────────
  // 3. SIDEBAR BANNER (160x600)
  // ─────────────────────────────────────────
  sidebar: {
    key: 'sidebar',
    label: 'Sidebar Banner',
    size: '160x600',
    description: 'Global sidebar',
    html: `<script type="text/javascript">
  atOptions = {
    'key' : 'e442beade8551ec6f5b46ac873258104',
    'format' : 'iframe',
    'height' : 600,
    'width' : 160,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/e442beade8551ec6f5b46ac873258104/invoke.js"></script>`,
  },

  // ─────────────────────────────────────────
  // 4. NATIVE BANNER
  // ─────────────────────────────────────────
  native_banner: {
    key: 'native_banner',
    label: 'Native Banner',
    size: 'Native',
    description: 'In-content native ad',
    html: `<script async="async" data-cfasync="false" src="https://pl31307600.profitableratecpmnetwork.com/01a82fbfbafd6dd1c171b99710d41e85/invoke.js"></script>
<div id="container-01a82fbfbafd6dd1c171b99710d41e85"></div>`,
  },

  // ─────────────────────────────────────────
  // 5. SOCIAL BAR
  // ─────────────────────────────────────────
  social_bar: {
    key: 'social_bar',
    label: 'Social Bar',
    size: 'Adsterra Social Bar',
    description: 'Sticky bottom social bar',
    html: `<script src="https://pl31307601.profitableratecpmnetwork.com/33/73/5f/33735f2163d96bb58d02a9750b19a248.js"></script>`,
  },

  // ─────────────────────────────────────────
  // 6. TOOL SIDEBAR — LEFT (160x600)
  //    ♻️ Reusing sidebar code #3
  // ─────────────────────────────────────────
  tool_sidebar_left: {
    key: 'tool_sidebar_left',
    label: 'Tool Sidebar — Left',
    size: '160x600',
    description: 'Left side of tool modal (desktop only)',
    html: `<script type="text/javascript">
  atOptions = {
    'key' : 'e442beade8551ec6f5b46ac873258104',
    'format' : 'iframe',
    'height' : 600,
    'width' : 160,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/e442beade8551ec6f5b46ac873258104/invoke.js"></script>`,
  },

  // ─────────────────────────────────────────
  // 7. TOOL SIDEBAR — RIGHT (160x600)
  //    ♻️ Reusing sidebar code #3
  // ─────────────────────────────────────────
  tool_sidebar_right: {
    key: 'tool_sidebar_right',
    label: 'Tool Sidebar — Right',
    size: '160x600',
    description: 'Right side of tool modal (desktop only)',
    html: `<script type="text/javascript">
  atOptions = {
    'key' : 'e442beade8551ec6f5b46ac873258104',
    'format' : 'iframe',
    'height' : 600,
    'width' : 160,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/e442beade8551ec6f5b46ac873258104/invoke.js"></script>`,
  },

  // ─────────────────────────────────────────
  // 8. DOWNLOAD POPUP (300x250)
  //    ♻️ Reusing tool_banner code #2
  // ─────────────────────────────────────────
  download_popup: {
    key: 'download_popup',
    label: 'Download Popup Ad',
    size: '300x250',
    description: 'Shown when free user clicks Download (5s wait)',
    html: `<script type="text/javascript">
  atOptions = {
    'key' : '2ef8505895f174f8c060ae2dde6e969a',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/2ef8505895f174f8c060ae2dde6e969a/invoke.js"></script>`,
  },
};
