import { alpha, createTheme } from "@mui/material/styles";

const getDesignTokens = (mode) => {
  const isDark = mode === "dark";
  const primary = isDark ? "#7DD3FC" : "#2563EB";
  const secondary = isDark ? "#C084FC" : "#7C3AED";
  const accent = isDark ? "#38BDF8" : "#0EA5E9";
  const bgDefault = isDark ? "#0B1220" : "#F6F8FC";
  const bgPaper = isDark ? "#111827" : "#FFFFFF";
  const textPrimary = isDark ? "#E5EEF9" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#475569";
  const divider = isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(15, 23, 42, 0.08)";

  return {
    palette: {
      mode,
      primary: { main: primary },
      secondary: { main: secondary },
      background: {
        default: bgDefault,
        paper: bgPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider,
      success: { main: "#22C55E" },
      warning: { main: "#F59E0B" },
      error: { main: "#EF4444" },
      action: {
        hover: isDark ? alpha(primary, 0.12) : alpha(primary, 0.06),
        selected: isDark ? alpha(primary, 0.18) : alpha(primary, 0.12),
      },
      appShell: {
        accent,
        subtleSurface: isDark ? "#182235" : "#F8FAFC",
        elevatedSurface: isDark ? "#0F172A" : "#FFFFFF",
        heroGradient: isDark
          ? `linear-gradient(135deg, ${alpha("#2563EB", 0.3)} 0%, ${alpha(
              "#7C3AED",
              0.22
            )} 55%, rgba(15, 23, 42, 0.92) 100%)`
          : "linear-gradient(135deg, #2563EB 0%, #7C3AED 55%, #0EA5E9 100%)",
        sidebarGradient: isDark
          ? "linear-gradient(180deg, rgba(37, 99, 235, 0.32) 0%, #081120 18%, #0F172A 100%)"
          : "linear-gradient(180deg, #2563EB 0%, #7C3AED 100%)",
      },
    },
    typography: {
      fontFamily: `"Inter", "Segoe UI", sans-serif`,
      h4: { fontWeight: 700, letterSpacing: "-0.03em" },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      body1: { fontSize: "0.95rem" },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark
              ? "linear-gradient(180deg, #0B1220 0%, #111827 100%)"
              : "linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
            color: textPrimary,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            color: textPrimary,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.06)"}`,
            boxShadow: isDark
              ? "0 12px 40px rgba(2, 6, 23, 0.34)"
              : "0 12px 40px rgba(15, 23, 42, 0.08)",
            color: textPrimary,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12 },
          containedPrimary: { color: "#fff" },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha("#fff", 0.03) : alpha("#fff", 0.7),
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(primary, 0.8),
            },
          },
          notchedOutline: {
            borderColor: divider,
          },
          input: {
            color: textPrimary,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: textSecondary,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${divider}`,
            color: textPrimary,
          },
          head: {
            backgroundColor: isDark ? alpha(primary, 0.18) : primary,
            color: "#fff",
            fontWeight: 700,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&.MuiTableRow-hover:hover": {
              backgroundColor: isDark ? alpha(primary, 0.12) : alpha(primary, 0.05),
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${divider}`,
            backgroundColor: bgPaper,
            color: textPrimary,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: isDark ? alpha(primary, 0.14) : alpha(primary, 0.08),
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${divider}`,
            backgroundColor: bgPaper,
            color: textPrimary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "none",
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode = "light") =>
  createTheme(getDesignTokens(mode));

export default createAppTheme;
