import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import {
  handlePushSubscriptionsDelete,
  handlePushSubscriptionsPost,
} from '@/lib/api/push-subscriptions'

export const Route = createFileRoute('/api/push-subscriptions')({
  server: {
    handlers: {
      POST: handleApi(
        withAuth(({ request, user }) =>
          handlePushSubscriptionsPost(request, user.id),
        ),
      ),
      DELETE: handleApi(
        withAuth(({ request, user }) =>
          handlePushSubscriptionsDelete(request, user.id),
        ),
      ),
    },
  },
})
