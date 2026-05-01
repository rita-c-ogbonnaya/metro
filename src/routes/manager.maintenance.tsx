import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem, InputAdornment, Drawer, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Avatar, Stack, Chip, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BuildIcon from "@mui/icons-material/Build";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { AppShell } from "@/components/metro/AppShell";
import { StatCard } from "@/components/metro/StatCard";
import { StatusChip } from "@/components/metro/StatusChip";
import { useStore } from "@/lib/mock-store";
import { formatDate } from "@/lib/format";
import { MaintenanceRequest } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — Metro Manaja" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { maintenance, properties, tenants, updateMaintenance, bulkUpdateMaintenance } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<MaintenanceRequest | null>(null);
  const [editing, setEditing] = useState<MaintenanceRequest | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const active = activeId ? maintenance.find((m) => m.id === activeId) || null : null;

  const filtered = useMemo(
    () =>
      maintenance.filter((m) => {
        if (status !== "All" && m.status !== status) return false;
        if (priority !== "All" && m.priority !== priority) return false;
        if (q && !`${m.description} ${m.category}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [maintenance, q, status, priority]
  );

  const stats = {
    open: maintenance.filter((m) => m.status === "Open").length,
    inProgress: maintenance.filter((m) => m.status === "In Progress").length,
    resolved: maintenance.filter((m) => m.status === "Resolved").length,
    critical: maintenance.filter((m) => m.priority === "Critical").length,
  };

  return (
    <AppShell role="manager" title="Maintenance Log" subtitle="Track and resolve property requests">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard icon={<BuildIcon />} value={stats.open} label="Open" sub="Awaiting assignment" trend={-2} color="#3B82F6" />
        <StatCard icon={<BuildIcon />} value={stats.inProgress} label="In Progress" sub="Active jobs" trend={5} color="#F5A623" />
        <StatCard icon={<BuildIcon />} value={stats.resolved} label="Resolved" sub="Last 30 days" trend={18} color="#10B981" />
        <StatCard icon={<BuildIcon />} value={stats.critical} label="Critical Priority" sub="Immediate attention" trend={-1} color="#EF4444" />
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>All Requests</Typography>
              <Typography variant="caption" color="text.secondary">Click a row to view details</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <TextField
                placeholder="Search description / category…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ minWidth: 240 }}
              />
              <TextField select value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
                {["All", "Open", "In Progress", "Resolved", "Closed"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField select value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ minWidth: 140 }}>
                {["All", "Low", "Medium", "High", "Critical"].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Box>
          </Box>

          {selected.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, mb: 1.5, borderRadius: 2, bgcolor: "rgba(26,86,219,0.10)", border: "1px solid rgba(26,86,219,0.4)" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                {selected.length} request{selected.length > 1 ? "s" : ""} selected
              </Typography>
              <Button size="small" variant="outlined" startIcon={<AssignmentIcon />}
                onClick={() => { bulkUpdateMaintenance(selected, { status: "In Progress" }); setSelected([]); }}>
                Mark In Progress
              </Button>
              <Button size="small" variant="contained" color="success" startIcon={<DoneAllIcon />}
                onClick={() => { bulkUpdateMaintenance(selected, { status: "Resolved" }); setSelected([]); }}>
                Mark Resolved
              </Button>
              <Button size="small" onClick={() => setSelected([])}>Clear</Button>
            </Box>
          )}

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={filtered.length > 0 && selected.length === filtered.length}
                      indeterminate={selected.length > 0 && selected.length < filtered.length}
                      onChange={(e) => setSelected(e.target.checked ? filtered.map((m) => m.id) : [])}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Request</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assigned to</TableCell>
                  <TableCell>Date submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((m, i) => {
                  const prop = properties.find((p) => p.id === m.propertyId);
                  const tenant = tenants.find((t) => t.id === m.tenantId);
                  const isSel = selected.includes(m.id);
                  return (
                    <TableRow
                      key={m.id}
                      hover
                      selected={isSel}
                      sx={{ cursor: "pointer", backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={isSel}
                          onChange={(e) => setSelected((cur) => e.target.checked ? [...cur, m.id] : cur.filter((x) => x !== m.id))}
                        />
                      </TableCell>
                      <TableCell onClick={() => setViewing(m)}><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{m.id}</Typography></TableCell>
                      <TableCell onClick={() => setViewing(m)}><Typography variant="body2">{prop?.name}</Typography></TableCell>
                      <TableCell onClick={() => setViewing(m)}><Typography variant="body2" color="text.secondary">{tenant?.name || "—"}</Typography></TableCell>
                      <TableCell onClick={() => setViewing(m)}><Chip size="small" label={m.category} variant="outlined" /></TableCell>
                      <TableCell onClick={() => setViewing(m)}><StatusChip status={m.status} /></TableCell>
                      <TableCell onClick={() => setViewing(m)}><StatusChip status={m.priority} /></TableCell>
                      <TableCell onClick={() => setViewing(m)}><Typography variant="body2" color="text.secondary">{m.assignedTo}</Typography></TableCell>
                      <TableCell onClick={() => setViewing(m)}><Typography variant="caption">{formatDate(m.date)}</Typography></TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={() => setEditing(m)} aria-label="Edit request" sx={{ color: "text.primary" }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setViewing(m)} aria-label="View request" sx={{ color: "primary.main" }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Drawer anchor="right" open={!!active} onClose={() => setActiveId(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 480 }, p: 0 } } }}>
        {active && (() => {
          const prop = properties.find((p) => p.id === active.propertyId);
          const tenant = tenants.find((t) => t.id === active.tenantId);
          return (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Request {active.id}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{active.category} Issue</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <StatusChip status={active.priority} />
                    <StatusChip status={active.status} />
                  </Stack>
                </Box>
                <IconButton onClick={() => setActiveId(null)} size="small"><CloseIcon /></IconButton>
              </Box>

              <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
                <Section label="Description">{active.description}</Section>
                <Section label="Property">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{prop?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{prop?.address}</Typography>
                </Section>
                <Section label="Reported By">
                  {tenant ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 12 }}>
                        {tenant.name.split(" ").map((n) => n[0]).join("")}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{tenant.phone}</Typography>
                      </Box>
                    </Box>
                  ) : "—"}
                </Section>
                <Section label="Reported On">{formatDate(active.date)}</Section>
                <Section label="Assigned To"><Typography variant="body2">{active.assignedTo}</Typography></Section>

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Activity</Typography>
                <Box sx={{ mt: 1.5 }}>
                  {[
                    { t: formatDate(active.date), msg: `Request submitted by ${tenant?.name || "tenant"}` },
                    { t: formatDate(active.date), msg: `Assigned to ${active.assignedTo}` },
                    ...(active.status === "Resolved" ? [{ t: formatDate(active.date), msg: "Marked as resolved" }] : []),
                  ].map((a, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", mt: 0.75 }} />
                      <Box>
                        <Typography variant="body2">{a.msg}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.t}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ p: 2, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  disabled={active.status === "In Progress" || active.status === "Resolved"}
                  onClick={() => updateMaintenance(active.id, { status: "In Progress" })}
                >
                  {active.status === "In Progress" ? "In Progress" : "Mark In Progress"}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={active.status === "Resolved"}
                  onClick={() => updateMaintenance(active.id, { status: "Resolved" })}
                >
                  {active.status === "Resolved" ? "Resolved" : "Mark Resolved"}
                </Button>
              </Box>
            </Box>
          );
        })()}
      </Drawer>

      <ViewRequestDialog
        request={viewing}
        property={viewing ? properties.find((p) => p.id === viewing.propertyId) : undefined}
        tenant={viewing ? tenants.find((t) => t.id === viewing.tenantId) : undefined}
        onClose={() => setViewing(null)}
      />
      <EditRequestDialog
        request={editing}
        property={editing ? properties.find((p) => p.id === editing.propertyId) : undefined}
        tenant={editing ? tenants.find((t) => t.id === editing.tenantId) : undefined}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) updateMaintenance(editing.id, patch);
          setEditing(null);
        }}
      />
    </AppShell>
  );
}

function ViewRequestDialog({ request, property, tenant, onClose }: {
  request: MaintenanceRequest | null;
  property?: { name: string };
  tenant?: { name: string; phone: string; email: string };
  onClose: () => void;
}) {
  return (
    <Dialog open={!!request} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Maintenance</Typography>
          <Typography variant="caption" color="text.secondary">View maintenance request</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {request && (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Preview Tenant Maintenance Request Form</Typography>
            <PreviewRow k="Request Id" v={request.id} />
            <PreviewRow k="Tenant name" v={tenant?.name || "—"} />
            <PreviewRow k="Property name" v={property?.name || "—"} />
            <PreviewRow k="Description" v={request.description} />
            <PreviewRow k="Status" v={request.status} />
            <PreviewRow k="Priority" v={request.priority} />
            <PreviewRow k="Assigned staff" v={request.assignedTo} />
            <PreviewRow k="Date submitted" v={formatDate(request.date)} />
            <PreviewRow k="Tenant contact info" v={tenant ? `${tenant.phone}/${tenant.email}` : "—"} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" startIcon={<ChatBubbleOutlineIcon />}>Comment</Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => toast.success("Request downloaded")}>Download</Button>
      </DialogActions>
    </Dialog>
  );
}

function PreviewRow({ k, v }: { k: string; v: string }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150 }}>{k}:</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{v}</Typography>
    </Box>
  );
}

function EditRequestDialog({ request, property, tenant, onClose, onSave }: {
  request: MaintenanceRequest | null;
  property?: { name: string };
  tenant?: { name: string };
  onClose: () => void;
  onSave: (patch: Partial<MaintenanceRequest>) => void;
}) {
  const [form, setForm] = useState<Partial<MaintenanceRequest>>({});
  useEffect(() => {
    if (request) {
      setForm({
        category: request.category, priority: request.priority, status: request.status,
        assignedTo: request.assignedTo, description: request.description,
      });
    }
  }, [request]);

  if (!request) return null;
  const set = <K extends keyof MaintenanceRequest>(k: K, v: MaintenanceRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={!!request} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Maintenance</Typography>
          <Typography variant="caption" color="text.secondary">Edit to update maintenance request</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Update/Edit Tenant Maintenance Request Form</Typography>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField label="Tenant name" value={tenant?.name || ""} fullWidth disabled />
          <TextField label="Property name" value={property?.name || ""} fullWidth disabled />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField select label="Request type" value={form.category || ""} onChange={(e) => set("category", e.target.value as MaintenanceRequest["category"])} fullWidth>
              {(["Plumbing", "Electrical", "Structural", "General", "Renovation"] as const).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField select label="Priority" value={form.priority || ""} onChange={(e) => set("priority", e.target.value as MaintenanceRequest["priority"])} fullWidth>
              {(["Low", "Medium", "High", "Critical"] as const).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={form.status || ""} onChange={(e) => set("status", e.target.value as MaintenanceRequest["status"])} fullWidth>
              {(["Open", "In Progress", "Resolved", "Closed"] as const).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Assigned Staff" value={form.assignedTo || ""} onChange={(e) => set("assignedTo", e.target.value)} fullWidth />
          </Box>
          <TextField label="Description of the request" value={form.description || ""} onChange={(e) => set("description", e.target.value)} multiline minRows={4} fullWidth placeholder="Enter a description............." />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={() => { onSave({ ...form, status: "Resolved" }); toast.success("Request marked completed"); }}>Mark as completed</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => { onSave(form); toast.success("Request updated"); }}>Update</Button>
      </DialogActions>
    </Dialog>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, display: "block", mb: 0.5 }}>{label}</Typography>
      <Box sx={{ fontSize: 14 }}>{children}</Box>
    </Box>
  );
}
