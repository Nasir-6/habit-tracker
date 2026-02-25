export const calendarBlockMaxWidthClass = 'max-w-74'

export const overviewCellSizeClass =
  '[--cell-size:3.15rem] sm:[--cell-size:3.35rem] lg:[--cell-size:3.55rem]'
export const habitCellSizeClass =
  '[--cell-size:3rem] sm:[--cell-size:3.15rem] lg:[--cell-size:3.35rem]'

export const overviewDayButtonClass =
  '!h-full !w-full min-h-[3rem] min-w-0 rounded-md bg-transparent p-0 data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-inherit sm:min-h-[3.2rem] lg:min-h-[3.4rem]'
export const habitDayButtonClass =
  '!h-full !w-full min-h-[2.8rem] min-w-0 rounded-md bg-transparent p-0 data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-inherit sm:min-h-[3rem] lg:min-h-[3.2rem]'

export const calendarClassNames = {
  root: 'w-full',
  months: 'w-full',
  month: 'w-full gap-1.5',
  month_grid: 'w-full',
  month_caption: 'hidden',
  table: 'w-full table-fixed border-collapse',
  weekdays: 'grid grid-cols-7 gap-x-1',
  weekday:
    'select-none rounded-md text-center text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500',
  week: 'mt-1 grid w-full grid-cols-7 gap-x-1',
  day: 'group/day relative h-full p-0 text-center',
  today: 'bg-transparent text-current',
}
