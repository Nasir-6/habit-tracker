import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq, or } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { partnerships } from '@/db/schema'
import { auth } from '@/lib/auth'

const jsonHeaders = {
  'content-type': 'application/json',
}

const unauthorized = () => {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: jsonHeaders,
  })
}

const ok = (payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: jsonHeaders,
  })
}

const notFound = () => {
  return new Response(JSON.stringify({ error: 'No partnership found' }), {
    status: 404,
    headers: jsonHeaders,
  })
}

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

export const Route = createFileRoute('/api/partnerships')({
  server: {
    handlers: {
      DELETE: async () => {
        const user = await getSessionUser()

        if (!user) {
          return unauthorized()
        }

        const existing = await db
          .select({ id: partnerships.id })
          .from(partnerships)
          .where(
            or(
              eq(partnerships.userAId, user.id),
              eq(partnerships.userBId, user.id),
            ),
          )
          .then((rows) => rows.at(0))

        if (!existing) {
          return notFound()
        }

        await db.delete(partnerships).where(eq(partnerships.id, existing.id))

        return ok({ revoked: true })
      },
    },
  },
})
