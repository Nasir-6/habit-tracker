import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import {
  handlePartnerInvitesPatch,
  handlePartnerInvitesPost,
} from '@/lib/api/partner-invites'

export const Route = createFileRoute('/api/partner-invites')({
  server: {
    handlers: {
      POST: handleApi(
        withAuth(({ request, user }) =>
          handlePartnerInvitesPost(request, user),
        ),
      ),
      PATCH: handleApi(
        withAuth(({ request, user }) =>
          handlePartnerInvitesPatch(request, user),
        ),
      ),
    },
  },
})
