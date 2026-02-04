import type { DragEvent, FormEvent } from 'react'
import type { Habit } from '@/components/dashboard/types'

import { CreateHabitCard } from '@/components/dashboard/CreateHabitCard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { HabitList } from '@/components/dashboard/HabitList'
import { PageShell } from '@/components/dashboard/PageShell'
import { PartnerStatusCard } from '@/components/dashboard/PartnerStatusCard'
import { WeekPreviewCard } from '@/components/dashboard/WeekPreviewCard'

type DashboardProps = {
  habitName: string
  isSaveDisabled: boolean
  isSubmitting: boolean
  errorMessage: string | null
  habits: Habit[]
  historyHabitId: string | null
  historyDates: string[]
  historyError: string | null
  isHistoryLoading: boolean
  habitStreaks: Partial<Record<string, { current: number; best: number }>>
  partnerHabits: { id: string; name: string; completedToday: boolean }[]
  partnerStartedOn: string | null
  partnerError: string | null
  isPartnerLoading: boolean
  hasPartner: boolean
  draggingHabitId: string | null
  onHabitNameChange: (value: string) => void
  onCreateHabit: (event: FormEvent<HTMLFormElement>) => void
  onHabitDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => void
  onHabitDragEnd: () => void
  onHabitDrop: (targetId: string) => void
  onToggleHabit: (habitId: string) => void
  onToggleHistory: (habitId: string) => void
}

export function Dashboard({
  habitName,
  isSaveDisabled,
  isSubmitting,
  errorMessage,
  habits,
  historyHabitId,
  historyDates,
  historyError,
  isHistoryLoading,
  habitStreaks,
  partnerHabits,
  partnerStartedOn,
  partnerError,
  isPartnerLoading,
  hasPartner,
  draggingHabitId,
  onHabitNameChange,
  onCreateHabit,
  onHabitDragStart,
  onHabitDragEnd,
  onHabitDrop,
  onToggleHabit,
  onToggleHistory,
}: DashboardProps) {
  return (
    <PageShell maxWidthClass="max-w-6xl" paddingTopClass="pt-16">
      <div className="flex flex-col gap-8">
        <DashboardHeader />

        <div className="grid gap-6">
          <CreateHabitCard
            errorMessage={errorMessage}
            habitName={habitName}
            isSaveDisabled={isSaveDisabled}
            isSubmitting={isSubmitting}
            onCreateHabit={onCreateHabit}
            onHabitNameChange={onHabitNameChange}
          />

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <HabitList
              draggingHabitId={draggingHabitId}
              habits={habits}
              historyDates={historyDates}
              historyError={historyError}
              historyHabitId={historyHabitId}
              isHistoryLoading={isHistoryLoading}
              habitStreaks={habitStreaks}
              onHabitDragEnd={onHabitDragEnd}
              onHabitDragStart={onHabitDragStart}
              onHabitDrop={onHabitDrop}
              onToggleHabit={onToggleHabit}
              onToggleHistory={onToggleHistory}
            />
            <div className="grid gap-6">
              <WeekPreviewCard />
              <PartnerStatusCard
                errorMessage={partnerError}
                habits={partnerHabits}
                hasPartner={hasPartner}
                isLoading={isPartnerLoading}
                startedOn={partnerStartedOn}
              />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
