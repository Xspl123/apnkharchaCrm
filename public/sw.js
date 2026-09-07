// Minimal push-only service worker. It does NOT do any offline caching /
// PWA asset precaching — its only job is to receive Web Push events from
// the Laravel backend and turn them into an OS-level notification, and to
// route a click on that notification back into the app.

self.addEventListener('push', (event) => {
    let payload = { title: 'Notification', body: '' };
    try {
        if (event.data) payload = event.data.json();
    } catch {
        // Fallback for any push sent as plain text instead of JSON
        payload = { title: 'Notification', body: event.data ? event.data.text() : '' };
    }

    const { title, body, data, icon } = payload;

    event.waitUntil(
        self.registration.showNotification(title || 'Notification', {
            body: body || '',
            icon: icon || '/notification-icon.png',
            badge: '/notification-badge.png',
            data: data || {},
            tag: data?.leadId ? `lead-${data.leadId}` : undefined,
        })
    );
});

// Clicking the notification focuses an already-open tab if one exists,
// otherwise opens a new one — either way landing on the relevant lead.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const leadId = event.notification.data?.leadId;
    const targetUrl = leadId ? `/crm/leads/${leadId}` : '/crm/leads';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
            const existing = clientsArr.find((c) => 'focus' in c);
            if (existing) {
                existing.navigate(targetUrl);
                return existing.focus();
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});