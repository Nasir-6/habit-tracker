import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import type {
  PartnerHabit,
  PendingPartnerInvite,
  SentPartnerInvite,
} from '@/types/dashboard'

import { useLocalDate } from '@/context/local-date'
import { requestApi } from '@/lib/client-api'

const partnerStatusQueryKey = (localDate: string) =>
  ['partner-status', localDate] as const
const pendingInvitesQueryKey = ['partner-pending-invites'] as const

type PendingInvitesPayload = {
  invites?: PendingPartnerInvite[]
  receivedInvites?: PendingPartnerInvite[]
  sentInvites?: SentPartnerInvite[]
}

type ResendInvitePayload = {
  id: string
  email: string
}

type DeleteInvitePayload = {
  id: string
  status: 'pending' | 'rejected'
}

type NudgeMutationPayload = {
  limits?: {
    cooldownSeconds?: number
  }
}

type NudgeErrorPayload = {
  error?: string
  code?: string
  retryAfterSeconds?: number
}

type NudgeRequestError = Error & {
  retryAfterSeconds?: number
}

const parseJsonPayload = async (response: Response) => {
  const body = await response.text()

  if (!body) {
    return null
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}

const formatNudgeCooldown = (secondsRemaining: number) => {
  if (secondsRemaining < 60) {
    return `${secondsRemaining}s`
  }

  const minutesRemaining = Math.ceil(secondsRemaining / 60)
  return `${minutesRemaining}m`
}

export function usePartnerStatus() {
  const localDate = useLocalDate()
  const queryClient = useQueryClient()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteValidationError, setInviteValidationError] = useState<
    string | null
  >(null)
  const [inviteRequestError, setInviteRequestError] = useState<string | null>(
    null,
  )
  const [inviteNotice, setInviteNotice] = useState<string | null>(null)
  const [acceptInviteError, setAcceptInviteError] = useState<string | null>(
    null,
  )
  const [acceptInviteNotice, setAcceptInviteNotice] = useState<string | null>(
    null,
  )
  const [removePartnerError, setRemovePartnerError] = useState<string | null>(
    null,
  )
  const [removePartnerNotice, setRemovePartnerNotice] = useState<string | null>(
    null,
  )
  const [nudgeError, setNudgeError] = useState<string | null>(null)
  const [nudgeNotice, setNudgeNotice] = useState<string | null>(null)
  const [nudgeCooldownEndsAt, setNudgeCooldownEndsAt] = useState<number | null>(
    null,
  )
  const [nudgeCooldownSecondsRemaining, setNudgeCooldownSecondsRemaining] =
    useState(0)

  useEffect(() => {
    if (!nudgeCooldownEndsAt) {
      setNudgeCooldownSecondsRemaining(0)
      return
    }

    const updateRemaining = () => {
      const nextRemaining = Math.max(
        Math.ceil((nudgeCooldownEndsAt - Date.now()) / 1000),
        0,
      )

      setNudgeCooldownSecondsRemaining(nextRemaining)

      if (nextRemaining === 0) {
        setNudgeCooldownEndsAt(null)
      }
    }

    updateRemaining()

    const intervalId = window.setInterval(updateRemaining, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [nudgeCooldownEndsAt])

  const partnerStatusQuery = useQuery({
    queryKey: partnerStatusQueryKey(localDate),
    queryFn: async () => {
      const response = await fetch(
        `/api/partnerships?localDate=${encodeURIComponent(localDate)}`,
      )

      if (response.status === 404) {
        return {
          hasPartner: false,
          startedOn: null,
          partnerEmail: null,
          habits: [] as PartnerHabit[],
        }
      }

      const payload = (await response.json()) as {
        error?: string
        partner?: { startedOn?: string; email?: string | null }
        habits?: PartnerHabit[]
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load partner status')
      }

      return {
        hasPartner: true,
        startedOn: payload.partner?.startedOn ?? null,
        partnerEmail:
          typeof payload.partner?.email === 'string'
            ? payload.partner.email
            : null,
        habits: Array.isArray(payload.habits) ? payload.habits : [],
      }
    },
  })

  const pendingInvitesQuery = useQuery({
    queryKey: pendingInvitesQueryKey,
    queryFn: async () => {
      const payload = await requestApi<PendingInvitesPayload>(
        '/api/partner-invites',
        undefined,
        'Unable to load partner invites',
      )

      const receivedInvites = Array.isArray(payload.receivedInvites)
        ? payload.receivedInvites
        : Array.isArray(payload.invites)
          ? payload.invites
          : []

      const sentInvites = Array.isArray(payload.sentInvites)
        ? payload.sentInvites
        : []

      return { receivedInvites, sentInvites }
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      await requestApi(
        '/api/partner-invites',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
        'Unable to send invite',
      )
    },
    onMutate: () => {
      setInviteValidationError(null)
      setInviteRequestError(null)
      setInviteNotice(null)
      setAcceptInviteNotice(null)
    },
    onSuccess: async (_data, email) => {
      setInviteEmail('')
      setInviteNotice(`Invite sent to ${email}`)

      await queryClient.invalidateQueries({
        queryKey: pendingInvitesQueryKey,
      })
    },
    onError: (error) => {
      setInviteRequestError(
        error instanceof Error ? error.message : 'Unable to send invite',
      )
    },
  })

  const deleteInviteMutation = useMutation({
    mutationFn: async ({ id }: DeleteInvitePayload) => {
      const payload = await requestApi<{ invite?: { id?: string } }>(
        '/api/partner-invites',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ inviteId: id, action: 'delete' }),
        },
        'Unable to delete invite',
      )

      if (typeof payload.invite?.id !== 'string') {
        throw new Error('Unable to delete invite')
      }
    },
    onMutate: () => {
      setInviteValidationError(null)
      setInviteRequestError(null)
      setInviteNotice(null)
      setAcceptInviteNotice(null)
    },
    onSuccess: async (_data, variables) => {
      setInviteNotice(
        variables.status === 'rejected'
          ? 'Rejected invite cleared'
          : 'Pending invite deleted',
      )

      await queryClient.invalidateQueries({
        queryKey: pendingInvitesQueryKey,
      })
    },
    onError: (error) => {
      setInviteRequestError(
        error instanceof Error ? error.message : 'Unable to delete invite',
      )
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async ({ email }: ResendInvitePayload) => {
      await requestApi(
        '/api/partner-invites',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
        'Unable to resend invite',
      )
    },
    onMutate: () => {
      setInviteValidationError(null)
      setInviteRequestError(null)
      setInviteNotice(null)
      setAcceptInviteNotice(null)
    },
    onSuccess: async (_data, variables) => {
      setInviteNotice(`Invite resent to ${variables.email}`)

      await queryClient.invalidateQueries({
        queryKey: pendingInvitesQueryKey,
      })
    },
    onError: (error) => {
      setInviteRequestError(
        error instanceof Error ? error.message : 'Unable to resend invite',
      )
    },
  })

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await requestApi(
        '/api/partner-invites',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ inviteId }),
        },
        'Unable to accept invite',
      )
    },
    onMutate: () => {
      setAcceptInviteError(null)
      setAcceptInviteNotice(null)
      setInviteNotice(null)
    },
    onSuccess: async () => {
      setAcceptInviteNotice('Partnership activated')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pendingInvitesQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: partnerStatusQueryKey(localDate),
        }),
      ])
    },
    onError: (error) => {
      setAcceptInviteError(
        error instanceof Error ? error.message : 'Unable to accept invite',
      )
    },
  })

  const rejectInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await requestApi(
        '/api/partner-invites',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ inviteId, action: 'reject' }),
        },
        'Unable to reject invite',
      )
    },
    onMutate: () => {
      setAcceptInviteError(null)
      setAcceptInviteNotice(null)
      setInviteNotice(null)
    },
    onSuccess: async () => {
      setAcceptInviteNotice('Invite rejected')
      await queryClient.invalidateQueries({
        queryKey: pendingInvitesQueryKey,
      })
    },
    onError: (error) => {
      setAcceptInviteError(
        error instanceof Error ? error.message : 'Unable to reject invite',
      )
    },
  })

  const removePartnerMutation = useMutation({
    mutationFn: async () => {
      await requestApi(
        '/api/partnerships',
        {
          method: 'DELETE',
        },
        'Unable to remove partner',
      )
    },
    onMutate: () => {
      setRemovePartnerError(null)
      setRemovePartnerNotice(null)
      setAcceptInviteNotice(null)
      setInviteNotice(null)
    },
    onSuccess: async () => {
      queryClient.setQueryData(partnerStatusQueryKey(localDate), {
        hasPartner: false,
        startedOn: null,
        partnerEmail: null,
        habits: [] as PartnerHabit[],
      })

      await queryClient.invalidateQueries({
        queryKey: pendingInvitesQueryKey,
      })

      setRemovePartnerNotice('Partner removed')
    },
    onError: (error) => {
      setRemovePartnerError(
        error instanceof Error ? error.message : 'Unable to remove partner',
      )
    },
  })

  const sendNudgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/nudges', {
        method: 'POST',
      })
      const payload = (await parseJsonPayload(response)) as
        | NudgeMutationPayload
        | NudgeErrorPayload
        | null

      if (!response.ok) {
        const errorMessage =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof payload.error === 'string' &&
          payload.error.trim().length > 0
            ? payload.error
            : 'Unable to send nudge'

        const mutationError = new Error(errorMessage) as NudgeRequestError

        if (
          payload &&
          typeof payload === 'object' &&
          'code' in payload &&
          payload.code === 'NUDGE_COOLDOWN' &&
          'retryAfterSeconds' in payload &&
          typeof payload.retryAfterSeconds === 'number' &&
          payload.retryAfterSeconds > 0
        ) {
          mutationError.retryAfterSeconds = payload.retryAfterSeconds
        }

        throw mutationError
      }

      return payload as NudgeMutationPayload | null
    },
    onMutate: () => {
      setNudgeError(null)
      setNudgeNotice(null)
    },
    onSuccess: (payload) => {
      const cooldownSeconds = payload?.limits?.cooldownSeconds

      if (typeof cooldownSeconds === 'number' && cooldownSeconds > 0) {
        setNudgeCooldownEndsAt(Date.now() + cooldownSeconds * 1000)
      }

      setNudgeNotice('Nudge sent')
    },
    onError: (error) => {
      const mutationError = error as NudgeRequestError

      if (
        typeof mutationError.retryAfterSeconds === 'number' &&
        mutationError.retryAfterSeconds > 0
      ) {
        setNudgeCooldownEndsAt(
          Date.now() + mutationError.retryAfterSeconds * 1000,
        )
      }

      setNudgeError(
        error instanceof Error ? error.message : 'Unable to send nudge',
      )
    },
  })

  const handleInviteEmailChange = (value: string) => {
    setInviteValidationError(null)
    setInviteRequestError(null)
    setInviteNotice(null)
    setAcceptInviteError(null)
    setAcceptInviteNotice(null)
    setNudgeError(null)
    setNudgeNotice(null)
    setInviteEmail(value)
  }

  const handleInviteSubmit = () => {
    if (inviteMutation.isPending) {
      return
    }

    const sentInvites = pendingInvitesQuery.data?.sentInvites ?? []

    if (sentInvites.length > 0) {
      setInviteValidationError('You already have a pending invite')
      return
    }

    const email = inviteEmail.trim()

    if (!email) {
      setInviteValidationError('Partner email is required')
      return
    }

    inviteMutation.mutate(email)
  }

  const handleInviteAccept = (inviteId: string) => {
    if (acceptInviteMutation.isPending) {
      return
    }

    acceptInviteMutation.mutate(inviteId)
  }

  const handleSendNudge = () => {
    if (sendNudgeMutation.isPending || nudgeCooldownSecondsRemaining > 0) {
      if (nudgeCooldownSecondsRemaining > 0) {
        setNudgeError(
          `Nudge cooldown active. Try again in ${formatNudgeCooldown(nudgeCooldownSecondsRemaining)}`,
        )
      }

      return
    }

    sendNudgeMutation.mutate()
  }

  const handleRemovePartner = () => {
    if (removePartnerMutation.isPending) {
      return
    }

    removePartnerMutation.mutate()
  }

  const handleInviteReject = (inviteId: string) => {
    if (rejectInviteMutation.isPending) {
      return
    }

    rejectInviteMutation.mutate(inviteId)
  }

  const handleInviteDelete = (inviteId: string) => {
    if (deleteInviteMutation.isPending) {
      return
    }

    const inviteToDelete = (pendingInvitesQuery.data?.sentInvites ?? []).find(
      (invite) => invite.id === inviteId,
    )

    if (!inviteToDelete) {
      setInviteRequestError('Invite not found')
      return
    }

    deleteInviteMutation.mutate({
      id: inviteToDelete.id,
      status: inviteToDelete.status,
    })
  }

  const handleInviteResend = (inviteId: string) => {
    if (resendInviteMutation.isPending) {
      return
    }

    const rejectedInvite = (pendingInvitesQuery.data?.sentInvites ?? []).find(
      (invite) => invite.id === inviteId && invite.status === 'rejected',
    )

    if (!rejectedInvite) {
      setInviteRequestError('Invite not found')
      return
    }

    resendInviteMutation.mutate({
      id: rejectedInvite.id,
      email: rejectedInvite.inviteeEmail,
    })
  }

  return {
    habits: partnerStatusQuery.data?.habits ?? [],
    startedOn: partnerStatusQuery.data?.startedOn ?? null,
    partnerEmail: partnerStatusQuery.data?.partnerEmail ?? null,
    errorMessage: partnerStatusQuery.error?.message ?? null,
    isLoading: partnerStatusQuery.isLoading,
    hasPartner: partnerStatusQuery.data?.hasPartner ?? false,
    inviteEmail,
    inviteError: inviteValidationError ?? inviteRequestError,
    inviteNotice,
    isInviteSubmitting: inviteMutation.isPending,
    pendingInvites: pendingInvitesQuery.data?.receivedInvites ?? [],
    sentInvites: pendingInvitesQuery.data?.sentInvites ?? [],
    canSendInvite: (pendingInvitesQuery.data?.sentInvites.length ?? 0) === 0,
    deletingInviteId: deleteInviteMutation.isPending
      ? deleteInviteMutation.variables.id
      : null,
    resendingInviteId: resendInviteMutation.isPending
      ? resendInviteMutation.variables.id
      : null,
    pendingInvitesError: pendingInvitesQuery.error?.message ?? null,
    isPendingInvitesLoading: pendingInvitesQuery.isLoading,
    acceptingInviteId: acceptInviteMutation.isPending
      ? acceptInviteMutation.variables
      : null,
    rejectingInviteId: rejectInviteMutation.isPending
      ? rejectInviteMutation.variables
      : null,
    acceptInviteError,
    acceptInviteNotice,
    nudgeError,
    nudgeNotice,
    nudgeCooldownSecondsRemaining,
    isNudgeOnCooldown: nudgeCooldownSecondsRemaining > 0,
    isSendingNudge: sendNudgeMutation.isPending,
    isRemovingPartner: removePartnerMutation.isPending,
    removePartnerError,
    removePartnerNotice,
    handleInviteEmailChange,
    handleInviteSubmit,
    handleInviteDelete,
    handleInviteResend,
    handleInviteAccept,
    handleInviteReject,
    handleSendNudge,
    handleRemovePartner,
  }
}
