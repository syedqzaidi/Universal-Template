// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  server: { port: 4400 },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    react(),
    sentry({
      project: process.env.SENTRY_PROJECT || 'astro-site',
      authToken: process.env.SENTRY_AUTH_TOKEN || '',
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
      enabled: !!process.env.SENTRY_DSN,
    }),
  ],
});
