import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const formatLocalDate = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMsUntilNextMidnight = (now: Date) => {
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  )

  return nextMidnight.getTime() - now.getTime()
}

const LocalDateContext = createContext<string | null>(null)

export function LocalDateProvider({ children }: { children: React.ReactNode }) {
  const [localDate, setLocalDate] = useState(() => formatLocalDate(new Date()))

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleUpdate = () => {
      const now = new Date()
      const msUntilNextMidnight = getMsUntilNextMidnight(now)

      timeoutId = setTimeout(() => {
        setLocalDate(formatLocalDate(new Date()))
        scheduleUpdate()
      }, msUntilNextMidnight)
    }

    scheduleUpdate()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  const value = useMemo(() => localDate, [localDate])

  return (
    <LocalDateContext.Provider value={value}>
      {children}
    </LocalDateContext.Provider>
  )
}

export function useLocalDate() {
  const localDate = useContext(LocalDateContext)

  if (!localDate) {
    throw new Error('useLocalDate must be used within LocalDateProvider')
  }

  return localDate
}
