import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { habits } from '@/db/schema'

export const fetchActiveHabits = async (userId: string) => {
  return db
    .select({ id: habits.id, name: habits.name, sortOrder: habits.sortOrder })
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(habits.sortOrder)
}

export const fetchLastHabitSortOrder = async (userId: string) => {
  return db
    .select({ sortOrder: habits.sortOrder })
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(desc(habits.sortOrder))
    .limit(1)
    .then((rows) => rows.at(0))
}

export const insertHabit = async (
  userId: string,
  name: string,
  sortOrder: number,
) => {
  return db
    .insert(habits)
    .values({ name, userId, sortOrder })
    .returning({
      id: habits.id,
      name: habits.name,
      sortOrder: habits.sortOrder,
    })
    .then((rows) => rows.at(0))
}

export const fetchHabitById = async (userId: string, habitId: string) => {
  return db
    .select({
      id: habits.id,
      name: habits.name,
      archivedAt: habits.archivedAt,
      createdAt: habits.createdAt,
    })
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.id, habitId)))
    .then((rows) => rows.at(0))
}

export const fetchHabitsByIds = async (userId: string, habitIds: string[]) => {
  return db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.userId, userId), inArray(habits.id, habitIds)))
}

export const archiveHabit = async (userId: string, habitId: string) => {
  return db
    .update(habits)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(habits.userId, userId),
        eq(habits.id, habitId),
        isNull(habits.archivedAt),
      ),
    )
}

export const updateHabitSortOrder = async (
  userId: string,
  habitId: string,
  sortOrder: number,
) => {
  return db
    .update(habits)
    .set({ sortOrder })
    .where(and(eq(habits.userId, userId), eq(habits.id, habitId)))
}

export const deleteHabitById = async (userId: string, habitId: string) => {
  return db
    .delete(habits)
    .where(and(eq(habits.userId, userId), eq(habits.id, habitId)))
    .returning({ id: habits.id })
    .then((rows) => rows.at(0))
}
