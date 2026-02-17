import { badRequest, ok } from '@/lib/api'
import { formatUtcDateWithOffset, parseMonth } from '@/lib/date'
import {
  fetchCompletionsForHabitInRange,
  fetchCompletionsForHabitsInRange,
} from '@/db/completions'
import { fetchActiveHabitsForCalendar, fetchHabitById } from '@/db/habits'

const maxDate = (left: string, right: string) => (left >= right ? left : right)

const minDate = (left: string, right: string) => (left <= right ? left : right)

const parseTzOffsetMinutes = (value: string | null) => {
  if (value === null) {
    return 0
  }

  if (!/^[-+]?\d+$/.test(value)) {
    return null
  }

  const tzOffsetMinutes = Number(value)

  if (!Number.isFinite(tzOffsetMinutes) || !Number.isInteger(tzOffsetMinutes)) {
    return null
  }

  if (Math.abs(tzOffsetMinutes) > 14 * 60) {
    return null
  }

  return tzOffsetMinutes
}

const nextDateKey = (value: string) => {
  const [yearPart, monthPart, dayPart] = value.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (Number.isNaN(date.getTime())) {
    return value
  }

  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

const buildDateRange = (startDate: string, endDate: string) => {
  if (endDate < startDate) {
    return []
  }

  const dates: string[] = []
  let cursor = startDate

  while (cursor <= endDate) {
    dates.push(cursor)
    cursor = nextDateKey(cursor)
  }

  return dates
}

const getCalendarParams = (request: Request) => {
  const url = new URL(request.url)
  const view = url.searchParams.get('view')
  const habitId = url.searchParams.get('habitId')
  const month = url.searchParams.get('month')
  const tzOffsetMinutes = parseTzOffsetMinutes(
    url.searchParams.get('tzOffsetMinutes'),
  )

  if (!month || tzOffsetMinutes === null) {
    return null
  }

  const parsedMonth = parseMonth(month)
  if (!parsedMonth) {
    return null
  }

  if (view === 'overview') {
    return { view: 'overview' as const, month, parsedMonth, tzOffsetMinutes }
  }

  if (!habitId) {
    return null
  }

  return {
    view: 'habit' as const,
    habitId,
    month,
    parsedMonth,
    tzOffsetMinutes,
  }
}

const handleHabitCalendarGet = async (
  userId: string,
  params: {
    habitId: string
    month: string
    parsedMonth: NonNullable<ReturnType<typeof parseMonth>>
    tzOffsetMinutes: number
  },
) => {
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

const handleOverviewCalendarGet = async (
  userId: string,
  params: {
    month: string
    parsedMonth: NonNullable<ReturnType<typeof parseMonth>>
    tzOffsetMinutes: number
  },
) => {
  const { month, parsedMonth, tzOffsetMinutes } = params
  const today = formatUtcDateWithOffset(new Date(), tzOffsetMinutes)
  const endBound = minDate(parsedMonth.endDate, today)

  if (endBound < parsedMonth.startDate) {
    return ok({ month, days: [] })
  }

  const activeHabits = await fetchActiveHabitsForCalendar(userId)
  const habitIds = activeHabits.map((habit) => habit.id)
  const createdOnByHabit = new Map(
    activeHabits.map((habit) => {
      const createdAt =
        habit.createdAt instanceof Date
          ? habit.createdAt
          : new Date(habit.createdAt)

      if (Number.isNaN(createdAt.getTime())) {
        return [habit.id, parsedMonth.startDate] as const
      }

      return [
        habit.id,
        formatUtcDateWithOffset(createdAt, tzOffsetMinutes),
      ] as const
    }),
  )

  const completions = await fetchCompletionsForHabitsInRange(
    userId,
    habitIds,
    parsedMonth.startDate,
    endBound,
  )
  const completedByDay = new Map<string, number>()

  for (const completion of completions) {
    completedByDay.set(
      completion.completedOn,
      (completedByDay.get(completion.completedOn) ?? 0) + 1,
    )
  }

  const days = buildDateRange(parsedMonth.startDate, endBound).map((date) => {
    const totalHabits = activeHabits.reduce((count, habit) => {
      const createdOn = createdOnByHabit.get(habit.id)

      if (!createdOn) {
        return count
      }

      return createdOn <= date ? count + 1 : count
    }, 0)

    return {
      date,
      completedHabits: completedByDay.get(date) ?? 0,
      totalHabits,
    }
  })

  return ok({ month, days })
}

export const handleCalendarGet = async (request: Request, userId: string) => {
  const params = getCalendarParams(request)

  if (!params) {
    return badRequest('Month is required')
  }

  if (params.view === 'overview') {
    return handleOverviewCalendarGet(userId, params)
  }

  return handleHabitCalendarGet(userId, params)
}
