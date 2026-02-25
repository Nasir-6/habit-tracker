import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

type HabitCalendarMonthNavProps = {
  monthLabel: string
  onMonthStep: (offset: number) => void
}

export function HabitCalendarMonthNav({
  monthLabel,
  onMonthStep,
}: HabitCalendarMonthNavProps) {
  return (
    <div className="inline-flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Previous month"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        onClick={() => onMonthStep(-1)}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-700">
        {monthLabel}
      </p>
      <button
        type="button"
        aria-label="Next month"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        onClick={() => onMonthStep(1)}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
