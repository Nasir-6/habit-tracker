import { useEffect, useMemo, useState } from 'react'

import type { Habit } from '@/components/dashboard/types'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
  const calendar = useMemo(() => buildCalendarDays(new Date()), [])
  const monthLabel = useMemo(() => {
    return new Date(calendar.year, calendar.monthIndex, 1).toLocaleDateString(
      undefined,
      {
        month: 'long',
        year: 'numeric',
      },
    )
  }, [calendar.monthIndex, calendar.year])

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
                    ? 'rounded-xl border border-slate-200 bg-white/80 px-2 py-2 text-slate-600'
                    : 'rounded-xl border border-transparent px-2 py-2'
                }
              >
                {day ?? ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
