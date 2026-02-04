import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '@/lib/auth'

const jsonHeaders = {
  'content-type': 'application/json',
}

export class ApiResponseError extends Error {
  response: Response

  constructor(response: Response) {
    super('API response error')
    this.response = response
  }
}

export const json = (payload: unknown, status = 200) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  })
}

export const ok = (payload: Record<string, unknown>) => json(payload, 200)

export const created = (payload: Record<string, unknown>) => json(payload, 201)

export const badRequest = (message: string) => json({ error: message }, 400)

export const unauthorized = () => json({ error: 'Unauthorized' }, 401)

export const notFound = (message = 'Not found') => json({ error: message }, 404)

type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>['user']

const getSessionUser = async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session?.user
}

export const withAuth = <T extends { request: Request }>(
  handler: (ctx: T & { user: SessionUser }) => Promise<Response> | Response,
) => {
  return async (ctx: T) => {
    const user = await getSessionUser()

    if (!user) {
      throw new ApiResponseError(unauthorized())
    }

    return handler({ ...ctx, user })
  }
}

export const handleApi = <T>(
  handler: (ctx: T) => Promise<Response> | Response,
) => {
  return async (ctx: T) => {
    try {
      return await handler(ctx)
    } catch (error) {
      if (error instanceof ApiResponseError) {
        return error.response
      }

      throw error
    }
  }
}

export const parseJson = async (request: Request) => {
  try {
    return (await request.json()) as unknown
  } catch {
    throw new ApiResponseError(badRequest('Invalid JSON payload'))
  }
}
