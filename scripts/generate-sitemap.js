// ============================================
// SITEMAP AUTO-GENERATOR (ES Module version)
// Runs on every Vercel build (via prebuild script)
// Reads toolsRegistry.ts + blogPosts.ts → sitemap.xml
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://tools999.store';
const TODAY = new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────
// 1. Extract tool IDs from toolsRegistry.ts
// ─────────────────────────────────────────
const registryPath = path.join(ROOT, 'src', 'data', 'toolsRegistry.ts');
const registryContent = fs.readFileSync(registryPath, 'utf-8');

const toolIdRegex = /num:\s*\d+,\s*\n\s*id:\s*'([a-z_]+)'/g;
const toolIds = [];
let match;
while ((match = toolIdRegex.exec(registryContent)) !== null) {
  toolIds.push(match[1]);
}
const uniqueToolIds = [...new Set(toolIds)];

// ─────────────────────────────────────────
// 2. Extract blog slugs from blogPosts.ts
// ─────────────────────────────────────────
const blogPath = path.join(ROOT, 'src', 'data', 'blogPosts.ts');
const blogContent = fs.readFileSync(blogPath, 'utf-8');

const blogSlugRegex = /\bslug:\s*'([a-z0-9-]+)'/g;
const blogSlugs = [];
while ((match = blogSlugRegex.exec(blogContent)) !== null) {
  blogSlugs.push(match[1]);
}

// ─────────────────────────────────────────
// 3. Build sitemap XML
// ─────────────────────────────────────────
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

// Tool pages (0.9 priority)
for (const toolId of uniqueToolIds) {
  sitemap += `  <url>
    <loc>${SITE_URL}/tools/${toolId}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
}

// Blog listing
sitemap += `  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

// Blog posts (0.8 priority)
for (const slug of blogSlugs) {
  sitemap += `  <url>
    <loc>${SITE_URL}/blog/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
}

// Static pages
const staticPages = [
  { path: '/services', priority: 0.8 },
  { path: '/pricing', priority: 0.7 },
  { path: '/contact', priority: 0.6 },
  { path: '/privacy', priority: 0.4 },
  { path: '/terms', priority: 0.4 },
  { path: '/refund', priority: 0.4 },
];

for (const page of staticPages) {
  sitemap += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
}

sitemap += `</urlset>
`;

// ─────────────────────────────────────────
// 4. Write to public/sitemap.xml
// ─────────────────────────────────────────
const outputPath = path.join(ROOT, 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, sitemap, 'utf-8');

const totalUrls = 1 + uniqueToolIds.length + 1 + blogSlugs.length + staticPages.length;
console.log('✅ Sitemap generated successfully!');
console.log(`   📍 Location: ${outputPath}`);
console.log(`   🛠️  Tools:      ${uniqueToolIds.length}`);
console.log(`   📝 Blog posts: ${blogSlugs.length}`);
console.log(`   📄 Static:     ${staticPages.length}`);
console.log(`   🌐 Total URLs: ${totalUrls}`);