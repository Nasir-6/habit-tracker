import type { FormEvent } from 'react'

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
  inviteEmail: string
  inviteError: string | null
  inviteNotice: string | null
  isInviteSubmitting: boolean
  onInvite: (event: FormEvent<HTMLFormElement>) => void
  onInviteEmailChange: (value: string) => void
}

export function PartnerStatusCard({
  hasPartner,
  isLoading,
  startedOn,
  errorMessage,
  habits,
  inviteEmail,
  inviteError,
  inviteNotice,
  isInviteSubmitting,
  onInvite,
  onInviteEmailChange,
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
          <div className="grid gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm text-slate-500">
              No partner yet. Invite someone to see shared progress here.
            </p>
            <form className="grid gap-3" onSubmit={onInvite}>
              <label className="grid gap-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                Partner email
                <input
                  autoComplete="email"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  name="partnerEmail"
                  onChange={(event) => {
                    onInviteEmailChange(event.target.value)
                  }}
                  placeholder="name@example.com"
                  type="email"
                  value={inviteEmail}
                />
              </label>
              <button
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isInviteSubmitting || inviteEmail.trim().length === 0}
                type="submit"
              >
                {isInviteSubmitting ? 'Sending invite...' : 'Send invite'}
              </button>
            </form>
            {inviteError ? (
              <p className="text-sm text-rose-500">{inviteError}</p>
            ) : inviteNotice ? (
              <p className="text-sm text-emerald-600">{inviteNotice}</p>
            ) : null}
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
