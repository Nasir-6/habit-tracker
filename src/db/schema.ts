import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const habits = pgTable('habits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const habitCompletions = pgTable(
  'habit_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    completedOn: date('completed_on', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueHabitDay: uniqueIndex('habit_completions_habit_day_unique').on(
      table.habitId,
      table.completedOn,
    ),
  }),
)

export const partnerInvites = pgTable(
  'partner_invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inviterUserId: text('inviter_user_id').notNull(),
    inviteeEmail: text('invitee_email').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniquePendingInvite: uniqueIndex(
      'partner_invites_inviter_invitee_status_unique',
    ).on(table.inviterUserId, table.inviteeEmail, table.status),
  }),
)

export const partnerships = pgTable(
  'partnerships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userAId: text('user_a_id').notNull(),
    userBId: text('user_b_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniquePair: uniqueIndex('partnerships_user_pair_unique').on(
      table.userAId,
      table.userBId,
    ),
  }),
)

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
})
