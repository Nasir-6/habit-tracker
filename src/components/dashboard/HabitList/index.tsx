import { useEffect, useRef, useState } from 'react'
import { Archive, Plus } from 'lucide-react'
import { CompletionConfetti } from './CompletionConfetti'
import { DailyProgressBar } from './DailyProgressBar'
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
    operation: 'archive' | 'restore' | 'hardDelete',
  ) => Promise<void>
  onSetHabitReminder: (habitId: string, reminderTime: string) => Promise<void>
  onClearHabitReminder: (habitId: string) => Promise<void>
  onOpenCreateHabit: () => void
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
  onOpenCreateHabit,
}: HabitListProps) {
  const allHabits = [...habits, ...archivedHabits]
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null)
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null)
  const [savingReminderHabitId, setSavingReminderHabitId] = useState<
    string | null
  >(null)
  const [restoringHabitId, setRestoringHabitId] = useState<string | null>(null)
  const [deleteFlowHabitId, setDeleteFlowHabitId] = useState<string | null>(
    null,
  )
  const [confirmHardDeleteHabitId, setConfirmHardDeleteHabitId] = useState<
    string | null
  >(null)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const completionButtonByHabitIdRef = useRef<
    Record<string, HTMLButtonElement | null>
  >({})
  const [confettiSourceElement, setConfettiSourceElement] =
    useState<HTMLElement | null>(null)
  const [lastToggledHabitId, setLastToggledHabitId] = useState<string | null>(
    null,
  )
  const [confettiRun, setConfettiRun] = useState(0)
  const hasInitializedProgressRef = useRef(false)
  const previousCompletionPercentRef = useRef(0)

  const habitHistory = useHabitHistory({ habits: allHabits })
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
      setLastToggledHabitId(habitId)
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
  const completedCount = habits.filter((habit) => habit.isCompleted).length
  const totalCount = habits.length
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
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
    operation: 'archive' | 'restore' | 'hardDelete',
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

  const handleRestoreHabit = async (habitId: string) => {
    if (restoringHabitId || deletingHabitId) {
      return
    }

    setRestoringHabitId(habitId)

    try {
      await handleDeleteHabit(habitId, 'restore')
    } finally {
      setRestoringHabitId(null)
    }
  }

  const handleCompletionButtonRef = (
    habitId: string,
    element: HTMLButtonElement | null,
  ) => {
    completionButtonByHabitIdRef.current[habitId] = element
  }

  useEffect(() => {
    if (!hasInitializedProgressRef.current) {
      hasInitializedProgressRef.current = true
      previousCompletionPercentRef.current = completionPercent
      return
    }

    const reachedComplete = totalCount > 0 && completionPercent === 100
    const crossedFromBelow = previousCompletionPercentRef.current < 100

    if (reachedComplete && crossedFromBelow) {
      if (lastToggledHabitId) {
        const nextSourceElement =
          completionButtonByHabitIdRef.current[lastToggledHabitId]

        if (nextSourceElement) {
          setConfettiSourceElement(nextSourceElement)
          setConfettiRun((value) => value + 1)
        }
      }
    }

    previousCompletionPercentRef.current = completionPercent
  }, [completionPercent, lastToggledHabitId, totalCount])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm sm:p-8">
      {confettiRun > 0 && confettiSourceElement ? (
        <CompletionConfetti
          runKey={confettiRun}
          sourceElement={confettiSourceElement}
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Today</h2>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-3"
            type="button"
            onClick={() => {
              setIsArchiveModalOpen(true)
            }}
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archived
          </button>
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900 px-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-3"
            type="button"
            onClick={onOpenCreateHabit}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add habit
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        <DailyProgressBar
          completedCount={completedCount}
          totalCount={totalCount}
        />
        {actionError ? (
          <p className="text-sm text-rose-500" role="status">
            {actionError}
          </p>
        ) : null}
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
            <p>Add your first habit to start tracking daily completions.</p>
            <button
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={onOpenCreateHabit}
            >
              <span aria-hidden="true">+</span>
              Add habit
            </button>
          </div>
        ) : (
          orderedHabits.map((habit) => (
            <HabitListItem
              key={habit.id}
              habit={habit}
              habitStreak={habitStreaks[habit.id]}
              itemState={listItemState}
              handlers={listItemHandlers}
              onCompletionButtonRef={handleCompletionButtonRef}
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
      {isArchiveModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Archived habits"
          onClick={() => {
            setIsArchiveModalOpen(false)
          }}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xl"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Archived
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review archived habits.
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={() => {
                  setIsArchiveModalOpen(false)
                }}
              >
                Close
              </button>
            </div>
            {archivedHabits.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                No archived habits yet.
              </p>
            ) : (
              <ul className="mt-4 grid max-h-80 gap-2 overflow-y-auto pr-1">
                {archivedHabits.map((habit) => (
                  <li
                    key={habit.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                  >
                    <span className="min-w-0 truncate">{habit.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        type="button"
                        onClick={() => {
                          void habitHistory.handleToggleHistory(habit.id)
                        }}
                      >
                        {habitHistory.historyHabitId === habit.id
                          ? 'Hide history'
                          : 'View history'}
                      </button>
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        type="button"
                        onClick={() => {
                          void handleRestoreHabit(habit.id)
                        }}
                        disabled={Boolean(restoringHabitId || deletingHabitId)}
                      >
                        {restoringHabitId === habit.id
                          ? 'Restoring...'
                          : 'Restore'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
                Archived
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
