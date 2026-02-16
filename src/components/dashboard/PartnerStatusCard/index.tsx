import { useState } from 'react'

import { PartnerActiveHabits } from './PartnerActiveHabits'
import { PartnerInviteForm } from './PartnerInviteForm'
import { PartnerPendingInvites } from './PartnerPendingInvites'
import { PartnerSentInvites } from './PartnerSentInvites'
import { PartnerStatusHeader } from './PartnerStatusHeader'
import {
  formatRelativeTimestamp,
  getPartnerDisplayName,
} from './partnerStatusUtils'
import { ConfirmModal } from '@/components/dashboard/ConfirmModal'

import { usePartnerStatus } from '@/hooks/usePartnerStatus'

const formatCooldownTime = (secondsRemaining: number) => {
  if (secondsRemaining < 60) {
    return `${secondsRemaining}s`
  }

  const minutesRemaining = Math.ceil(secondsRemaining / 60)
  return `${minutesRemaining}m`
}

export function PartnerStatusCard() {
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)
  const {
    hasPartner,
    isLoading,
    errorMessage,
    habits,
    startedOn,
    partnerEmail,
    latestIncomingNudgeAt,
    pendingInvites,
    sentInvites,
    deletingInviteId,
    resendingInviteId,
    pendingInvitesError,
    isPendingInvitesLoading,
    acceptingInviteId,
    rejectingInviteId,
    acceptInviteError,
    acceptInviteNotice,
    nudgeError,
    nudgeNotice,
    nudgeCooldownSecondsRemaining,
    isNudgeOnCooldown,
    inviteEmail,
    canSendInvite,
    inviteError,
    inviteNotice,
    sentInviteOutcomeNotice,
    isInviteSubmitting,
    isSendingNudge,
    isRemovingPartner,
    removePartnerError,
    removePartnerNotice,
    partnerEndedNotice,
    handleInviteAccept,
    handleInviteEmailChange,
    handleInviteSubmit,
    handleInviteDelete,
    handleInviteResend,
    handleSendNudge,
    handleRemovePartner,
    handleInviteReject,
  } = usePartnerStatus()
  const partnerName = getPartnerDisplayName(partnerEmail)
  const nudgeSenderName = partnerName ?? 'Your partner'
  const latestIncomingNudgeLabel = latestIncomingNudgeAt
    ? `${nudgeSenderName} nudged you ${formatRelativeTimestamp(latestIncomingNudgeAt)}`
    : null
  let nudgeButtonLabel = 'Send nudge'

  if (isSendingNudge) {
    nudgeButtonLabel = 'Sending nudge...'
  } else if (isNudgeOnCooldown) {
    nudgeButtonLabel = `Nudge cooldown (${formatCooldownTime(nudgeCooldownSecondsRemaining)})`
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <PartnerStatusHeader hasPartner={hasPartner} partnerName={partnerName} />
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
                rejectingInviteId={rejectingInviteId}
                onInviteAccept={(inviteId) => {
                  void handleInviteAccept(inviteId)
                }}
                onInviteReject={(inviteId) => {
                  void handleInviteReject(inviteId)
                }}
              />
            )}

            <PartnerSentInvites
              sentInvites={sentInvites}
              deletingInviteId={deletingInviteId}
              resendingInviteId={resendingInviteId}
              onInviteDelete={(inviteId) => {
                handleInviteDelete(inviteId)
              }}
              onInviteResend={(inviteId) => {
                handleInviteResend(inviteId)
              }}
            />
            {partnerEndedNotice ? (
              <p className="text-sm text-sky-700">{partnerEndedNotice}</p>
            ) : null}

            {sentInviteOutcomeNotice ? (
              <p className="text-sm text-sky-700">{sentInviteOutcomeNotice}</p>
            ) : null}

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
            {latestIncomingNudgeLabel ? (
              <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                {latestIncomingNudgeLabel}
              </p>
            ) : null}
            {sentInviteOutcomeNotice ? (
              <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                {sentInviteOutcomeNotice}
              </p>
            ) : null}
            <PartnerActiveHabits habits={habits} startedOn={startedOn} />
            <button
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-50 disabled:text-indigo-300"
              disabled={isSendingNudge || isNudgeOnCooldown}
              onClick={() => {
                handleSendNudge()
              }}
              type="button"
            >
              {nudgeButtonLabel}
            </button>
            {nudgeError ? (
              <p className="text-sm text-rose-500">{nudgeError}</p>
            ) : nudgeNotice ? (
              <p className="text-sm text-emerald-600">{nudgeNotice}</p>
            ) : isNudgeOnCooldown ? (
              <p className="text-sm text-amber-700">
                Nudge cooldown active. Try again in{' '}
                {formatCooldownTime(nudgeCooldownSecondsRemaining)}.
              </p>
            ) : null}
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
