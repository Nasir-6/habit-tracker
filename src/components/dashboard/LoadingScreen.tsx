import { PageShell } from '@/components/dashboard/PageShell'

export function LoadingScreen() {
  return (
    <PageShell maxWidthClass="max-w-3xl" paddingTopClass="pt-20">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-slate-600 shadow-sm">
        Checking your session…
      </div>
    </PageShell>
  )
}
