import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import { handleHistoryGet } from '@/lib/api/history'

export const Route = createFileRoute('/api/history')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(({ request, user }) => handleHistoryGet(request, user.id)),
      ),
    },
  },
})
