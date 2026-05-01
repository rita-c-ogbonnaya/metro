import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1A56DB", dark: "#1240A8", light: "#EEF3FF" },
    secondary: { main: "#F5A623", dark: "#C47D0E" },
    background: { default: "#0A0C14", paper: "#111827" },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    info: { main: "#3B82F6" },
    text: { primary: "#F9FAFB", secondary: "#9CA3AF" },
    divider: "#1E2A3A",
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    caption: { fontWeight: 400 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #1E2A3A",
          backgroundImage: "none",
          backgroundColor: "#111827",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }: any) => ({
          borderRadius: 8,
          padding: "8px 20px",
          ...(ownerState?.variant === "contained" &&
            ownerState?.color === "primary" && {
              boxShadow: "0 0 16px rgba(26,86,219,0.25)",
            }),
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#1A2233",
          fontWeight: 600,
          color: "#9CA3AF",
          borderBottom: "1px solid #1E2A3A",
        },
        body: { borderBottom: "1px solid #1E2A3A" },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 20, fontWeight: 500 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: "#111827", backgroundImage: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
  },
});
