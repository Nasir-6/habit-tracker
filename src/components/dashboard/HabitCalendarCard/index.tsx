import { HabitCalendarGrid } from './HabitCalendarGrid'
import { HabitCalendarHeader } from './HabitCalendarHeader'
import { HabitCalendarStatus } from './HabitCalendarStatus'
import { HabitCalendarStreaks } from './HabitCalendarStreaks'

import type { Habit } from '@/components/dashboard/types'

import { useHabitCalendar } from '@/hooks/useHabitCalendar'

type HabitCalendarCardProps = {
  habits: Habit[]
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
}

export function HabitCalendarCard({
  habits,
  habitStreaks,
}: HabitCalendarCardProps) {
  const {
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
  } = useHabitCalendar({ habits, habitStreaks })

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <HabitCalendarHeader
        habits={habits}
        monthLabel={monthLabel}
        onHabitChange={setSelectedHabitId}
        onMonthChange={shiftMonth}
        selectedHabitId={selectedHabitId}
      />

      {habits.length === 0 || !selectedHabit ? (
        <p className="mt-6 text-sm text-slate-500">
          Create a habit to unlock the monthly calendar view.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {selectedHabit.name}
          </p>
          <HabitCalendarStreaks
            best={selectedStreak.best}
            current={selectedStreak.current}
          />
          <HabitCalendarGrid
            calendar={calendar}
            completedDates={completedDates}
            todayKey={todayKey}
          />
          <HabitCalendarStatus
            calendarError={calendarError}
            isCalendarLoading={isCalendarLoading}
          />
        </div>
      )}
    </div>
  )
}
