import { formatInviteDate, formatInviter } from './partnerStatusUtils'

type PartnerPendingInvitesProps = {
  pendingInvites: {
    id: string
    inviterUserId: string
    inviteeEmail: string
    createdAt: string
  }[]
  acceptingInviteId: string | null
  onInviteAccept: (inviteId: string) => void
}

export function PartnerPendingInvites({
  pendingInvites,
  acceptingInviteId,
  onInviteAccept,
}: PartnerPendingInvitesProps) {
  if (pendingInvites.length === 0) {
    return null
  }

  return (
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
  )
}
