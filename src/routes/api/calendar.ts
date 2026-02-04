import { createFileRoute } from '@tanstack/react-router'
import { and, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits } from '@/db/schema'
import { badRequest, handleApi, ok, withAuth } from '@/lib/api'
import { formatUtcDateWithOffset, parseMonth } from '@/lib/date'

const maxDate = (left: string, right: string) => (left >= right ? left : right)

const minDate = (left: string, right: string) => (left <= right ? left : right)

const getCalendarParams = (request: Request) => {
  const url = new URL(request.url)
  const habitId = url.searchParams.get('habitId')
  const month = url.searchParams.get('month')
  const tzOffsetParam = url.searchParams.get('tzOffsetMinutes')

  if (!habitId || !month) {
    return null
  }

  const parsedMonth = parseMonth(month)

  if (!parsedMonth) {
    return null
  }

  if (tzOffsetParam === null) {
    return { habitId, month, parsedMonth, tzOffsetMinutes: 0 }
  }

  if (!/^[-+]?\d+$/.test(tzOffsetParam)) {
    return null
  }

  const tzOffsetMinutes = Number(tzOffsetParam)

  if (!Number.isFinite(tzOffsetMinutes) || !Number.isInteger(tzOffsetMinutes)) {
    return null
  }

  if (Math.abs(tzOffsetMinutes) > 14 * 60) {
    return null
  }

  return { habitId, month, parsedMonth, tzOffsetMinutes }
}

export const Route = createFileRoute('/api/calendar')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(async ({ request, user }) => {
          const params = getCalendarParams(request)

          if (!params) {
            return badRequest('Habit id and month are required')
          }

          const { habitId, month, parsedMonth, tzOffsetMinutes } = params

          const habit = await db
            .select({ id: habits.id, createdAt: habits.createdAt })
            .from(habits)
            .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
            .then((rows) => rows.at(0))

          if (!habit) {
            return badRequest('Habit not found')
          }

          const habitCreatedAt =
            habit.createdAt instanceof Date
              ? habit.createdAt
              : new Date(habit.createdAt)

          if (Number.isNaN(habitCreatedAt.getTime())) {
            return badRequest('Habit creation date unavailable')
          }

          const habitCreatedOn = formatUtcDateWithOffset(
            habitCreatedAt,
            tzOffsetMinutes,
          )
          const today = formatUtcDateWithOffset(new Date(), tzOffsetMinutes)
          const startBound = maxDate(parsedMonth.startDate, habitCreatedOn)
          const endBound = minDate(parsedMonth.endDate, today)

          if (endBound < startBound) {
            return ok({ habitId, month, dates: [] })
          }

          const completions = await db
            .select({ completedOn: habitCompletions.completedOn })
            .from(habitCompletions)
            .where(
              and(
                eq(habitCompletions.userId, user.id),
                eq(habitCompletions.habitId, habitId),
                gte(habitCompletions.completedOn, startBound),
                lte(habitCompletions.completedOn, endBound),
              ),
            )
            .orderBy(habitCompletions.completedOn)

          return ok({
            habitId,
            month,
            dates: completions.map((row) => row.completedOn),
          })
        }),
      ),
    },
  },
})
