export type PartnerHabit = {
  id: string
  name: string
  completedToday: boolean
}

export type PendingPartnerInvite = {
  id: string
  inviterUserId: string
  inviteeEmail: string
  createdAt: string
}
