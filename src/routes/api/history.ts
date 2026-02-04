import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, lte } from 'drizzle-orm'

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

const parseLocalDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utcDate = new Date(Date.UTC(year, month - 1, day))

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day, utcDate }
}

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

const getHistoryParams = (request: Request) => {
  const url = new URL(request.url)
  const habitId = url.searchParams.get('habitId')
  const localDate = url.searchParams.get('localDate')

  if (!habitId || !localDate) {
    return null
  }

  if (!parseLocalDate(localDate)) {
    return null
  }

  return { habitId, localDate }
}

export const Route = createFileRoute('/api/history')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        const params = getHistoryParams(request)

        if (!params) {
          return badRequest('Habit id and local date are required')
        }

        const { habitId, localDate } = params

        const habit = await db
          .select({ id: habits.id })
          .from(habits)
          .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
          .then((rows) => rows.at(0))

        if (!habit) {
          return badRequest('Habit not found')
        }

        const rows = await db
          .select({ completedOn: habitCompletions.completedOn })
          .from(habitCompletions)
          .where(
            and(
              eq(habitCompletions.userId, user.id),
              eq(habitCompletions.habitId, habitId),
              lte(habitCompletions.completedOn, localDate),
            ),
          )
          .orderBy(habitCompletions.completedOn)

        return ok({ habitId, dates: rows.map((row) => row.completedOn) })
      },
    },
  },
})
