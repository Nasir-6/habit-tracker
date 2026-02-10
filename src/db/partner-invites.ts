import { and, eq, ilike, inArray } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { partnerInvites, partnerships, users } from '@/db/schema'

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

export const fetchPendingInvitesForEmail = async (inviteeEmail: string) => {
  return db
    .select({
      id: partnerInvites.id,
      inviterUserId: partnerInvites.inviterUserId,
      inviterEmail: users.email,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
      createdAt: partnerInvites.createdAt,
    })
    .from(partnerInvites)
    .leftJoin(users, eq(users.id, partnerInvites.inviterUserId))
    .where(
      and(
        eq(partnerInvites.inviteeEmail, inviteeEmail),
        eq(partnerInvites.status, 'pending'),
      ),
    )
}

export const fetchPendingInvitesForInviter = async (inviterUserId: string) => {
  return db
    .select({
      id: partnerInvites.id,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
      createdAt: partnerInvites.createdAt,
    })
    .from(partnerInvites)
    .where(
      and(
        eq(partnerInvites.inviterUserId, inviterUserId),
        eq(partnerInvites.status, 'pending'),
      ),
    )
}

export const fetchUserByEmail = async (email: string) => {
  return db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(ilike(users.email, email))
    .then((rows) => rows.at(0))
}

export const fetchPendingInviteForPair = async (
  inviterUserId: string,
  inviteeEmail: string,
) => {
  return db
    .select({
      id: partnerInvites.id,
    })
    .from(partnerInvites)
    .where(
      and(
        eq(partnerInvites.inviterUserId, inviterUserId),
        eq(partnerInvites.inviteeEmail, inviteeEmail),
        eq(partnerInvites.status, 'pending'),
      ),
    )
    .then((rows) => rows.at(0))
}

export const fetchSentInvitesForInviter = async (inviterUserId: string) => {
  return db
    .select({
      id: partnerInvites.id,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
      createdAt: partnerInvites.createdAt,
    })
    .from(partnerInvites)
    .where(
      and(
        eq(partnerInvites.inviterUserId, inviterUserId),
        inArray(partnerInvites.status, ['pending', 'rejected']),
      ),
    )
}

export const fetchAcceptedInviteForPair = async (
  inviterUserId: string,
  inviteeEmail: string,
) => {
  return db
    .select({
      id: partnerInvites.id,
      inviterUserId: partnerInvites.inviterUserId,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
    })
    .from(partnerInvites)
    .where(
      and(
        eq(partnerInvites.inviterUserId, inviterUserId),
        eq(partnerInvites.inviteeEmail, inviteeEmail),
        eq(partnerInvites.status, 'accepted'),
      ),
    )
    .then((rows) => rows.at(0))
}

export const deleteAcceptedInviteForPair = async (
  inviterUserId: string,
  inviteeEmail: string,
) => {
  return db
    .delete(partnerInvites)
    .where(
      and(
        eq(partnerInvites.inviterUserId, inviterUserId),
        eq(partnerInvites.inviteeEmail, inviteeEmail),
        eq(partnerInvites.status, 'accepted'),
      ),
    )
    .returning({ id: partnerInvites.id })
}

export const deletePendingInviteForInviter = async (
  inviteId: string,
  inviterUserId: string,
) => {
  return db
    .delete(partnerInvites)
    .where(
      and(
        eq(partnerInvites.id, inviteId),
        eq(partnerInvites.inviterUserId, inviterUserId),
        inArray(partnerInvites.status, ['pending', 'rejected']),
      ),
    )
    .returning({ id: partnerInvites.id })
    .then((rows) => rows.at(0))
}

export const rejectPendingInviteForInvitee = async (inviteId: string) => {
  return db
    .update(partnerInvites)
    .set({ status: 'rejected' })
    .where(
      and(
        eq(partnerInvites.id, inviteId),
        eq(partnerInvites.status, 'pending'),
      ),
    )
    .returning({
      id: partnerInvites.id,
      inviterUserId: partnerInvites.inviterUserId,
      inviteeEmail: partnerInvites.inviteeEmail,
      status: partnerInvites.status,
    })
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
