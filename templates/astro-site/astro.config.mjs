// @ts-check
import { defineConfig } from 'astro/config';
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

export default defineConfig({
  // Astro 6: output 'static' is the default — pages are SSG unless they
  // export `prerender = false` (used by preview and search routes).
  site: process.env.SITE_URL || 'http://localhost:4400',
  trailingSlash: 'never',
  server: { port: 4400 },
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
