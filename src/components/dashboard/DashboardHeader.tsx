import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { authClient } from '@/lib/auth-client'

type DashboardHeaderProps = {
  userDisplayName: string
}

export function DashboardHeader({ userDisplayName }: DashboardHeaderProps) {
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut()

      if (result.error) {
        throw new Error(result.error.message || 'Unable to sign out')
      }
    },
    onMutate: () => {
      setSignOutNotice(null)
      setSignOutError(null)
    },
    onSuccess: () => {
      setSignOutNotice('Signed out')
    },
    onError: (error) => {
      setSignOutError(
        error instanceof Error ? error.message : 'Unable to sign out',
      )
    },
  })

  const handleSignOut = () => {
    if (isSigningOut) {
      return
    }

    signOut()
  }

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
      <div className="flex flex-col items-end gap-2">
        <button
          className={
            isSigningOut
              ? 'rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500'
              : 'rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800'
          }
          disabled={isSigningOut}
          type="button"
          onClick={handleSignOut}
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
        {signOutError ? (
          <p className="text-xs text-rose-500" role="status">
            {signOutError}
          </p>
        ) : signOutNotice ? (
          <p className="text-xs text-emerald-600" role="status">
            {signOutNotice}
          </p>
        ) : null}
      </div>
    </div>
  )
}
