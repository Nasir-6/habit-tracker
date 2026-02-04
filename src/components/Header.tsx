import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="px-6 py-5 border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white text-lg font-semibold">
            H
          </span>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Habit Tracker
            </span>
            <span className="text-lg font-semibold text-slate-900">
              Focused Progress
            </span>
          </div>
        </Link>
        <div className="text-sm text-slate-500">Draft workspace</div>
      </div>
    </header>
  )
}
