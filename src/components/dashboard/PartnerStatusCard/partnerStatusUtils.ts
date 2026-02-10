export const formatInviteDate = (value: string) => {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Recently'
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export const formatInviter = (value: string) => {
  if (value.length <= 8) {
    return value
  }

  return `${value.slice(0, 6)}…${value.slice(-2)}`
}

export const getInviterLabel = (
  inviterEmail: string | null,
  inviterUserId: string,
) => {
  if (!inviterEmail) {
    return `user ${formatInviter(inviterUserId)}`
  }

  const localPart = inviterEmail.split('@')[0] || inviterEmail
  const displayName =
    localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase()

  return `${displayName} (${inviterEmail})`
}
