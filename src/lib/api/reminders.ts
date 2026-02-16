import webPush from 'web-push'

import { ok, parseJson } from '@/lib/api'
import { claimHabitReminderDispatches } from '@/db/habit-reminder-dispatches'
import { fetchCompletionHabitIdsByDate } from '@/db/completions'
import { fetchDueHabitReminders } from '@/db/habits'
import {
  deactivatePushSubscription,
  fetchActivePushSubscriptionsForUser,
} from '@/db/push-subscriptions'
import { formatUtcDateWithOffset } from '@/lib/date'

type ReminderDispatchPayload = {
  nowIso?: unknown
  tzOffsetMinutes?: unknown
}

type PushResult = {
  sentCount: number
  staleCount: number
}

const MAX_TZ_OFFSET_MINUTES = 14 * 60

let webPushConfigured = false
let webPushConfigAttempted = false

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

const getDispatchNow = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return new Date()
  }

  const { nowIso } = payload as ReminderDispatchPayload

  if (typeof nowIso !== 'string' || !nowIso.trim()) {
    return new Date()
  }

  const parsed = new Date(nowIso)

  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }

  return parsed
}

const getTzOffsetMinutes = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return 0
  }

  const { tzOffsetMinutes } = payload as ReminderDispatchPayload

  if (
    typeof tzOffsetMinutes !== 'number' ||
    !Number.isInteger(tzOffsetMinutes) ||
    Math.abs(tzOffsetMinutes) > MAX_TZ_OFFSET_MINUTES
  ) {
    return 0
  }

  return tzOffsetMinutes
}

const getLocalTime = (date: Date, tzOffsetMinutes: number) => {
  const shifted =
    tzOffsetMinutes === 0
      ? date
      : new Date(date.getTime() - tzOffsetMinutes * 60 * 1000)

  const hour = String(shifted.getUTCHours()).padStart(2, '0')
  const minute = String(shifted.getUTCMinutes()).padStart(2, '0')

  return `${hour}:${minute}`
}

const sendReminderNotifications = async (
  userId: string,
  reminders: readonly { id: string; name: string }[],
): Promise<PushResult> => {
  if (!reminders.length || !ensureWebPushConfigured()) {
    return { sentCount: 0, staleCount: 0 }
  }

  const subscriptions = await fetchActivePushSubscriptionsForUser(userId)

  if (!subscriptions.length) {
    return { sentCount: 0, staleCount: 0 }
  }

  const staleEndpoints = new Set<string>()
  let sentCount = 0

  for (const reminder of reminders) {
    const payload = JSON.stringify({
      type: 'habit_reminder',
      habitId: reminder.id,
      title: 'Habit reminder',
      body: `Time for ${reminder.name}`,
    })

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

          sentCount += 1
        } catch (error) {
          if (isStalePushSubscriptionError(error)) {
            staleEndpoints.add(subscription.endpoint)
          }
        }
      }),
    )
  }

  await Promise.all(
    Array.from(staleEndpoints).map((endpoint) =>
      deactivatePushSubscription(userId, endpoint),
    ),
  )

  return { sentCount, staleCount: staleEndpoints.size }
}

export const handleReminderDispatchPost = async (
  request: Request,
  userId: string,
) => {
  const payload = await parseJson(request)
  const now = getDispatchNow(payload)
  const tzOffsetMinutes = getTzOffsetMinutes(payload)
  const localDate = formatUtcDateWithOffset(now, tzOffsetMinutes)
  const localTime = getLocalTime(now, tzOffsetMinutes)

  const [dueHabits, completedHabitIds] = await Promise.all([
    fetchDueHabitReminders(userId, localTime),
    fetchCompletionHabitIdsByDate(userId, localDate),
  ])

  const completedSet = new Set(completedHabitIds)

  const dueIncomplete = dueHabits
    .filter((habit) => !completedSet.has(habit.id))
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
    }))

  const dispatchableReminders = await claimHabitReminderDispatches(
    userId,
    localDate,
    dueIncomplete,
  )

  const push = await sendReminderNotifications(userId, dispatchableReminders)

  return ok({
    dispatchedAt: now.toISOString(),
    localDate,
    localTime,
    dueHabitsCount: dueHabits.length,
    skippedCompletedCount: dueHabits.length - dueIncomplete.length,
    skippedAlreadyRemindedCount:
      dueIncomplete.length - dispatchableReminders.length,
    remindedHabitsCount: dispatchableReminders.length,
    push,
  })
}
