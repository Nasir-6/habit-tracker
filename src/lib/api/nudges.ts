import webPush from 'web-push'

import { badRequest, created, json } from '@/lib/api'
import {
  fetchLatestPartnerNudgeForSender,
  fetchPartnerNudgesSentSince,
  insertPartnerNudge,
} from '@/db/nudges'
import { fetchPartnershipForUser } from '@/db/partnerships'
import {
  deactivatePushSubscription,
  fetchActivePushSubscriptionsForUser,
} from '@/db/push-subscriptions'

const NUDGE_COOLDOWN_SECONDS = 15 * 60
const NUDGE_DAILY_LIMIT = 10

let webPushConfigured = false
let webPushConfigAttempted = false

const getUtcDayStart = (now: Date) => {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
}

const getCooldownSecondsRemaining = (lastNudgeAt: Date, now: Date) => {
  const elapsedMs = now.getTime() - lastNudgeAt.getTime()
  const cooldownMs = NUDGE_COOLDOWN_SECONDS * 1000

  if (elapsedMs >= cooldownMs) {
    return 0
  }

  return Math.ceil((cooldownMs - elapsedMs) / 1000)
}

const formatCooldownMessage = (secondsRemaining: number) => {
  if (secondsRemaining < 60) {
    return `Nudge cooldown active. Try again in ${secondsRemaining}s`
  }

  const minutesRemaining = Math.ceil(secondsRemaining / 60)

  return `Nudge cooldown active. Try again in ${minutesRemaining}m`
}

const ensureWebPushConfigured = () => {
  if (webPushConfigAttempted) {
    return webPushConfigured
  }

  webPushConfigAttempted = true

  const vapidPublicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim()
  const vapidPrivateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim()
  const vapidSubject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim()

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    webPushConfigured = false
    return false
  }

  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    webPushConfigured = true
  } catch {
    webPushConfigured = false
  }

  return webPushConfigured
}

const getErrorStatusCode = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return null
  }

  const maybeStatusCode = (error as { statusCode?: unknown }).statusCode

  if (typeof maybeStatusCode !== 'number') {
    return null
  }

  return maybeStatusCode
}

const isStalePushSubscriptionError = (error: unknown) => {
  const statusCode = getErrorStatusCode(error)
  return statusCode === 404 || statusCode === 410
}

const sendPartnerNudgePushNotifications = async (
  senderUserId: string,
  receiverUserId: string,
  nudge: { id: string; createdAt: Date },
) => {
  if (!ensureWebPushConfigured()) {
    return
  }

  const subscriptions =
    await fetchActivePushSubscriptionsForUser(receiverUserId)

  if (!subscriptions.length) {
    return
  }

  const payload = JSON.stringify({
    type: 'partner_nudge',
    nudgeId: nudge.id,
    senderUserId,
    createdAt: nudge.createdAt.toISOString(),
    title: 'Habit nudge',
    body: 'Your partner sent you a nudge.',
  })

  const staleEndpoints: string[] = []

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime?.getTime() ?? null,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        )
      } catch (error) {
        if (isStalePushSubscriptionError(error)) {
          staleEndpoints.push(subscription.endpoint)
        }
      }
    }),
  )

  await Promise.all(
    staleEndpoints.map((endpoint) =>
      deactivatePushSubscription(receiverUserId, endpoint),
    ),
  )
}

export const handleNudgesPost = async (userId: string) => {
  const partnership = await fetchPartnershipForUser(userId)

  if (!partnership) {
    return badRequest('Active partnership required to send a nudge')
  }

  const receiverUserId =
    partnership.userAId === userId ? partnership.userBId : partnership.userAId

  const now = new Date()
  const [latestNudge, nudgesToday] = await Promise.all([
    fetchLatestPartnerNudgeForSender(userId),
    fetchPartnerNudgesSentSince(userId, getUtcDayStart(now)),
  ])

  if (latestNudge) {
    const secondsRemaining = getCooldownSecondsRemaining(
      latestNudge.createdAt,
      now,
    )

    if (secondsRemaining > 0) {
      return json(
        {
          error: formatCooldownMessage(secondsRemaining),
          code: 'NUDGE_COOLDOWN',
          retryAfterSeconds: secondsRemaining,
        },
        429,
      )
    }
  }

  if (nudgesToday.length >= NUDGE_DAILY_LIMIT) {
    return json(
      {
        error: `Daily nudge limit reached (${NUDGE_DAILY_LIMIT}/day). Try again tomorrow`,
        code: 'NUDGE_DAILY_LIMIT',
        dailyLimit: NUDGE_DAILY_LIMIT,
      },
      429,
    )
  }

  const nudge = await insertPartnerNudge(userId, receiverUserId)

  if (!nudge) {
    return badRequest('Unable to send nudge')
  }

  try {
    await sendPartnerNudgePushNotifications(userId, receiverUserId, {
      id: nudge.id,
      createdAt: nudge.createdAt,
    })
  } catch {
    // Ignore push dispatch failures so nudge creation remains successful.
  }

  return created({
    nudge,
    limits: {
      cooldownSeconds: NUDGE_COOLDOWN_SECONDS,
      dailyLimit: NUDGE_DAILY_LIMIT,
      remainingToday: Math.max(NUDGE_DAILY_LIMIT - nudgesToday.length - 1, 0),
    },
  })
}
