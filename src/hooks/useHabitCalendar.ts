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

type DailyOverviewEntry = {
  completedHabits: number
  date: string
  totalHabits: number
}

type UseHabitCalendarArgs = {
  habits: Habit[]
  habitStreaks: Partial<Record<string, HabitStreak>>
  viewMode: 'overview' | 'habit'
}

export const useHabitCalendar = ({
  habits,
  habitStreaks,
  viewMode,
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

  const habitIdsKey = useMemo(
    () => habits.map((habit) => habit.id).join(','),
    [habits],
  )

  const habitCalendarQuery = useQuery({
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
    enabled: viewMode === 'habit' && Boolean(selectedHabit),
  })

  const overviewQuery = useQuery({
    queryKey: [
      'habit-calendar-overview',
      monthKey,
      tzOffsetMinutes,
      habitIdsKey,
    ],
    queryFn: async () => {
      return requestApi<{ days?: DailyOverviewEntry[] }>(
        `/api/calendar?view=overview&month=${monthKey}&tzOffsetMinutes=${tzOffsetMinutes}`,
        undefined,
        'Unable to load calendar overview',
      )
    },
    enabled: viewMode === 'overview' && habits.length > 0,
  })

  const overviewByDate = useMemo(() => {
    const days = Array.isArray(overviewQuery.data?.days)
      ? overviewQuery.data.days
      : []

    return new Map(days.map((day) => [day.date, day]))
  }, [overviewQuery.data?.days])
  const completedDates = useMemo(() => {
    const dates = Array.isArray(habitCalendarQuery.data?.dates)
      ? habitCalendarQuery.data.dates
      : []

    return new Set(dates)
  }, [habitCalendarQuery.data?.dates])

  return {
    calendar,
    completedDates,
    habitCalendarError: habitCalendarQuery.error?.message ?? null,
    isHabitCalendarLoading: habitCalendarQuery.isLoading,
    isOverviewLoading: overviewQuery.isLoading,
    monthLabel,
    overviewByDate,
    overviewCalendarError: overviewQuery.error?.message ?? null,
    selectedHabit,
    selectedHabitId,
    selectedStreak,
    setSelectedHabitId,
    shiftMonth,
    todayKey,
  }
}
