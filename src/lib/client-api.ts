type ErrorPayload = {
  error?: unknown
}

const getErrorMessage = (payload: unknown, fallbackMessage: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallbackMessage
  }

  const { error } = payload as ErrorPayload

  if (typeof error !== 'string' || error.trim().length === 0) {
    return fallbackMessage
  }

  return error
}

const parseJson = async (response: Response) => {
  const body = await response.text()

  if (!body) {
    return undefined
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return undefined
  }
}

export const requestApi = async <T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackMessage: string,
) => {
  const response = await fetch(input, init)
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackMessage))
  }

  return payload as T
}
