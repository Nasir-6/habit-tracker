import { X } from 'lucide-react'

import type { useHabitHistory } from '@/hooks/useHabitHistory'
import { Calendar } from '@/components/ui/calendar'

type HabitHistoryDialogProps = {
  habitHistory: ReturnType<typeof useHabitHistory>
}

export function HabitHistoryDialog({ habitHistory }: HabitHistoryDialogProps) {
  if (
    typeof habitHistory.historyHabitId !== 'string' ||
    !habitHistory.selectedHabit
  ) {
    return null
  }

  const historyHabitId = habitHistory.historyHabitId
  const habitName = habitHistory.selectedHabit.name
  const historyCount = habitHistory.historyDates.length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${habitName} history`}
      onClick={() => {
        habitHistory.handleToggleHistory(historyHabitId)
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
              {habitName}
            </p>
            <p className="mt-1 text-xs text-slate-400">{historyCount} total</p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            onClick={() => {
              habitHistory.handleToggleHistory(historyHabitId)
            }}
            aria-label="Close history"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4">
          {habitHistory.isHistoryLoading ? (
            <p className="text-slate-500">Loading history...</p>
          ) : habitHistory.historyError ? (
            <p className="text-rose-500">{habitHistory.historyError}</p>
          ) : habitHistory.historyDates.length === 0 ? (
            <p className="text-slate-500">
              No completions yet. Check in to start building a streak.
            </p>
          ) : (
            <Calendar
              mode="multiple"
              selected={habitHistory.historySelectedDates}
              defaultMonth={habitHistory.historyDefaultMonth}
              showOutsideDays={true}
              className="rounded-xl border border-slate-200 bg-white"
              modifiers={{
                streak: habitHistory.historySelectedDates,
                streakStart: habitHistory.streakStartDates,
                streakEnd: habitHistory.streakEndDates,
                streakMiddle: habitHistory.streakMiddleDates,
                streakSingle: habitHistory.streakSingleDates,
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
  )
}
