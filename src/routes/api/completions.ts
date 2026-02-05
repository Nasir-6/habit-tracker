import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import {
  handleCompletionsDelete,
  handleCompletionsGet,
  handleCompletionsPost,
} from '@/lib/api/completions'

export const Route = createFileRoute('/api/completions')({
  server: {
    handlers: {
      GET: handleApi(
        withAuth(({ request, user }) => handleCompletionsGet(request, user.id)),
      ),
      POST: handleApi(
        withAuth(({ request, user }) =>
          handleCompletionsPost(request, user.id),
        ),
      ),
      DELETE: handleApi(
        withAuth(({ request, user }) =>
          handleCompletionsDelete(request, user.id),
        ),
      ),
    },
  },
})
