import { badRequest, created, notFound, ok, parseJson } from '@/lib/api'
import {
  archiveHabit,
  deleteHabitById,
  fetchActiveHabits,
  fetchHabitById,
  fetchHabitsByIds,
  fetchLastHabitSortOrder,
  insertHabit,
  updateHabitSortOrder,
} from '@/db/habits'

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

const getHabitIdFromQuery = (request: Request) => {
  const url = new URL(request.url)
  const habitId = url.searchParams.get('habitId')

  if (!habitId || habitId.trim().length === 0) {
    return null
  }

  return habitId
}

export const handleHabitsGet = async (userId: string) => {
  const rows = await fetchActiveHabits(userId)
  return ok({ habits: rows })
}

export const handleHabitsPost = async (request: Request, userId: string) => {
  const payload = await parseJson(request)

  const habitName = getHabitName(payload)

  if (!habitName) {
    return badRequest('Name is required')
  }

  const lastHabit = await fetchLastHabitSortOrder(userId)
  const nextSortOrder = (lastHabit?.sortOrder ?? 0) + 1

  const inserted = await insertHabit(userId, habitName, nextSortOrder)

  if (!inserted) {
    return badRequest('Unable to save habit')
  }

  return createdHabit(inserted)
}

export const handleHabitsPatch = async (request: Request, userId: string) => {
  const payload = await parseJson(request)

  const orderedIds = getOrderedIds(payload)
  const archiveId = getArchiveId(payload)

  if (orderedIds && archiveId) {
    return badRequest('Provide either ordered habit ids or archive id')
  }

  if (archiveId) {
    const habit = await fetchHabitById(userId, archiveId)

    if (!habit) {
      return badRequest('Habit not found')
    }

    if (!habit.archivedAt) {
      await archiveHabit(userId, archiveId)
    }

    return ok({ archived: true })
  }

  if (!orderedIds) {
    return badRequest('Ordered habit ids are required')
  }

  const existing = await fetchHabitsByIds(userId, orderedIds)

  if (existing.length !== orderedIds.length) {
    return badRequest('One or more habits were not found')
  }

  for (const [index, habitId] of orderedIds.entries()) {
    await updateHabitSortOrder(userId, habitId, index + 1)
  }

  return ok({ success: true })
}

export const handleHabitsDelete = async (request: Request, userId: string) => {
  const habitId = getHabitIdFromQuery(request)

  if (!habitId) {
    return badRequest('Habit id is required')
  }

  const deleted = await deleteHabitById(userId, habitId)

  if (!deleted) {
    return notFound('Habit not found')
  }

  return ok({ deleted: true })
}
