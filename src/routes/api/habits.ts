import { createFileRoute } from '@tanstack/react-router'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habits } from '@/db/schema'
import {
  badRequest,
  created,
  handleApi,
  ok,
  parseJson,
  withAuth,
} from '@/lib/api'

type HabitCreatePayload = {
  name?: unknown
}

type HabitOrderPayload = {
  orderedIds?: unknown
  archiveId?: unknown
}

const createdHabit = (habit: { id: string; name: string; sortOrder: number }) =>
  created({ habit })

const getHabitName = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { name } = payload as HabitCreatePayload

  if (typeof name !== 'string') {
    return null
  }

  const trimmedName = name.trim()

  if (trimmedName.length === 0) {
    return null
  }

  return trimmedName
}

const getOrderedIds = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { orderedIds } = payload as HabitOrderPayload

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return null
  }

  const ids = orderedIds.filter((id) => typeof id === 'string')

  if (ids.length !== orderedIds.length) {
    return null
  }

  return ids
}

const getArchiveId = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { archiveId } = payload as HabitOrderPayload

  if (typeof archiveId !== 'string' || archiveId.trim().length === 0) {
    return null
  }

  return archiveId
}

export const Route = createFileRoute('/api/habits')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(async ({ user }) => {
          const rows = await db
            .select({
              id: habits.id,
              name: habits.name,
              sortOrder: habits.sortOrder,
            })
            .from(habits)
            .where(and(eq(habits.userId, user.id), isNull(habits.archivedAt)))
            .orderBy(habits.sortOrder)

          return ok({ habits: rows })
        }),
      ),
      POST: handleApi(
        withAuth(async ({ request, user }) => {
          const payload = await parseJson(request)

          const habitName = getHabitName(payload)

          if (!habitName) {
            return badRequest('Name is required')
          }

          const lastHabit = await db
            .select({ sortOrder: habits.sortOrder })
            .from(habits)
            .where(eq(habits.userId, user.id))
            .orderBy(desc(habits.sortOrder))
            .limit(1)
            .then((rows) => rows.at(0))

          const nextSortOrder = (lastHabit?.sortOrder ?? 0) + 1

          const inserted = await db
            .insert(habits)
            .values({
              name: habitName,
              userId: user.id,
              sortOrder: nextSortOrder,
            })
            .returning({
              id: habits.id,
              name: habits.name,
              sortOrder: habits.sortOrder,
            })
            .then((rows) => rows.at(0))

          if (!inserted) {
            return badRequest('Unable to save habit')
          }

          return createdHabit(inserted)
        }),
      ),
      PATCH: handleApi(
        withAuth(async ({ request, user }) => {
          const payload = await parseJson(request)

          const orderedIds = getOrderedIds(payload)
          const archiveId = getArchiveId(payload)

          if (orderedIds && archiveId) {
            return badRequest('Provide either ordered habit ids or archive id')
          }

          if (archiveId) {
            const habit = await db
              .select({ id: habits.id, archivedAt: habits.archivedAt })
              .from(habits)
              .where(and(eq(habits.userId, user.id), eq(habits.id, archiveId)))
              .then((rows) => rows.at(0))

            if (!habit) {
              return badRequest('Habit not found')
            }

            if (!habit.archivedAt) {
              await db
                .update(habits)
                .set({ archivedAt: new Date() })
                .where(
                  and(
                    eq(habits.userId, user.id),
                    eq(habits.id, archiveId),
                    isNull(habits.archivedAt),
                  ),
                )
            }

            return ok({ archived: true })
          }

          if (!orderedIds) {
            return badRequest('Ordered habit ids are required')
          }

          const existing = await db
            .select({ id: habits.id })
            .from(habits)
            .where(
              and(eq(habits.userId, user.id), inArray(habits.id, orderedIds)),
            )

          if (existing.length !== orderedIds.length) {
            return badRequest('One or more habits were not found')
          }

          for (const [index, habitId] of orderedIds.entries()) {
            await db
              .update(habits)
              .set({ sortOrder: index + 1 })
              .where(and(eq(habits.userId, user.id), eq(habits.id, habitId)))
          }

          return ok({ success: true })
        }),
      ),
    },
  },
})
