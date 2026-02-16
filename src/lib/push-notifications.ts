import { requestApi } from '@/lib/client-api'

const notificationPromptVisitKeyPrefix =
  'habit-tracker:notifications:last-visit:'
const staleNotificationPromptWindowMs = 14 * 24 * 60 * 60 * 1000

const base64UrlToUint8Array = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
  const raw = atob(padded)

  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

export const isPushNotificationsSupported = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return 'Notification' in window && 'serviceWorker' in navigator
}

export const getCurrentNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default'
  }

  return Notification.permission
}

export const hasActivePushSubscription = async () => {
  if (!isPushNotificationsSupported()) {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  return Boolean(subscription)
}

export type NotificationPromptReason = 'first_visit' | 'stale_return'

type ConsumeNotificationPromptReasonOptions = {
  userId: string
  isSupported: boolean
  isNotificationActive: boolean
  permission: NotificationPermission
}

export const consumeNotificationPromptReason = ({
  userId,
  isSupported,
  isNotificationActive,
  permission,
}: ConsumeNotificationPromptReasonOptions): NotificationPromptReason | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const storageKey = `${notificationPromptVisitKeyPrefix}${userId}`

  let previousVisitTimestamp: number | null = null

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    const parsedValue = rawValue ? Number(rawValue) : Number.NaN

    previousVisitTimestamp = Number.isFinite(parsedValue) ? parsedValue : null
    window.localStorage.setItem(storageKey, String(Date.now()))
  } catch {
    return null
  }

  if (!isSupported || isNotificationActive || permission === 'denied') {
    return null
  }

  if (previousVisitTimestamp === null) {
    return 'first_visit'
  }

  if (Date.now() - previousVisitTimestamp >= staleNotificationPromptWindowMs) {
    return 'stale_return'
  }

  return null
}

type SubscribeToPushOptions = {
  requestPermission: boolean
}

export const subscribeToPush = async ({
  requestPermission,
}: SubscribeToPushOptions) => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not available in this browser')
  }

  const permission = requestPermission
    ? await Notification.requestPermission()
    : Notification.permission

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
