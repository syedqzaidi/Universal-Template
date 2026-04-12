import { createPayloadClient } from '@template/shared/payload'

// Single Payload client instance for the entire Astro site.
// PAYLOAD_API_URL is the only source of truth for the API location.
// Set in .env.local by init-project.sh with the correct per-project port.
export const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3100/api',
  apiKey: import.meta.env.PAYLOAD_API_KEY || undefined,
})
