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

  const title =
    typeof payload?.title === 'string' && payload.title.trim().length > 0
      ? payload.title.trim()
      : 'Habit nudge'
  const body =
    typeof payload?.body === 'string' && payload.body.trim().length > 0
      ? payload.body.trim()
      : 'Your partner sent you a nudge.'
  const url =
    typeof payload?.url === 'string' && payload.url.startsWith('/')
      ? payload.url
      : '/'
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
        const hasVisibleClient = clients.some(
          (client) => client.visibilityState === 'visible',
        )

        if (hasVisibleClient) {
          clients.forEach((client) => {
            client.postMessage(bannerPayload)
          })
          return undefined
        }

        return self.registration.showNotification(title, {
          body,
          tag: bannerPayload.nudgeId,
          data: { url },
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
