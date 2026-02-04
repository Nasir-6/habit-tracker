import { cn } from '@/lib/utils'

type PartnerHabit = {
  id: string
  name: string
  completedToday: boolean
}

type PartnerStatusCardProps = {
  hasPartner: boolean
  isLoading: boolean
  startedOn: string | null
  errorMessage: string | null
  habits: PartnerHabit[]
}

export function PartnerStatusCard({
  hasPartner,
  isLoading,
  startedOn,
  errorMessage,
  habits,
}: PartnerStatusCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Partner</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {hasPartner ? 'Active' : 'Invite'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Check in with a partner to stay aligned on today’s habits.
      </p>
      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading partner status...</p>
        ) : errorMessage ? (
          <p className="text-sm text-rose-500">{errorMessage}</p>
        ) : !hasPartner ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
            No partner yet. Invite someone to see shared progress here.
          </div>
        ) : habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
            Your partner has not added any habits yet.
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {habit.name}
                </p>
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
              >
                {habit.completedToday ? 'Completed' : 'Not yet'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
