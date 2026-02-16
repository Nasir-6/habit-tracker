import { useState } from 'react'
import { HabitHistoryDialog } from './HabitHistoryDialog'
import { HabitListItem } from './HabitListItem'
import type { DragEvent } from 'react'

import type { Habit } from '@/types/dashboard'
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'
import { useHabitHistory } from '@/hooks/useHabitHistory'

type HabitListProps = {
  habits: Habit[]
  archivedHabits: Habit[]
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
  actionError: string | null
  onHabitReorder: (fromId: string, toId: string) => void
  onToggleHabit: (habitId: string) => void
  onDeleteHabit: (
    habitId: string,
    operation: 'archive' | 'hardDelete',
  ) => Promise<void>
  onSetHabitReminder: (habitId: string, reminderTime: string) => Promise<void>
  onClearHabitReminder: (habitId: string) => Promise<void>
}

export function HabitList({
  habits,
  archivedHabits,
  habitStreaks,
  actionError,
  onHabitReorder,
  onToggleHabit,
  onDeleteHabit,
  onSetHabitReminder,
  onClearHabitReminder,
}: HabitListProps) {
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null)
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null)
  const [savingReminderHabitId, setSavingReminderHabitId] = useState<
    string | null
  >(null)
  const [deleteFlowHabitId, setDeleteFlowHabitId] = useState<string | null>(
    null,
  )
  const [confirmHardDeleteHabitId, setConfirmHardDeleteHabitId] = useState<
    string | null
  >(null)

  const habitHistory = useHabitHistory({ habits })
  const listItemState = {
    draggingHabitId,
    deletingHabitId,
    savingReminderHabitId,
    historyHabitId: habitHistory.historyHabitId,
  }

  const listItemHandlers = {
    onDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', habitId)
      setDraggingHabitId(habitId)
    },
    onDragEnd: () => {
      setDraggingHabitId(null)
    },
    onDrop: (habitId: string) => {
      handleHabitDrop(habitId)
    },
    onToggleHabit: (habitId: string) => {
      onToggleHabit(habitId)
    },
    onToggleHistory: (habitId: string) => {
      void habitHistory.handleToggleHistory(habitId)
    },
    onDeleteHabit: (habitId: string) => {
      if (deletingHabitId) {
        return
      }

      setDeleteFlowHabitId(habitId)
    },
    onSetHabitReminder: (habitId: string, reminderTime: string) => {
      void handleSetHabitReminder(habitId, reminderTime)
    },
    onClearHabitReminder: (habitId: string) => {
      void handleClearHabitReminder(habitId)
    },
  }

  const orderedHabits = [...habits].sort(
    (left, right) => Number(left.isCompleted) - Number(right.isCompleted),
  )
  const deleteFlowHabit = orderedHabits.find(
    (habit) => habit.id === deleteFlowHabitId,
  )
  const confirmHardDeleteHabit = orderedHabits.find(
    (habit) => habit.id === confirmHardDeleteHabitId,
  )

  const handleHabitDrop = (targetId: string) => {
    if (!draggingHabitId) {
      return
    }

    const sourceId = draggingHabitId
    setDraggingHabitId(null)

    onHabitReorder(sourceId, targetId)
  }

  const handleDeleteHabit = async (
    habitId: string,
    operation: 'archive' | 'hardDelete',
  ) => {
    if (deletingHabitId) {
      return
    }

    setDeletingHabitId(habitId)

    try {
      await onDeleteHabit(habitId, operation)
    } finally {
      setDeletingHabitId(null)
      setDeleteFlowHabitId(null)
      setConfirmHardDeleteHabitId(null)
    }
  }

  const handleSetHabitReminder = async (
    habitId: string,
    reminderTime: string,
  ) => {
    if (savingReminderHabitId) {
      return
    }

    setSavingReminderHabitId(habitId)

    try {
      await onSetHabitReminder(habitId, reminderTime)
    } finally {
      setSavingReminderHabitId(null)
    }
  }

  const handleClearHabitReminder = async (habitId: string) => {
    if (savingReminderHabitId) {
      return
    }

    setSavingReminderHabitId(habitId)

    try {
      await onClearHabitReminder(habitId)
    } finally {
      setSavingReminderHabitId(null)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Today</h2>
      </div>
      <div className="mt-6 grid gap-4">
        {actionError ? (
          <p className="text-sm text-rose-500" role="status">
            {actionError}
          </p>
        ) : null}
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            Add your first habit to start tracking daily completions.
          </div>
        ) : (
          orderedHabits.map((habit) => (
            <HabitListItem
              key={habit.id}
              habit={habit}
              habitStreak={habitStreaks[habit.id]}
              itemState={listItemState}
              handlers={listItemHandlers}
            />
          ))
        )}
        {habits.length > 1 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            Drag habits to reorder.
          </div>
        ) : null}

        {archivedHabits.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Archived
            </h3>
            <ul className="mt-3 grid gap-2">
              {archivedHabits.map((habit) => (
                <li
                  key={habit.id}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                >
                  {habit.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {habitHistory.historyHabitId && habitHistory.selectedHabit ? (
        <HabitHistoryDialog habitHistory={habitHistory} />
      ) : null}
      {deleteFlowHabit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Delete habit"
          onClick={() => {
            if (!deletingHabitId) {
              setDeleteFlowHabitId(null)
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xl"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <h3 className="text-base font-semibold text-slate-900">
              Delete habit
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {`Choose what to do with "${deleteFlowHabit.name}".`}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={() => {
                  setDeleteFlowHabitId(null)
                }}
                disabled={Boolean(deletingHabitId)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                type="button"
                onClick={() => {
                  void handleDeleteHabit(deleteFlowHabit.id, 'archive')
                }}
                disabled={Boolean(deletingHabitId)}
              >
                Archive
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
                type="button"
                onClick={() => {
                  setDeleteFlowHabitId(null)
                  setConfirmHardDeleteHabitId(deleteFlowHabit.id)
                }}
                disabled={Boolean(deletingHabitId)}
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmModal
        title="Delete forever"
        description={
          confirmHardDeleteHabit
            ? `Permanently delete "${confirmHardDeleteHabit.name}" and all related data? This cannot be undone.`
            : 'Permanently delete this habit and all related data? This cannot be undone.'
        }
        confirmLabel="Delete forever"
        isOpen={Boolean(confirmHardDeleteHabitId)}
        isConfirming={Boolean(deletingHabitId)}
        onCancel={() => {
          if (!deletingHabitId) {
            setConfirmHardDeleteHabitId(null)
          }
        }}
        onConfirm={() => {
          if (confirmHardDeleteHabit) {
            void handleDeleteHabit(confirmHardDeleteHabit.id, 'hardDelete')
          }
        }}
      />
    </div>
  )
}
