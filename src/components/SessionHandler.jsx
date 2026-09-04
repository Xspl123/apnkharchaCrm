import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchMe, logout } from "../features/auth/state/authSlice";
import { setSessionExpiredHandler } from "../api/authSession";

const SessionHandler = () => {
    const dispatch = useDispatch();

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

    return null;
};

export default SessionHandler;
