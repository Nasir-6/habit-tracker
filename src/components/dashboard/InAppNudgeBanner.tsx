import { useEffect, useState } from 'react'

type NudgeBannerMessage = {
  type?: string
  title?: string
  body?: string
}

type NudgeBannerState = {
  title: string
  body: string
}

const BANNER_AUTO_DISMISS_MS = 7000

const resolveBannerPayload = (
  message: NudgeBannerMessage,
): NudgeBannerState | null => {
  if (message.type !== 'partner_nudge_banner') {
    return null
  }

  const title = message.title?.trim() || 'Habit nudge'
  const body = message.body?.trim() || 'Your partner sent you a nudge.'

  return { title, body }
}

export function InAppNudgeBanner() {
  const [banner, setBanner] = useState<NudgeBannerState | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const handleMessage = (event: MessageEvent<NudgeBannerMessage>) => {
      const payload = resolveBannerPayload(event.data)

      if (!payload) {
        return
      }

      setBanner(payload)
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  useEffect(() => {
    if (!banner) {
      return
    }

    const timeout = window.setTimeout(() => {
      setBanner(null)
    }, BANNER_AUTO_DISMISS_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [banner])

  if (!banner) {
    return null
  }

  return (
    <div
      className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-900 shadow-sm"
      role="status"
    >
      <div>
        <p className="text-sm font-semibold">{banner.title}</p>
        <p className="text-sm text-emerald-800">{banner.body}</p>
      </div>
      <button
        className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        type="button"
        onClick={() => {
          setBanner(null)
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
