import { AlarmClock, Check, Circle, History, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { formatStreak } from './habitListUtils'
import type { Habit } from '@/types/dashboard'

import type { DragEvent } from 'react'
import { cn } from '@/lib/utils'

type HabitListItemUiState = {
  draggingHabitId: string | null
  deletingHabitId: string | null
  savingReminderHabitId: string | null
  historyHabitId: string | null
}

type HabitListItemHandlers = {
  onDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => void
  onDragEnd: () => void
  onDrop: (habitId: string) => void
  onToggleHabit: (habitId: string) => void
  onToggleHistory: (habitId: string) => void
  onDeleteHabit: (habitId: string) => void
  onSetHabitReminder: (habitId: string, reminderTime: string) => void
  onClearHabitReminder: (habitId: string) => void
}

type HabitListItemProps = {
  habit: Habit
  habitStreak: { current: number; best: number } | undefined
  itemState: HabitListItemUiState
  handlers: HabitListItemHandlers
  onCompletionButtonRef: (
    habitId: string,
    element: HTMLButtonElement | null,
  ) => void
}

const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

const parseReminderMinutes = (reminderTime: string) => {
  const [hoursText, minutesText] = reminderTime.split(':')
  const hours = Number.parseInt(hoursText, 10)
  const minutes = Number.parseInt(minutesText, 10)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return hours * MINUTES_PER_HOUR + minutes
}

const formatReminderCountdown = (reminderTime: string, now: Date) => {
  const reminderMinutes = parseReminderMinutes(reminderTime)

  if (reminderMinutes === null) {
    return null
  }

  const nowMinutes = now.getHours() * MINUTES_PER_HOUR + now.getMinutes()
  const minutesRemaining =
    reminderMinutes >= nowMinutes
      ? reminderMinutes - nowMinutes
      : MINUTES_PER_DAY - nowMinutes + reminderMinutes

  if (minutesRemaining < MINUTES_PER_HOUR) {
    return `in ${minutesRemaining}m`
  }

  const hours = Math.floor(minutesRemaining / MINUTES_PER_HOUR)
  const minutes = minutesRemaining % MINUTES_PER_HOUR

  if (minutes === 0) {
    return `in ${hours}h`
  }

  return `in ${hours}h ${minutes}m`
}

export function HabitListItem({
  habit,
  habitStreak,
  itemState,
  handlers,
  onCompletionButtonRef,
}: HabitListItemProps) {
  const [reminderInput, setReminderInput] = useState(habit.reminderTime ?? '')
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const {
    draggingHabitId,
    deletingHabitId,
    savingReminderHabitId,
    historyHabitId,
  } = itemState
  const isSavingReminder = savingReminderHabitId === habit.id
  const canSaveReminder =
    reminderInput.length > 0 &&
    reminderInput !== (habit.reminderTime ?? '') &&
    !isSavingReminder
  const reminderCountdown = habit.reminderTime
    ? formatReminderCountdown(habit.reminderTime, now)
    : null

  useEffect(() => {
    setReminderInput(habit.reminderTime ?? '')
  }, [habit.reminderTime])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          'relative grid gap-4 rounded-2xl border bg-white/90 px-4 py-4 shadow-sm transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-5',
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
        <div className="flex min-w-0 items-start gap-3">
          <button
            ref={(element) => {
              onCompletionButtonRef(habit.id, element)
            }}
            className={cn(
              'mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition',
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
          <div className="min-w-0 space-y-2">
            <p
              className={cn(
                'truncate text-lg font-semibold leading-none',
                habit.isCompleted
                  ? 'text-slate-500 line-through decoration-slate-400'
                  : 'text-slate-900',
              )}
            >
              {habit.name}
            </p>
            <p className="text-sm text-slate-500">
              Current {formatStreak(habitStreak?.current ?? 0)} · Best{' '}
              {formatStreak(habitStreak?.best ?? 0)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                type="button"
                aria-label={`${habit.reminderTime ? 'Edit' : 'Set'} reminder for ${habit.name}`}
                onClick={() => {
                  setReminderInput(habit.reminderTime ?? '')
                  setIsReminderModalOpen(true)
                }}
              >
                <AlarmClock aria-hidden="true" className="h-3.5 w-3.5" />
                {reminderCountdown ?? 'Set reminder'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 sm:justify-start">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
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
              'inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition',
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
      {isReminderModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Reminder for ${habit.name}`}
          onClick={() => {
            if (!isSavingReminder) {
              setIsReminderModalOpen(false)
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xl"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <h3 className="text-base font-semibold text-slate-900">
              Reminder for {habit.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Choose a daily reminder time.
            </p>
            <label className="mt-4 block text-xs font-medium text-slate-500">
              Time
              <input
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                type="time"
                value={reminderInput}
                onChange={(event) => {
                  setReminderInput(event.target.value)
                }}
                disabled={isSavingReminder}
              />
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {habit.reminderTime ? (
                <button
                  className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                  type="button"
                  onClick={() => {
                    handlers.onClearHabitReminder(habit.id)
                    setIsReminderModalOpen(false)
                  }}
                  disabled={isSavingReminder}
                >
                  Remove
                </button>
              ) : null}
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                type="button"
                onClick={() => {
                  setIsReminderModalOpen(false)
                }}
                disabled={isSavingReminder}
              >
                Cancel
              </button>
              <button
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed',
                  canSaveReminder
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-slate-300',
                )}
                type="button"
                onClick={() => {
                  if (canSaveReminder) {
                    handlers.onSetHabitReminder(habit.id, reminderInput)
                    setIsReminderModalOpen(false)
                  }
                }}
                disabled={!canSaveReminder}
              >
                Save reminder
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
