import { padNumber, weekdayLabels } from './habitCalendarUtils'

import type { CalendarData } from './habitCalendarUtils'
import { cn } from '@/lib/utils'

type HabitCalendarGridProps = {
  calendar: CalendarData
  completedDates: Set<string>
  todayKey: string
}

export function HabitCalendarGrid({
  calendar,
  completedDates,
  todayKey,
}: HabitCalendarGridProps) {
  return (
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
                    isFuture && 'border-slate-100 bg-white/40 text-slate-300',
                    isMissed && 'border-slate-200 bg-slate-100 text-slate-400',
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
  )
}
