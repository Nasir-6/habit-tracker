export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Today
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900">
          Build habits that compound.
        </h1>
        <p className="mt-3 max-w-xl text-base md:text-lg text-slate-600">
          This is the starting point for your habit tracker. Next up: add the
          creation flow, today list, and streak logic from the PRD.
        </p>
      </div>
      <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15">
        New habit
      </button>
    </div>
  )
}
