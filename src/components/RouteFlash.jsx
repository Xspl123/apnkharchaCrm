import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";

const RouteFlash = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("info");

    useEffect(() => {
        const flash = location.state?.flash;
        if (!flash?.message) {
            return;
        }

        setMessage(flash.message);
        setSeverity(flash.severity || "info");
        setOpen(true);

        navigate(
            { pathname: location.pathname, search: location.search },
            { replace: true, state: null }
        );
    }, [location.pathname, location.search, location.state, navigate]);

    return (
        <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert severity={severity} onClose={() => setOpen(false)} variant="filled">
                {message}
            </Alert>
        </Snackbar>
    );
};

export default RouteFlash;
