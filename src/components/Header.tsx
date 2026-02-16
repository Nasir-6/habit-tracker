import { Link } from '@tanstack/react-router'
import { Bell, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'

export default function Header() {
  const { data: session, isPending } = authClient.useSession()
  const shouldShowNotificationBell = !isPending && Boolean(session?.user)
  const [isIdentityMenuOpen, setIsIdentityMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const identityMenuRef = useRef<HTMLDivElement | null>(null)

  const userName = session?.user.name.trim()
  const fallbackName = session?.user.email.split('@')[0]?.trim()
  const userDisplayName = userName || fallbackName || 'Account'

  useEffect(() => {
    if (session?.user) {
      return
    }

    setIsIdentityMenuOpen(false)
    setIsSigningOut(false)
    setSignOutError(null)
  }, [session?.user])

  useEffect(() => {
    if (!isIdentityMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!identityMenuRef.current) {
        return
      }

      const target = event.target

      if (target instanceof Node && !identityMenuRef.current.contains(target)) {
        setIsIdentityMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsIdentityMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isIdentityMenuOpen])

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    setSignOutError(null)
    setIsSigningOut(true)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        throw new Error(result.error.message || 'Unable to log out')
      }

      setIsIdentityMenuOpen(false)
    } catch (error) {
      setSignOutError(
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Unable to log out. Please try again.',
      )
    } finally {
      setIsSigningOut(false)
    }
  }

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
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>Draft workspace</span>
          {shouldShowNotificationBell ? (
            <button
              aria-label="Notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              type="button"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
          {session?.user ? (
            <div className="relative" ref={identityMenuRef}>
              <button
                aria-expanded={isIdentityMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                type="button"
                onClick={() => {
                  setIsIdentityMenuOpen((current) => !current)
                }}
              >
                {userDisplayName}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              {isIdentityMenuOpen ? (
                <div
                  className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-lg shadow-slate-900/10"
                  role="menu"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Signed in
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {userDisplayName}
                  </p>
                  <button
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    disabled={isSigningOut}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      void handleSignOut()
                    }}
                  >
                    {isSigningOut ? 'Logging out...' : 'Log out'}
                  </button>
                  {signOutError ? (
                    <p className="mt-2 text-xs text-rose-600" role="alert">
                      {signOutError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
