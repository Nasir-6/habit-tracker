import { createFileRoute } from '@tanstack/react-router'

import { handleApi, withAuth } from '@/lib/api'
import {
  handleHabitsGet,
  handleHabitsPatch,
  handleHabitsPost,
} from '@/lib/api/habits'

export const Route = createFileRoute('/api/habits')({
  server: {
    handlers: {
      GET: handleApi(withAuth(({ user }) => handleHabitsGet(user.id))),
      POST: handleApi(
        withAuth(({ request, user }) => handleHabitsPost(request, user.id)),
      ),
      PATCH: handleApi(
        withAuth(({ request, user }) => handleHabitsPatch(request, user.id)),
      ),
    },
  },
})
