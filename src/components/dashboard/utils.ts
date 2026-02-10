import type { Habit } from '@/types/dashboard'

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
