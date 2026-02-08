import type { ChangeEvent, FormEvent } from 'react'
import type { AuthMode } from '@/components/dashboard/types'

import { cn } from '@/lib/utils'
import { PageShell } from '@/components/dashboard/PageShell'

type AuthScreenProps = {
  authMode: AuthMode
  authName: string
  authEmail: string
  authPassword: string
  authError: string | null
  isAuthSubmitting: boolean
  onAuthNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  onAuthEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onAuthPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onToggleMode: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthScreen({
  authMode,
  authName,
  authEmail,
  authPassword,
  authError,
  isAuthSubmitting,
  onAuthNameChange,
  onAuthEmailChange,
  onAuthPasswordChange,
  onToggleMode,
  onSubmit,
}: AuthScreenProps) {
  const isSubmitDisabled =
    isAuthSubmitting ||
    authEmail.trim().length === 0 ||
    authPassword.length === 0

  return (
    <PageShell maxWidthClass="max-w-3xl" paddingTopClass="pt-16">
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Welcome
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900">
            Sign in to start tracking.
          </h1>
          <p className="mt-3 max-w-xl text-base md:text-lg text-slate-600">
            Create an account to save your habits and keep them synced.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {authMode === 'sign-in' ? 'Sign in' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Use your email and password to continue.
          </p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
            {authMode === 'sign-up' ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Name
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Alex Johnson"
                  type="text"
                  value={authName}
                  onChange={onAuthNameChange}
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="you@company.com"
                required
                type="email"
                value={authEmail}
                onChange={onAuthEmailChange}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Enter a password"
                required
                type="password"
                value={authPassword}
                onChange={onAuthPasswordChange}
              />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                className={cn(
                  'rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition',
                  isSubmitDisabled
                    ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                    : 'bg-slate-900 text-white shadow-slate-900/15 hover:bg-slate-800',
                )}
                disabled={isSubmitDisabled}
                type="submit"
              >
                {isAuthSubmitting
                  ? 'Working…'
                  : authMode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
              <button
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
                type="button"
                onClick={onToggleMode}
              >
                {authMode === 'sign-in'
                  ? 'Need an account?'
                  : 'Already have an account?'}
              </button>
            </div>
            {authError ? (
              <p className="text-sm text-rose-500" role="alert">
                {authError}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </PageShell>
  )
}
