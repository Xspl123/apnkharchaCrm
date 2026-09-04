import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import AppRoutes from "./AppRoutes";
import { createAppTheme } from "./theme";

function App() {
    const [colorMode, setColorMode] = useState(
        () => localStorage.getItem("colorMode") || "light"
    );
    const theme = useMemo(() => createAppTheme(colorMode), [colorMode]);

    useEffect(() => {
        localStorage.setItem("colorMode", colorMode);
    }, [colorMode]);

    useEffect(() => {
        document.documentElement.dataset.colorMode = colorMode;
    }, [colorMode]);

    const toggleColorMode = () => {
        setColorMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyles
                styles={{
                    "*": {
                        scrollbarWidth: "thin",
                    },
                    "*::-webkit-scrollbar": {
                        width: "10px",
                        height: "10px",
                    },
                    "*::-webkit-scrollbar-thumb": {
                        backgroundColor:
                            colorMode === "dark"
                                ? "rgba(148, 163, 184, 0.32)"
                                : "rgba(15, 23, 42, 0.18)",
                        borderRadius: "999px",
                    },
                    ".MuiTableContainer-root, .MuiDialog-paper, .MuiMenu-paper, .MuiPopover-paper": {
                        color: theme.palette.text.primary,
                    },
                    ".MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
                        backgroundColor:
                            colorMode === "dark"
                                ? "rgba(148, 163, 184, 0.035)"
                                : "rgba(15, 23, 42, 0.015)",
                    },
                    "[data-color-mode='dark'] .MuiPaper-root": {
                        color: `${theme.palette.text.primary} !important`,
                    },
                    "[data-color-mode='dark'] .MuiTableRow-hover:hover .MuiTableCell-root": {
                        color: `${theme.palette.text.primary} !important`,
                    },
                    "[data-color-mode='dark'] .MuiMenuItem-root:hover": {
                        color: `${theme.palette.text.primary} !important`,
                    },
                    "[data-color-mode='dark'] .MuiIconButton-root:hover": {
                        backgroundColor: `${theme.palette.action.hover} !important`,
                    },
                    "[data-color-mode='dark'] .MuiButton-outlined:hover": {
                        backgroundColor: `${theme.palette.action.hover} !important`,
                    },
                }}
            />
            <Router>
                <AppRoutes
                    colorMode={colorMode}
                    toggleColorMode={toggleColorMode}
                />
            </Router>
        </ThemeProvider>
    );
}

export default App;
