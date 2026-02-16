type PartnerStatusHeaderProps = {
  hasPartner: boolean
  partnerName: string | null
}

export function PartnerStatusHeader({
  hasPartner,
  partnerName,
}: PartnerStatusHeaderProps) {
  const heading =
    hasPartner && partnerName ? `${partnerName}'s Habits` : 'Partner'

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {hasPartner ? 'Active' : 'Invite'}
        </span>
      </div>
    </>
  )
}
