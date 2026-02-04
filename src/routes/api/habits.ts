import { createFileRoute } from '@tanstack/react-router'

type HabitCreatePayload = {
  name?: unknown
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

const created = (name: string) => {
  return new Response(JSON.stringify({ habit: { name } }), {
    status: 201,
    headers: jsonHeaders,
  })
}

const getHabitName = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const { name } = payload as HabitCreatePayload

  if (typeof name !== 'string') {
    return null
  }

  const trimmedName = name.trim()

  if (trimmedName.length === 0) {
    return null
  }

  return trimmedName
}

export const Route = createFileRoute('/api/habits')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown

        try {
          payload = await request.json()
        } catch {
          return badRequest('Invalid JSON payload')
        }

        const habitName = getHabitName(payload)

        if (!habitName) {
          return badRequest('Name is required')
        }

        return created(habitName)
      },
    },
  },
})
