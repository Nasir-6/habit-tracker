export type LocalDateParts = {
  year: number
  month: number
  day: number
  utcDate: Date
}

export const parseLocalDateParts = (value: string): LocalDateParts | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utcDate = new Date(Date.UTC(year, month - 1, day))

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day, utcDate }
}

export const isValidLocalDateString = (value: string) =>
  Boolean(parseLocalDateParts(value))

export const formatUtcDate = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatUtcDateWithOffset = (date: Date, offsetMinutes = 0) => {
  const shiftedDate =
    offsetMinutes === 0
      ? date
      : new Date(date.getTime() - offsetMinutes * 60 * 1000)
  return formatUtcDate(shiftedDate)
}

export const previousUtcLocalDate = (value: string) => {
  const parsed = parseLocalDateParts(value)

  if (!parsed) {
    return null
  }

  const previous = new Date(parsed.utcDate)
  previous.setUTCDate(previous.getUTCDate() - 1)
  return formatUtcDate(previous)
}

export type ParsedMonth = {
  year: number
  month: number
  startDate: string
  endDate: string
}

export const parseMonth = (value: string): ParsedMonth | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (month < 1 || month > 12) {
    return null
  }

  const start = new Date(Date.UTC(year, month - 1, 1))

  if (
    start.getUTCFullYear() !== year ||
    start.getUTCMonth() !== month - 1 ||
    start.getUTCDate() !== 1
  ) {
    return null
  }

  const end = new Date(Date.UTC(year, month, 0))

  return {
    year,
    month,
    startDate: formatUtcDate(start),
    endDate: formatUtcDate(end),
  }
}
