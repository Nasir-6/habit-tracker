type DailyProgressBarProps = {
  completedCount: number
  totalCount: number
}

export function DailyProgressBar({
  completedCount,
  totalCount,
}: DailyProgressBarProps) {
  if (totalCount === 0) {
    return null
  }

  const completionPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Daily progress</p>
        <p>{`${completedCount} of ${totalCount}, ${completionPercent}%`}</p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-slate-700 transition-[width] duration-300 ease-out"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
    </div>
  )
}
