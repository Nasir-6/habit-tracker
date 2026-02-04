import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageShellProps = {
  children: ReactNode
  maxWidthClass: string
  paddingTopClass: string
}

export function PageShell({
  children,
  maxWidthClass,
  paddingTopClass,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2f7_40%,_#e2e8f0_100%)] px-6 pb-20">
      <section className={cn('mx-auto', maxWidthClass, paddingTopClass)}>
        {children}
      </section>
    </main>
  )
}
