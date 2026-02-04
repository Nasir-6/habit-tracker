import type { DragEvent } from 'react'
import type { Habit } from '@/components/dashboard/types'

import { cn } from '@/lib/utils'

type HabitListProps = {
  habits: Habit[]
  draggingHabitId: string | null
  onHabitDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => void
  onHabitDragEnd: () => void
  onHabitDrop: (targetId: string) => void
  onToggleHabit: (habitId: string) => void
}

export function HabitList({
  habits,
  draggingHabitId,
  onHabitDragStart,
  onHabitDragEnd,
  onHabitDrop,
  onToggleHabit,
}: HabitListProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Today</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Empty
        </span>
      </div>
      <div className="mt-6 grid gap-4">
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            Add your first habit to start tracking daily completions.
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className={cn(
                'flex items-center justify-between rounded-2xl border bg-white/90 px-5 py-4 shadow-sm transition',
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
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {habit.name}
                </p>
                <p className="text-xs text-slate-500">
                  {habit.isCompleted
                    ? 'Completed today.'
                    : 'Ready for today’s check-in.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                <button
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold transition',
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
    </div>
  )
}
