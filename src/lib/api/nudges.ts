import { badRequest, created } from '@/lib/api'
import { insertPartnerNudge } from '@/db/nudges'
import { fetchPartnershipForUser } from '@/db/partnerships'

export const handleNudgesPost = async (userId: string) => {
  const partnership = await fetchPartnershipForUser(userId)

  if (!partnership) {
    return badRequest('Active partnership required to send a nudge')
  }

  const receiverUserId =
    partnership.userAId === userId ? partnership.userBId : partnership.userAId

  const nudge = await insertPartnerNudge(userId, receiverUserId)

  if (!nudge) {
    return badRequest('Unable to send nudge')
  }

  return created({ nudge })
}
