import { useState } from 'react'

import type { Habit } from '@/types/dashboard'

import { CreateHabitCard } from '@/components/dashboard/CreateHabitCard'
import { HabitCalendarCard } from '@/components/dashboard/HabitCalendarCard'
import { HabitList } from '@/components/dashboard/HabitList'
import { InAppNudgeBanner } from '@/components/dashboard/InAppNudgeBanner'
import { PageShell } from '@/components/dashboard/PageShell'
import { PartnerStatusCard } from '@/components/dashboard/PartnerStatusCard'

type DashboardProps = {
  habits: Habit[]
  archivedHabits: Habit[]
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
  habitActionError: string | null
  onHabitReorder: (fromId: string, toId: string) => void
  onToggleHabit: (habitId: string) => void
  onDeleteHabit: (
    habitId: string,
    operation: 'archive' | 'restore' | 'hardDelete',
  ) => Promise<void>
  onSetHabitReminder: (habitId: string, reminderTime: string) => Promise<void>
  onClearHabitReminder: (habitId: string) => Promise<void>
}

export function Dashboard({
  habits,
  archivedHabits,
  habitStreaks,
  habitActionError,
  onHabitReorder,
  onToggleHabit,
  onDeleteHabit,
  onSetHabitReminder,
  onClearHabitReminder,
}: DashboardProps) {
  const [isCreateHabitModalOpen, setIsCreateHabitModalOpen] = useState(false)

  return (
    <PageShell maxWidthClass="max-w-6xl" paddingTopClass="pt-16">
      <div className="flex flex-col gap-8">
        <InAppNudgeBanner />

        <div className="grid gap-6">
          <CreateHabitCard
            isModalOpen={isCreateHabitModalOpen}
            onOpenModal={() => {
              setIsCreateHabitModalOpen(true)
            }}
            onCloseModal={() => {
              setIsCreateHabitModalOpen(false)
            }}
          />

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <HabitList
              habits={habits}
              archivedHabits={archivedHabits}
              habitStreaks={habitStreaks}
              actionError={habitActionError}
              onDeleteHabit={onDeleteHabit}
              onHabitReorder={onHabitReorder}
              onToggleHabit={onToggleHabit}
              onSetHabitReminder={onSetHabitReminder}
              onClearHabitReminder={onClearHabitReminder}
              onOpenCreateHabit={() => {
                setIsCreateHabitModalOpen(true)
              }}
            />
            <div className="grid gap-6">
              <HabitCalendarCard habitStreaks={habitStreaks} habits={habits} />
              <PartnerStatusCard />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
