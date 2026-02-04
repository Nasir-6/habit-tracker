import type { Habit } from '@/components/dashboard/types'

export const moveHabit = (items: Habit[], fromId: string, toId: string) => {
  if (fromId === toId) {
    return items
  }

  const fromIndex = items.findIndex((item) => item.id === fromId)
  const toIndex = items.findIndex((item) => item.id === toId)

  if (fromIndex === -1 || toIndex === -1) {
    return items
  }

  const updated = [...items]
  const [moved] = updated.splice(fromIndex, 1)

  updated.splice(toIndex, 0, moved)
  return updated
}

export const persistHabitOrder = async (orderedIds: string[]) => {
  const response = await fetch('/api/habits', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ orderedIds }),
  })

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string }
    throw new Error(payload.error || 'Unable to update habit order')
  }
}
