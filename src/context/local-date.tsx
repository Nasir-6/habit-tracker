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

type LocalDateContextValue = {
  selectedLocalDate: string
  setSelectedLocalDate: (localDate: string) => void
  todayLocalDate: string
}

const LocalDateContext = createContext<LocalDateContextValue | null>(null)

export function LocalDateProvider({ children }: { children: React.ReactNode }) {
  const [todayLocalDate, setTodayLocalDate] = useState(() =>
    formatLocalDate(new Date()),
  )
  const [selectedLocalDate, setSelectedLocalDate] = useState(() =>
    formatLocalDate(new Date()),
  )

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleUpdate = () => {
      const now = new Date()
      const msUntilNextMidnight = getMsUntilNextMidnight(now)

      timeoutId = setTimeout(() => {
        const nextLocalDate = formatLocalDate(new Date())

        setTodayLocalDate((previousTodayLocalDate) => {
          setSelectedLocalDate((currentSelectedLocalDate) =>
            currentSelectedLocalDate === previousTodayLocalDate
              ? nextLocalDate
              : currentSelectedLocalDate,
          )

          return nextLocalDate
        })
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

  const value = useMemo(
    () => ({ selectedLocalDate, setSelectedLocalDate, todayLocalDate }),
    [selectedLocalDate, todayLocalDate],
  )

  return (
    <LocalDateContext.Provider value={value}>
      {children}
    </LocalDateContext.Provider>
  )
}

export function useLocalDate() {
  const localDateContext = useContext(LocalDateContext)

  if (!localDateContext) {
    throw new Error('useLocalDate must be used within LocalDateProvider')
  }

  return localDateContext.selectedLocalDate
}

export function useSetLocalDate() {
  const localDateContext = useContext(LocalDateContext)

  if (!localDateContext) {
    throw new Error('useSetLocalDate must be used within LocalDateProvider')
  }

  return localDateContext.setSelectedLocalDate
}

export function useTodayLocalDate() {
  const localDateContext = useContext(LocalDateContext)

  if (!localDateContext) {
    throw new Error('useTodayLocalDate must be used within LocalDateProvider')
  }

  return localDateContext.todayLocalDate
}
