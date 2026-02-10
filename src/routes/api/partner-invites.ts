import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import {
  handlePartnerInvitesDelete,
  handlePartnerInvitesGet,
  handlePartnerInvitesPatch,
  handlePartnerInvitesPost,
} from '@/lib/api/partner-invites'

export const Route = createFileRoute('/api/partner-invites')({
  server: {
    handlers: {
      GET: handleApi(withAuth(({ user }) => handlePartnerInvitesGet(user))),
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
      DELETE: handleApi(
        withAuth(({ request, user }) =>
          handlePartnerInvitesDelete(request, user),
        ),
      ),
    },
  },
})
