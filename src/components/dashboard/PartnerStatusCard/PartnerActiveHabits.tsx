import type { PartnerHabit } from '@/types/dashboard'

import { cn } from '@/lib/utils'

type PartnerActiveHabitsProps = {
  habits: PartnerHabit[]
  startedOn: string | null
}

export function PartnerActiveHabits({
  habits,
  startedOn,
}: PartnerActiveHabitsProps) {
  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
        Your partner has not added any habits yet.
      </div>
    )
  }

  return (
    <>
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">{habit.name}</p>
            <p className="text-xs text-slate-400">
              {startedOn ? `Active since ${startedOn}` : 'Partner habit'}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              habit.completedToday
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-500',
            )}
            aria-label={habit.completedToday ? 'Completed' : 'Not completed'}
          >
            {habit.completedToday ? '✓' : '○'}
          </span>
        </div>
      ))}
    </>
  )
}
