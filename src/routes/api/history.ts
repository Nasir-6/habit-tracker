import { createFileRoute } from '@tanstack/react-router'
import { and, eq, lte } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits } from '@/db/schema'
import { badRequest, handleApi, ok, withAuth } from '@/lib/api'
import { parseLocalDateParts } from '@/lib/date'

const getHistoryParams = (request: Request) => {
  const url = new URL(request.url)
  const habitId = url.searchParams.get('habitId')
  const localDate = url.searchParams.get('localDate')

  if (!habitId || !localDate) {
    return null
  }

  if (!parseLocalDateParts(localDate)) {
    return null
  }

  return { habitId, localDate }
}

export const Route = createFileRoute('/api/history')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(async ({ request, user }) => {
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
        }),
      ),
    },
  },
})
