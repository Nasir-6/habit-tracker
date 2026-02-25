import type { HabitCalendarViewMode } from './types'

import { cn } from '@/lib/utils'

type LegendItem = {
  colorClassName: string
  label: string
}

const legendByViewMode: Record<HabitCalendarViewMode, LegendItem[]> = {
  overview: [
    { colorClassName: 'bg-emerald-500', label: 'Completed progress' },
    { colorClassName: 'bg-slate-300', label: 'Future' },
  ],
  habit: [
    { colorClassName: 'bg-emerald-500', label: 'Completed' },
    { colorClassName: 'bg-slate-900', label: 'Today' },
    { colorClassName: 'bg-rose-300', label: 'Missed' },
  ],
}

type HabitCalendarLegendProps = {
  viewMode: HabitCalendarViewMode
}

export function HabitCalendarLegend({ viewMode }: HabitCalendarLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-slate-500">
      {legendByViewMode[viewMode].map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', item.colorClassName)} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
