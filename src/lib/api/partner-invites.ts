import { badRequest, created, ok, parseJson } from '@/lib/api'
import {
  acceptPartnerInvite,
  fetchPartnerInvite,
  fetchPendingInvitesForEmail,
  insertPartnerInvite,
} from '@/db/partner-invites'

type InviteCreatePayload = {
  email?: unknown
}

type InviteAcceptPayload = {
  inviteId?: unknown
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

  const inserted = await insertPartnerInvite(user.id, inviteEmail)

  if (!inserted) {
    return badRequest('Invite already pending')
  }

  return created({ invite: inserted })
}

export const handlePartnerInvitesGet = async (user: InviteUser) => {
  if (typeof user.email !== 'string') {
    return ok({ invites: [] })
  }

  const inviteeEmail = user.email.trim().toLowerCase()

  if (!inviteeEmail) {
    return ok({ invites: [] })
  }

  const invites = await fetchPendingInvitesForEmail(inviteeEmail)

  return ok({ invites })
}

export const handlePartnerInvitesPatch = async (
  request: Request,
  user: InviteUser,
) => {
  const payload = await parseJson(request)

  const inviteId = getInviteId(payload)

  if (!inviteId) {
    return badRequest('Invite id is required')
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

  const [userAId, userBId] = [invite.inviterUserId, user.id].sort()

  const partnership = await acceptPartnerInvite(invite.id, userAId, userBId)

  if (!partnership) {
    return badRequest('Unable to activate partnership')
  }

  return ok({ partnership })
}
