import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import type { Habit } from '@/types/dashboard'

import {
  buildCalendarDays,
  formatLocalDate,
  padNumber,
} from '@/components/dashboard/HabitCalendarCard/habitCalendarUtils'
import { requestApi } from '@/lib/client-api'

type HabitStreak = { current: number; best: number }

type UseHabitCalendarArgs = {
  habits: Habit[]
  habitStreaks: Partial<Record<string, HabitStreak>>
}

export const useHabitCalendar = ({
  habits,
  habitStreaks,
}: UseHabitCalendarArgs) => {
  const [monthAnchor, setMonthAnchor] = useState(() => new Date())
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
    habits[0]?.id ?? null,
  )

  useEffect(() => {
    if (habits.length === 0) {
      if (selectedHabitId !== null) {
        setSelectedHabitId(null)
      }
      return
    }

    if (
      !selectedHabitId ||
      !habits.some((habit) => habit.id === selectedHabitId)
    ) {
      setSelectedHabitId(habits[0].id)
    }
  }, [habits, selectedHabitId])

  const selectedHabit =
    habits.find((habit) => habit.id === selectedHabitId) ?? null
  const calendar = useMemo(() => buildCalendarDays(monthAnchor), [monthAnchor])
  const monthKey = useMemo(() => {
    return `${calendar.year}-${padNumber(calendar.monthIndex + 1)}`
  }, [calendar.monthIndex, calendar.year])
  const todayKey = useMemo(() => formatLocalDate(new Date()), [])
  const tzOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), [])
  const selectedStreak = useMemo(() => {
    if (!selectedHabitId) {
      return { current: 0, best: 0 }
    }

    return habitStreaks[selectedHabitId] ?? { current: 0, best: 0 }
  }, [habitStreaks, selectedHabitId])
  const monthLabel = useMemo(() => {
    return new Date(calendar.year, calendar.monthIndex, 1).toLocaleDateString(
      undefined,
      {
        month: 'long',
        year: 'numeric',
      },
    )
  }, [calendar.monthIndex, calendar.year])

  const shiftMonth = (offset: number) => {
    setMonthAnchor(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    )
  }

  const calendarQuery = useQuery({
    queryKey: [
      'habit-calendar',
      selectedHabit?.id ?? null,
      monthKey,
      tzOffsetMinutes,
    ],
    queryFn: async () => {
      return requestApi<{ dates?: string[] }>(
        `/api/calendar?habitId=${encodeURIComponent(
          selectedHabit?.id ?? '',
        )}&month=${monthKey}&tzOffsetMinutes=${tzOffsetMinutes}`,
        undefined,
        'Unable to load calendar data',
      )
    },
    enabled: Boolean(selectedHabit),
  })

  const completedDates = useMemo(() => {
    const dates = Array.isArray(calendarQuery.data?.dates)
      ? calendarQuery.data.dates
      : []
    return new Set(dates)
  }, [calendarQuery.data?.dates])
  const calendarError = calendarQuery.error?.message ?? null
  const isCalendarLoading = calendarQuery.isLoading

  return {
    calendar,
    calendarError,
    completedDates,
    isCalendarLoading,
    monthLabel,
    selectedHabit,
    selectedHabitId,
    selectedStreak,
    setSelectedHabitId,
    shiftMonth,
    todayKey,
  }
}
