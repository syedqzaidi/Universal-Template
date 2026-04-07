// Shared Sentry configuration defaults
// Each template has its own framework-specific Sentry package (@sentry/astro, @sentry/nextjs)
// This file provides shared config values

export const sentryDefaultConfig = {
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
};
