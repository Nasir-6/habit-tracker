import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import { handleNudgesPost } from '@/lib/api/nudges'

export const Route = createFileRoute('/api/nudges')({
  server: {
    handlers: {
      POST: handleApi(withAuth(({ user }) => handleNudgesPost(user.id))),
    },
  },
})
