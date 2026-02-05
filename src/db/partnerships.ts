import { and, eq, or } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions, habits, partnerships } from '@/db/schema'

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

export const deletePartnership = async (partnershipId: string) => {
  return db.delete(partnerships).where(eq(partnerships.id, partnershipId))
}

export const fetchPartnerHabits = async (partnerUserId: string) => {
  return db
    .select({ id: habits.id, name: habits.name, sortOrder: habits.sortOrder })
    .from(habits)
    .where(eq(habits.userId, partnerUserId))
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
