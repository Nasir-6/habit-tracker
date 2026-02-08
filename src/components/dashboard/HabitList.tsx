import type { DragEvent } from 'react'
import type { Habit } from '@/components/dashboard/types'

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
                  'flex flex-col gap-4 rounded-2xl border bg-white/90 px-4 py-4 shadow-sm transition sm:flex-row sm:items-center sm:justify-between sm:px-5',
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
                <div className="space-y-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      habit.isCompleted
                        ? 'text-slate-500 line-through decoration-slate-400'
                        : 'text-slate-900',
                    )}
                  >
                    {habit.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {habit.isCompleted
                      ? 'Completed today.'
                      : 'Ready for today’s check-in.'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Current {formatStreak(habitStreaks[habit.id]?.current ?? 0)}{' '}
                    · Best {formatStreak(habitStreaks[habit.id]?.best ?? 0)}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                  <button
                    className="min-h-[44px] w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 sm:w-auto"
                    type="button"
                    onClick={() => {
                      onToggleHistory(habit.id)
                    }}
                  >
                    {historyHabitId === habit.id ? 'Hide history' : 'History'}
                  </button>
                  <button
                    className={cn(
                      'min-h-[44px] w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition sm:w-auto',
                      habit.isCompleted
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-50'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                    type="button"
                    onClick={() => {
                      onToggleHabit(habit.id)
                    }}
                  >
                    {habit.isCompleted ? 'Undo' : 'Mark complete'}
                  </button>
                  <button
                    className={cn(
                      'min-h-[44px] w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition sm:w-auto',
                      deletingHabitId === habit.id
                        ? 'border-rose-200 bg-rose-50 text-rose-400'
                        : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
                    )}
                    disabled={deletingHabitId === habit.id}
                    type="button"
                    onClick={() => {
                      onDeleteHabit(habit.id)
                    }}
                  >
                    {deletingHabitId === habit.id ? 'Deleting…' : 'Delete'}
                  </button>
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      habit.isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500',
                    )}
                  >
                    {habit.isCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
              {historyHabitId === habit.id ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 sm:p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>History</span>
                    <span>{historyDates.length} total</span>
                  </div>
                  <div className="mt-3">
                    {isHistoryLoading ? (
                      <p className="text-slate-500">Loading history...</p>
                    ) : historyError ? (
                      <p className="text-rose-500">{historyError}</p>
                    ) : historyDates.length === 0 ? (
                      <p className="text-slate-500">
                        No completions yet. Check in to start building a streak.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {historyDates.map((date) => (
                          <span
                            key={date}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                          >
                            {date}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
        {habits.length > 1 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            Drag to reorder once you have more than one habit.
          </div>
        ) : null}
      </div>
    </div>
  )
}
