import { useEffect } from 'react'
import { toast } from 'sonner'

type NudgeBannerMessage = {
  type?: string
  title?: string
  body?: string
  nudgeId?: string
}

const resolveBannerPayload = (
  message: NudgeBannerMessage,
): { title: string; body: string; nudgeId?: string } | null => {
  if (message.type !== 'partner_nudge_banner') {
    return null
  }

  const title = message.title?.trim() || 'Habit nudge'
  const body = message.body?.trim() || 'Your partner sent you a nudge.'

  return {
    title,
    body,
    nudgeId: typeof message.nudgeId === 'string' ? message.nudgeId : undefined,
  }
}

export function InAppNudgeBanner() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log(
        'Service workers are not supported in this browser. In-app nudge banners will not work.',
      )
      return
    }

    const handleMessage = (event: MessageEvent<NudgeBannerMessage>) => {
      console.log('HANDLE INCOMING MESSAGE', event.data)
      const payload = resolveBannerPayload(event.data)
      console.log('payload :>> ', payload)
      if (!payload) {
        return
      }
      console.log('Firing toast with payload')

      toast(payload.title, {
        description: payload.body,
        duration: 7000,
        id: payload.nudgeId,
      })
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  return null
}
