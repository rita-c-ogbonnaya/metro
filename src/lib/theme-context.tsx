import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { ThemeProvider as MUIThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { muiTheme as darkMuiTheme } from "@/lib/theme";

export type Mode = "light" | "dark";

interface Ctx {
  mode: Mode;
  toggle: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const ThemeCtx = createContext<Ctx>({
  mode: "dark",
  toggle: () => {},
  sidebarCollapsed: false,
  toggleSidebar: () => {},
});

const lightMuiTheme = createTheme({
  ...darkMuiTheme,
  palette: {
    ...darkMuiTheme.palette,
    mode: "light",
    primary: { main: "#1A56DB", dark: "#1240A8", light: "#EEF3FF" },
    secondary: { main: "#F5A623", dark: "#C47D0E" },
    background: { default: "#F7F8FB", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#64748B" },
    divider: "#E2E8F0",
  },
  components: {
    ...darkMuiTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E2E8F0",
          backgroundImage: "none",
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#F1F5F9",
          fontWeight: 600,
          color: "#64748B",
          borderBottom: "1px solid #E2E8F0",
        },
        body: { borderBottom: "1px solid #E2E8F0" },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { backgroundColor: "#FFFFFF", backgroundImage: "none" } },
    },
  },
});

// SSR-safe defaults — server always renders with these. The pre-hydration
// script in __root.tsx applies the stored class to <html> before React paints
// so there is no flash, and the client mount syncs React state to the same value.
const DEFAULT_MODE: Mode = "dark";
const DEFAULT_COLLAPSED = false;

function readStoredMode(): Mode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const m = window.localStorage.getItem("metro-theme");
  return m === "light" || m === "dark" ? m : DEFAULT_MODE;
}
function readStoredCollapsed(): boolean {
  if (typeof window === "undefined") return DEFAULT_COLLAPSED;
  return window.localStorage.getItem("metro-sidebar") === "1";
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  // Render with SSR defaults to avoid hydration mismatch, then sync to stored
  // value on mount in a single effect — never overwrite stored value with default.
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(DEFAULT_COLLAPSED);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMode(readStoredMode());
    setSidebarCollapsed(readStoredCollapsed());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(mode);
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    // Only persist after we've hydrated from storage — prevents the SSR
    // default from clobbering a previously-saved preference on first render.
    if (hydrated) localStorage.setItem("metro-theme", mode);
  }, [mode, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("metro-sidebar", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed, hydrated]);

  const value = useMemo(
    () => ({
      mode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((c) => !c),
    }),
    [mode, sidebarCollapsed]
  );

  const theme = mode === "dark" ? darkMuiTheme : lightMuiTheme;

  return (
    <ThemeCtx.Provider value={value}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeCtx.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeCtx);
