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
