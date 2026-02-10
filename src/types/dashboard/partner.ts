export type PartnerHabit = {
  id: string
  name: string
  completedToday: boolean
}

export type PendingPartnerInvite = {
  id: string
  inviterUserId: string
  inviterEmail: string | null
  inviteeEmail: string
  createdAt: string
}

export type SentPartnerInvite = {
  id: string
  inviteeEmail: string
  createdAt: string
  status: 'pending' | 'rejected'
}

export type IncomingPartnerNudge = {
  createdAt: string
}
