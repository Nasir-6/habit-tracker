import { useState } from 'react'

import { PartnerActiveHabits } from './PartnerActiveHabits'
import { PartnerInviteForm } from './PartnerInviteForm'
import { PartnerPendingInvites } from './PartnerPendingInvites'
import { PartnerSentInvites } from './PartnerSentInvites'
import { PartnerStatusHeader } from './PartnerStatusHeader'
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'

import { usePartnerStatus } from '@/hooks/usePartnerStatus'

export function PartnerStatusCard() {
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)
  const {
    hasPartner,
    isLoading,
    errorMessage,
    habits,
    startedOn,
    pendingInvites,
    sentInvites,
    deletingInviteId,
    pendingInvitesError,
    isPendingInvitesLoading,
    acceptingInviteId,
    acceptInviteError,
    acceptInviteNotice,
    inviteEmail,
    canSendInvite,
    inviteError,
    inviteNotice,
    isInviteSubmitting,
    isRemovingPartner,
    removePartnerError,
    removePartnerNotice,
    handleInviteAccept,
    handleInviteEmailChange,
    handleInviteSubmit,
    handleInviteDelete,
    handleRemovePartner,
  } = usePartnerStatus()

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <PartnerStatusHeader hasPartner={hasPartner} />
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
            ) : (
              <PartnerPendingInvites
                pendingInvites={pendingInvites}
                acceptingInviteId={acceptingInviteId}
                onInviteAccept={(inviteId) => {
                  void handleInviteAccept(inviteId)
                }}
              />
            )}

            <PartnerSentInvites
              sentInvites={sentInvites}
              deletingInviteId={deletingInviteId}
              onInviteDelete={(inviteId) => {
                handleInviteDelete(inviteId)
              }}
            />

            <p className="text-sm text-slate-500">
              No partner yet. Invite someone to see shared progress here.
            </p>

            {canSendInvite ? (
              <PartnerInviteForm
                inviteEmail={inviteEmail}
                isInviteSubmitting={isInviteSubmitting}
                onInviteEmailChange={handleInviteEmailChange}
                onInviteSubmit={handleInviteSubmit}
              />
            ) : (
              <p className="text-xs text-slate-500">
                You already have a pending invite. Wait for a response before
                sending a new one.
              </p>
            )}

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
            <PartnerActiveHabits habits={habits} startedOn={startedOn} />
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-rose-50 disabled:text-rose-300"
              disabled={isRemovingPartner}
              onClick={() => {
                setIsRemoveConfirmOpen(true)
              }}
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
      <ConfirmModal
        title="Remove partner"
        description="Remove your active partner? Shared visibility ends immediately."
        confirmLabel="Remove"
        isOpen={isRemoveConfirmOpen}
        isConfirming={isRemovingPartner}
        onCancel={() => {
          if (!isRemovingPartner) {
            setIsRemoveConfirmOpen(false)
          }
        }}
        onConfirm={() => {
          handleRemovePartner()
          setIsRemoveConfirmOpen(false)
        }}
      />
    </div>
  )
}
