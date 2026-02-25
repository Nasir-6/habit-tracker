import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'

import { HabitCalendarGrid } from './HabitCalendarGrid'
import { HabitCalendarStatus } from './HabitCalendarStatus'
import { HabitCalendarStreaks } from './HabitCalendarStreaks'
import { formatLocalDate } from './habitCalendarUtils'
import { calendarBlockMaxWidthClass } from './constants'

import type { Habit } from '@/types/dashboard'

import { useSetLocalDate } from '@/context/local-date'
import { useHabitCalendar } from '@/hooks/useHabitCalendar'

type HabitCalendarCardProps = {
  habits: Habit[]
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
}

export function HabitCalendarCard({
  habits,
  habitStreaks,
}: HabitCalendarCardProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'habit'>('overview')
  const setLocalDate = useSetLocalDate()
  const {
    completedDates,
    habitCalendarError,
    isHabitCalendarLoading,
    isOverviewLoading,
    month,
    monthLabel,
    overviewCalendarError,
    selectedHabit,
    selectedHabitId,
    selectedStreak,
    setMonth,
    setSelectedHabitId,
    shiftMonth,
    todayKey,
    overviewByDate,
  } = useHabitCalendar({ habits, habitStreaks, viewMode })

  const selectedFilterValue =
    viewMode === 'overview' ? 'all' : (selectedHabitId ?? 'all')

  const sharedGridProps = {
    monthLabel,
    month,
    onMonthChange: setMonth,
    onMonthStep: shiftMonth,
    onDateSelect: (selectedDay: Date) => {
      setLocalDate(formatLocalDate(selectedDay))
    },
    todayKey,
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
      {habits.length === 0 || !selectedHabit ? (
        <p className="text-sm text-slate-500">
          Create a habit to unlock the monthly calendar view.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="min-w-0 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Calendar
            </h2>

            <div className={`relative w-full ${calendarBlockMaxWidthClass}`}>
              <select
                className="w-full appearance-none rounded-md border border-slate-200 bg-white py-1.5 pr-10 pl-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-600 outline-none transition hover:border-slate-300 focus:border-slate-400"
                value={selectedFilterValue}
                onChange={(event) => {
                  const value = event.target.value

                  if (value === 'all') {
                    setViewMode('overview')
                    return
                  }

                  setSelectedHabitId(value)
                  setViewMode('habit')
                }}
              >
                <option value="all">All habits</option>
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            {viewMode === 'overview' ? (
              <HabitCalendarGrid
                {...sharedGridProps}
                viewMode="overview"
                overviewByDate={overviewByDate}
              />
            ) : (
              <HabitCalendarGrid
                {...sharedGridProps}
                viewMode="habit"
                completedDates={completedDates}
              />
            )}

            <HabitCalendarStatus
              calendarError={
                viewMode === 'overview'
                  ? overviewCalendarError
                  : habitCalendarError
              }
              isCalendarLoading={
                viewMode === 'overview'
                  ? isOverviewLoading
                  : isHabitCalendarLoading
              }
            />
          </div>

          {viewMode === 'habit' ? (
            <div className="w-fit max-w-full">
              <HabitCalendarStreaks
                best={selectedStreak.best}
                current={selectedStreak.current}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
