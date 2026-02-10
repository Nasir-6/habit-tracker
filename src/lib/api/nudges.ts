import { badRequest, created, json } from '@/lib/api'
import {
  fetchLatestPartnerNudgeForSender,
  fetchPartnerNudgesSentSince,
  insertPartnerNudge,
} from '@/db/nudges'
import { fetchPartnershipForUser } from '@/db/partnerships'

const NUDGE_COOLDOWN_SECONDS = 15 * 60
const NUDGE_DAILY_LIMIT = 10

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

  return created({
    nudge,
    limits: {
      cooldownSeconds: NUDGE_COOLDOWN_SECONDS,
      dailyLimit: NUDGE_DAILY_LIMIT,
      remainingToday: Math.max(NUDGE_DAILY_LIMIT - nudgesToday.length - 1, 0),
    },
  })
}
