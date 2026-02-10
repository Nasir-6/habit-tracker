import { and, eq, isNull, or } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits, partnerships, users } from '@/db/schema'

export const fetchPartnershipForUser = async (userId: string) => {
  return db
    .select({
      id: partnerships.id,
      userAId: partnerships.userAId,
      userBId: partnerships.userBId,
      startedAt: partnerships.startedAt,
    })
    .from(partnerships)
    .where(
      or(eq(partnerships.userAId, userId), eq(partnerships.userBId, userId)),
    )
    .then((rows) => rows.at(0))
}

export const deletePartnershipsForUser = async (userId: string) => {
  return db
    .delete(partnerships)
    .where(
      or(eq(partnerships.userAId, userId), eq(partnerships.userBId, userId)),
    )
    .returning({ id: partnerships.id })
}

export const fetchPartnerHabits = async (partnerUserId: string) => {
  return db
    .select({ id: habits.id, name: habits.name, sortOrder: habits.sortOrder })
    .from(habits)
    .where(and(eq(habits.userId, partnerUserId), isNull(habits.archivedAt)))
    .orderBy(habits.sortOrder)
}

export const fetchPartnerCompletionIds = async (
  partnerUserId: string,
  localDate: string,
) => {
  return db
    .select({ habitId: habitCompletions.habitId })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, partnerUserId),
        eq(habitCompletions.completedOn, localDate),
      ),
    )
}

export const fetchUserEmailById = async (userId: string) => {
  return db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .then((rows) => rows.at(0)?.email ?? null)
}
