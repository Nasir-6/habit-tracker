import { badRequest, created, ok, parseJson } from '@/lib/api'
import {
  deactivatePushSubscription,
  upsertPushSubscription,
} from '@/db/push-subscriptions'

type PushSubscriptionPayload = {
  subscription?: {
    endpoint?: unknown
    expirationTime?: unknown
    keys?: {
      p256dh?: unknown
      auth?: unknown
    }
  }
}

const toNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return trimmed
}

const getExpirationTime = (value: unknown) => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  if (value <= 0) {
    return null
  }

  return new Date(value)
}

const getSubscriptionInput = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { subscription } = payload as PushSubscriptionPayload

  if (!subscription || typeof subscription !== 'object') {
    return null
  }

  const endpoint = toNonEmptyString(subscription.endpoint)
  const p256dh = toNonEmptyString(subscription.keys?.p256dh)
  const auth = toNonEmptyString(subscription.keys?.auth)

  if (!endpoint || !p256dh || !auth) {
    return null
  }

  return {
    endpoint,
    p256dh,
    auth,
    expirationTime: getExpirationTime(subscription.expirationTime),
  }
}

export const handlePushSubscriptionsPost = async (
  request: Request,
  userId: string,
) => {
  const payload = await parseJson(request)
  const subscription = getSubscriptionInput(payload)

  if (!subscription) {
    return badRequest('Valid push subscription payload is required')
  }

  const stored = await upsertPushSubscription({ userId, ...subscription })

  if (!stored) {
    return badRequest('Unable to store push subscription')
  }

  return created({ subscription: stored })
}

export const handlePushSubscriptionsDelete = async (
  request: Request,
  userId: string,
) => {
  const payload = await parseJson(request)
  const subscription = getSubscriptionInput(payload)

  if (!subscription) {
    return badRequest('Valid push subscription payload is required')
  }

  const deactivated = await deactivatePushSubscription(
    userId,
    subscription.endpoint,
  )

  return ok({ removed: Boolean(deactivated) })
}
