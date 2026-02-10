import { badRequest, notFound, ok } from '@/lib/api'
import { formatUtcDate, parseLocalDateParts } from '@/lib/date'
import { fetchLatestPartnerNudgeForReceiverFromSender } from '@/db/nudges'
import {
  deletePartnershipsForUser,
  fetchPartnerCompletionIds,
  fetchPartnerHabits,
  fetchPartnershipForUser,
  fetchUserEmailById,
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
  const partnerEmail = await fetchUserEmailById(partnerUserId)
  const startedOn = formatUtcDate(partnership.startedAt)
  const { localDate } = params

  const [partnerHabits, latestIncomingNudge] = await Promise.all([
    fetchPartnerHabits(partnerUserId),
    fetchLatestPartnerNudgeForReceiverFromSender(userId, partnerUserId),
  ])

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
    partner: { userId: partnerUserId, startedOn, email: partnerEmail },
    habits: habitsWithStatus,
    latestIncomingNudge: latestIncomingNudge
      ? { createdAt: latestIncomingNudge.createdAt.toISOString() }
      : null,
  })
}

export const handlePartnershipsDelete = async (userId: string) => {
  const deleted = await deletePartnershipsForUser(userId)

  if (deleted.length === 0) {
    return notFound('No partnership found')
  }

  return ok({ revoked: true })
}
