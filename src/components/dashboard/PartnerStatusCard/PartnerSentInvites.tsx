import { formatInviteDate } from './partnerStatusUtils'

type PartnerSentInvitesProps = {
  sentInvites: {
    id: string
    inviteeEmail: string
    createdAt: string
  }[]
  deletingInviteId: string | null
  onInviteDelete: (inviteId: string) => void
}

export function PartnerSentInvites({
  sentInvites,
  deletingInviteId,
  onInviteDelete,
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

        return (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {invite.inviteeEmail}
              </p>
              <p className="text-xs text-slate-400">
                Sent {formatInviteDate(invite.createdAt)}
              </p>
            </div>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={isDeleting}
              onClick={() => {
                onInviteDelete(invite.id)
              }}
              type="button"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
