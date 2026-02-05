import { badRequest, ok } from '@/lib/api'
import { parseLocalDateParts, previousUtcLocalDate } from '@/lib/date'
import { fetchCompletionsForHabitUpTo } from '@/db/completions'
import { fetchHabitById } from '@/db/habits'

const getStreakParams = (request: Request) => {
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

const previousLocalDate = (value: string) => previousUtcLocalDate(value)

const getCurrentStreak = (
  completed: { completedOn: string }[],
  localDate: string,
) => {
  let expectedDate = localDate
  let count = 0

  for (const completion of completed) {
    if (completion.completedOn === expectedDate) {
      count += 1
      const previous = previousLocalDate(expectedDate)

      if (!previous) {
        break
      }

      expectedDate = previous
      continue
    }

    if (completion.completedOn < expectedDate) {
      break
    }
  }

  return count
}

const getBestStreak = (completed: { completedOn: string }[]) => {
  let best = 0
  let count = 0
  let expectedDate: string | null = null

  for (const completion of completed) {
    if (!expectedDate) {
      count = 1
    } else if (completion.completedOn === expectedDate) {
      count += 1
    } else {
      count = 1
    }

    if (count > best) {
      best = count
    }

    expectedDate = previousLocalDate(completion.completedOn)
  }

  return best
}

export const handleStreaksGet = async (request: Request, userId: string) => {
  const params = getStreakParams(request)

  if (!params) {
    return badRequest('Habit id and local date are required')
  }

  const { habitId, localDate } = params

  const habit = await fetchHabitById(userId, habitId)

  if (!habit) {
    return badRequest('Habit not found')
  }

  let completions: { completedOn: string }[] = []

  try {
    completions = await fetchCompletionsForHabitUpTo(
      userId,
      habitId,
      localDate,
      'desc',
    )
  } catch (error) {
    const pgError = (error as { cause?: { code?: string } }).cause
    if (pgError?.code !== '42P01') {
      throw error
    }
  }

  const currentStreak = getCurrentStreak(completions, localDate)
  const bestStreak = getBestStreak(completions)

  return ok({ currentStreak, bestStreak })
}
