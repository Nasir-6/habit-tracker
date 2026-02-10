import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db/index.ts'
import { pushSubscriptions } from '@/db/schema'

type UpsertPushSubscriptionInput = {
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  expirationTime: Date | null
}

export const upsertPushSubscription = async (
  input: UpsertPushSubscriptionInput,
) => {
  return db
    .insert(pushSubscriptions)
    .values({
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      expirationTime: input.expirationTime,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
        expirationTime: input.expirationTime,
        deletedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      createdAt: pushSubscriptions.createdAt,
      updatedAt: pushSubscriptions.updatedAt,
    })
    .then((rows) => rows.at(0) ?? null)
}

export const deactivatePushSubscription = async (
  userId: string,
  endpoint: string,
) => {
  return db
    .update(pushSubscriptions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
        isNull(pushSubscriptions.deletedAt),
      ),
    )
    .returning({ id: pushSubscriptions.id })
    .then((rows) => rows.at(0) ?? null)
}

export const fetchActivePushSubscriptionsForUser = async (userId: string) => {
  return db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      expirationTime: pushSubscriptions.expirationTime,
    })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        isNull(pushSubscriptions.deletedAt),
      ),
    )
}
