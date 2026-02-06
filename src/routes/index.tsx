import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import type { AuthMode, Habit } from '@/components/dashboard/types'

import { authClient } from '@/lib/auth-client'
import { AuthScreen } from '@/components/dashboard/AuthScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { LoadingScreen } from '@/components/dashboard/LoadingScreen'
import { moveHabit, persistHabitOrder } from '@/components/dashboard/utils'

export const Route = createFileRoute('/')({ component: App })

type PartnerHabit = {
  id: string
  name: string
  completedToday: boolean
}

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
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [habitName, setHabitName] = useState('')
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitStreaks, setHabitStreaks] = useState<
    Partial<Record<string, { current: number; best: number }>>
  >({})
  const [historyHabitId, setHistoryHabitId] = useState<string | null>(null)
  const [historyDates, setHistoryDates] = useState<string[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const historyRequestIdRef = useRef(0)
  const [partnerHabits, setPartnerHabits] = useState<PartnerHabit[]>([])
  const [partnerStartedOn, setPartnerStartedOn] = useState<string | null>(null)
  const [partnerError, setPartnerError] = useState<string | null>(null)
  const [isPartnerLoading, setIsPartnerLoading] = useState(false)
  const [hasPartner, setHasPartner] = useState(false)
  const [partnerInviteEmail, setPartnerInviteEmail] = useState('')
  const [partnerInviteError, setPartnerInviteError] = useState<string | null>(
    null,
  )
  const [partnerInviteNotice, setPartnerInviteNotice] = useState<string | null>(
    null,
  )
  const [isPartnerInviteSubmitting, setIsPartnerInviteSubmitting] =
    useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null)
  const trimmedHabitName = habitName.trim()
  const isSaveDisabled = trimmedHabitName.length === 0 || isSubmitting
  const localDate = formatLocalDate(new Date())

  useEffect(() => {
    if (!session?.user) {
      setHabits([])
      setPartnerHabits([])
      setPartnerStartedOn(null)
      setPartnerError(null)
      setIsPartnerLoading(false)
      setHasPartner(false)
      setPartnerInviteEmail('')
      setPartnerInviteError(null)
      setPartnerInviteNotice(null)
      setIsPartnerInviteSubmitting(false)
      setSignOutError(null)
      setIsSigningOut(false)
      return
    }

    let isActive = true

    const loadPartnerStatus = async () => {
      setIsPartnerLoading(true)
      setPartnerError(null)

      try {
        const response = await fetch(
          `/api/partnerships?localDate=${encodeURIComponent(localDate)}`,
        )

        if (response.status === 404) {
          if (!isActive) {
            return
          }

          setHasPartner(false)
          setPartnerHabits([])
          setPartnerStartedOn(null)
          return
        }

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error || 'Unable to load partner status')
        }

        const payload = (await response.json()) as {
          partner?: { startedOn?: string }
          habits?: PartnerHabit[]
        }

        if (!isActive) {
          return
        }

        setHasPartner(true)
        setPartnerStartedOn(payload.partner?.startedOn ?? null)
        setPartnerHabits(Array.isArray(payload.habits) ? payload.habits : [])
      } catch (error) {
        if (!isActive) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load partner status'
        setPartnerError(message)
        setHasPartner(false)
        setPartnerHabits([])
        setPartnerStartedOn(null)
      } finally {
        if (isActive) {
          setIsPartnerLoading(false)
        }
      }
    }

    void loadPartnerStatus()

    return () => {
      isActive = false
    }
  }, [localDate, session?.user.id])

  useEffect(() => {
    if (!session?.user) {
      return
    }

    let isActive = true

    const loadHabits = async () => {
      setErrorMessage(null)

      try {
        const [habitsResponse, completionsResponse] = await Promise.all([
          fetch('/api/habits'),
          fetch(`/api/completions?localDate=${encodeURIComponent(localDate)}`),
        ])

        if (!habitsResponse.ok) {
          const payload = (await habitsResponse.json()) as { error?: string }
          throw new Error(payload.error || 'Unable to load habits')
        }

        if (!completionsResponse.ok) {
          const payload = (await completionsResponse.json()) as {
            error?: string
          }
          throw new Error(payload.error || 'Unable to load completions')
        }

        const habitsPayload = (await habitsResponse.json()) as {
          habits?: { id?: string; name?: string }[]
        }
        const completionsPayload = (await completionsResponse.json()) as {
          habitIds?: string[]
        }

        if (!isActive) {
          return
        }

        const next = Array.isArray(habitsPayload.habits)
          ? habitsPayload.habits
          : []
        const completedIds = new Set(
          Array.isArray(completionsPayload.habitIds)
            ? completionsPayload.habitIds
            : [],
        )

        setHabits(
          next.map((habit) => ({
            id: habit.id ?? crypto.randomUUID(),
            name: habit.name ?? 'Untitled habit',
            isCompleted: completedIds.has(habit.id ?? ''),
          })),
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        const message =
          error instanceof Error ? error.message : 'Unable to load habits'
        setErrorMessage(message)
        setHabits([])
      }
    }

    void loadHabits()

    return () => {
      isActive = false
    }
  }, [localDate, session?.user.id])

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

        const signInResult = await authClient.signIn.email({
          email,
          password,
        })

        if (signInResult.error) {
          throw new Error(signInResult.error.message || 'Unable to sign in')
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

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)
    setSignOutError(null)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        throw new Error(result.error.message || 'Unable to sign out')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign out'
      setSignOutError(message)
    } finally {
      setIsSigningOut(false)
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

  const handlePartnerInviteSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isPartnerInviteSubmitting) {
      return
    }

    const email = partnerInviteEmail.trim()

    if (!email) {
      setPartnerInviteError('Partner email is required')
      setPartnerInviteNotice(null)
      return
    }

    setIsPartnerInviteSubmitting(true)
    setPartnerInviteError(null)
    setPartnerInviteNotice(null)

    try {
      const response = await fetch('/api/partner-invites', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send invite')
      }

      setPartnerInviteEmail('')
      setPartnerInviteNotice(`Invite sent to ${email}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send invite'
      setPartnerInviteError(message)
    } finally {
      setIsPartnerInviteSubmitting(false)
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

  const handleToggleHabit = async (habitId: string) => {
    const targetHabit = habits.find((habit) => habit.id === habitId)

    if (!targetHabit) {
      return
    }

    const nextCompleted = !targetHabit.isCompleted

    setHabits((current) =>
      current.map((item) =>
        item.id === habitId
          ? {
              ...item,
              isCompleted: nextCompleted,
            }
          : item,
      ),
    )

    try {
      const response = await fetch('/api/completions', {
        method: nextCompleted ? 'POST' : 'DELETE',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ habitId, localDate }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Unable to update completion')
      }
    } catch (error) {
      setHabits((current) =>
        current.map((item) =>
          item.id === habitId
            ? {
                ...item,
                isCompleted: !nextCompleted,
              }
            : item,
        ),
      )

      const message =
        error instanceof Error ? error.message : 'Unable to update completion'
      setErrorMessage(message)
    }
  }

  const handleToggleHistory = async (habitId: string) => {
    if (historyHabitId === habitId) {
      historyRequestIdRef.current += 1
      setHistoryHabitId(null)
      setHistoryDates([])
      setHistoryError(null)
      setIsHistoryLoading(false)
      return
    }

    const requestId = historyRequestIdRef.current + 1
    historyRequestIdRef.current = requestId
    setHistoryHabitId(habitId)
    setHistoryDates([])
    setHistoryError(null)
    setIsHistoryLoading(true)

    try {
      const response = await fetch(
        `/api/history?habitId=${encodeURIComponent(
          habitId,
        )}&localDate=${localDate}`,
      )

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Unable to load history')
      }

      const payload = (await response.json()) as { dates?: string[] }

      if (historyRequestIdRef.current !== requestId) {
        return
      }

      setHistoryDates(Array.isArray(payload.dates) ? payload.dates : [])
    } catch (error) {
      if (historyRequestIdRef.current !== requestId) {
        return
      }

      const message =
        error instanceof Error ? error.message : 'Unable to load history'
      setHistoryError(message)
    } finally {
      if (historyRequestIdRef.current === requestId) {
        setIsHistoryLoading(false)
      }
    }
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
      hasPartner={hasPartner}
      partnerInviteEmail={partnerInviteEmail}
      partnerInviteError={partnerInviteError}
      partnerInviteNotice={partnerInviteNotice}
      isPartnerInviteSubmitting={isPartnerInviteSubmitting}
      historyDates={historyDates}
      historyError={historyError}
      historyHabitId={historyHabitId}
      isHistoryLoading={isHistoryLoading}
      isPartnerLoading={isPartnerLoading}
      isSigningOut={isSigningOut}
      habitStreaks={habitStreaks}
      isSaveDisabled={isSaveDisabled}
      isSubmitting={isSubmitting}
      partnerError={partnerError}
      partnerHabits={partnerHabits}
      partnerStartedOn={partnerStartedOn}
      signOutError={signOutError}
      onCreateHabit={handleCreateHabitSubmit}
      onHabitDragEnd={() => {
        setDraggingHabitId(null)
      }}
      onHabitDragStart={handleHabitDragStart}
      onHabitDrop={handleHabitDrop}
      onHabitNameChange={setHabitName}
      onToggleHabit={handleToggleHabit}
      onToggleHistory={handleToggleHistory}
      onSignOut={handleSignOut}
      onPartnerInvite={handlePartnerInviteSubmit}
      onPartnerInviteEmailChange={(value) => {
        setPartnerInviteError(null)
        setPartnerInviteNotice(null)
        setPartnerInviteEmail(value)
      }}
    />
  )
}
