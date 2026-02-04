export function WeekPreviewCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">This week</h2>
      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="rounded-full border border-slate-200 bg-white/80 px-2 py-2"
          >
            {day}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Calendar and streak data will live here once habits are in place.
      </p>
    </div>
  )
}
