import type { FormEvent } from 'react'

import { cn } from '@/lib/utils'

type CreateHabitCardProps = {
  habitName: string
  isSaveDisabled: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onHabitNameChange: (value: string) => void
  onCreateHabit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateHabitCard({
  habitName,
  isSaveDisabled,
  isSubmitting,
  errorMessage,
  onHabitNameChange,
  onCreateHabit,
}: CreateHabitCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Create a habit</h2>
      <p className="mt-2 text-sm text-slate-500">
        Give it a short, action-focused name. You can always edit it later.
      </p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={onCreateHabit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Habit name
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Drink 8 cups of water"
            required
            type="text"
            value={habitName}
            onChange={(event) => {
              onHabitNameChange(event.target.value)
            }}
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button
            className={cn(
              'rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition',
              isSaveDisabled
                ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                : 'bg-slate-900 text-white shadow-slate-900/15 hover:bg-slate-800',
            )}
            disabled={isSaveDisabled}
            type="submit"
          >
            {isSubmitting ? 'Saving…' : 'Save habit'}
          </button>
          <span className="text-xs text-slate-400">
            Required to keep your list focused.
          </span>
        </div>
        {errorMessage ? (
          <p className="text-sm text-rose-500" role="status">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </div>
  )
}
