import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import { handleReminderDispatchPost } from '@/lib/api/reminders'

export const Route = createFileRoute('/api/reminders')({
  server: {
    handlers: {
      POST: handleApi(
        withAuth(({ request, user }) =>
          handleReminderDispatchPost(request, user.id),
        ),
      ),
    },
  },
})
