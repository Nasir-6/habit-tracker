import { badRequest, ok } from '@/lib/api'
import { parseLocalDateParts } from '@/lib/date'
import { fetchCompletionsForHabitUpTo } from '@/db/completions'
import { fetchHabitById } from '@/db/habits'

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

export const handleHistoryGet = async (request: Request, userId: string) => {
  const params = getHistoryParams(request)

  if (!params) {
    return badRequest('Habit id and local date are required')
  }

  const { habitId, localDate } = params

  const habit = await fetchHabitById(userId, habitId)

  if (!habit) {
    return badRequest('Habit not found')
  }

  const rows = await fetchCompletionsForHabitUpTo(
    userId,
    habitId,
    localDate,
    'asc',
  )

  return ok({ habitId, dates: rows.map((row) => row.completedOn) })
}
