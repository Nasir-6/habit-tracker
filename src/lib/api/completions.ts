import { badRequest, created, ok, parseJson } from '@/lib/api'
import { isValidLocalDateString, parseLocalDateParts } from '@/lib/date'
import {
  deleteCompletion,
  fetchCompletion,
  fetchCompletionHabitIdsByDate,
  insertCompletion,
  insertCompletionsBulk,
} from '@/db/completions'
import { fetchHabitById, fetchHabitsByIds } from '@/db/habits'

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

const parseCompletion = (payload: unknown): CompletionPayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { habitId, localDate } = payload as CompletionCreatePayload

  if (typeof habitId !== 'string' || typeof localDate !== 'string') {
    return null
  }

  if (!parseLocalDateParts(localDate)) {
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

const getCompletionParams = (request: Request) => {
  const url = new URL(request.url)
  const localDate = url.searchParams.get('localDate')

  if (!localDate) {
    return null
  }

  if (!isValidLocalDateString(localDate)) {
    return null
  }

  return { localDate }
}

export const handleCompletionsGet = async (
  request: Request,
  userId: string,
) => {
  const params = getCompletionParams(request)

  if (!params) {
    return badRequest('Local date is required')
  }

  const habitIds = await fetchCompletionHabitIdsByDate(userId, params.localDate)

  return ok({ habitIds })
}

export const handleCompletionsPost = async (
  request: Request,
  userId: string,
) => {
  const payload = await parseJson(request)

  const completionList = getCompletionList(payload)

  if (completionList) {
    const habitIds = Array.from(
      new Set(completionList.map((completion) => completion.habitId)),
    )

    const ownedHabits = await fetchHabitsByIds(userId, habitIds)

    if (ownedHabits.length !== habitIds.length) {
      return badRequest('Habit not found')
    }

    const inserted = await insertCompletionsBulk(userId, completionList)

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

  const habit = await fetchHabitById(userId, habitId)

  if (!habit) {
    return badRequest('Habit not found')
  }

  const inserted = await insertCompletion(userId, habitId, localDate)

  if (inserted) {
    return created({ completion: inserted, created: true })
  }

  const existing = await fetchCompletion(userId, habitId, localDate)

  if (!existing) {
    return badRequest('Unable to save completion')
  }

  return ok({ completion: existing, created: false })
}

export const handleCompletionsDelete = async (
  request: Request,
  userId: string,
) => {
  const payload = await parseJson(request)

  const completionPayload = getCompletionPayload(payload)

  if (!completionPayload) {
    return badRequest('Habit id and local date are required')
  }

  const { habitId, localDate } = completionPayload

  const habit = await fetchHabitById(userId, habitId)

  if (!habit) {
    return badRequest('Habit not found')
  }

  const deleted = await deleteCompletion(userId, habitId, localDate)

  return ok({ removed: Boolean(deleted) })
}
