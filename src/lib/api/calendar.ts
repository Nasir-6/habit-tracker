import { badRequest, ok } from '@/lib/api'
import { formatUtcDateWithOffset, parseMonth } from '@/lib/date'
import { fetchCompletionsForHabitInRange } from '@/db/completions'
import { fetchHabitById } from '@/db/habits'

const maxDate = (left: string, right: string) => (left >= right ? left : right)

const minDate = (left: string, right: string) => (left <= right ? left : right)

const getCalendarParams = (request: Request) => {
  const url = new URL(request.url)
  const habitId = url.searchParams.get('habitId')
  const month = url.searchParams.get('month')
  const tzOffsetParam = url.searchParams.get('tzOffsetMinutes')

  if (!habitId || !month) {
    return null
  }

  const parsedMonth = parseMonth(month)

  if (!parsedMonth) {
    return null
  }

  if (tzOffsetParam === null) {
    return { habitId, month, parsedMonth, tzOffsetMinutes: 0 }
  }

  if (!/^[-+]?\d+$/.test(tzOffsetParam)) {
    return null
  }

  const tzOffsetMinutes = Number(tzOffsetParam)

  if (!Number.isFinite(tzOffsetMinutes) || !Number.isInteger(tzOffsetMinutes)) {
    return null
  }

  if (Math.abs(tzOffsetMinutes) > 14 * 60) {
    return null
  }

  return { habitId, month, parsedMonth, tzOffsetMinutes }
}

export const handleCalendarGet = async (request: Request, userId: string) => {
  const params = getCalendarParams(request)

  if (!params) {
    return badRequest('Habit id and month are required')
  }

  const { habitId, month, parsedMonth, tzOffsetMinutes } = params

  const habit = await fetchHabitById(userId, habitId)

  if (!habit) {
    return badRequest('Habit not found')
  }

  const habitCreatedAt =
    habit.createdAt instanceof Date
      ? habit.createdAt
      : new Date(habit.createdAt)

  if (Number.isNaN(habitCreatedAt.getTime())) {
    return badRequest('Habit creation date unavailable')
  }

  const habitCreatedOn = formatUtcDateWithOffset(
    habitCreatedAt,
    tzOffsetMinutes,
  )
  const today = formatUtcDateWithOffset(new Date(), tzOffsetMinutes)
  const startBound = maxDate(parsedMonth.startDate, habitCreatedOn)
  const endBound = minDate(parsedMonth.endDate, today)

  if (endBound < startBound) {
    return ok({ habitId, month, dates: [] })
  }

  const completions = await fetchCompletionsForHabitInRange(
    userId,
    habitId,
    startBound,
    endBound,
  )

  return ok({
    habitId,
    month,
    dates: completions.map((row) => row.completedOn),
  })
}
