import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { partnerInvites, partnerships } from '@/db/schema'
import { auth } from '@/lib/auth'

type InviteCreatePayload = {
  email?: unknown
}

type InviteAcceptPayload = {
  inviteId?: unknown
}

const jsonHeaders = {
  'content-type': 'application/json',
}

const badRequest = (message: string) => {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: jsonHeaders,
  })
}

const unauthorized = () => {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: jsonHeaders,
  })
}

const created = (payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status: 201,
    headers: jsonHeaders,
  })
}

const ok = (payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: jsonHeaders,
  })
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

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

export const Route = createFileRoute('/api/partner-invites')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        let payload: unknown

        try {
          payload = await request.json()
        } catch {
          return badRequest('Invalid JSON payload')
        }

        const inviteEmail = getInviteEmail(payload)

        if (!inviteEmail) {
          return badRequest('Valid invite email is required')
        }

        if (typeof user.email === 'string') {
          if (user.email.toLowerCase() === inviteEmail) {
            return badRequest('Cannot invite yourself')
          }
        }

        const inserted = await db
          .insert(partnerInvites)
          .values({
            inviterUserId: user.id,
            inviteeEmail: inviteEmail,
            status: 'pending',
          })
          .onConflictDoNothing()
          .returning({
            id: partnerInvites.id,
            inviteeEmail: partnerInvites.inviteeEmail,
            status: partnerInvites.status,
          })
          .then((rows) => rows.at(0))

        if (!inserted) {
          return badRequest('Invite already pending')
        }

        return created({ invite: inserted })
      },
      PATCH: async ({ request }) => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        let payload: unknown

        try {
          payload = await request.json()
        } catch {
          return badRequest('Invalid JSON payload')
        }

        const inviteId = getInviteId(payload)

        if (!inviteId) {
          return badRequest('Invite id is required')
        }

        const invite = await db
          .select({
            id: partnerInvites.id,
            inviterUserId: partnerInvites.inviterUserId,
            inviteeEmail: partnerInvites.inviteeEmail,
            status: partnerInvites.status,
          })
          .from(partnerInvites)
          .where(eq(partnerInvites.id, inviteId))
          .then((rows) => rows.at(0))

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

        const partnership = await db.transaction(async (tx) => {
          const inserted = await tx
            .insert(partnerships)
            .values({ userAId, userBId })
            .onConflictDoNothing()
            .returning({
              id: partnerships.id,
              userAId: partnerships.userAId,
              userBId: partnerships.userBId,
              startedAt: partnerships.startedAt,
            })
            .then((rows) => rows.at(0))

          const existing =
            inserted ??
            (await tx
              .select({
                id: partnerships.id,
                userAId: partnerships.userAId,
                userBId: partnerships.userBId,
                startedAt: partnerships.startedAt,
              })
              .from(partnerships)
              .where(
                and(
                  eq(partnerships.userAId, userAId),
                  eq(partnerships.userBId, userBId),
                ),
              )
              .then((rows) => rows.at(0)))

          if (!existing) {
            return null
          }

          await tx
            .update(partnerInvites)
            .set({ status: 'accepted' })
            .where(
              and(
                eq(partnerInvites.id, invite.id),
                eq(partnerInvites.status, 'pending'),
              ),
            )

          return existing
        })

        if (!partnership) {
          return badRequest('Unable to activate partnership')
        }

        return ok({ partnership })
      },
    },
  },
})
