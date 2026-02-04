import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, or } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits, partnerships } from '@/db/schema'
import { auth } from '@/lib/auth'

const jsonHeaders = {
  'content-type': 'application/json',
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

const badRequest = (message: string) => {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: jsonHeaders,
  })
}

const notFound = () => {
  return new Response(JSON.stringify({ error: 'No partnership found' }), {
    status: 404,
    headers: jsonHeaders,
  })
}

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
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

const getPartnerParams = (request: Request) => {
  const url = new URL(request.url)
  const localDate = url.searchParams.get('localDate')

  if (!localDate) {
    return null
  }

  if (!parseLocalDate(localDate)) {
    return null
  }

  return { localDate }
}

export const Route = createFileRoute('/api/partnerships')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        const params = getPartnerParams(request)

        if (!params) {
          return badRequest('Local date is required')
        }

        const partnership = await db
          .select({
            id: partnerships.id,
            userAId: partnerships.userAId,
            userBId: partnerships.userBId,
            startedAt: partnerships.startedAt,
          })
          .from(partnerships)
          .where(
            or(
              eq(partnerships.userAId, user.id),
              eq(partnerships.userBId, user.id),
            ),
          )
          .then((rows) => rows.at(0))

        if (!partnership) {
          return notFound()
        }

        const partnerUserId =
          partnership.userAId === user.id
            ? partnership.userBId
            : partnership.userAId
        const startedOn = formatLocalDate(partnership.startedAt)
        const { localDate } = params

        const partnerHabits = await db
          .select({
            id: habits.id,
            name: habits.name,
            sortOrder: habits.sortOrder,
          })
          .from(habits)
          .where(eq(habits.userId, partnerUserId))
          .orderBy(habits.sortOrder)

        let completedHabitIds = new Set<string>()

        if (localDate >= startedOn) {
          const completions = await db
            .select({ habitId: habitCompletions.habitId })
            .from(habitCompletions)
            .where(
              and(
                eq(habitCompletions.userId, partnerUserId),
                eq(habitCompletions.completedOn, localDate),
              ),
            )

          completedHabitIds = new Set(completions.map((row) => row.habitId))
        }

        const habitsWithStatus = partnerHabits.map((habit) => ({
          id: habit.id,
          name: habit.name,
          completedToday: completedHabitIds.has(habit.id),
        }))

        return ok({
          partner: { userId: partnerUserId, startedOn },
          habits: habitsWithStatus,
        })
      },
      DELETE: async () => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        const existing = await db
          .select({ id: partnerships.id })
          .from(partnerships)
          .where(
            or(
              eq(partnerships.userAId, user.id),
              eq(partnerships.userBId, user.id),
            ),
          )
          .then((rows) => rows.at(0))

        if (!existing) {
          return notFound()
        }

        await db.delete(partnerships).where(eq(partnerships.id, existing.id))

        return ok({ revoked: true })
      },
    },
  },
})
