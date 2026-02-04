import { useEffect, useMemo, useState } from 'react'

import type { Habit } from '@/components/dashboard/types'
import { cn } from '@/lib/utils'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const padNumber = (value: number) => String(value).padStart(2, '0')

const formatLocalDate = (value: Date) => {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(
    value.getDate(),
  )}`
}

const buildCalendarDays = (reference: Date) => {
  const year = reference.getFullYear()
  const monthIndex = reference.getMonth()
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const days: (number | null)[] = Array(startOffset).fill(null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day)
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  return { days, year, monthIndex }
}

type HabitCalendarCardProps = {
  habits: Habit[]
}

export function HabitCalendarCard({ habits }: HabitCalendarCardProps) {
  const [monthAnchor] = useState(() => new Date())
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
  const monthLabel = useMemo(() => {
    return new Date(calendar.year, calendar.monthIndex, 1).toLocaleDateString(
      undefined,
      {
        month: 'long',
        year: 'numeric',
      },
    )
  }, [calendar.monthIndex, calendar.year])

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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Calendar</h2>
          <p className="text-xs text-slate-500">{monthLabel}</p>
        </div>
        {habits.length > 0 ? (
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
            value={selectedHabitId ?? ''}
            onChange={(event) => {
              setSelectedHabitId(event.target.value)
            }}
          >
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {habits.length === 0 || !selectedHabit ? (
        <p className="mt-6 text-sm text-slate-500">
          Create a habit to unlock the monthly calendar view.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {selectedHabit.name}
          </p>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-[0.65rem] text-slate-400">
                {label}
              </div>
            ))}
            {calendar.days.map((day, index) => (
              <div
                key={`${day ?? 'blank'}-${index}`}
                className={
                  day
                    ? (() => {
                        const dayKey = `${calendar.year}-${padNumber(
                          calendar.monthIndex + 1,
                        )}-${padNumber(day)}`
                        const isCompleted = completedDates.has(dayKey)
                        const isToday = dayKey === todayKey
                        const isFuture = dayKey > todayKey
                        const isMissed = !isCompleted && !isFuture && !isToday

                        return cn(
                          'rounded-xl border px-2 py-2 text-xs font-medium transition-colors',
                          isCompleted &&
                            'border-emerald-200 bg-emerald-100 text-emerald-700',
                          isToday &&
                            !isCompleted &&
                            'border-amber-300 bg-amber-50 text-amber-900',
                          isToday &&
                            isCompleted &&
                            'ring-2 ring-amber-300 ring-offset-1',
                          isFuture &&
                            'border-slate-100 bg-white/40 text-slate-300',
                          isMissed &&
                            'border-slate-200 bg-slate-100 text-slate-400',
                          !isCompleted &&
                            !isToday &&
                            !isFuture &&
                            !isMissed &&
                            'border-slate-200 bg-white/80 text-slate-600',
                        )
                      })()
                    : 'rounded-xl border border-transparent px-2 py-2'
                }
              >
                {day ?? ''}
              </div>
            ))}
          </div>
          {isCalendarLoading ? (
            <p className="text-xs text-slate-400">Refreshing calendar...</p>
          ) : null}
          {calendarError ? (
            <p className="text-xs text-rose-500">{calendarError}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
