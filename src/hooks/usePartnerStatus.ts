import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { PartnerHabit, PendingPartnerInvite } from '@/types/dashboard'

import { useLocalDate } from '@/context/local-date'
import { requestApi } from '@/lib/client-api'

const partnerStatusQueryKey = (localDate: string) =>
  ['partner-status', localDate] as const
const pendingInvitesQueryKey = ['partner-pending-invites'] as const

export function usePartnerStatus() {
  const localDate = useLocalDate()
  const queryClient = useQueryClient()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
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
          habits: [] as PartnerHabit[],
        }
      }

      const payload = (await response.json()) as {
        error?: string
        partner?: { startedOn?: string }
        habits?: PartnerHabit[]
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load partner status')
      }

      return {
        hasPartner: true,
        startedOn: payload.partner?.startedOn ?? null,
        habits: Array.isArray(payload.habits) ? payload.habits : [],
      }
    },
  })

  const pendingInvitesQuery = useQuery({
    queryKey: pendingInvitesQueryKey,
    queryFn: async () => {
      const payload = await requestApi<{ invites?: PendingPartnerInvite[] }>(
        '/api/partner-invites',
        undefined,
        'Unable to load partner invites',
      )

      return Array.isArray(payload.invites) ? payload.invites : []
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return requestApi<{ error?: string }>(
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
  })

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      return requestApi<{ error?: string }>(
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
  })

  const removePartnerMutation = useMutation({
    mutationFn: async () => {
      return requestApi<{ revoked?: boolean }>(
        '/api/partnerships',
        {
          method: 'DELETE',
        },
        'Unable to remove partner',
      )
    },
  })

  const handleInviteEmailChange = (value: string) => {
    setAcceptInviteError(null)
    setAcceptInviteNotice(null)
    setInviteError(null)
    setInviteNotice(null)
    setInviteEmail(value)
  }

  const handleInviteSubmit = async () => {
    if (inviteMutation.isPending) {
      return
    }

    const email = inviteEmail.trim()

    if (!email) {
      setInviteError('Partner email is required')
      setInviteNotice(null)
      return
    }

    setInviteError(null)
    setInviteNotice(null)

    try {
      await inviteMutation.mutateAsync(email)
      setInviteEmail('')
      setInviteNotice(`Invite sent to ${email}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send invite'
      setInviteError(message)
    }
  }

  const handleInviteAccept = async (inviteId: string) => {
    if (acceptInviteMutation.isPending) {
      return
    }

    setAcceptInviteError(null)
    setAcceptInviteNotice(null)

    try {
      await acceptInviteMutation.mutateAsync(inviteId)
      setAcceptInviteNotice('Partnership activated')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pendingInvitesQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: partnerStatusQueryKey(localDate),
        }),
      ])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to accept invite'
      setAcceptInviteError(message)
    }
  }

  const handleRemovePartner = async () => {
    if (removePartnerMutation.isPending) {
      return
    }

    setRemovePartnerError(null)
    setRemovePartnerNotice(null)

    try {
      await removePartnerMutation.mutateAsync()

      queryClient.setQueryData(partnerStatusQueryKey(localDate), {
        hasPartner: false,
        startedOn: null,
        habits: [] as PartnerHabit[],
      })

      await queryClient.invalidateQueries({
        queryKey: pendingInvitesQueryKey,
      })

      setRemovePartnerNotice('Partner removed')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to remove partner'
      setRemovePartnerError(message)
    }
  }

  return {
    habits: partnerStatusQuery.data?.habits ?? [],
    startedOn: partnerStatusQuery.data?.startedOn ?? null,
    errorMessage: partnerStatusQuery.error?.message ?? null,
    isLoading: partnerStatusQuery.isLoading,
    hasPartner: partnerStatusQuery.data?.hasPartner ?? false,
    inviteEmail,
    inviteError,
    inviteNotice,
    isInviteSubmitting: inviteMutation.isPending,
    pendingInvites: pendingInvitesQuery.data ?? [],
    pendingInvitesError: pendingInvitesQuery.error?.message ?? null,
    isPendingInvitesLoading: pendingInvitesQuery.isLoading,
    acceptingInviteId: acceptInviteMutation.isPending
      ? acceptInviteMutation.variables
      : null,
    acceptInviteError,
    acceptInviteNotice,
    isRemovingPartner: removePartnerMutation.isPending,
    removePartnerError,
    removePartnerNotice,
    handleInviteEmailChange,
    handleInviteSubmit,
    handleInviteAccept,
    handleRemovePartner,
  }
}
