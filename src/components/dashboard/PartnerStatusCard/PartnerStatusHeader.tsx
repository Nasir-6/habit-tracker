type PartnerStatusHeaderProps = {
  hasPartner: boolean
}

export function PartnerStatusHeader({ hasPartner }: PartnerStatusHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Partner</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {hasPartner ? 'Active' : 'Invite'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Check in with a partner to stay aligned on today’s habits.
      </p>
    </>
  )
}
