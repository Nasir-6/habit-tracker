const formatStreak = (value: number) => `${value} day${value === 1 ? '' : 's'}`

type HabitCalendarStreaksProps = {
  best: number
  current: number
}

export function HabitCalendarStreaks({
  best,
  current,
}: HabitCalendarStreaksProps) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="w-fit min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[0.65rem] uppercase tracking-[0.14em] text-slate-500">
          Current streak
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">
          {formatStreak(current)}
        </p>
      </div>
      <div className="w-fit min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[0.65rem] uppercase tracking-[0.14em] text-slate-500">
          Best streak
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">
          {formatStreak(best)}
        </p>
      </div>
    </div>
  )
}
