// ApnaKharcha CRM Service Worker
// Push Notifications + PWA Support

// Install Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Notification
self.addEventListener("push", (event) => {
  let payload = {
    title: "ApnaKharcha CRM",
    body: "",
  };

  try {
    if (event.data) payload = event.data.json();
  } catch {
    payload = {
      title: "ApnaKharcha CRM",
      body: event.data ? event.data.text() : "",
    };
  }

  const { title, body, data, icon } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "ApnaKharcha CRM", {
      body: body || "",
      icon: icon || "/pwa/icon-192.png",
      badge: "/pwa/icon-192.png",
      data: data || {},
      tag: data?.leadId ? `lead-${data.leadId}` : "general",
      renotify: true,
      requireInteraction: true,
    })
  );
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const leadId = event.notification.data?.leadId;
  const targetUrl = leadId ? `/crm/leads/${leadId}` : "/crm/leads";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});