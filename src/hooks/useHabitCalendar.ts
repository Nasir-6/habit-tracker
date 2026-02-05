import { useEffect, useMemo, useState } from 'react'

import type { Habit } from '@/components/dashboard/types'

import {
  buildCalendarDays,
  formatLocalDate,
  padNumber,
} from '@/components/dashboard/HabitCalendarCard/habitCalendarUtils'

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
  const [completedDates, setCompletedDates] = useState<Set<string>>(
    () => new Set(),
  )
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [isCalendarLoading, setIsCalendarLoading] = useState(false)

  useEffect(() => {
    if (habits.length === 0) {
      if (selectedHabitId !== null) {
        setSelectedHabitId(null)
      }
      setCompletedDates(new Set())
      setCalendarError(null)
      setIsCalendarLoading(false)
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

  useEffect(() => {
    if (!selectedHabit) {
      setCompletedDates(new Set())
      setCalendarError(null)
      setIsCalendarLoading(false)
      return
    }

    let isActive = true

    const loadCalendar = async () => {
      setIsCalendarLoading(true)
      setCalendarError(null)

      try {
        const response = await fetch(
          `/api/calendar?habitId=${encodeURIComponent(
            selectedHabit.id,
          )}&month=${monthKey}&tzOffsetMinutes=${tzOffsetMinutes}`,
        )

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error || 'Unable to load calendar data')
        }

        const payload = (await response.json()) as { dates?: string[] }
        const next = new Set(Array.isArray(payload.dates) ? payload.dates : [])

        if (isActive) {
          setCompletedDates(next)
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load calendar data'
        setCalendarError(message)
        setCompletedDates(new Set())
      } finally {
        if (isActive) {
          setIsCalendarLoading(false)
        }
      }
    }

    void loadCalendar()

    return () => {
      isActive = false
    }
  }, [monthKey, selectedHabit, tzOffsetMinutes])

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
