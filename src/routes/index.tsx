import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import type { AuthMode, Habit } from '@/components/dashboard/types'

import { authClient } from '@/lib/auth-client'
import { AuthScreen } from '@/components/dashboard/AuthScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { LoadingScreen } from '@/components/dashboard/LoadingScreen'
import { moveHabit, persistHabitOrder } from '@/components/dashboard/utils'

export const Route = createFileRoute('/')({ component: App })

const formatLocalDate = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function App() {
  const { data: session, isPending } = authClient.useSession()
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [habitName, setHabitName] = useState('')
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitStreaks, setHabitStreaks] = useState<
    Partial<Record<string, { current: number; best: number }>>
  >({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null)
  const trimmedHabitName = habitName.trim()
  const isSaveDisabled = trimmedHabitName.length === 0 || isSubmitting
  const localDate = formatLocalDate(new Date())

  useEffect(() => {
    if (habits.length === 0) {
      setHabitStreaks({})
      return
    }

    let isActive = true

    const loadStreaks = async () => {
      const results = await Promise.all(
        habits.map(async (habit) => {
          try {
            const response = await fetch(
              `/api/streaks?habitId=${encodeURIComponent(
                habit.id,
              )}&localDate=${localDate}`,
            )

            if (!response.ok) {
              return { id: habit.id, current: 0, best: 0 }
            }

            const payload = (await response.json()) as {
              currentStreak?: number
              bestStreak?: number
            }

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

      if (!isActive) {
        return
      }

      const next: Record<string, { current: number; best: number }> = {}

      results.forEach((result) => {
        next[result.id] = { current: result.current, best: result.best }
      })

      setHabitStreaks(next)
    }

    void loadStreaks()

    return () => {
      isActive = false
    }
  }, [habits, localDate])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isAuthSubmitting) {
      return
    }

    const email = authEmail.trim()
    const password = authPassword

    if (!email || !password) {
      setAuthError('Email and password are required')
      return
    }

    setIsAuthSubmitting(true)
    setAuthError(null)

    try {
      if (authMode === 'sign-in') {
        const result = await authClient.signIn.email({
          email,
          password,
        })

        if (result.error) {
          throw new Error(result.error.message || 'Unable to sign in')
        }
      } else {
        const name = authName.trim() || email.split('@')[0] || 'Habit Tracker'
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })

        if (result.error) {
          throw new Error(result.error.message || 'Unable to sign up')
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed'
      setAuthError(message)
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const handleCreateHabitSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSaveDisabled) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedHabitName }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string
        }

        throw new Error(payload.error || 'Unable to save habit')
      }

      const payload = (await response.json()) as {
        habit?: { id?: string; name?: string }
      }
      const createdHabit = payload.habit
      const createdName = createdHabit?.name || trimmedHabitName
      const createdId = createdHabit?.id || crypto.randomUUID()

      setHabits((current) => [
        {
          id: createdId,
          name: createdName,
          isCompleted: false,
        },
        ...current,
      ])
      setHabitName('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHabitDragStart = (
    event: DragEvent<HTMLDivElement>,
    habitId: string,
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', habitId)
    setDraggingHabitId(habitId)
  }

  const handleHabitDrop = async (targetId: string) => {
    if (!draggingHabitId) {
      return
    }

    const updated = moveHabit(habits, draggingHabitId, targetId)

    if (updated === habits) {
      setDraggingHabitId(null)
      return
    }

    const previous = habits
    const orderedIds = updated.map((item) => item.id)

    setHabits(updated)
    setDraggingHabitId(null)

    try {
      await persistHabitOrder(orderedIds)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update habit order'
      setErrorMessage(message)
      setHabits(previous)
    }
  }

  const handleToggleHabit = (habitId: string) => {
    setHabits((current) =>
      current.map((item) =>
        item.id === habitId
          ? {
              ...item,
              isCompleted: !item.isCompleted,
            }
          : item,
      ),
    )
  }

  if (isPending) {
    return <LoadingScreen />
  }

  if (!session?.user) {
    return (
      <AuthScreen
        authEmail={authEmail}
        authError={authError}
        authMode={authMode}
        authName={authName}
        authPassword={authPassword}
        isAuthSubmitting={isAuthSubmitting}
        onAuthEmailChange={(event) => {
          setAuthEmail(event.target.value)
        }}
        onAuthNameChange={(event) => {
          setAuthName(event.target.value)
        }}
        onAuthPasswordChange={(event) => {
          setAuthPassword(event.target.value)
        }}
        onSubmit={handleAuthSubmit}
        onToggleMode={() => {
          setAuthError(null)
          setAuthMode((mode) => (mode === 'sign-in' ? 'sign-up' : 'sign-in'))
        }}
      />
    )
  }

  return (
    <Dashboard
      draggingHabitId={draggingHabitId}
      errorMessage={errorMessage}
      habitName={habitName}
      habits={habits}
      habitStreaks={habitStreaks}
      isSaveDisabled={isSaveDisabled}
      isSubmitting={isSubmitting}
      onCreateHabit={handleCreateHabitSubmit}
      onHabitDragEnd={() => {
        setDraggingHabitId(null)
      }}
      onHabitDragStart={handleHabitDragStart}
      onHabitDrop={handleHabitDrop}
      onHabitNameChange={setHabitName}
      onToggleHabit={handleToggleHabit}
    />
  )
}
