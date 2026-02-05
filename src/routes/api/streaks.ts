import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import { handleStreaksGet } from '@/lib/api/streaks'

export const Route = createFileRoute('/api/streaks')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(({ request, user }) => handleStreaksGet(request, user.id)),
      ),
    },
  },
})
