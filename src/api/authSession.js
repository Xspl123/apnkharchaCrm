let onSessionExpired = null;

export function setSessionExpiredHandler(handler) {
    onSessionExpired = handler;
}

export function notifySessionExpired() {
    onSessionExpired?.();
}
