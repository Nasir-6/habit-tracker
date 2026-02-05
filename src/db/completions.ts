import { and, desc, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habitCompletions } from '@/db/schema'

type CompletionInsert = {
  habitId: string
  localDate: string
}

export const fetchCompletionHabitIdsByDate = async (
  userId: string,
  localDate: string,
) => {
  const rows = await db
    .select({ habitId: habitCompletions.habitId })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.completedOn, localDate),
      ),
    )

  return rows.map((row) => row.habitId)
}

export const insertCompletionsBulk = async (
  userId: string,
  completions: CompletionInsert[],
) => {
  return db
    .insert(habitCompletions)
    .values(
      completions.map((completion) => ({
        habitId: completion.habitId,
        userId,
        completedOn: completion.localDate,
      })),
    )
    .onConflictDoNothing({
      target: [habitCompletions.habitId, habitCompletions.completedOn],
    })
    .returning({
      id: habitCompletions.id,
      habitId: habitCompletions.habitId,
      completedOn: habitCompletions.completedOn,
    })
}

export const insertCompletion = async (
  userId: string,
  habitId: string,
  localDate: string,
) => {
  return db
    .insert(habitCompletions)
    .values({ habitId, userId, completedOn: localDate })
    .onConflictDoNothing({
      target: [habitCompletions.habitId, habitCompletions.completedOn],
    })
    .returning({
      id: habitCompletions.id,
      habitId: habitCompletions.habitId,
      completedOn: habitCompletions.completedOn,
    })
    .then((rows) => rows.at(0))
}

export const fetchCompletion = async (
  userId: string,
  habitId: string,
  localDate: string,
) => {
  return db
    .select({
      id: habitCompletions.id,
      habitId: habitCompletions.habitId,
      completedOn: habitCompletions.completedOn,
    })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.completedOn, localDate),
      ),
    )
    .then((rows) => rows.at(0))
}

export const deleteCompletion = async (
  userId: string,
  habitId: string,
  localDate: string,
) => {
  return db
    .delete(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.completedOn, localDate),
      ),
    )
    .returning({ id: habitCompletions.id })
    .then((rows) => rows.at(0))
}

export const fetchCompletionsForHabitUpTo = async (
  userId: string,
  habitId: string,
  localDate: string,
  order: 'asc' | 'desc' = 'asc',
) => {
  const query = db
    .select({ completedOn: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.habitId, habitId),
        lte(habitCompletions.completedOn, localDate),
      ),
    )

  if (order === 'desc') {
    return query.orderBy(desc(habitCompletions.completedOn))
  }

  return query.orderBy(habitCompletions.completedOn)
}

export const fetchCompletionsForHabitInRange = async (
  userId: string,
  habitId: string,
  startBound: string,
  endBound: string,
) => {
  return db
    .select({ completedOn: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.completedOn, startBound),
        lte(habitCompletions.completedOn, endBound),
      ),
    )
    .orderBy(habitCompletions.completedOn)
}
