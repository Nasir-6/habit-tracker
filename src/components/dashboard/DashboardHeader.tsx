type DashboardHeaderProps = {
  userDisplayName: string
  isSigningOut: boolean
  signOutError: string | null
  onSignOut: () => void
}

export function DashboardHeader({
  userDisplayName,
  isSigningOut,
  signOutError,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Today
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900">
          Build habits that compound.
        </h1>
        <p className="mt-3 text-base md:text-lg font-medium text-slate-700">
          Hi {userDisplayName}
        </p>
        <p className="mt-3 max-w-xl text-base md:text-lg text-slate-600">
          This is the starting point for your habit tracker. Next up: add the
          creation flow, today list, and streak logic from the PRD.
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          className={
            isSigningOut
              ? 'rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500'
              : 'rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800'
          }
          disabled={isSigningOut}
          type="button"
          onClick={onSignOut}
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
        {signOutError ? (
          <p className="text-xs text-rose-500" role="status">
            {signOutError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
