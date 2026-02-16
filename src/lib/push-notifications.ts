import { requestApi } from '@/lib/client-api'

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
