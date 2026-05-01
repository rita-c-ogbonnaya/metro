import { useState, useEffect, useMemo } from "react";
import { Box, Drawer, IconButton, Typography, Avatar, Stack, Divider, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, TextField, MenuItem, ToggleButton, ToggleButtonGroup, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import EditIcon from "@mui/icons-material/Edit";
import BuildIcon from "@mui/icons-material/Build";
import EventIcon from "@mui/icons-material/Event";
import GavelIcon from "@mui/icons-material/Gavel";
import { differenceInDays, format, addDays } from "date-fns";
import { toast } from "sonner";
import { useStore } from "@/lib/mock-store";
import { Tenant, MaintenanceRequest } from "@/data/mock";
import { formatNGN, formatDate } from "@/lib/format";
import { StatusChip } from "./StatusChip";
import { AgreementEditor } from "./AgreementEditor";

const TODAY = new Date("2025-04-27");
const STORAGE_KEY = "metro-open-tenant";

interface Props {
  tenant: Tenant | null;
  onClose: () => void;
  onEdit?: (t: Tenant) => void;
  onPersistedOpen?: (id: string) => void;
}

// Nigerian phone: normalize to E.164 234XXXXXXXXXX
function normalizePhone(raw: string): { e164: string; pretty: string; valid: boolean } {
  const digits = raw.replace(/\D/g, "");
  let national = digits;
  if (digits.startsWith("234")) national = digits.slice(3);
  else if (digits.startsWith("0")) national = digits.slice(1);
  // Nigerian mobile: 10 digits starting with 7, 8, or 9
  const valid = /^[789]\d{9}$/.test(national);
  const e164 = valid ? `234${national}` : digits;
  const pretty = valid
    ? `+234 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
    : raw;
  return { e164, pretty, valid };
}

type MaintFilter = "All" | "Open" | "In Progress" | "Resolved";

export function TenantDetailsDrawer({ tenant, onClose, onEdit, onPersistedOpen }: Props) {
  const { properties, maintenance, addMaintenance } = useStore();
  const [logOpen, setLogOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [maintFilter, setMaintFilter] = useState<MaintFilter>("All");
  const [reminderDate, setReminderDate] = useState<string>(format(addDays(TODAY, 0), "yyyy-MM-dd"));
  const [mForm, setMForm] = useState<{ category: MaintenanceRequest["category"]; priority: MaintenanceRequest["priority"]; description: string }>({
    category: "General",
    priority: "Medium",
    description: "",
  });

  const prop = tenant ? properties.find((p) => p.id === tenant.propertyId) : null;
  const tenantMaintenance = useMemo(
    () => (tenant ? maintenance.filter((m) => m.tenantId === tenant.id) : []),
    [tenant, maintenance]
  );
  const filteredMaintenance = useMemo(
    () => (maintFilter === "All" ? tenantMaintenance : tenantMaintenance.filter((m) => m.status === maintFilter)),
    [tenantMaintenance, maintFilter]
  );
  const daysToDue = tenant ? differenceInDays(new Date(tenant.rentDue), TODAY) : 0;
  const phoneInfo = tenant ? normalizePhone(tenant.phone) : null;

  // Persist open tenant + restore on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (tenant) {
      window.localStorage.setItem(STORAGE_KEY, tenant.id);
      setReminderDate(format(new Date(tenant.endDate), "yyyy-MM-dd"));
    }
  }, [tenant]);

  useEffect(() => {
    if (typeof window === "undefined" || !onPersistedOpen) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) onPersistedOpen(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  // Track maintenance changes for this tenant — toast on add/status change
  const [seen, setSeen] = useState<Record<string, MaintenanceRequest["status"]>>({});
  useEffect(() => {
    if (!tenant) return;
    const next: Record<string, MaintenanceRequest["status"]> = {};
    tenantMaintenance.forEach((m) => {
      next[m.id] = m.status;
      const prev = seen[m.id];
      if (prev === undefined && Object.keys(seen).length > 0) {
        toast.success(`New ${m.priority.toLowerCase()} maintenance request added`, { description: m.description });
      } else if (prev && prev !== m.status) {
        toast.message(`Request status: ${m.status}`, { description: m.description });
      }
    });
    setSeen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantMaintenance, tenant?.id]);

  const sendReminder = () => {
    if (!tenant || !phoneInfo) return;
    if (!phoneInfo.valid) {
      toast.error("Invalid phone number — cannot send WhatsApp", {
        description: `${tenant.phone} is not a valid Nigerian mobile number.`,
      });
      return;
    }
    const firstName = tenant.name.split(" ")[0];
    const propName = prop?.name || "your property";
    const propAddr = prop?.address || "";
    const rentAmt = prop ? formatNGN(prop.annualRent) : "";
    const scheduled = formatDate(reminderDate);
    const msg =
      `Hi ${firstName}, this is a friendly renewal reminder from Metro Manaja regarding your tenancy at ${propName}` +
      (propAddr ? ` (${propAddr})` : "") +
      `.\n\nYour current tenancy ends on ${formatDate(tenant.endDate)}` +
      (rentAmt ? ` and the renewal rent is ${rentAmt}.` : ".") +
      `\n\nWe'd like to follow up with you on ${scheduled} — please let us know if you'd like to renew so we can prepare your paperwork. Thank you!`;
    window.open(`https://wa.me/${phoneInfo.e164}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(`WhatsApp draft opened`, { description: `Renewal follow-up scheduled for ${scheduled}` });
  };

  const submitMaintenance = () => {
    if (!tenant || !mForm.description.trim()) return;
    addMaintenance({
      id: `M${Date.now()}`,
      propertyId: tenant.propertyId,
      tenantId: tenant.id,
      category: mForm.category,
      description: mForm.description,
      date: format(new Date(), "yyyy-MM-dd"),
      priority: mForm.priority,
      status: "Open",
      assignedTo: "Unassigned",
    });
    setLogOpen(false);
    setMForm({ category: "General", priority: "Medium", description: "" });
    toast.success(`Maintenance request logged for ${tenant.name}`);
  };

  return (
    <Drawer
      anchor="right"
      open={!!tenant}
      onClose={handleClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 540 } } } }}
    >
      {tenant && (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ p: 3, borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: 18, fontWeight: 700 }}>
                {tenant.name.split(" ").map((n) => n[0]).join("")}
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Tenant</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{tenant.name}</Typography>
                <Typography variant="caption" color="text.secondary">{tenant.occupation}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <StatusChip status={tenant.type} />
                  <StatusChip status={tenant.rentStatus} />
                </Stack>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
            <SectionTitle>Contact</SectionTitle>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }} useFlexGap>
              <Button size="small" variant="outlined" startIcon={<EmailIcon />}
                onClick={() => window.open(`mailto:${tenant.email}`)}>
                {tenant.email}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                disabled={!phoneInfo?.valid}
                onClick={() => phoneInfo?.valid && window.open(`https://wa.me/${phoneInfo.e164}`, "_blank")}
              >
                {phoneInfo?.pretty || tenant.phone}
              </Button>
            </Stack>
            {phoneInfo && !phoneInfo.valid && (
              <Alert severity="warning" sx={{ mb: 2, fontSize: 12 }}>
                Phone number isn't a valid Nigerian mobile (expected 10 digits starting with 7, 8, or 9). Edit the tenant to fix it.
              </Alert>
            )}

            <SectionTitle>Property</SectionTitle>
            <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, border: "1px solid var(--border-subtle)", display: "flex", gap: 1.5, alignItems: "center" }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(26,86,219,0.15)", color: "primary.main" }}>
                <HomeWorkIcon fontSize="small" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{prop?.name || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">{prop?.address}</Typography>
              </Box>
            </Box>

            <SectionTitle>Tenancy Summary</SectionTitle>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mb: 2 }}>
              <KV k="Tenancy Type" v={tenant.type} />
              <KV k="Annual Rent" v={prop ? formatNGN(prop.annualRent) : "—"} />
              <KV k="Start Date" v={formatDate(tenant.startDate)} />
              <KV k="End Date" v={formatDate(tenant.endDate)} />
              <KV k="Rent Due" v={formatDate(tenant.rentDue)} />
              <KV k="DOB" v={formatDate(tenant.dob)} />
            </Box>

            <SectionTitle>Rent Status</SectionTitle>
            <Box
              sx={{
                p: 2, mb: 2, borderRadius: 2,
                bgcolor: daysToDue < 0 ? "rgba(239,68,68,0.10)" : daysToDue <= 7 ? "rgba(245,158,11,0.10)" : "rgba(16,185,129,0.10)",
                border: `1px solid ${daysToDue < 0 ? "rgba(239,68,68,0.4)" : daysToDue <= 7 ? "rgba(245,158,11,0.4)" : "rgba(16,185,129,0.4)"}`,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {daysToDue < 0 ? `Overdue by ${Math.abs(daysToDue)} days` : daysToDue === 0 ? "Rent due today" : `Due in ${daysToDue} days`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Next payment of {prop ? formatNGN(prop.annualRent) : "—"} on {formatDate(tenant.rentDue)}
              </Typography>
            </Box>

            <SectionTitle>Renewal Reminder</SectionTitle>
            <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                type="date"
                size="small"
                label="Follow-up date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 180 }}
              />
              <Button variant="contained" size="small" startIcon={<WhatsAppIcon />} onClick={sendReminder} disabled={!phoneInfo?.valid}>
                Send WhatsApp
              </Button>
              <Stack direction="row" spacing={0.5}>
                {[7, 14, 30].map((d) => (
                  <Chip
                    key={d}
                    size="small"
                    icon={<EventIcon sx={{ fontSize: 14 }} />}
                    label={`+${d}d`}
                    onClick={() => setReminderDate(format(addDays(TODAY, d), "yyyy-MM-dd"))}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <SectionTitle>Maintenance History</SectionTitle>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={maintFilter}
                onChange={(_, v) => v && setMaintFilter(v)}
                sx={{ "& .MuiToggleButton-root": { py: 0.25, px: 1, fontSize: 11, textTransform: "none" } }}
              >
                <ToggleButton value="All">All ({tenantMaintenance.length})</ToggleButton>
                <ToggleButton value="Open">Open ({tenantMaintenance.filter((m) => m.status === "Open").length})</ToggleButton>
                <ToggleButton value="In Progress">In Progress ({tenantMaintenance.filter((m) => m.status === "In Progress").length})</ToggleButton>
                <ToggleButton value="Resolved">Resolved ({tenantMaintenance.filter((m) => m.status === "Resolved").length})</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {filteredMaintenance.length === 0 ? (
              <Typography variant="caption" color="text.secondary">No requests in this view.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMaintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell><Typography variant="caption">{formatDate(m.date)}</Typography></TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={m.category} /></TableCell>
                      <TableCell><StatusChip status={m.priority} /></TableCell>
                      <TableCell><StatusChip status={m.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <SectionTitle>Log Maintenance Request</SectionTitle>
                {!logOpen && (
                  <Button size="small" variant="outlined" startIcon={<BuildIcon />} onClick={() => setLogOpen(true)}>
                    New Request
                  </Button>
                )}
              </Box>
              {logOpen && (
                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid var(--border-subtle)", display: "grid", gap: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    <TextField select label="Category" size="small" value={mForm.category} onChange={(e) => setMForm((f) => ({ ...f, category: e.target.value as MaintenanceRequest["category"] }))}>
                      {["Plumbing", "Electrical", "Structural", "General", "Renovation"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                    <TextField select label="Priority" size="small" value={mForm.priority} onChange={(e) => setMForm((f) => ({ ...f, priority: e.target.value as MaintenanceRequest["priority"] }))}>
                      {["Low", "Medium", "High", "Critical"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Box>
                  <TextField label="Description" size="small" multiline rows={3} value={mForm.description} onChange={(e) => setMForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the issue..." />
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button size="small" onClick={() => { setLogOpen(false); setMForm({ category: "General", priority: "Medium", description: "" }); }}>Cancel</Button>
                    <Button size="small" variant="contained" onClick={submitMaintenance} disabled={!mForm.description.trim()}>Add to history</Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />
          <Box sx={{ p: 2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <Button variant="outlined" startIcon={<WhatsAppIcon />} onClick={sendReminder} disabled={!phoneInfo?.valid}>
              Send Renewal Reminder
            </Button>
            <Button variant="outlined" startIcon={<GavelIcon />} onClick={() => setAgreementOpen(true)}>
              Agreement
            </Button>
            <Button variant="text" startIcon={<EditIcon />} onClick={() => onEdit?.(tenant)} sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
              Edit Tenant
            </Button>
          </Box>
        </Box>
      )}
      <AgreementEditor tenant={tenant} open={agreementOpen} onClose={() => setAgreementOpen(false)} />
    </Drawer>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, display: "block", mb: 1 }}>
      {children}
    </Typography>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "var(--table-alt)" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10 }}>{k}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{v}</Typography>
    </Box>
  );
}
