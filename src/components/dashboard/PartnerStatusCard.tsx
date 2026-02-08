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
  pendingInvites: {
    id: string
    inviterUserId: string
    inviteeEmail: string
    createdAt: string
  }[]
  pendingInvitesError: string | null
  isPendingInvitesLoading: boolean
  acceptingInviteId: string | null
  acceptInviteError: string | null
  acceptInviteNotice: string | null
  inviteEmail: string
  inviteError: string | null
  inviteNotice: string | null
  isInviteSubmitting: boolean
  isRemovingPartner: boolean
  removePartnerError: string | null
  removePartnerNotice: string | null
  onInvite: (event: FormEvent<HTMLFormElement>) => void
  onInviteEmailChange: (value: string) => void
  onInviteAccept: (inviteId: string) => void
  onRemovePartner: () => void
}

export function PartnerStatusCard({
  hasPartner,
  isLoading,
  startedOn,
  errorMessage,
  habits,
  pendingInvites,
  pendingInvitesError,
  isPendingInvitesLoading,
  acceptingInviteId,
  acceptInviteError,
  acceptInviteNotice,
  inviteEmail,
  inviteError,
  inviteNotice,
  isInviteSubmitting,
  isRemovingPartner,
  removePartnerError,
  removePartnerNotice,
  onInvite,
  onInviteEmailChange,
  onInviteAccept,
  onRemovePartner,
}: PartnerStatusCardProps) {
  const formatInviteDate = (value: string) => {
    const parsed = new Date(value)

    if (Number.isNaN(parsed.getTime())) {
      return 'Recently'
    }

    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatInviter = (value: string) => {
    if (value.length <= 8) {
      return value
    }

    return `${value.slice(0, 6)}…${value.slice(-2)}`
  }

  const hasPendingInvites = pendingInvites.length > 0

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
            {isPendingInvitesLoading ? (
              <p className="text-sm text-slate-500">
                Checking for partner invites...
              </p>
            ) : pendingInvitesError ? (
              <p className="text-sm text-rose-500">{pendingInvitesError}</p>
            ) : hasPendingInvites ? (
              <div className="grid gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Pending invites
                </p>
                {pendingInvites.map((invite) => {
                  const isAccepting = acceptingInviteId === invite.id

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Invite from user {formatInviter(invite.inviterUserId)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Sent {formatInviteDate(invite.createdAt)}
                        </p>
                      </div>
                      <button
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        disabled={isAccepting}
                        onClick={() => {
                          onInviteAccept(invite.id)
                        }}
                        type="button"
                      >
                        {isAccepting ? 'Accepting...' : 'Accept'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : null}
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
            {acceptInviteError ? (
              <p className="text-sm text-rose-500">{acceptInviteError}</p>
            ) : acceptInviteNotice ? (
              <p className="text-sm text-emerald-600">{acceptInviteNotice}</p>
            ) : inviteError ? (
              <p className="text-sm text-rose-500">{inviteError}</p>
            ) : inviteNotice ? (
              <p className="text-sm text-emerald-600">{inviteNotice}</p>
            ) : null}
          </div>
        ) : (
          <>
            {habits.length === 0 ? (
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
                      {startedOn
                        ? `Active since ${startedOn}`
                        : 'Partner habit'}
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
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-rose-50 disabled:text-rose-300"
              disabled={isRemovingPartner}
              onClick={onRemovePartner}
              type="button"
            >
              {isRemovingPartner ? 'Removing partner...' : 'Remove partner'}
            </button>
            {removePartnerError ? (
              <p className="text-sm text-rose-500">{removePartnerError}</p>
            ) : removePartnerNotice ? (
              <p className="text-sm text-emerald-600">{removePartnerNotice}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
