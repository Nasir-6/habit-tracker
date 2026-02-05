import { and, eq } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { partnerInvites, partnerships } from '@/db/schema'

export const insertPartnerInvite = async (
  inviterUserId: string,
  inviteeEmail: string,
) => {
  return db
    .insert(partnerInvites)
    .values({ inviterUserId, inviteeEmail, status: 'pending' })
    .onConflictDoNothing()
    .returning({
      id: partnerInvites.id,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
    })
    .then((rows) => rows.at(0))
}

export const fetchPartnerInvite = async (inviteId: string) => {
  return db
    .select({
      id: partnerInvites.id,
      inviterUserId: partnerInvites.inviterUserId,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
    })
    .from(partnerInvites)
    .where(eq(partnerInvites.id, inviteId))
    .then((rows) => rows.at(0))
}

export const acceptPartnerInvite = async (
  inviteId: string,
  userAId: string,
  userBId: string,
) => {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(partnerships)
      .values({ userAId, userBId })
      .onConflictDoNothing()
      .returning({
        id: partnerships.id,
        userAId: partnerships.userAId,
        userBId: partnerships.userBId,
        startedAt: partnerships.startedAt,
      })
      .then((rows) => rows.at(0))

    const existing =
      inserted ??
      (await tx
        .select({
          id: partnerships.id,
          userAId: partnerships.userAId,
          userBId: partnerships.userBId,
          startedAt: partnerships.startedAt,
        })
        .from(partnerships)
        .where(
          and(
            eq(partnerships.userAId, userAId),
            eq(partnerships.userBId, userBId),
          ),
        )
        .then((rows) => rows.at(0)))

    if (!existing) {
      return null
    }

    await tx
      .update(partnerInvites)
      .set({ status: 'accepted' })
      .where(
        and(
          eq(partnerInvites.id, inviteId),
          eq(partnerInvites.status, 'pending'),
        ),
      )

    return existing
  })
}
