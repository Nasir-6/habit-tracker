import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { Habit } from '@/types/dashboard'

import { AuthScreen } from '@/components/dashboard/AuthScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { LoadingScreen } from '@/components/dashboard/LoadingScreen'
import { moveHabit } from '@/components/dashboard/utils'
import { authClient } from '@/lib/auth-client'
import { requestApi } from '@/lib/client-api'
import { useLocalDate } from '@/context/local-date'

export const Route = createFileRoute('/')({ component: App })

const habitsQueryKey = (userId: string, localDate: string) =>
  ['dashboard-habits', userId, localDate] as const

const streaksQueryKey = (
  userId: string,
  localDate: string,
  habitIds: string[],
) => ['dashboard-streaks', userId, localDate, habitIds] as const

const mapHabitsPayload = (
  habitsPayload: { habits?: { id?: string; name?: string }[] },
  completionsPayload: { habitIds?: string[] },
) => {
  const habits = Array.isArray(habitsPayload.habits) ? habitsPayload.habits : []
  const completedIds = new Set(
    Array.isArray(completionsPayload.habitIds)
      ? completionsPayload.habitIds
      : [],
  )

  return habits.map((habit) => ({
    id: habit.id ?? crypto.randomUUID(),
    name: habit.name ?? 'Untitled habit',
    isCompleted: completedIds.has(habit.id ?? ''),
  }))
}

const fetchHabits = async (localDate: string) => {
  const [habitsResponse, completionsResponse] = await Promise.all([
    requestApi<{ habits?: { id?: string; name?: string }[] }>(
      '/api/habits',
      undefined,
      'Unable to load habits',
    ),
    requestApi<{ habitIds?: string[] }>(
      `/api/completions?localDate=${encodeURIComponent(localDate)}`,
      undefined,
      'Unable to load completions',
    ),
  ])

  return mapHabitsPayload(habitsResponse, completionsResponse)
}

const fetchStreaks = async (habits: Habit[], localDate: string) => {
  const results = await Promise.all(
    habits.map(async (habit) => {
      try {
        const payload = await requestApi<{
          currentStreak?: number
          bestStreak?: number
        }>(
          `/api/streaks?habitId=${encodeURIComponent(
            habit.id,
          )}&localDate=${localDate}`,
          undefined,
          'Unable to load streaks',
        )

        return {
          id: habit.id,
          current: payload.currentStreak ?? 0,
          best: payload.bestStreak ?? 0,
        }
      } catch {
        return { id: habit.id, current: 0, best: 0 }
      }
    }),
  )

  const next: Record<string, { current: number; best: number }> = {}

  results.forEach((result) => {
    next[result.id] = { current: result.current, best: result.best }
  })

  return next
}

export function App() {
  const queryClient = useQueryClient()
  const {
    data: session,
    isPending,
    refetch: refetchSession,
  } = authClient.useSession()
  const hasRefetchedSessionRef = useRef(false)
  const localDate = useLocalDate()
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (hasRefetchedSessionRef.current) {
      return
    }

    hasRefetchedSessionRef.current = true
    void refetchSession()
  }, [refetchSession])

  const habitsQuery = useQuery({
    queryKey: habitsQueryKey(userId ?? 'guest', localDate),
    queryFn: async () => fetchHabits(localDate),
    enabled: Boolean(userId),
  })

  const habits = habitsQuery.data ?? []

  const streaksQuery = useQuery({
    queryKey: streaksQueryKey(
      userId ?? 'guest',
      localDate,
      habits.map((habit) => habit.id),
    ),
    queryFn: async () => fetchStreaks(habits, localDate),
    enabled: Boolean(userId) && habits.length > 0,
  })

  const habitStreaks = habits.length === 0 ? {} : (streaksQuery.data ?? {})

  const reorderHabitMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      return requestApi<{ success?: boolean }>(
        '/api/habits',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ orderedIds }),
        },
        'Unable to update habit order',
      )
    },
  })

  const toggleHabitMutation = useMutation({
    mutationFn: async ({
      habitId,
      nextCompleted,
    }: {
      habitId: string
      nextCompleted: boolean
    }) => {
      return requestApi<{ removed?: boolean }>(
        '/api/completions',
        {
          method: nextCompleted ? 'POST' : 'DELETE',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ habitId, localDate }),
        },
        'Unable to update completion',
      )
    },
  })

  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      return requestApi<{ archived?: boolean }>(
        '/api/habits',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ archiveId: habitId }),
        },
        'Unable to delete habit',
      )
    },
  })

  const handleHabitReorder = async (fromId: string, toId: string) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []
    const updated = moveHabit(previous, fromId, toId)

    if (updated === previous) {
      return
    }

    const orderedIds = updated.map((item) => item.id)
    queryClient.setQueryData(queryKey, updated)

    try {
      await reorderHabitMutation.mutateAsync(orderedIds)
    } catch (error) {
      queryClient.setQueryData(queryKey, previous)

      const message =
        error instanceof Error ? error.message : 'Unable to update habit order'
      throw new Error(message)
    }
  }

  const handleToggleHabit = async (habitId: string) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []
    const targetHabit = previous.find((habit) => habit.id === habitId)

    if (!targetHabit) {
      return
    }

    const nextCompleted = !targetHabit.isCompleted

    queryClient.setQueryData<Habit[]>(
      queryKey,
      previous.map((item) =>
        item.id === habitId
          ? {
              ...item,
              isCompleted: nextCompleted,
            }
          : item,
      ),
    )

    try {
      await toggleHabitMutation.mutateAsync({ habitId, nextCompleted })
      await queryClient.invalidateQueries({
        queryKey: streaksQueryKey(
          userId,
          localDate,
          previous.map((habit) => habit.id),
        ),
      })
    } catch (error) {
      queryClient.setQueryData(queryKey, previous)

      const message =
        error instanceof Error ? error.message : 'Unable to update completion'
      throw new Error(message)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []
    queryClient.setQueryData(
      queryKey,
      previous.filter((habit) => habit.id !== habitId),
    )

    try {
      await deleteHabitMutation.mutateAsync(habitId)
    } catch (error) {
      queryClient.setQueryData(queryKey, previous)
      throw error
    }
  }

  if (isPending || (session?.user && habitsQuery.isLoading)) {
    return <LoadingScreen />
  }

  if (!session?.user) {
    return <AuthScreen />
  }

  const userDisplayName =
    session.user.name.trim() ||
    session.user.email.split('@')[0].trim() ||
    'there'

  return (
    <Dashboard
      userDisplayName={userDisplayName}
      habits={habits}
      habitStreaks={habitStreaks}
      onHabitReorder={handleHabitReorder}
      onToggleHabit={handleToggleHabit}
      onDeleteHabit={handleDeleteHabit}
    />
  )
}
