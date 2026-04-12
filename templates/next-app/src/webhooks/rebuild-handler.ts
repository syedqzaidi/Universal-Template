// NOTE: The module-level debounce timer works correctly in long-running server
// environments (VPS/Docker) but will NOT survive across serverless cold starts
// (e.g. Vercel). In serverless environments, Vercel's native deploy hook
// deduplication handles the debounce — this timer is a no-op there.
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const triggerRebuild = async (webhookUrl: string) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(webhookUrl, { method: 'POST' })
      if (response.ok) {
        console.log(`[Rebuild] Triggered deploy at ${webhookUrl}`)
      } else {
        console.error(`[Rebuild] Deploy webhook returned ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('[Rebuild] Failed to trigger deploy:', error)
    }
  }, 30_000) // 30-second debounce
}
