import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import { handleCalendarGet } from '@/lib/api/calendar'

export const Route = createFileRoute('/api/calendar')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(({ request, user }) => handleCalendarGet(request, user.id)),
      ),
    },
  },
})
