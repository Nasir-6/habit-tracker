import { badRequest, notFound, ok } from '@/lib/api'
import { formatUtcDate, parseLocalDateParts } from '@/lib/date'
import {
  deletePartnershipsForUser,
  fetchPartnerCompletionIds,
  fetchPartnerHabits,
  fetchPartnershipForUser,
} from '@/db/partnerships'

const getPartnerParams = (request: Request) => {
  const url = new URL(request.url)
  const localDate = url.searchParams.get('localDate')

  if (!localDate) {
    return null
  }

  if (!parseLocalDateParts(localDate)) {
    return null
  }

  return { localDate }
}

export const handlePartnershipsGet = async (
  request: Request,
  userId: string,
) => {
  const params = getPartnerParams(request)

  if (!params) {
    return badRequest('Local date is required')
  }

  const partnership = await fetchPartnershipForUser(userId)

  if (!partnership) {
    return notFound('No partnership found')
  }

  const partnerUserId =
    partnership.userAId === userId ? partnership.userBId : partnership.userAId
  const startedOn = formatUtcDate(partnership.startedAt)
  const { localDate } = params

  const partnerHabits = await fetchPartnerHabits(partnerUserId)

  let completedHabitIds = new Set<string>()

  if (localDate >= startedOn) {
    const completions = await fetchPartnerCompletionIds(
      partnerUserId,
      localDate,
    )
    completedHabitIds = new Set(completions.map((row) => row.habitId))
  }

  const habitsWithStatus = partnerHabits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    completedToday: completedHabitIds.has(habit.id),
  }))

  return ok({
    partner: { userId: partnerUserId, startedOn },
    habits: habitsWithStatus,
  })
}

export const handlePartnershipsDelete = async (userId: string) => {
  const deleted = await deletePartnershipsForUser(userId)

  if (deleted.length === 0) {
    return notFound('No partnership found')
  }

  return ok({ revoked: true })
}
