import { ReactNode, useEffect, useState } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAppTheme } from "@/lib/theme-context";
import { useLockRole, Role } from "@/lib/role-context";
import { useLocation } from "@tanstack/react-router";

interface Props {
  title: string;
  subtitle?: string;
  /** Locks the active role for this page so identity/sidebar/features always match the route. */
  role?: Role;
  children: ReactNode;
}

export function AppShell({ title, subtitle, role, children }: Props) {
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  useLockRole(role ?? "manager");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleToggle = () => {
    if (isMobile) setMobileOpen((o) => !o);
    else toggleSidebar();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { sx: { width: 280, border: 0 } } }}
        >
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header title={title} subtitle={subtitle} onToggleSidebar={handleToggle} showMenuButton={isMobile} />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
