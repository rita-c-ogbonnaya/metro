import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PeopleIcon from "@mui/icons-material/People";
import BuildIcon from "@mui/icons-material/Build";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import StarRateIcon from "@mui/icons-material/StarRate";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import EmailIcon from "@mui/icons-material/Email";
import { useRole, Role } from "@/lib/role-context";
import { clearAllSession } from "@/lib/session";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navByRole: Record<Role, { section: string; items: NavItem[] }[]> = {
  manager: [
    {
      section: "Workspace",
      items: [
        { to: "/manager", label: "Overview", icon: <DashboardIcon fontSize="small" /> },
        { to: "/manager/properties", label: "Properties", icon: <HomeWorkIcon fontSize="small" /> },
        { to: "/manager/tenants", label: "Tenants", icon: <PeopleIcon fontSize="small" /> },
        { to: "/manager/maintenance", label: "Maintenance", icon: <BuildIcon fontSize="small" /> },
        { to: "/manager/financials", label: "Financials", icon: <BarChartIcon fontSize="small" /> },
        { to: "/manager/reports", label: "Report Analysis", icon: <AssessmentIcon fontSize="small" /> },
      ],
    },
    {
      section: "More",
      items: [
        { to: "/manager/documents", label: "Documents", icon: <DescriptionIcon fontSize="small" /> },
        { to: "/manager/emails", label: "Sent Emails", icon: <EmailIcon fontSize="small" /> },
        { to: "/manager/notifications", label: "Notifications", icon: <NotificationsIcon fontSize="small" /> },
        { to: "/manager/settings", label: "Settings", icon: <SettingsIcon fontSize="small" /> },
      ],
    },
  ],
  landlord: [
    {
      section: "Portfolio",
      items: [
        { to: "/landlord", label: "Overview", icon: <DashboardIcon fontSize="small" /> },
        { to: "/landlord/properties", label: "My Properties", icon: <HomeWorkIcon fontSize="small" /> },
        { to: "/landlord/tenants", label: "Tenants", icon: <PeopleIcon fontSize="small" /> },
        { to: "/landlord/financials", label: "Financials", icon: <BarChartIcon fontSize="small" /> },
        { to: "/landlord/documents", label: "Documents", icon: <DescriptionIcon fontSize="small" /> },
      ],
    },
  ],
  tenant: [
    {
      section: "My Home",
      items: [
        { to: "/tenant", label: "Overview", icon: <DashboardIcon fontSize="small" /> },
        { to: "/tenant/rent", label: "My Rent", icon: <RequestQuoteIcon fontSize="small" /> },
        { to: "/tenant/maintenance", label: "Maintenance", icon: <BuildIcon fontSize="small" /> },
        { to: "/tenant/documents", label: "Documents", icon: <DescriptionIcon fontSize="small" /> },
        { to: "/tenant/loan", label: "Rent Loan", icon: <RequestQuoteIcon fontSize="small" /> },
        { to: "/tenant/reviews", label: "Reviews", icon: <StarRateIcon fontSize="small" /> },
      ],
    },
  ],
};

const userByRole: Record<Role, { name: string; role: string }> = {
  manager: { name: "Adesuwa Edun", role: "Property Manager" },
  landlord: { name: "Adebayo Ogunlesi", role: "Landlord" },
  tenant: { name: "Tunde Bakare", role: "Tenant" },
};

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: Props) {
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const sections = navByRole[role];
  const user = userByRole[role];
  const width = collapsed ? 76 : 260;

  const handleLogout = () => {
    clearAllSession();
    navigate({ to: "/" });
  };

  return (
    <Box
      component="aside"
      sx={{
        width,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
        transition: "width 200ms ease",
      }}
    >
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1,
          borderBottom: "1px solid var(--border-subtle)",
          minHeight: 72,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, height: 48 }}>
            <img
              src="/manajalogo.png"
              alt="Manaja"
              style={{ height: 40, width: "auto", objectFit: "contain" }}
            />
          </Box>
        )}
        <Tooltip title={collapsed ? "Open menu" : "Collapse menu"} placement="right">
          <IconButton size="small" onClick={onToggle} sx={{ color: "text.secondary" }}>
            <MenuOpenIcon
              fontSize="small"
              sx={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
        {sections.map((section) => (
          <Box key={section.section} sx={{ mb: 2 }}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 2.5,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {section.section}
              </Typography>
            )}
            <Box sx={{ mt: collapsed ? 0 : 1 }}>
              {section.items.map((item) => {
                const active = location.pathname === item.to;
                const inner = (
                  <Box
                    sx={{
                      mx: 1,
                      my: 0.25,
                      px: collapsed ? 0 : 1.5,
                      py: 1.1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: collapsed ? "center" : "flex-start",
                      gap: 1.5,
                      borderRadius: 2,
                      color: active ? "primary.main" : "text.secondary",
                      backgroundColor: active ? "rgba(26,86,219,0.12)" : "transparent",
                      borderLeft: active && !collapsed ? "3px solid #1A56DB" : "3px solid transparent",
                      transition: "all 200ms",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "rgba(26,86,219,0.08)" },
                    }}
                  >
                    <Box sx={{ display: "flex" }}>{item.icon}</Box>
                    {!collapsed && (
                      <Typography variant="body2" sx={{ fontWeight: active ? 600 : 500 }}>
                        {item.label}
                      </Typography>
                    )}
                  </Box>
                );
                return (
                  <Link key={item.to} to={item.to} style={{ textDecoration: "none", display: "block" }}>
                    {collapsed ? (
                      <Tooltip title={item.label} placement="right">{inner}</Tooltip>
                    ) : (
                      inner
                    )}
                  </Link>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          p: collapsed ? 1 : 2,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 1 : 1.5,
        }}
      >
        <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14 }}>
          {user.name.split(" ").map((n) => n[0]).join("")}
        </Avatar>
        {!collapsed ? (
          <>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                {user.role}
              </Typography>
            </Box>
            <Tooltip title="Sign out">
              <IconButton size="small" onClick={handleLogout} sx={{ color: "text.secondary" }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Sign out" placement="right">
            <IconButton size="small" onClick={handleLogout} sx={{ color: "text.secondary" }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
