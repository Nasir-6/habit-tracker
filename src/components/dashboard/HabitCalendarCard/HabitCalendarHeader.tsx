import type { Habit } from '@/types/dashboard'

type HabitCalendarHeaderProps = {
  habits: Habit[]
  monthLabel: string
  onHabitChange: (habitId: string) => void
  onMonthChange: (offset: number) => void
  onViewModeChange: (mode: 'overview' | 'habit') => void
  selectedHabitId: string | null
  viewMode: 'overview' | 'habit'
}

export function HabitCalendarHeader({
  habits,
  monthLabel,
  onHabitChange,
  onMonthChange,
  onViewModeChange,
  selectedHabitId,
  viewMode,
}: HabitCalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Calendar
        </h2>
        <p className="text-sm text-slate-500">{monthLabel}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <button
            className={
              viewMode === 'overview'
                ? 'bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                : 'px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
            }
            type="button"
            onClick={() => onViewModeChange('overview')}
          >
            Overview
          </button>
          <span className="h-5 w-px bg-slate-200" />
          <button
            className={
              viewMode === 'habit'
                ? 'bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                : 'px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
            }
            type="button"
            onClick={() => onViewModeChange('habit')}
          >
            Habit detail
          </button>
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <button
            className="px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            type="button"
            onClick={() => onMonthChange(-1)}
          >
            Prev
          </button>
          <span className="h-5 w-px bg-slate-200" />
          <button
            className="px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            type="button"
            onClick={() => onMonthChange(1)}
          >
            Next
          </button>
        </div>
        {habits.length > 0 && viewMode === 'habit' ? (
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-400"
            value={selectedHabitId ?? ''}
            onChange={(event) => {
              onHabitChange(event.target.value)
            }}
          >
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  )
}
