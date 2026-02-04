export const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const padNumber = (value: number) => String(value).padStart(2, '0')

export const formatLocalDate = (value: Date) => {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(
    value.getDate(),
  )}`
}

export type CalendarData = {
  days: (number | null)[]
  year: number
  monthIndex: number
}

export const buildCalendarDays = (reference: Date): CalendarData => {
  const year = reference.getFullYear()
  const monthIndex = reference.getMonth()
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const days: (number | null)[] = Array(startOffset).fill(null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day)
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  return { days, year, monthIndex }
}
