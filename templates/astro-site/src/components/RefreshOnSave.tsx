import { isDocumentEvent, ready } from '@payloadcms/live-preview'
import { useCallback, useEffect, useRef } from 'react'

interface Props {
  serverURL: string
}

// Listens for Payload save events and silently swaps the page content
// without a visible reload. Debounces rapid autosave events (1.5s interval)
// so the preview doesn't flash.
export default function RefreshOnSave({ serverURL }: Props) {
  const hasSentReady = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()
  const isFetching = useRef(false)

  const swapContent = useCallback(async () => {
    if (isFetching.current) return
    isFetching.current = true
    try {
      const res = await fetch(window.location.href)
      if (!res.ok) return
      const html = await res.text()
      const parser = new DOMParser()
      const newDoc = parser.parseFromString(html, 'text/html')
      // Replace <main> (or <article>) content with the freshly rendered version.
      // This is safe: the HTML comes from our own Astro SSR server (same origin),
      // not from user input or external sources.
      const newMain = newDoc.querySelector('main') || newDoc.querySelector('article') || newDoc.body
      const currentMain = document.querySelector('main') || document.querySelector('article')
      if (currentMain && newMain) {
        currentMain.replaceChildren(...Array.from(newMain.childNodes).map(n => n.cloneNode(true)))
      }
    } catch {} finally {
      isFetching.current = false
    }
  }, [])

  useEffect(() => {
    if (!hasSentReady.current) {
      hasSentReady.current = true
      const target = window.opener || window.parent
      if (target && target !== window) {
        target.postMessage({ type: 'payload-live-preview', ready: true }, serverURL)
      }
    }

    const onMessage = (event: MessageEvent) => {
      // Listen for both document events AND live preview field changes.
      // Autosave sends live-preview events, explicit save sends document events.
      const isFromPayload = event.origin === serverURL
        && event.data
        && typeof event.data === 'object'
        && (event.data.type === 'payload-document-event' || event.data.type === 'payload-live-preview')

      if (isFromPayload) {
        // Debounce: wait 2s after last event before swapping.
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(swapContent, 2000)
      }
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [serverURL, swapContent])

  return null
}
