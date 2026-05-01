import { ReactNode } from "react";
import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import ConstructionIcon from "@mui/icons-material/Construction";
import { AppShell } from "@/components/metro/AppShell";
import type { Role } from "@/lib/role-context";

export function StubPage({
  title,
  subtitle,
  description,
  icon,
  role,
}: {
  title: string;
  subtitle?: string;
  description: string;
  icon?: ReactNode;
  role?: Role;
}) {
  return (
    <AppShell title={title} subtitle={subtitle} role={role}>
      <Card sx={{ maxWidth: 720, mx: "auto", mt: 6 }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Box sx={{ width: 72, height: 72, mx: "auto", mb: 2, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(26,86,219,0.12)", color: "#1A56DB" }}>
            {icon || <ConstructionIcon sx={{ fontSize: 36 }} />}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: "auto" }}>
            {description}
          </Typography>
          <Box sx={{ mt: 3, display: "flex", gap: 1.5, justifyContent: "center" }}>
            <Button variant="contained">Coming Soon</Button>
            <Button variant="outlined">Request Early Access</Button>
          </Box>
        </CardContent>
      </Card>
    </AppShell>
  );
}
