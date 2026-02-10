import { formatUtcDate, parseLocalDateParts } from '@/lib/date'

export const formatStreak = (value: number) =>
  `${value} day${value === 1 ? '' : 's'}`

export const getHistoryCalendarData = (historyDates: string[]) => {
  const historySelectedDates = historyDates
    .map((date) => {
      const parsed = parseLocalDateParts(date)

      if (!parsed) {
        return null
      }

      return new Date(parsed.year, parsed.month - 1, parsed.day)
    })
    .filter((date): date is Date => Boolean(date))

  const historyDefaultMonth = historySelectedDates.length
    ? historySelectedDates[historySelectedDates.length - 1]
    : undefined

  const historyDateSet = new Set(historyDates)
  const streakStartDates: Date[] = []
  const streakEndDates: Date[] = []
  const streakMiddleDates: Date[] = []
  const streakSingleDates: Date[] = []

  const addUtcDays = (date: Date, days: number) => {
    const copy = new Date(date)
    copy.setUTCDate(copy.getUTCDate() + days)
    return copy
  }

  historyDates.forEach((date) => {
    const parsed = parseLocalDateParts(date)

    if (!parsed) {
      return
    }

    const previousDate = formatUtcDate(addUtcDays(parsed.utcDate, -1))
    const nextDate = formatUtcDate(addUtcDays(parsed.utcDate, 1))
    const hasPrevious = historyDateSet.has(previousDate)
    const hasNext = historyDateSet.has(nextDate)
    const localDateValue = new Date(parsed.year, parsed.month - 1, parsed.day)

    if (!hasPrevious && !hasNext) {
      streakSingleDates.push(localDateValue)
      return
    }

    if (!hasPrevious) {
      streakStartDates.push(localDateValue)
    }

    if (!hasNext) {
      streakEndDates.push(localDateValue)
    }

    if (hasPrevious && hasNext) {
      streakMiddleDates.push(localDateValue)
    }
  })

  return {
    historySelectedDates,
    historyDefaultMonth,
    streakStartDates,
    streakEndDates,
    streakMiddleDates,
    streakSingleDates,
  }
}
