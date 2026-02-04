import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits } from '@/db/schema'
import { auth } from '@/lib/auth'

type CompletionCreatePayload = {
  habitId?: unknown
  localDate?: unknown
}

type CompletionListPayload = {
  completions?: unknown
}

type CompletionPayload = {
  habitId: string
  localDate: string
}

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

const created = (payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status: 201,
    headers: jsonHeaders,
  })
}

const parseCompletion = (payload: unknown): CompletionPayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { habitId, localDate } = payload as CompletionCreatePayload

  if (typeof habitId !== 'string' || typeof localDate !== 'string') {
    return null
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate)

  if (!dateMatch) {
    return null
  }

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const utcDate = new Date(Date.UTC(year, month - 1, day))

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null
  }

  return { habitId, localDate }
}

const getCompletionPayload = (payload: unknown) => {
  return parseCompletion(payload)
}

const getCompletionList = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { completions } = payload as CompletionListPayload

  if (!Array.isArray(completions) || completions.length === 0) {
    return null
  }

  const parsed = completions.map((completion) => parseCompletion(completion))

  if (parsed.some((completion) => !completion)) {
    return null
  }

  return parsed.filter(
    (completion): completion is CompletionPayload => completion !== null,
  )
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

  return value
}

const getCompletionParams = (request: Request) => {
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

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

export const Route = createFileRoute('/api/completions')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        const params = getCompletionParams(request)

        if (!params) {
          return badRequest('Local date is required')
        }

        const rows = await db
          .select({ habitId: habitCompletions.habitId })
          .from(habitCompletions)
          .where(
            and(
              eq(habitCompletions.userId, user.id),
              eq(habitCompletions.completedOn, params.localDate),
            ),
          )

        return ok({ habitIds: rows.map((row) => row.habitId) })
      },
      POST: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        let payload: unknown

        try {
          payload = await request.json()
        } catch {
          return badRequest('Invalid JSON payload')
        }

        const completionList = getCompletionList(payload)

        if (completionList) {
          const habitIds = Array.from(
            new Set(completionList.map((completion) => completion.habitId)),
          )

          const ownedHabits = await db
            .select({ id: habits.id })
            .from(habits)
            .where(
              and(eq(habits.userId, user.id), inArray(habits.id, habitIds)),
            )

          if (ownedHabits.length !== habitIds.length) {
            return badRequest('Habit not found')
          }

          const inserted = await db
            .insert(habitCompletions)
            .values(
              completionList.map((completion) => ({
                habitId: completion.habitId,
                userId: user.id,
                completedOn: completion.localDate,
              })),
            )
            .onConflictDoNothing({
              target: [habitCompletions.habitId, habitCompletions.completedOn],
            })
            .returning({
              id: habitCompletions.id,
              habitId: habitCompletions.habitId,
              completedOn: habitCompletions.completedOn,
            })

          return ok({
            completions: inserted,
            createdCount: inserted.length,
            totalCount: completionList.length,
          })
        }

        const completionPayload = getCompletionPayload(payload)

        if (!completionPayload) {
          return badRequest('Habit id and local date are required')
        }

        const { habitId, localDate } = completionPayload

        const habit = await db
          .select({ id: habits.id })
          .from(habits)
          .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
          .then((rows) => rows.at(0))

        if (!habit) {
          return badRequest('Habit not found')
        }

        const inserted = await db
          .insert(habitCompletions)
          .values({
            habitId,
            userId: user.id,
            completedOn: localDate,
          })
          .onConflictDoNothing({
            target: [habitCompletions.habitId, habitCompletions.completedOn],
          })
          .returning({
            id: habitCompletions.id,
            habitId: habitCompletions.habitId,
            completedOn: habitCompletions.completedOn,
          })
          .then((rows) => rows.at(0))

        if (inserted) {
          return created({ completion: inserted, created: true })
        }

        const existing = await db
          .select({
            id: habitCompletions.id,
            habitId: habitCompletions.habitId,
            completedOn: habitCompletions.completedOn,
          })
          .from(habitCompletions)
          .where(
            and(
              eq(habitCompletions.habitId, habitId),
              eq(habitCompletions.userId, user.id),
              eq(habitCompletions.completedOn, localDate),
            ),
          )
          .then((rows) => rows.at(0))

        if (!existing) {
          return badRequest('Unable to save completion')
        }

        return ok({ completion: existing, created: false })
      },
      DELETE: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        let payload: unknown

        try {
          payload = await request.json()
        } catch {
          return badRequest('Invalid JSON payload')
        }

        const completionPayload = getCompletionPayload(payload)

        if (!completionPayload) {
          return badRequest('Habit id and local date are required')
        }

        const { habitId, localDate } = completionPayload

        const habit = await db
          .select({ id: habits.id })
          .from(habits)
          .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
          .then((rows) => rows.at(0))

        if (!habit) {
          return badRequest('Habit not found')
        }

        const deleted = await db
          .delete(habitCompletions)
          .where(
            and(
              eq(habitCompletions.habitId, habitId),
              eq(habitCompletions.userId, user.id),
              eq(habitCompletions.completedOn, localDate),
            ),
          )
          .returning({ id: habitCompletions.id })
          .then((rows) => rows.at(0))

        return ok({ removed: Boolean(deleted) })
      },
    },
  },
})
