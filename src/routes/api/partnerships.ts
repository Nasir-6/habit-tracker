import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import {
  handlePartnershipsDelete,
  handlePartnershipsGet,
} from '@/lib/api/partnerships'

export const Route = createFileRoute('/api/partnerships')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(({ request, user }) =>
          handlePartnershipsGet(request, user.id),
        ),
      ),
      DELETE: handleApi(
        withAuth(({ user }) => handlePartnershipsDelete(user.id)),
      ),
    },
  },
})
