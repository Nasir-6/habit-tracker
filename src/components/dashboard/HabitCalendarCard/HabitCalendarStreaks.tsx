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
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
          Current streak
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {formatStreak(current)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
          Best streak
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {formatStreak(best)}
        </p>
      </div>
    </div>
  )
}
