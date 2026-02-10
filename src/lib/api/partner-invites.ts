import { badRequest, created, ok, parseJson } from '@/lib/api'
import {
  acceptPartnerInvite,
  deleteAcceptedInviteForPair,
  deletePendingInviteForInviter,
  fetchAcceptedInviteForPair,
  fetchPartnerInvite,
  fetchPendingInviteForPair,
  fetchPendingInvitesForEmail,
  fetchPendingInvitesForInviter,
  fetchSentInvitesForInviter,
  fetchUserByEmail,
  insertPartnerInvite,
  rejectPendingInviteForInvitee,
} from '@/db/partner-invites'
import { fetchPartnershipForUser } from '@/db/partnerships'

type InviteCreatePayload = {
  email?: unknown
}

type InviteAcceptPayload = {
  inviteId?: unknown
  action?: unknown
}

type InviteUser = {
  id: string
  email?: string | null
}

const getInviteEmail = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { email } = payload as InviteCreatePayload

  if (typeof email !== 'string') {
    return null
  }

  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return null
  }

  const atIndex = trimmed.indexOf('@')
  const dotIndex = trimmed.lastIndexOf('.')

  if (
    atIndex <= 0 ||
    dotIndex <= atIndex + 1 ||
    dotIndex >= trimmed.length - 1
  ) {
    return null
  }

  return trimmed.toLowerCase()
}

const getInviteId = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { inviteId } = payload as InviteAcceptPayload

  if (typeof inviteId !== 'string') {
    return null
  }

  const trimmed = inviteId.trim()

  if (trimmed.length === 0) {
    return null
  }

  return trimmed
}

const getInviteAction = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return 'accept' as const
  }

  const { action } = payload as InviteAcceptPayload

  if (action === 'delete') {
    return 'delete' as const
  }

  if (action === 'reject') {
    return 'reject' as const
  }

  return 'accept' as const
}

export const handlePartnerInvitesPost = async (
  request: Request,
  user: InviteUser,
) => {
  const payload = await parseJson(request)

  const inviteEmail = getInviteEmail(payload)

  if (!inviteEmail) {
    return badRequest('Valid invite email is required')
  }

  if (typeof user.email === 'string') {
    if (user.email.toLowerCase() === inviteEmail) {
      return badRequest('Cannot invite yourself')
    }
  }

  const existingPartnership = await fetchPartnershipForUser(user.id)

  if (existingPartnership) {
    return badRequest('You already have a partner')
  }

  const pendingSentInvites = await fetchPendingInvitesForInviter(user.id)

  if (pendingSentInvites.length > 0) {
    return badRequest('You already have a pending invite')
  }

  if (typeof user.email === 'string') {
    const inviterEmail = user.email.trim().toLowerCase()

    const inviteTargetUser = await fetchUserByEmail(inviteEmail)

    if (inviteTargetUser && inviteTargetUser.id !== user.id) {
      const oppositePendingInvite = await fetchPendingInviteForPair(
        inviteTargetUser.id,
        inviterEmail,
      )

      if (oppositePendingInvite) {
        return badRequest(
          'A pending invite already exists from this user. Accept or reject it first',
        )
      }
    }
  }

  const acceptedInvite = await fetchAcceptedInviteForPair(user.id, inviteEmail)

  if (acceptedInvite) {
    await deleteAcceptedInviteForPair(user.id, inviteEmail)
  }

  const inserted = await insertPartnerInvite(user.id, inviteEmail)

  if (!inserted) {
    return badRequest('Invite already pending')
  }

  return created({ invite: inserted })
}

export const handlePartnerInvitesGet = async (user: InviteUser) => {
  if (typeof user.email !== 'string') {
    const sentInvites = await fetchSentInvitesForInviter(user.id)

    return ok({ invites: [], receivedInvites: [], sentInvites })
  }

  const inviteeEmail = user.email.trim().toLowerCase()

  if (!inviteeEmail) {
    const sentInvites = await fetchSentInvitesForInviter(user.id)

    return ok({ invites: [], receivedInvites: [], sentInvites })
  }

  const [receivedInvites, sentInvites] = await Promise.all([
    fetchPendingInvitesForEmail(inviteeEmail),
    fetchSentInvitesForInviter(user.id),
  ])

  return ok({ invites: receivedInvites, receivedInvites, sentInvites })
}

export const handlePartnerInvitesPatch = async (
  request: Request,
  user: InviteUser,
) => {
  const payload = await parseJson(request)

  const inviteId = getInviteId(payload)
  const action = getInviteAction(payload)

  if (!inviteId) {
    return badRequest('Invite id is required')
  }

  if (action === 'delete') {
    const deleted = await deletePendingInviteForInviter(inviteId, user.id)

    if (!deleted) {
      return badRequest('Invite not found')
    }

    return ok({ invite: deleted })
  }

  const invite = await fetchPartnerInvite(inviteId)

  if (!invite) {
    return badRequest('Invite not found')
  }

  if (invite.status !== 'pending') {
    return badRequest('Invite is no longer pending')
  }

  if (typeof user.email !== 'string') {
    return badRequest('Invite is not for current user')
  }

  if (user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
    return badRequest('Invite is not for current user')
  }

  if (invite.inviterUserId === user.id) {
    return badRequest('Cannot accept your own invite')
  }

  if (action === 'reject') {
    const rejected = await rejectPendingInviteForInvitee(invite.id)

    if (!rejected) {
      return badRequest('Invite is no longer pending')
    }

    return ok({ invite: rejected })
  }

  const acceptedInvite = await fetchAcceptedInviteForPair(
    invite.inviterUserId,
    invite.inviteeEmail,
  )

  if (acceptedInvite) {
    return badRequest('Invite was already accepted')
  }

  const [userAId, userBId] = [invite.inviterUserId, user.id].sort()

  const partnership = await acceptPartnerInvite(invite.id, userAId, userBId)

  if (!partnership) {
    return badRequest('Unable to activate partnership')
  }

  return ok({ partnership })
}

export const handlePartnerInvitesDelete = async (
  request: Request,
  user: InviteUser,
) => {
  const requestUrl = new URL(request.url)
  const inviteId = getInviteId({
    inviteId: requestUrl.searchParams.get('inviteId'),
  })

  if (!inviteId) {
    return badRequest('Invite id is required')
  }

  const deleted = await deletePendingInviteForInviter(inviteId, user.id)

  if (!deleted) {
    return badRequest('Invite not found')
  }

  return ok({ invite: deleted })
}
