import { Box, Typography, IconButton, Avatar, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";
import { useRole } from "@/lib/role-context";
import { useAppTheme } from "@/lib/theme-context";
import { ReportSender } from "./ReportSender";

interface Props {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

const userByRole = {
  manager: { name: "Adesuwa Edun", initials: "AE" },
  landlord: { name: "Adebayo Ogunlesi", initials: "AO" },
  tenant: { name: "Tunde Bakare", initials: "TB" },
} as const;

export function Header({ title, subtitle, onToggleSidebar, showMenuButton }: Props) {
  const { role } = useRole();
  const { mode, toggle } = useAppTheme();
  const user = userByRole[role];

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, md: 3 },
        gap: 2,
        minHeight: 72,
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: mode === "dark" ? "rgba(13,17,23,0.7)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
        {showMenuButton && (
          <IconButton size="small" onClick={onToggleSidebar} sx={{ color: "text.primary" }}>
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: 16, md: 18 } }} noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {role === "manager" && <ReportSender buttonLabel="Send Report" />}

        <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton onClick={toggle} sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1, ml: 0.5, borderLeft: "1px solid var(--border-subtle)" }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 13, fontWeight: 700 }}>
            {user.initials}
          </Avatar>
          <Box sx={{ display: { xs: "none", md: "block" }, lineHeight: 1.1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
              {role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
