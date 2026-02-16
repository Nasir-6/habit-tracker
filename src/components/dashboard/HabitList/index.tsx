import { useState } from 'react'
import { HabitHistoryDialog } from './HabitHistoryDialog'
import { HabitListItem } from './HabitListItem'
import type { DragEvent } from 'react'

import type { Habit } from '@/types/dashboard'
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'
import { useHabitHistory } from '@/hooks/useHabitHistory'

type HabitListProps = {
  habits: Habit[]
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
  actionError: string | null
  onHabitReorder: (fromId: string, toId: string) => void
  onToggleHabit: (habitId: string) => void
  onDeleteHabit: (habitId: string) => Promise<void>
  onSetHabitReminder: (habitId: string, reminderTime: string) => Promise<void>
  onClearHabitReminder: (habitId: string) => Promise<void>
}

export function HabitList({
  habits,
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
  const [confirmDeleteHabitId, setConfirmDeleteHabitId] = useState<
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
      setConfirmDeleteHabitId(habitId)
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
  const confirmDeleteHabit = orderedHabits.find(
    (habit) => habit.id === confirmDeleteHabitId,
  )

  const handleHabitDrop = (targetId: string) => {
    if (!draggingHabitId) {
      return
    }

    const sourceId = draggingHabitId
    setDraggingHabitId(null)

    onHabitReorder(sourceId, targetId)
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (deletingHabitId) {
      return
    }

    setDeletingHabitId(habitId)

    try {
      await onDeleteHabit(habitId)
    } finally {
      setDeletingHabitId(null)
      setConfirmDeleteHabitId(null)
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
      </div>
      {habitHistory.historyHabitId && habitHistory.selectedHabit ? (
        <HabitHistoryDialog habitHistory={habitHistory} />
      ) : null}
      <ConfirmModal
        title="Delete habit"
        description={
          confirmDeleteHabit
            ? `Delete "${confirmDeleteHabit.name}"? This cannot be undone.`
            : 'Delete this habit? This cannot be undone.'
        }
        confirmLabel="Delete"
        isOpen={Boolean(confirmDeleteHabitId)}
        isConfirming={Boolean(deletingHabitId)}
        onCancel={() => {
          if (!deletingHabitId) {
            setConfirmDeleteHabitId(null)
          }
        }}
        onConfirm={() => {
          if (confirmDeleteHabit) {
            void handleDeleteHabit(confirmDeleteHabit.id)
          }
        }}
      />
    </div>
  )
}
