import { db } from '@/db/index.ts'
import { habitReminderDispatches } from '@/db/schema'

type ReminderCandidate = {
  id: string
  name: string
}

export const claimHabitReminderDispatches = async (
  userId: string,
  localDate: string,
  reminders: readonly ReminderCandidate[],
) => {
  if (!reminders.length) {
    return []
  }

  const claimedRows = await db
    .insert(habitReminderDispatches)
    .values(
      reminders.map((reminder) => ({
        userId,
        habitId: reminder.id,
        localDate,
      })),
    )
    .onConflictDoNothing({
      target: [
        habitReminderDispatches.habitId,
        habitReminderDispatches.localDate,
      ],
    })
    .returning({ habitId: habitReminderDispatches.habitId })

  const claimedHabitIds = new Set(claimedRows.map((row) => row.habitId))

  return reminders.filter((reminder) => claimedHabitIds.has(reminder.id))
}
