import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import type { Habit } from '@/types/dashboard'

import { getHistoryCalendarData } from '@/components/dashboard/HabitList/habitListUtils'
import { useLocalDate } from '@/context/local-date'
import { requestApi } from '@/lib/client-api'

type UseHabitHistoryArgs = {
  habits: Habit[]
}

export function useHabitHistory({ habits }: UseHabitHistoryArgs) {
  const localDate = useLocalDate()
  const [historyHabitId, setHistoryHabitId] = useState<string | null>(null)

  useEffect(() => {
    if (!historyHabitId) {
      return
    }

    const hasSelectedHabit = habits.some((habit) => habit.id === historyHabitId)

    if (hasSelectedHabit) {
      return
    }

    setHistoryHabitId(null)
  }, [habits, historyHabitId])

  const selectedHabit = historyHabitId
    ? habits.find((habit) => habit.id === historyHabitId)
    : null

  const historyQuery = useQuery({
    queryKey: ['habit-history', historyHabitId, localDate],
    queryFn: async () => {
      return requestApi<{ dates?: string[] }>(
        `/api/history?habitId=${encodeURIComponent(
          historyHabitId ?? '',
        )}&localDate=${localDate}`,
        undefined,
        'Unable to load history',
      )
    },
    enabled: Boolean(historyHabitId && selectedHabit),
  })

  const historyDates = Array.isArray(historyQuery.data?.dates)
    ? historyQuery.data.dates
    : []
  const historyError = historyQuery.error?.message ?? null
  const isHistoryLoading = historyQuery.isLoading

  const calendarData = useMemo(
    () => getHistoryCalendarData(historyDates),
    [historyDates],
  )

  const handleToggleHistory = (habitId: string) => {
    if (historyHabitId === habitId) {
      setHistoryHabitId(null)
      return
    }

    setHistoryHabitId(habitId)
  }

  return {
    historyHabitId,
    historyDates,
    historyError,
    isHistoryLoading,
    selectedHabit,
    ...calendarData,
    handleToggleHistory,
  }
}
