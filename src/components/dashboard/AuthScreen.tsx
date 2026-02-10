import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import type { AuthMode } from '@/types/dashboard'

import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { PageShell } from '@/components/dashboard/PageShell'

const resolveAuthErrorMessage = (
  authMode: AuthMode,
  error: unknown,
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return authMode === 'sign-in'
    ? 'Sign in failed. Check your credentials and try again.'
    : 'Sign up failed. Check your details and try again.'
}

export function AuthScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authValidationError, setAuthValidationError] = useState<string | null>(
    null,
  )
  const [authRequestError, setAuthRequestError] = useState<string | null>(null)

  const { mutate: submitAuth, isPending: isAuthSubmitting } = useMutation({
    mutationFn: async ({
      mode,
      email,
      password,
      name,
    }: {
      mode: AuthMode
      email: string
      password: string
      name: string
    }) => {
      try {
        if (mode === 'sign-in') {
          const result = await authClient.signIn.email({
            email,
            password,
          })

          if (result.error) {
            throw new Error(result.error.message || 'Unable to sign in')
          }

          return
        }

        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })

        if (result.error) {
          throw new Error(result.error.message || 'Unable to sign up')
        }

        const signInResult = await authClient.signIn.email({
          email,
          password,
        })

        if (signInResult.error) {
          throw new Error(signInResult.error.message || 'Unable to sign in')
        }
      } catch (mutationError) {
        throw new Error(resolveAuthErrorMessage(mode, mutationError))
      }
    },
    onMutate: () => {
      setAuthRequestError(null)
    },
    onError: (error) => {
      setAuthRequestError(
        error instanceof Error
          ? error.message
          : resolveAuthErrorMessage(authMode, error),
      )
    },
  })

  const authError = authValidationError ?? authRequestError

  const isSubmitDisabled =
    isAuthSubmitting ||
    authEmail.trim().length === 0 ||
    authPassword.length === 0

  const handleAuthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isAuthSubmitting) {
      return
    }

    const email = authEmail.trim()
    const password = authPassword
    const submittingMode = authMode

    if (!email || !password) {
      setAuthValidationError('Email and password are required')
      return
    }

    setAuthValidationError(null)
    submitAuth({
      mode: submittingMode,
      email,
      password,
      name: authName.trim() || email.split('@')[0] || 'Habit Tracker',
    })
  }

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
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={handleAuthSubmit}
          >
            {authMode === 'sign-up' ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Name
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Alex Johnson"
                  type="text"
                  value={authName}
                  onChange={(event) => {
                    setAuthValidationError(null)
                    setAuthRequestError(null)
                    setAuthName(event.target.value)
                  }}
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
                onChange={(event) => {
                  setAuthValidationError(null)
                  setAuthRequestError(null)
                  setAuthEmail(event.target.value)
                }}
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
                onChange={(event) => {
                  setAuthValidationError(null)
                  setAuthRequestError(null)
                  setAuthPassword(event.target.value)
                }}
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
                  ? 'Working...'
                  : authMode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
              <button
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
                type="button"
                onClick={() => {
                  setAuthValidationError(null)
                  setAuthRequestError(null)
                  setAuthMode((mode) =>
                    mode === 'sign-in' ? 'sign-up' : 'sign-in',
                  )
                }}
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
