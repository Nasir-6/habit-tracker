import type { Habit } from '@/types/dashboard'

type HabitCalendarHeaderProps = {
  habits: Habit[]
  monthLabel: string
  onHabitChange: (habitId: string) => void
  onMonthChange: (offset: number) => void
  selectedHabitId: string | null
}

export function HabitCalendarHeader({
  habits,
  monthLabel,
  onHabitChange,
  onMonthChange,
  selectedHabitId,
}: HabitCalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Calendar</h2>
        <p className="text-xs text-slate-500">{monthLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-slate-200 bg-white">
          <button
            className="rounded-full px-3 py-1 text-xs text-slate-500 transition hover:text-slate-800"
            type="button"
            onClick={() => onMonthChange(-1)}
          >
            Prev
          </button>
          <span className="h-5 w-px bg-slate-200" />
          <button
            className="rounded-full px-3 py-1 text-xs text-slate-500 transition hover:text-slate-800"
            type="button"
            onClick={() => onMonthChange(1)}
          >
            Next
          </button>
        </div>
        {habits.length > 0 ? (
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
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
