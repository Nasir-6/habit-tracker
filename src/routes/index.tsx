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

type HabitQueryKey = ReturnType<typeof habitsQueryKey>

type ReorderHabitVariables = {
  orderedIds: string[]
  queryKey: HabitQueryKey
  previous: Habit[]
  updated: Habit[]
}

type ToggleHabitVariables = {
  queryKey: HabitQueryKey
  previous: Habit[]
  habitId: string
  nextCompleted: boolean
  userId: string
  streakHabitIds: string[]
}

type DeleteHabitVariables = {
  queryKey: HabitQueryKey
  previous: Habit[]
  habitId: string
  operation: 'archive' | 'hardDelete'
}

type ReminderHabitVariables = {
  queryKey: HabitQueryKey
  previous: Habit[]
  habitId: string
  reminderTime: string | null
}

const mapHabitsPayload = (
  habitsPayload: {
    habits?: { id?: string; name?: string; reminderTime?: unknown }[]
  },
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
    reminderTime:
      typeof habit.reminderTime === 'string' ? habit.reminderTime : null,
  }))
}

const fetchHabits = async (localDate: string) => {
  const [habitsResponse, completionsResponse] = await Promise.all([
    requestApi<{
      habits?: { id?: string; name?: string; reminderTime?: unknown }[]
    }>('/api/habits', undefined, 'Unable to load habits'),
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
    mutationFn: async ({ orderedIds }: ReorderHabitVariables) => {
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
    onMutate: ({ queryKey, updated }: ReorderHabitVariables) => {
      queryClient.setQueryData(queryKey, updated)
    },
    onError: (_error, { queryKey, previous }: ReorderHabitVariables) => {
      queryClient.setQueryData(queryKey, previous)
    },
  })

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, nextCompleted }: ToggleHabitVariables) => {
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
    onMutate: ({ queryKey, habitId, nextCompleted }: ToggleHabitVariables) => {
      queryClient.setQueryData<Habit[]>(queryKey, (current = []) =>
        current.map((item) =>
          item.id === habitId
            ? {
                ...item,
                isCompleted: nextCompleted,
              }
            : item,
        ),
      )
    },
    onSuccess: async (
      _data,
      { userId: mutationUserId, streakHabitIds }: ToggleHabitVariables,
    ) => {
      await queryClient.invalidateQueries({
        queryKey: streaksQueryKey(mutationUserId, localDate, streakHabitIds),
      })
    },
    onError: (_error, { queryKey, previous }: ToggleHabitVariables) => {
      queryClient.setQueryData(queryKey, previous)
    },
  })

  const deleteHabitMutation = useMutation({
    mutationFn: async ({ habitId, operation }: DeleteHabitVariables) => {
      return requestApi<{ operation?: 'archive' | 'hardDelete' }>(
        '/api/habits',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ action: operation, habitId }),
        },
        operation === 'archive'
          ? 'Unable to archive habit'
          : 'Unable to delete habit forever',
      )
    },
    onMutate: ({ queryKey, habitId }: DeleteHabitVariables) => {
      queryClient.setQueryData<Habit[]>(queryKey, (current = []) =>
        current.filter((habit) => habit.id !== habitId),
      )
    },
    onError: (_error, { queryKey, previous }: DeleteHabitVariables) => {
      queryClient.setQueryData(queryKey, previous)
    },
  })

  const reminderMutation = useMutation({
    mutationFn: async ({ habitId, reminderTime }: ReminderHabitVariables) => {
      return requestApi<{ operation?: string; reminderTime?: string | null }>(
        '/api/habits',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(
            reminderTime
              ? { action: 'setReminder', habitId, reminderTime }
              : { action: 'clearReminder', habitId },
          ),
        },
        'Unable to update reminder',
      )
    },
    onMutate: ({ queryKey, habitId, reminderTime }: ReminderHabitVariables) => {
      queryClient.setQueryData<Habit[]>(queryKey, (current = []) =>
        current.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                reminderTime,
              }
            : habit,
        ),
      )
    },
    onError: (_error, { queryKey, previous }: ReminderHabitVariables) => {
      queryClient.setQueryData(queryKey, previous)
    },
  })

  const handleHabitReorder = (fromId: string, toId: string) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []
    const updated = moveHabit(previous, fromId, toId)

    if (updated === previous) {
      return
    }

    reorderHabitMutation.mutate({
      orderedIds: updated.map((item) => item.id),
      queryKey,
      previous,
      updated,
    })
  }

  const handleToggleHabit = (habitId: string) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []
    const targetHabit = previous.find((habit) => habit.id === habitId)

    if (!targetHabit) {
      return
    }

    toggleHabitMutation.mutate({
      queryKey,
      previous,
      habitId,
      nextCompleted: !targetHabit.isCompleted,
      userId,
      streakHabitIds: previous.map((habit) => habit.id),
    })
  }

  const handleDeleteHabit = async (
    habitId: string,
    operation: 'archive' | 'hardDelete',
  ) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []

    await deleteHabitMutation.mutateAsync({
      queryKey,
      previous,
      habitId,
      operation,
    })
  }

  const handleSetHabitReminder = async (
    habitId: string,
    reminderTime: string,
  ) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []

    await reminderMutation.mutateAsync({
      queryKey,
      previous,
      habitId,
      reminderTime,
    })
  }

  const handleClearHabitReminder = async (habitId: string) => {
    if (!userId) {
      return
    }

    const queryKey = habitsQueryKey(userId, localDate)
    const previous = queryClient.getQueryData<Habit[]>(queryKey) ?? []

    await reminderMutation.mutateAsync({
      queryKey,
      previous,
      habitId,
      reminderTime: null,
    })
  }

  const habitActionError =
    reorderHabitMutation.error?.message ??
    toggleHabitMutation.error?.message ??
    deleteHabitMutation.error?.message ??
    reminderMutation.error?.message ??
    null

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
      habitActionError={habitActionError}
      onHabitReorder={handleHabitReorder}
      onToggleHabit={handleToggleHabit}
      onDeleteHabit={handleDeleteHabit}
      onSetHabitReminder={handleSetHabitReminder}
      onClearHabitReminder={handleClearHabitReminder}
    />
  )
}
