// Browsers require the VAPID public key as a Uint8Array (raw bytes), but
// the backend hands it over as a URL-safe base64 string — this is the
// standard conversion snippet used across nearly every Web Push guide.
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Registers /sw.js (a no-op if already registered) and returns the
// registration, so callers can subscribe against it.
export async function registerServiceWorker() {
    if (!isPushSupported()) return null;
    return navigator.serviceWorker.register('/sw.js');
}

// Subscribes the current browser to push and returns the raw
// PushSubscription object (endpoint + keys) ready to send to the backend.
// vapidPublicKey is the string returned by GET /push/vapid-public-key.
export async function subscribeToPush(vapidPublicKey) {
    if (!isPushSupported() || !vapidPublicKey) return null;

    const registration = await registerServiceWorker();
    if (!registration) return null;

    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    return registration.pushManager.subscribe({
        userVisibleOnly: true, // required by Chrome: every push must show a visible notification
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
}

export async function getExistingSubscription() {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return null;
    return registration.pushManager.getSubscription();
}

export async function unsubscribeFromPush() {
    const subscription = await getExistingSubscription();
    if (!subscription) return null;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return endpoint;
}

// Converts the browser's PushSubscription object into the plain JSON
// shape the backend's StorePushSubscriptionRequest-style validation
// expects: { endpoint, keys: { p256dh, auth } }.
export function subscriptionToPayload(subscription) {
    const json = subscription.toJSON();
    return { endpoint: json.endpoint, keys: json.keys };
}