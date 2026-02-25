import { formatLocalDate } from './habitCalendarUtils'
import type { ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import type { DailyOverviewEntry } from './types'
import { cn } from '@/lib/utils'


type OverviewDayButtonContext = {
  overviewByDate: Map<string, DailyOverviewEntry>
  todayKey: string
}

type HabitDayButtonContext = {
  completedDates: Set<string>
  todayKey: string
}

const percentageForDay = (entry?: DailyOverviewEntry) => {
  if (!entry || entry.totalHabits <= 0) {
    return 0
  }

  return Math.round((entry.completedHabits / entry.totalHabits) * 100)
}

export const createOverviewDayButton = ({
  overviewByDate,
  todayKey,
}: OverviewDayButtonContext) => {
  return function OverviewDayButton({
    className,
    day,
    ...buttonProps
  }: ComponentProps<typeof DayButton>) {
    const dayKey = formatLocalDate(day.date)
    const isFuture = dayKey > todayKey
    const isToday = dayKey === todayKey
    const entry = overviewByDate.get(dayKey)
    const percentage = isFuture ? 0 : percentageForDay(entry)
    const completedHabits = isFuture ? 0 : (entry?.completedHabits ?? 0)
    const totalHabits = isFuture ? 0 : (entry?.totalHabits ?? 0)
    const isEmptyDay = !isFuture && totalHabits > 0 && percentage === 0
    const isStrongDay = !isFuture && percentage >= 70

    const ringColor = isFuture
      ? 'rgb(203 213 225)'
      : isEmptyDay
        ? 'rgb(244 63 94)'
        : 'rgb(16 185 129)'

    return (
      <button
        {...buttonProps}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center rounded-md border border-transparent px-1 py-1.5 transition-colors hover:bg-slate-50',
          isToday && 'bg-slate-100/80',
          className,
        )}
        title={`${dayKey}: ${completedHabits}/${totalHabits} habits (${percentage}%)`}
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full p-[2px]"
          style={{
            background: `conic-gradient(${ringColor} ${percentage}%, rgb(226 232 240) ${percentage}% 100%)`,
          }}
        >
          <span
            className={cn(
              'grid h-full w-full place-items-center rounded-full bg-white text-[0.65rem] font-semibold text-slate-700',
              isFuture && 'bg-slate-100 text-slate-300',
              isEmptyDay && 'bg-rose-100 text-rose-500',
              isStrongDay && 'bg-emerald-100 text-emerald-800',
              isToday && !isFuture && 'bg-slate-900 text-white',
            )}
          >
            {day.date.getDate()}
          </span>
        </span>
        <span
          className={cn(
            'mt-1 text-[0.6rem] font-medium leading-none',
            isFuture ? 'text-slate-300' : 'text-slate-500',
            isStrongDay && 'text-emerald-700',
            isEmptyDay && 'text-rose-500',
          )}
        >
          {isFuture ? '-' : `${completedHabits}/${totalHabits}`}
        </span>
      </button>
    )
  }
}

export const createHabitDayButton = ({
  completedDates,
  todayKey,
}: HabitDayButtonContext) => {
  return function HabitDayButton({
    className,
    day,
    ...buttonProps
  }: ComponentProps<typeof DayButton>) {
    const dayKey = formatLocalDate(day.date)
    const isCompleted = completedDates.has(dayKey)
    const isToday = dayKey === todayKey
    const isFuture = dayKey > todayKey
    const isMissed = !isCompleted && !isFuture && !isToday

    return (
      <button
        {...buttonProps}
        className={cn(
          'flex h-full w-full items-center justify-center rounded-md border border-transparent p-1.5 transition-colors hover:bg-slate-50',
          isToday && 'bg-slate-100/80',
          className,
        )}
        title={dayKey}
      >
        <span
          className={cn(
            'grid h-8 w-8 place-items-center rounded-full p-[2px]',
            isCompleted && 'bg-emerald-500',
            isToday && !isCompleted && 'bg-slate-900',
            isFuture && 'bg-slate-200',
            isMissed && 'bg-rose-300',
          )}
        >
          <span
            className={cn(
              'grid h-full w-full place-items-center rounded-full bg-white text-[0.65rem] font-semibold text-slate-700',
              isCompleted && 'bg-emerald-100 text-emerald-800',
              isToday && !isCompleted && 'bg-slate-900 text-white',
              isFuture && 'bg-slate-100 text-slate-300',
              isMissed && 'bg-rose-100 text-rose-500',
            )}
          >
            {day.date.getDate()}
          </span>
        </span>
      </button>
    )
  }
}
