import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, desc, eq, lte } from 'drizzle-orm'

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

const formatLocalDate = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const previousLocalDate = (value: string) => {
  const parsed = parseLocalDate(value)

  if (!parsed) {
    return null
  }

  const previous = new Date(parsed.utcDate)
  previous.setUTCDate(previous.getUTCDate() - 1)
  return formatLocalDate(previous)
}

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

const getStreakParams = (request: Request) => {
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

const getCurrentStreak = (
  completed: { completedOn: string }[],
  localDate: string,
) => {
  let expectedDate = localDate
  let count = 0

  for (const completion of completed) {
    if (completion.completedOn === expectedDate) {
      count += 1
      const previous = previousLocalDate(expectedDate)

      if (!previous) {
        break
      }

      expectedDate = previous
      continue
    }

    if (completion.completedOn < expectedDate) {
      break
    }
  }

  return count
}

const getBestStreak = (completed: { completedOn: string }[]) => {
  let best = 0
  let count = 0
  let expectedDate: string | null = null

  for (const completion of completed) {
    if (!expectedDate) {
      count = 1
    } else if (completion.completedOn === expectedDate) {
      count += 1
    } else {
      count = 1
    }

    if (count > best) {
      best = count
    }

    expectedDate = previousLocalDate(completion.completedOn)
  }

  return best
}

export const Route = createFileRoute('/api/streaks')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        const params = getStreakParams(request)

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

        let completions: { completedOn: string }[] = []

        try {
          completions = await db
            .select({ completedOn: habitCompletions.completedOn })
            .from(habitCompletions)
            .where(
              and(
                eq(habitCompletions.userId, user.id),
                eq(habitCompletions.habitId, habitId),
                lte(habitCompletions.completedOn, localDate),
              ),
            )
            .orderBy(desc(habitCompletions.completedOn))
        } catch (error) {
          const pgError = (error as { cause?: { code?: string } }).cause
          if (pgError?.code !== '42P01') {
            throw error
          }
        }

        const currentStreak = getCurrentStreak(completions, localDate)
        const bestStreak = getBestStreak(completions)

        return ok({ currentStreak, bestStreak })
      },
    },
  },
})
