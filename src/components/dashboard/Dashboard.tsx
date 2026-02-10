import type { Habit } from '@/types/dashboard'

import { CreateHabitCard } from '@/components/dashboard/CreateHabitCard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { HabitCalendarCard } from '@/components/dashboard/HabitCalendarCard'
import { HabitList } from '@/components/dashboard/HabitList'
import { PageShell } from '@/components/dashboard/PageShell'
import { PartnerStatusCard } from '@/components/dashboard/PartnerStatusCard'

type DashboardProps = {
  userDisplayName: string
  habits: Habit[]
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
  onHabitReorder: (fromId: string, toId: string) => Promise<void>
  onToggleHabit: (habitId: string) => Promise<void>
  onDeleteHabit: (habitId: string) => Promise<void>
}

export function Dashboard({
  userDisplayName,
  habits,
  habitStreaks,
  onHabitReorder,
  onToggleHabit,
  onDeleteHabit,
}: DashboardProps) {
  return (
    <PageShell maxWidthClass="max-w-6xl" paddingTopClass="pt-16">
      <div className="flex flex-col gap-8">
        <DashboardHeader userDisplayName={userDisplayName} />

        <div className="grid gap-6">
          <CreateHabitCard />

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <HabitList
              habits={habits}
              habitStreaks={habitStreaks}
              onDeleteHabit={onDeleteHabit}
              onHabitReorder={onHabitReorder}
              onToggleHabit={onToggleHabit}
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
