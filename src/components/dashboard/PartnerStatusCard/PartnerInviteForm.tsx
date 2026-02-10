import type { FormEvent } from 'react'

type PartnerInviteFormProps = {
  inviteEmail: string
  isInviteSubmitting: boolean
  onInviteEmailChange: (value: string) => void
  onInviteSubmit: () => Promise<void>
}

export function PartnerInviteForm({
  inviteEmail,
  isInviteSubmitting,
  onInviteEmailChange,
  onInviteSubmit,
}: PartnerInviteFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onInviteSubmit()
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-1 text-xs uppercase tracking-[0.2em] text-slate-400">
        Partner email
        <input
          autoComplete="email"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          name="partnerEmail"
          onChange={(event) => {
            onInviteEmailChange(event.target.value)
          }}
          placeholder="name@example.com"
          type="email"
          value={inviteEmail}
        />
      </label>
      <button
        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isInviteSubmitting || inviteEmail.trim().length === 0}
        type="submit"
      >
        {isInviteSubmitting ? 'Sending invite...' : 'Send invite'}
      </button>
    </form>
  )
}
