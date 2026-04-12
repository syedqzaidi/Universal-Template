// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sentry from '@sentry/astro';

// Adapter: install ONE of these packages matching your deploy target:
//   pnpm add @astrojs/vercel       -- for Vercel
//   pnpm add @astrojs/cloudflare   -- for Cloudflare Pages
//   pnpm add @astrojs/node         -- for self-hosted VPS / Docker / Hostinger
// Then uncomment the matching import:
// import vercel from '@astrojs/vercel';
// import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';

// Load .env.local before config — Astro hasn't loaded it yet at config time.
// Parse just the vars we need; no external dependencies required.
if (!process.env.SITE_URL) {
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
    for (const line of envFile.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {}
}

// Derive port from SITE_URL so there's a single source of truth.
// init-project.sh sets SITE_URL with the correct port per project.
const siteUrl = process.env.SITE_URL;
if (!siteUrl) throw new Error('SITE_URL is not set. Run ./scripts/init-project.sh or check your .env.local');
const astroPort = parseInt(new URL(siteUrl).port || '4400', 10);

export default defineConfig({
  // Astro 6: output 'static' is the default — pages are SSG unless they
  // export `prerender = false` (used by preview and search routes).
  site: siteUrl,
  trailingSlash: 'never',
  server: { port: astroPort },
  adapter: node({ mode: 'standalone' }),  // Required for SSR routes (preview, search)
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sentry({
      project: process.env.SENTRY_PROJECT || 'astro-site',
      authToken: process.env.SENTRY_AUTH_TOKEN || '',
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      enabled: !!process.env.SENTRY_DSN,
    }),
  ],
});
