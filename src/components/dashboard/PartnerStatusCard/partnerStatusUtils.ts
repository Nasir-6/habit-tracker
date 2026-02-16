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

export const getPartnerDisplayName = (partnerEmail: string | null) => {
  if (!partnerEmail) {
    return null
  }

  const localPart = partnerEmail.split('@')[0] || partnerEmail

  return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase()
}

export const formatRelativeTimestamp = (value: string) => {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'just now'
  }

  const diffMs = Date.now() - parsed.getTime()
  const diffSeconds = Math.max(Math.floor(diffMs / 1000), 0)

  if (diffSeconds < 60) {
    return 'just now'
  }

  const diffMinutes = Math.floor(diffSeconds / 60)

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export const formatSyncTimestamp = (value: string) => {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'just now'
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}
