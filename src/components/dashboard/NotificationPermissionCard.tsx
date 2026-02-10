import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { requestApi } from '@/lib/client-api'
import { cn } from '@/lib/utils'

const base64UrlToUint8Array = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
  const raw = atob(padded)

  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

const subscribeToPush = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not available in this browser')
  }

  const permission = await Notification.requestPermission()

  if (permission === 'denied') {
    throw new Error(
      'Notifications are blocked. Enable them in browser settings and try again.',
    )
  }

  if (permission !== 'granted') {
    throw new Error('Notification permission is required to enable alerts')
  }

  const config = await requestApi<{ vapidPublicKey?: string }>(
    '/api/push-subscriptions',
    undefined,
    'Unable to load notification configuration',
  )

  const vapidPublicKey = config.vapidPublicKey?.trim()

  if (!vapidPublicKey) {
    throw new Error('Push configuration is missing. Try again later.')
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
    })
  }

  await requestApi(
    '/api/push-subscriptions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    },
    'Unable to enable notifications',
  )

  return Notification.permission
}

export function NotificationPermissionCard() {
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [notice, setNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)
  }, [])

  const { mutate: enableNotifications, isPending } = useMutation({
    mutationFn: subscribeToPush,
    onMutate: () => {
      setNotice(null)
      setErrorMessage(null)
    },
    onSuccess: (nextPermission) => {
      setPermission(nextPermission)
      setNotice('Notifications enabled')
    },
    onError: (error) => {
      setPermission(
        'Notification' in window ? Notification.permission : 'default',
      )
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to enable notifications',
      )
    },
  })

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  const isBlocked = permission === 'denied'
  const buttonLabel =
    permission === 'granted' ? 'Refresh notifications' : 'Enable notifications'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {permission === 'granted'
            ? 'Enabled'
            : isBlocked
              ? 'Blocked'
              : 'Optional'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Get nudges even when this tab is in the background.
      </p>
      <div className="mt-4 grid gap-3">
        <button
          className={cn(
            'min-h-[44px] w-full rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition sm:w-auto',
            !isSupported || isPending || isBlocked
              ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
              : 'bg-slate-900 text-white shadow-slate-900/15 hover:bg-slate-800',
          )}
          disabled={!isSupported || isPending || isBlocked}
          type="button"
          onClick={() => {
            enableNotifications()
          }}
        >
          {isPending ? 'Enabling…' : buttonLabel}
        </button>
        {!isSupported ? (
          <p className="text-sm text-rose-500">
            This browser cannot register push notifications.
          </p>
        ) : null}
        {isBlocked ? (
          <p className="text-sm text-rose-500">
            Notification permission is blocked. Re-enable it in browser
            settings.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-rose-500" role="status">
            {errorMessage}
          </p>
        ) : notice ? (
          <p className="text-sm text-emerald-600" role="status">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  )
}
