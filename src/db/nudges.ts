import { db } from '@/db/index.ts'
import { partnerNudges } from '@/db/schema'

export const insertPartnerNudge = async (
  senderUserId: string,
  receiverUserId: string,
) => {
  return db
    .insert(partnerNudges)
    .values({ senderUserId, receiverUserId })
    .returning({
      id: partnerNudges.id,
      senderUserId: partnerNudges.senderUserId,
      receiverUserId: partnerNudges.receiverUserId,
      createdAt: partnerNudges.createdAt,
    })
    .then((rows) => rows.at(0) ?? null)
}
