import { formatInviteDate } from './partnerStatusUtils'

type PartnerSentInvitesProps = {
  sentInvites: {
    id: string
    inviteeEmail: string
    createdAt: string
    status: 'pending' | 'rejected'
  }[]
  deletingInviteId: string | null
  resendingInviteId: string | null
  onInviteDelete: (inviteId: string) => void
  onInviteResend: (inviteId: string) => void
}

export function PartnerSentInvites({
  sentInvites,
  deletingInviteId,
  resendingInviteId,
  onInviteDelete,
  onInviteResend,
}: PartnerSentInvitesProps) {
  if (sentInvites.length === 0) {
    return null
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        Sent invites
      </p>
      {sentInvites.map((invite) => {
        const isDeleting = deletingInviteId === invite.id
        const isRejected = invite.status === 'rejected'
        const isResending = resendingInviteId === invite.id

        return (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {invite.inviteeEmail}
                </p>
                <span
                  className={
                    isRejected
                      ? 'rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-700'
                      : 'rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600'
                  }
                >
                  {isRejected ? 'Rejected' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sent {formatInviteDate(invite.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRejected ? (
                <button
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={isDeleting || isResending}
                  onClick={() => {
                    onInviteResend(invite.id)
                  }}
                  type="button"
                >
                  {isResending ? 'Resending...' : 'Resend'}
                </button>
              ) : null}
              <button
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={isDeleting || isResending}
                onClick={() => {
                  onInviteDelete(invite.id)
                }}
                type="button"
              >
                {isDeleting
                  ? isRejected
                    ? 'Clearing...'
                    : 'Deleting...'
                  : isRejected
                    ? 'Clear'
                    : 'Delete'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
