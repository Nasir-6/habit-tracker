import { Check, Circle, History, X } from 'lucide-react'

import { formatStreak } from './habitListUtils'
import type { Habit } from '@/types/dashboard'

import type { DragEvent } from 'react'
import { cn } from '@/lib/utils'

type HabitListItemUiState = {
  draggingHabitId: string | null
  deletingHabitId: string | null
  historyHabitId: string | null
}

type HabitListItemHandlers = {
  onDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => void
  onDragEnd: () => void
  onDrop: (habitId: string) => void
  onToggleHabit: (habitId: string) => void
  onToggleHistory: (habitId: string) => void
  onDeleteHabit: (habitId: string) => void
}

type HabitListItemProps = {
  habit: Habit
  habitStreak: { current: number; best: number } | undefined
  itemState: HabitListItemUiState
  handlers: HabitListItemHandlers
}

export function HabitListItem({
  habit,
  habitStreak,
  itemState,
  handlers,
}: HabitListItemProps) {
  const { draggingHabitId, deletingHabitId, historyHabitId } = itemState

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          'relative flex flex-col gap-4 rounded-2xl border bg-white/90 px-4 py-4 shadow-sm transition sm:flex-row sm:items-center sm:justify-between sm:px-5',
          draggingHabitId === habit.id
            ? 'border-slate-400 bg-slate-50 shadow-md'
            : 'border-slate-200',
        )}
        draggable
        onDragStart={(event) => {
          handlers.onDragStart(event, habit.id)
        }}
        onDragEnd={handlers.onDragEnd}
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={() => {
          handlers.onDrop(habit.id)
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
                handlers.onToggleHabit(habit.id)
              }}
              aria-label={
                habit.isCompleted ? 'Mark as pending' : 'Mark as completed'
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
                Current {formatStreak(habitStreak?.current ?? 0)} · Best{' '}
                {formatStreak(habitStreak?.best ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:items-center sm:gap-3">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
            type="button"
            onClick={() => {
              handlers.onToggleHistory(habit.id)
            }}
            aria-label={
              historyHabitId === habit.id ? 'Hide history' : 'Show history'
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
              handlers.onDeleteHabit(habit.id)
            }}
            aria-label={deletingHabitId === habit.id ? 'Deleting' : 'Delete'}
          >
            <span className="sr-only">
              {deletingHabitId === habit.id ? 'Deleting' : 'Delete'}
            </span>
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
