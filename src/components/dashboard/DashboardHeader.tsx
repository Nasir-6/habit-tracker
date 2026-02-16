type DashboardHeaderProps = {
  userDisplayName: string
}

export function DashboardHeader({ userDisplayName }: DashboardHeaderProps) {
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
          Hi {userDisplayName}. Keep today simple: add habits, check them off,
          and stay in sync with your partner.
        </p>
      </div>
    </div>
  )
}
