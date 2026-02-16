import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { requestApi } from '@/lib/client-api'
import { cn } from '@/lib/utils'

type CreateHabitCardProps = {
  isModalOpen: boolean
  onCloseModal: () => void
}

export function CreateHabitCard({
  isModalOpen,
  onCloseModal,
}: CreateHabitCardProps) {
  const queryClient = useQueryClient()
  const [habitName, setHabitName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const { mutate: createHabit, isPending } = useMutation({
    mutationFn: async (name: string) => {
      return requestApi<{ habit?: { id?: string; name?: string } }>(
        '/api/habits',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ name }),
        },
        'Unable to save habit',
      )
    },
    onMutate: () => {
      setCreateError(null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['dashboard-habits'],
      })
      setHabitName('')
      onCloseModal()
    },
    onError: (error) => {
      setCreateError(
        error instanceof Error ? error.message : 'Unable to save habit',
      )
    },
  })

  const trimmedHabitName = habitName.trim()
  const isSaveDisabled = trimmedHabitName.length === 0 || isPending

  const handleCreateHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSaveDisabled) {
      return
    }

    createHabit(trimmedHabitName)
  }

  const closeModal = () => {
    if (isPending) {
      return
    }

    setCreateError(null)
    setHabitName('')

    onCloseModal()
  }

  return (
    <>
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Create a habit"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Create a habit
            </h2>
            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={handleCreateHabit}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="sr-only">Habit name</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Drink 8 cups of water"
                  required
                  autoFocus
                  type="text"
                  value={habitName}
                  onChange={(event) => {
                    setCreateError(null)
                    setHabitName(event.target.value)
                  }}
                />
              </label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="min-h-[44px] rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className={cn(
                    'min-h-[44px] rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition',
                    isSaveDisabled
                      ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                      : 'bg-slate-900 text-white shadow-slate-900/15 hover:bg-slate-800',
                  )}
                  disabled={isSaveDisabled}
                  type="submit"
                  aria-disabled={isSaveDisabled}
                >
                  {isPending ? 'Saving...' : 'Save habit'}
                </button>
              </div>
              {createError ? (
                <p className="text-sm text-rose-500" role="status">
                  {createError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
