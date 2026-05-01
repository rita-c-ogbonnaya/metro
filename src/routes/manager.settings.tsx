import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button, Switch, Avatar, Divider,
  FormControlLabel, MenuItem, Stack,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { AppShell } from "@/components/metro/AppShell";
import { useAppTheme } from "@/lib/theme-context";
import { clearAllSession, persistJSON, readJSON } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/settings")({
  head: () => ({ meta: [{ title: "Settings — Metro Manaja" }] }),
  component: SettingsPage,
});

const DEFAULT_PROFILE = {
  name: "Adesuwa Edun",
  email: "adesuwa@metromanaja.ng",
  phone: "+234 801 234 5678",
  role: "Property Manager",
  org: "Badij Technologies",
};
const DEFAULT_NOTIF = { rent: true, maintenance: true, newTenants: true, weeklyDigest: false };

function SettingsPage() {
  const { mode, toggle } = useAppTheme();
  const navigate = useNavigate();
  // Initial render uses defaults to avoid SSR mismatch; effect syncs from storage
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [savedProfile, setSavedProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    const p = readJSON("metro-profile", DEFAULT_PROFILE);
    const n = readJSON("metro-notif-prefs", DEFAULT_NOTIF);
    setProfile(p);
    setSavedProfile(p);
    setNotif(n);
  }, []);

  // Persist toggles immediately when changed
  useEffect(() => { persistJSON("metro-notif-prefs", notif); }, [notif]);

  const dirty = JSON.stringify(profile) !== JSON.stringify(savedProfile);

  const handleSave = () => {
    persistJSON("metro-profile", profile);
    setSavedProfile(profile);
    toast.success("Profile saved");
  };
  const handleCancel = () => { setProfile(savedProfile); toast.message("Reverted to last saved values"); };

  const handleLogout = () => {
    clearAllSession();
    toast.success("Signed out — session cleared");
    navigate({ to: "/" });
  };

  return (
    <AppShell role="manager" title="Settings" subtitle="Manage your profile, preferences and account">
      <Box sx={{ display: "grid", gap: 3, maxWidth: 920 }}>
        {/* Profile */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Profile</Typography>
            <Typography variant="caption" color="text.secondary">Your personal and organisation details</Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 22, fontWeight: 700 }}>
                {profile.name.split(" ").map((n) => n[0]).join("")}
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{profile.name}</Typography>
                <Typography variant="caption" color="text.secondary">{profile.role} · {profile.org}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField label="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} fullWidth />
              <TextField label="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} fullWidth />
              <TextField label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} fullWidth />
              <TextField select label="Role" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} fullWidth>
                {["Property Manager", "Senior Manager", "Admin"].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSave} disabled={!dirty}>Save changes</Button>
              <Button variant="outlined" onClick={handleCancel} disabled={!dirty}>Cancel</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Preferences</Typography>
            <Typography variant="caption" color="text.secondary">Theme and notification settings</Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Appearance</Typography>
                <Typography variant="caption" color="text.secondary">Currently {mode} mode</Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                onClick={toggle}
              >
                Switch to {mode === "dark" ? "light" : "dark"}
              </Button>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {[
              { key: "rent" as const, label: "Rent reminders", desc: "Notify me before rent is due or overdue" },
              { key: "maintenance" as const, label: "Maintenance updates", desc: "When tenants raise or update requests" },
              { key: "newTenants" as const, label: "Tenant onboarding", desc: "When a new tenant is added or signs an agreement" },
              { key: "weeklyDigest" as const, label: "Weekly digest", desc: "Summary of activity every Monday" },
            ].map((row) => (
              <Box key={row.key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.desc}</Typography>
                </Box>
                <FormControlLabel
                  control={<Switch checked={notif[row.key]} onChange={(_, v) => setNotif({ ...notif, [row.key]: v })} />}
                  label=""
                />
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Security / Account */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Account</Typography>
            <Typography variant="caption" color="text.secondary">Sign out of this device</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign out</Typography>
                <Typography variant="caption" color="text.secondary">You will need to log in again to access your dashboard.</Typography>
              </Box>
              <Button color="error" variant="contained" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppShell>
  );
}
