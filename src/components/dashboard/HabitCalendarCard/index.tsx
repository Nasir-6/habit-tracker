import { useState } from 'react'

import { HabitCalendarCompletionOverview } from './HabitCalendarCompletionOverview'
import { HabitCalendarHabitDetailGrid } from './HabitCalendarHabitDetailGrid'
import { HabitCalendarHeader } from './HabitCalendarHeader'
import { HabitCalendarStatus } from './HabitCalendarStatus'
import { HabitCalendarStreaks } from './HabitCalendarStreaks'

import type { Habit } from '@/types/dashboard'

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
  const {
    calendar,
    completedDates,
    habitCalendarError,
    isHabitCalendarLoading,
    isOverviewLoading,
    monthLabel,
    overviewCalendarError,
    selectedHabit,
    selectedHabitId,
    selectedStreak,
    setSelectedHabitId,
    shiftMonth,
    todayKey,
    overviewByDate,
  } = useHabitCalendar({ habits, habitStreaks, viewMode })

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] lg:p-7">
      <HabitCalendarHeader
        habits={habits}
        monthLabel={monthLabel}
        onHabitChange={setSelectedHabitId}
        onMonthChange={shiftMonth}
        onViewModeChange={setViewMode}
        selectedHabitId={selectedHabitId}
        viewMode={viewMode}
      />

      {habits.length === 0 || !selectedHabit ? (
        <p className="mt-5 text-sm text-slate-500">
          Create a habit to unlock the monthly calendar view.
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {viewMode === 'overview' ? (
            <>
              <p className="inline-flex w-fit items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                All active habits
              </p>
              <HabitCalendarCompletionOverview
                calendar={calendar}
                overviewByDate={overviewByDate}
                todayKey={todayKey}
              />
            </>
          ) : (
            <>
              <p className="inline-flex w-fit items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {selectedHabit.name}
              </p>
              <HabitCalendarStreaks
                best={selectedStreak.best}
                current={selectedStreak.current}
              />
              <HabitCalendarHabitDetailGrid
                calendar={calendar}
                completedDates={completedDates}
                todayKey={todayKey}
              />
            </>
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
      )}
    </div>
  )
}
