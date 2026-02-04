import type { DragEvent, FormEvent } from 'react'
import type { Habit } from '@/components/dashboard/types'

import { CreateHabitCard } from '@/components/dashboard/CreateHabitCard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { HabitList } from '@/components/dashboard/HabitList'
import { PageShell } from '@/components/dashboard/PageShell'
import { WeekPreviewCard } from '@/components/dashboard/WeekPreviewCard'

type DashboardProps = {
  habitName: string
  isSaveDisabled: boolean
  isSubmitting: boolean
  errorMessage: string | null
  habits: Habit[]
  draggingHabitId: string | null
  onHabitNameChange: (value: string) => void
  onCreateHabit: (event: FormEvent<HTMLFormElement>) => void
  onHabitDragStart: (event: DragEvent<HTMLDivElement>, habitId: string) => void
  onHabitDragEnd: () => void
  onHabitDrop: (targetId: string) => void
  onToggleHabit: (habitId: string) => void
}

export function Dashboard({
  habitName,
  isSaveDisabled,
  isSubmitting,
  errorMessage,
  habits,
  draggingHabitId,
  onHabitNameChange,
  onCreateHabit,
  onHabitDragStart,
  onHabitDragEnd,
  onHabitDrop,
  onToggleHabit,
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
              onHabitDragEnd={onHabitDragEnd}
              onHabitDragStart={onHabitDragStart}
              onHabitDrop={onHabitDrop}
              onToggleHabit={onToggleHabit}
            />
            <WeekPreviewCard />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
