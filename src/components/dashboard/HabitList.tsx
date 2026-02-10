import { Check, Circle, History, X } from 'lucide-react'
import type { DragEvent } from 'react'
import type { Habit } from '@/components/dashboard/types'

import { Calendar } from '@/components/ui/calendar'
import { formatUtcDate, parseLocalDateParts } from '@/lib/date'
import { cn } from '@/lib/utils'

type HabitListProps = {
  habits: Habit[]
  historyHabitId: string | null
  historyDates: string[]
  historyError: string | null
  isHistoryLoading: boolean
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
  draggingHabitId: string | null
  deletingHabitId: string | null
  onHabitDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => void
  onHabitDragEnd: () => void
  onHabitDrop: (targetId: string) => void
  onToggleHabit: (habitId: string) => void
  onToggleHistory: (habitId: string) => void
  onDeleteHabit: (habitId: string) => void
}

export function HabitList({
  habits,
  historyHabitId,
  historyDates,
  historyError,
  isHistoryLoading,
  habitStreaks,
  draggingHabitId,
  deletingHabitId,
  onHabitDragStart,
  onHabitDragEnd,
  onHabitDrop,
  onToggleHabit,
  onToggleHistory,
  onDeleteHabit,
}: HabitListProps) {
  const formatStreak = (value: number) =>
    `${value} day${value === 1 ? '' : 's'}`
  const orderedHabits = [...habits].sort(
    (left, right) => Number(left.isCompleted) - Number(right.isCompleted),
  )
  const selectedHabit = historyHabitId
    ? habits.find((habit) => habit.id === historyHabitId)
    : null
  const historySelectedDates = historyDates
    .map((date) => {
      const parsed = parseLocalDateParts(date)

      if (!parsed) {
        return null
      }

      return new Date(parsed.year, parsed.month - 1, parsed.day)
    })
    .filter((date): date is Date => Boolean(date))
  const historyDefaultMonth = historySelectedDates.length
    ? historySelectedDates[historySelectedDates.length - 1]
    : undefined
  const historyDateSet = new Set(historyDates)
  const streakStartDates: Date[] = []
  const streakEndDates: Date[] = []
  const streakMiddleDates: Date[] = []
  const streakSingleDates: Date[] = []

  const addUtcDays = (date: Date, days: number) => {
    const copy = new Date(date)
    copy.setUTCDate(copy.getUTCDate() + days)
    return copy
  }

  historyDates.forEach((date) => {
    const parsed = parseLocalDateParts(date)

    if (!parsed) {
      return
    }

    const previousDate = formatUtcDate(addUtcDays(parsed.utcDate, -1))
    const nextDate = formatUtcDate(addUtcDays(parsed.utcDate, 1))
    const hasPrevious = historyDateSet.has(previousDate)
    const hasNext = historyDateSet.has(nextDate)
    const localDate = new Date(parsed.year, parsed.month - 1, parsed.day)

    if (!hasPrevious && !hasNext) {
      streakSingleDates.push(localDate)
      return
    }

    if (!hasPrevious) {
      streakStartDates.push(localDate)
    }

    if (!hasNext) {
      streakEndDates.push(localDate)
    }

    if (hasPrevious && hasNext) {
      streakMiddleDates.push(localDate)
    }
  })

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Today</h2>
        {habits.length === 0 ? (
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Empty
          </span>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4">
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            Add your first habit to start tracking daily completions.
          </div>
        ) : (
          orderedHabits.map((habit) => (
            <div key={habit.id} className="grid gap-3">
              <div
                className={cn(
                  'relative flex flex-col gap-4 rounded-2xl border bg-white/90 px-4 py-4 shadow-sm transition sm:flex-row sm:items-center sm:justify-between sm:px-5',
                  draggingHabitId === habit.id
                    ? 'border-slate-400 bg-slate-50 shadow-md'
                    : 'border-slate-200',
                )}
                draggable
                onDragStart={(event) => {
                  onHabitDragStart(event, habit.id)
                }}
                onDragEnd={onHabitDragEnd}
                onDragOver={(event) => {
                  event.preventDefault()
                }}
                onDrop={() => {
                  onHabitDrop(habit.id)
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      className={cn(
                        'inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition',
                        habit.isCompleted
                          ? 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-50'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                      )}
                      type="button"
                      onClick={() => {
                        onToggleHabit(habit.id)
                      }}
                      aria-label={
                        habit.isCompleted
                          ? 'Mark as pending'
                          : 'Mark as completed'
                      }
                    >
                      {habit.isCompleted ? (
                        <Check aria-hidden="true" className="h-5 w-5" />
                      ) : (
                        <Circle
                          aria-hidden="true"
                          className="h-5 w-5"
                          strokeWidth={1.5}
                        />
                      )}
                    </button>
                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          habit.isCompleted
                            ? 'text-slate-500 line-through decoration-slate-400'
                            : 'text-slate-900',
                        )}
                      >
                        {habit.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Current{' '}
                        {formatStreak(habitStreaks[habit.id]?.current ?? 0)} ·
                        Best {formatStreak(habitStreaks[habit.id]?.best ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto sm:items-center sm:gap-3">
                  <button
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
                    type="button"
                    onClick={() => {
                      onToggleHistory(habit.id)
                    }}
                    aria-label={
                      historyHabitId === habit.id
                        ? 'Hide history'
                        : 'Show history'
                    }
                  >
                    <span aria-hidden="true">
                      <History aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </button>
                  <button
                    className={cn(
                      'ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition',
                      deletingHabitId === habit.id
                        ? 'border-rose-200 bg-rose-50 text-rose-300'
                        : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
                    )}
                    disabled={deletingHabitId === habit.id}
                    type="button"
                    onClick={() => {
                      onDeleteHabit(habit.id)
                    }}
                    aria-label={
                      deletingHabitId === habit.id ? 'Deleting' : 'Delete'
                    }
                  >
                    <span className="sr-only">
                      {deletingHabitId === habit.id ? 'Deleting' : 'Delete'}
                    </span>
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {habits.length > 1 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            Drag to reorder once you have more than one habit.
          </div>
        ) : null}
      </div>
      {historyHabitId && selectedHabit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedHabit.name} history`}
          onClick={() => {
            onToggleHistory(historyHabitId)
          }}
        >
          <div
            className="w-fit rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xl"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  History
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedHabit.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {historyDates.length} total
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                onClick={() => {
                  onToggleHistory(historyHabitId)
                }}
                aria-label="Close history"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4">
              {isHistoryLoading ? (
                <p className="text-slate-500">Loading history...</p>
              ) : historyError ? (
                <p className="text-rose-500">{historyError}</p>
              ) : historyDates.length === 0 ? (
                <p className="text-slate-500">
                  No completions yet. Check in to start building a streak.
                </p>
              ) : (
                <Calendar
                  mode="multiple"
                  selected={historySelectedDates}
                  defaultMonth={historyDefaultMonth}
                  showOutsideDays={true}
                  className="rounded-xl border border-slate-200 bg-white"
                  modifiers={{
                    streak: historySelectedDates,
                    streakStart: streakStartDates,
                    streakEnd: streakEndDates,
                    streakMiddle: streakMiddleDates,
                    streakSingle: streakSingleDates,
                  }}
                  modifiersClassNames={{
                    streak: 'bg-emerald-500 text-white',
                    streakStart: 'rounded-l-md',
                    streakEnd: 'rounded-r-md',
                    streakMiddle: 'rounded-none',
                    streakSingle: 'rounded-md',
                  }}
                  classNames={{
                    day: 'text-xs',
                    day_button:
                      'rounded-none bg-transparent text-inherit hover:bg-transparent data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-inherit data-[range-start=true]:bg-transparent data-[range-end=true]:bg-transparent data-[range-middle=true]:bg-transparent',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
