type HabitCalendarStatusProps = {
  calendarError: string | null
  isCalendarLoading: boolean
}

export function HabitCalendarStatus({
  calendarError,
  isCalendarLoading,
}: HabitCalendarStatusProps) {
  if (!calendarError && !isCalendarLoading) {
    return null
  }

  return (
    <div className="grid gap-2">
      {isCalendarLoading ? (
        <p className="text-xs text-slate-400">Refreshing calendar...</p>
      ) : null}
      {calendarError ? (
        <p className="text-xs text-rose-500">{calendarError}</p>
      ) : null}
    </div>
  )
}
