import { padNumber, weekdayLabels } from './habitCalendarUtils'

import type { CalendarData } from './habitCalendarUtils'
import { cn } from '@/lib/utils'

type HabitCalendarHabitDetailGridProps = {
  calendar: CalendarData
  completedDates: Set<string>
  todayKey: string
}

export function HabitCalendarHabitDetailGrid({
  calendar,
  completedDates,
  todayKey,
}: HabitCalendarHabitDetailGridProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-700">
          Habit history
        </p>
        <p className="text-[0.68rem] text-slate-500">Daily state ring</p>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {weekdayLabels.map((label) => (
          <div
            key={`habit-${label}`}
            className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            {label}
          </div>
        ))}

        {calendar.days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`habit-${day ?? 'blank'}-${index}`}
                className="h-12 rounded-lg border border-transparent"
              />
            )
          }

          const dayKey = `${calendar.year}-${padNumber(
            calendar.monthIndex + 1,
          )}-${padNumber(day)}`
          const isCompleted = completedDates.has(dayKey)
          const isToday = dayKey === todayKey
          const isFuture = dayKey > todayKey
          const isMissed = !isCompleted && !isFuture && !isToday

          return (
            <div
              key={`habit-${day}-${index}`}
              title={dayKey}
              className={cn(
                'relative flex h-12 items-center justify-center rounded-lg border bg-white text-sm font-semibold transition-colors',
                isCompleted && 'border-emerald-200 bg-emerald-50/80',
                isMissed && 'border-rose-200 bg-rose-50/80',
                isToday && !isCompleted && 'border-slate-300 bg-slate-50',
                isFuture && 'bg-slate-50 text-slate-300',
              )}
            >
              <div
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full p-[2px]',
                  isCompleted && 'bg-emerald-500',
                  isToday && !isCompleted && 'bg-slate-900',
                  isFuture && 'bg-slate-200',
                  isMissed && 'bg-rose-300',
                )}
              >
                <div
                  className={cn(
                    'grid h-full w-full place-items-center rounded-full bg-white text-[0.62rem] font-semibold',
                    isCompleted && 'bg-emerald-100 text-emerald-800',
                    isToday && !isCompleted && 'bg-slate-900 text-white',
                    isFuture && 'bg-slate-100 text-slate-300',
                    isMissed && 'bg-rose-100 text-rose-500',
                  )}
                >
                  {day}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Completed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-900" />
          Today
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          Missed
        </span>
      </div>
    </div>
  )
}
