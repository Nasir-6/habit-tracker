import {
  calendarBlockMaxWidthClass,
  calendarClassNames,
  habitCellSizeClass,
  habitDayButtonClass,
  overviewCellSizeClass,
  overviewDayButtonClass,
} from './constants'
import {
  createHabitDayButton,
  createOverviewDayButton,
} from './HabitCalendarDayButtons'
import { HabitCalendarLegend } from './HabitCalendarLegend'
import { HabitCalendarMonthNav } from './HabitCalendarMonthNav'
import type { DailyOverviewEntry, HabitCalendarViewMode } from './types'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'

type SharedProps = {
  monthLabel: string
  month: Date
  onMonthChange: (nextMonth: Date) => void
  onMonthStep: (offset: number) => void
  todayKey: string
}

type HabitCalendarGridProps =
  | ({
      viewMode: 'overview'
      overviewByDate: Map<string, DailyOverviewEntry>
    } & SharedProps)
  | ({
      viewMode: 'habit'
      completedDates: Set<string>
    } & SharedProps)

const getDayButtonClass = (viewMode: HabitCalendarViewMode) => {
  return viewMode === 'overview' ? overviewDayButtonClass : habitDayButtonClass
}

const getCellSizeClass = (viewMode: HabitCalendarViewMode) => {
  return viewMode === 'overview' ? overviewCellSizeClass : habitCellSizeClass
}

export function HabitCalendarGrid(props: HabitCalendarGridProps) {
  const { monthLabel, month, onMonthChange, onMonthStep, todayKey, viewMode } =
    props

  const dayButtonComponent =
    viewMode === 'overview'
      ? createOverviewDayButton({
          overviewByDate: props.overviewByDate,
          todayKey,
        })
      : createHabitDayButton({
          completedDates: props.completedDates,
          todayKey,
        })

  return (
    <div
      className={`w-full ${calendarBlockMaxWidthClass} space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4`}
    >
      <HabitCalendarMonthNav
        monthLabel={monthLabel}
        onMonthStep={onMonthStep}
      />

      <Calendar
        mode="single"
        month={month}
        onSelect={() => {}}
        onMonthChange={onMonthChange}
        hideNavigation={true}
        showOutsideDays={false}
        weekStartsOn={1}
        selected={undefined}
        className={cn(
          `w-full ${calendarBlockMaxWidthClass} rounded-lg bg-white p-0`,
          getCellSizeClass(viewMode),
        )}
        classNames={{
          ...calendarClassNames,
          day_button: getDayButtonClass(viewMode),
        }}
        components={{
          DayButton: dayButtonComponent,
        }}
      />

      <HabitCalendarLegend viewMode={viewMode} />
    </div>
  )
}
