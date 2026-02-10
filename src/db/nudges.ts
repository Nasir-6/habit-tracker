import { and, desc, eq, gte } from 'drizzle-orm'

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

export const fetchLatestPartnerNudgeForSender = async (
  senderUserId: string,
) => {
  return db
    .select({ createdAt: partnerNudges.createdAt })
    .from(partnerNudges)
    .where(eq(partnerNudges.senderUserId, senderUserId))
    .orderBy(desc(partnerNudges.createdAt))
    .then((rows) => rows.at(0) ?? null)
}

export const fetchPartnerNudgesSentSince = async (
  senderUserId: string,
  startTime: Date,
) => {
  return db
    .select({ id: partnerNudges.id })
    .from(partnerNudges)
    .where(
      and(
        eq(partnerNudges.senderUserId, senderUserId),
        gte(partnerNudges.createdAt, startTime),
      ),
    )
}
