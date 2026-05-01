import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem, InputAdornment, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Avatar, Menu,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { differenceInDays } from "date-fns";
import { AppShell } from "@/components/metro/AppShell";
import { StatCard } from "@/components/metro/StatCard";
import { StatusChip } from "@/components/metro/StatusChip";
import { AddTenantModal } from "@/components/metro/AddTenantModal";
import { TenantDetailsDrawer } from "@/components/metro/TenantDetailsDrawer";
import { EditTenantModal } from "@/components/metro/EditTenantModal";
import { useStore } from "@/lib/mock-store";
import { Tenant } from "@/data/mock";
import { formatNGN, formatDate } from "@/lib/format";

export const Route = createFileRoute("/manager/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Metro Manaja" }] }),
  component: TenantsPage,
});

const TODAY = new Date("2025-04-27");

function bucketOf(rentDue: string, status: string) {
  if (status === "Overdue") return "Overdue";
  const d = differenceInDays(new Date(rentDue), TODAY);
  if (d <= 7) return "Due in 7 days";
  if (d <= 90) return "Due in 3 months";
  if (d <= 180) return "Due in 6 months";
  return "Active";
}

function TenantsPage() {
  const { tenants, properties } = useStore();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Tenant | null>(null);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; tenant: Tenant } | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");

  const buckets = useMemo(() => {
    const counts: Record<string, number> = { All: tenants.length, Overdue: 0, "Due in 7 days": 0, "Due in 3 months": 0, "Due in 6 months": 0, Shortlet: 0 };
    tenants.forEach((t) => {
      if (t.type === "Shortlet") counts.Shortlet++;
      const b = bucketOf(t.rentDue, t.rentStatus);
      if (counts[b] !== undefined) counts[b]++;
    });
    return counts;
  }, [tenants]);

  const filtered = useMemo(
    () =>
      tenants.filter((t) => {
        if (tab !== "All") {
          if (tab === "Shortlet" && t.type !== "Shortlet") return false;
          else if (tab !== "Shortlet" && bucketOf(t.rentDue, t.rentStatus) !== tab) return false;
        }
        if (q && !`${t.name} ${t.email}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [tenants, q, tab]
  );

  return (
    <AppShell role="manager" title="Tenants" subtitle="CRM with rent-status segmentation">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard icon={<PeopleIcon />} value={tenants.length} label="Total Tenants" sub={`${tenants.filter((t) => t.type === "Yearly").length} yearly · ${tenants.filter((t) => t.type === "Shortlet").length} shortlet`} trend={12} />
        <StatCard icon={<PeopleIcon />} value={buckets.Overdue} label="Overdue" sub="Action required" trend={-1} color="#EF4444" />
        <StatCard icon={<PeopleIcon />} value={buckets["Due in 7 days"]} label="Due in 7 Days" sub="Send reminders" trend={2} color="#F59E0B" />
        <StatCard icon={<PeopleIcon />} value={buckets["Due in 3 months"] + buckets["Due in 6 months"]} label="Upcoming Renewals" sub="3–6 months out" trend={6} color="#3B82F6" />
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Tenants Directory</Typography>
              <Typography variant="caption" color="text.secondary">{filtered.length} of {tenants.length}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                placeholder="Search tenant…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ minWidth: 240 }}
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Tenant</Button>
            </Box>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2, borderBottom: "1px solid var(--border-subtle)" }} variant="scrollable">
            {["All", "Overdue", "Due in 7 days", "Due in 3 months", "Due in 6 months", "Shortlet"].map((b) => (
              <Tab key={b} value={b} label={`${b} (${buckets[b] ?? 0})`} />
            ))}
          </Tabs>

          <Box sx={{ overflowX: "auto", mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Tenancy</TableCell>
                  <TableCell>Rent Due</TableCell>
                  <TableCell>Annual Rent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width={40}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((t, i) => {
                  const prop = properties.find((p) => p.id === t.propertyId);
                  return (
                    <TableRow
                      key={t.id}
                      hover
                      onClick={() => setActive(t)}
                      sx={{ cursor: "pointer", backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: "primary.main" }}>
                            {t.name.split(" ").map((n) => n[0]).join("")}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{t.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{prop?.name}</Typography></TableCell>
                      <TableCell><StatusChip status={t.type} /></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{formatDate(t.startDate)} → {formatDate(t.endDate)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{formatDate(t.rentDue)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{prop ? formatNGN(prop.annualRent) : "—"}</Typography></TableCell>
                      <TableCell><StatusChip status={t.rentStatus} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, tenant: t })}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>No tenants in this segment.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Menu anchorEl={menuAnchor?.el || null} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { if (menuAnchor) setActive(menuAnchor.tenant); setMenuAnchor(null); }}>
          <VisibilityIcon fontSize="small" style={{ marginRight: 8 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { if (menuAnchor) setEditing(menuAnchor.tenant); setMenuAnchor(null); }}>
          <EditIcon fontSize="small" style={{ marginRight: 8 }} /> Edit Tenant
        </MenuItem>
      </Menu>

      <AddTenantModal open={open} onClose={() => setOpen(false)} />
      <TenantDetailsDrawer
        tenant={active}
        onClose={() => setActive(null)}
        onEdit={(t) => { setActive(null); setEditing(t); }}
        onPersistedOpen={(id) => {
          const t = tenants.find((x) => x.id === id);
          if (t) setActive(t);
        }}
      />
      <EditTenantModal open={!!editing} onClose={() => setEditing(null)} tenant={editing} />
    </AppShell>
  );
}
