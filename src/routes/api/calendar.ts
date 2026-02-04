import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits } from '@/db/schema'
import { auth } from '@/lib/auth'

const jsonHeaders = {
  'content-type': 'application/json',
}

const badRequest = (message: string) => {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: jsonHeaders,
  })
}

const unauthorized = () => {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: jsonHeaders,
  })
}

const ok = (payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: jsonHeaders,
  })
}

const formatLocalDate = (date: Date, offsetMinutes = 0) => {
  const shiftedDate =
    offsetMinutes === 0
      ? date
      : new Date(date.getTime() - offsetMinutes * 60 * 1000)
  const year = shiftedDate.getUTCFullYear()
  const month = String(shiftedDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shiftedDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const maxDate = (left: string, right: string) => (left >= right ? left : right)

const minDate = (left: string, right: string) => (left <= right ? left : right)

const parseMonth = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (month < 1 || month > 12) {
    return null
  }

  const start = new Date(Date.UTC(year, month - 1, 1))

  if (
    start.getUTCFullYear() !== year ||
    start.getUTCMonth() !== month - 1 ||
    start.getUTCDate() !== 1
  ) {
    return null
  }

  const end = new Date(Date.UTC(year, month, 0))

  return {
    year,
    month,
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  }
}

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

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
      GET: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

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

        const habitCreatedOn = formatLocalDate(habitCreatedAt, tzOffsetMinutes)
        const today = formatLocalDate(new Date(), tzOffsetMinutes)
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
      },
    },
  },
})
