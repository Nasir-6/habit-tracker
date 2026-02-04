import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2f7_40%,_#e2e8f0_100%)] px-6 pb-20">
      <section className="max-w-6xl mx-auto pt-16">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Today
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold text-slate-900">
                Build habits that compound.
              </h1>
              <p className="mt-3 max-w-xl text-base md:text-lg text-slate-600">
                This is the starting point for your habit tracker. Next up: add
                the creation flow, today list, and streak logic from the PRD.
              </p>
            </div>
            <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15">
              New habit
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Today</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Empty
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
                  Add your first habit to start tracking daily completions.
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-500">
                  Drag to reorder once you have more than one habit.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                This week
              </h2>
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
                Calendar and streak data will live here once habits are in
                place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
