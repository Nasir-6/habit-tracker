import { createFileRoute } from '@tanstack/react-router'
import { and, eq, or } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits, partnerships } from '@/db/schema'
import { badRequest, handleApi, notFound, ok, withAuth } from '@/lib/api'
import { formatUtcDate, parseLocalDateParts } from '@/lib/date'

const getPartnerParams = (request: Request) => {
  const url = new URL(request.url)
  const localDate = url.searchParams.get('localDate')

  if (!localDate) {
    return null
  }

  if (!parseLocalDateParts(localDate)) {
    return null
  }

  return { localDate }
}

export const Route = createFileRoute('/api/partnerships')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(async ({ request, user }) => {
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
            return notFound('No partnership found')
          }

          const partnerUserId =
            partnership.userAId === user.id
              ? partnership.userBId
              : partnership.userAId
          const startedOn = formatUtcDate(partnership.startedAt)
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
        }),
      ),
      DELETE: handleApi(
        withAuth(async ({ user }) => {
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
            return notFound('No partnership found')
          }

          await db.delete(partnerships).where(eq(partnerships.id, existing.id))

          return ok({ revoked: true })
        }),
      ),
    },
  },
})
