import { padNumber, weekdayLabels } from './habitCalendarUtils'

import type { CalendarData } from './habitCalendarUtils'
import { cn } from '@/lib/utils'

type DailyOverviewEntry = {
  completedHabits: number
  totalHabits: number
}

type HabitCalendarCompletionOverviewProps = {
  calendar: CalendarData
  overviewByDate: Map<string, DailyOverviewEntry>
  todayKey: string
}

const percentageForDay = (entry?: DailyOverviewEntry) => {
  if (!entry || entry.totalHabits <= 0) {
    return 0
  }

  return Math.round((entry.completedHabits / entry.totalHabits) * 100)
}

export function HabitCalendarCompletionOverview({
  calendar,
  overviewByDate,
  todayKey,
}: HabitCalendarCompletionOverviewProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-700">
          Overview history
        </p>
        <p className="text-[0.68rem] text-slate-500">
          Ring = daily completion %
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {weekdayLabels.map((label) => (
          <div
            key={`overview-${label}`}
            className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            {label}
          </div>
        ))}

        {calendar.days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`overview-${day ?? 'blank'}-${index}`}
                className="h-12 rounded-lg border border-transparent"
              />
            )
          }

          const dayKey = `${calendar.year}-${padNumber(
            calendar.monthIndex + 1,
          )}-${padNumber(day)}`
          const isFuture = dayKey > todayKey
          const isToday = dayKey === todayKey
          const entry = overviewByDate.get(dayKey)
          const percentage = isFuture ? 0 : percentageForDay(entry)
          const completedHabits = isFuture ? 0 : (entry?.completedHabits ?? 0)
          const totalHabits = isFuture ? 0 : (entry?.totalHabits ?? 0)
          const isEmptyDay = !isFuture && totalHabits > 0 && percentage === 0
          const isStrongDay = !isFuture && percentage >= 70

          return (
            <div
              key={`overview-${day}-${index}`}
              title={`${dayKey}: ${completedHabits}/${totalHabits} habits (${percentage}%)`}
              className={cn(
                'relative flex h-12 items-center justify-center rounded-lg border bg-white',
                isToday ? 'border-slate-300' : 'border-slate-200',
                isEmptyDay && 'border-rose-200 bg-rose-50/80',
                isStrongDay && 'border-emerald-200 bg-emerald-50/80',
                isFuture && 'bg-slate-50 text-slate-300',
              )}
            >
              <div
                className="grid h-8 w-8 place-items-center rounded-full p-[2px]"
                style={{
                  background: `conic-gradient(rgb(22 163 74) ${percentage}%, rgb(226 232 240) ${percentage}% 100%)`,
                }}
              >
                <div
                  className={cn(
                    'grid h-full w-full place-items-center rounded-full bg-white text-[0.62rem] font-semibold',
                    isFuture && 'bg-slate-100 text-slate-300',
                    isEmptyDay && 'bg-rose-100 text-rose-500',
                    isStrongDay && 'bg-emerald-100 text-emerald-800',
                    !isFuture &&
                      !isEmptyDay &&
                      !isStrongDay &&
                      'text-slate-700',
                  )}
                >
                  {day}
                </div>
              </div>

              <span
                className={cn(
                  'absolute bottom-1 right-1.5 text-[0.55rem] font-medium',
                  isFuture ? 'text-slate-300' : 'text-slate-500',
                )}
              >
                {isFuture ? '-' : `${completedHabits}/${totalHabits}`}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Completed progress
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          Future
        </span>
      </div>
    </div>
  )
}
