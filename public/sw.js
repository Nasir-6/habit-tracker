self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  let payload = null

  try {
    payload = event.data.json()
  } catch {
    return
  }

  const payloadType =
    typeof payload?.type === 'string' ? payload.type : 'unknown'
  const title =
    typeof payload?.title === 'string' && payload.title.trim().length > 0
      ? payload.title.trim()
      : payloadType === 'habit_reminder'
        ? 'Habit reminder'
        : 'Habit nudge'
  const body =
    typeof payload?.body === 'string' && payload.body.trim().length > 0
      ? payload.body.trim()
      : payloadType === 'habit_reminder'
        ? 'Time to check in on your habit.'
        : 'Your partner sent you a nudge.'
  const url =
    typeof payload?.url === 'string' && payload.url.startsWith('/')
      ? payload.url
      : '/'
  const reminderTag =
    typeof payload?.habitId === 'string' && payload.habitId.trim().length > 0
      ? `habit-reminder:${payload.habitId}`
      : 'habit-reminder'
  const bannerPayload = {
    type: 'partner_nudge_banner',
    title,
    body,
    url,
    nudgeId: typeof payload?.nudgeId === 'string' ? payload.nudgeId : undefined,
    createdAt:
      typeof payload?.createdAt === 'string' ? payload.createdAt : undefined,
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        if (payloadType === 'partner_nudge') {
          const visibleClients = clients.filter(
            (client) => client.visibilityState === 'visible',
          )

          if (visibleClients.length > 0) {
            visibleClients.forEach((client) => {
              client.postMessage(bannerPayload)
            })
            return undefined
          }
        }

        return self.registration.showNotification(title, {
          body,
          tag:
            payloadType === 'habit_reminder'
              ? reminderTag
              : bannerPayload.nudgeId,
          data: {
            type: payloadType,
            url,
            habitId:
              typeof payload?.habitId === 'string'
                ? payload.habitId
                : undefined,
          },
          renotify: false,
        })
      }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data
  const url =
    typeof notificationData?.url === 'string' &&
    notificationData.url.startsWith('/')
      ? notificationData.url
      : '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            if ('navigate' in client) {
              return client.navigate(url).then(() => client.focus())
            }

            return client.focus()
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }

        return undefined
      }),
  )
})
