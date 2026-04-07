import posthog from "posthog-js";

export function initPostHog(apiKey: string, apiHost: string) {
  if (typeof window !== "undefined" && apiKey) {
    posthog.init(apiKey, { api_host: apiHost });
  }
  return posthog;
}

export { posthog };
