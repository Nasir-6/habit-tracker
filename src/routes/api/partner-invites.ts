import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { db } from '@/db/index.ts'
import { partnerInvites } from '@/db/schema'
import { auth } from '@/lib/auth'

type InviteCreatePayload = {
  email?: unknown
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
    },
  },
})
