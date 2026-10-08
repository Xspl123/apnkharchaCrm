import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, logout, logoutUser } from "../features/auth/state/authSlice";
import { setSessionExpiredHandler } from "../api/authSession";

const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const LAST_ACTIVITY_KEY = "lastActivityAt";
const ACTIVITY_WRITE_INTERVAL_MS = 10 * 1000;

const SessionHandler = () => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.auth?.token);

    useEffect(() => {
        if (localStorage.getItem("token")) {
            dispatch(fetchMe());
        }
    }, [dispatch]);

    useEffect(() => {
        setSessionExpiredHandler(() => {
            dispatch(logout());
            if (window.location.pathname !== "/") {
                window.location.assign("/");
            }
        });

        return () => setSessionExpiredHandler(null);
    }, [dispatch]);

    useEffect(() => {
        const activeToken = token || localStorage.getItem("token");
        if (!activeToken) {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            return undefined;
        }

        let timerId;
        let lastActivityWrite = 0;
        let hasExpired = false;

        const expireSession = () => {
            if (hasExpired) return;
            hasExpired = true;
            // Send the logout request while the current token is still available.
            void dispatch(logoutUser());
            dispatch(logout());
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            if (window.location.pathname !== "/") {
                window.location.assign("/");
            }
        };

        const checkIdleTime = () => {
            window.clearTimeout(timerId);
            const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now();
            const remainingTime = IDLE_TIMEOUT_MS - (Date.now() - lastActivity);

            if (remainingTime <= 0) {
                expireSession();
                return;
            }

            timerId = window.setTimeout(checkIdleTime, remainingTime);
        };

        const recordActivity = () => {
            const now = Date.now();
            const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || now;
            if (now - lastActivity >= IDLE_TIMEOUT_MS) {
                expireSession();
                return;
            }

            if (now - lastActivityWrite >= ACTIVITY_WRITE_INTERVAL_MS) {
                localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
                lastActivityWrite = now;
            }
            checkIdleTime();
        };

        const handleStorage = (event) => {
            if (event.key === LAST_ACTIVITY_KEY) checkIdleTime();
        };

        if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
            localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        }

        const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"];
        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, recordActivity, { passive: true });
        });
        window.addEventListener("storage", handleStorage);
        checkIdleTime();

        return () => {
            window.clearTimeout(timerId);
            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, recordActivity);
            });
            window.removeEventListener("storage", handleStorage);
        };
    }, [dispatch, token]);

    return null;
};

export default SessionHandler;
