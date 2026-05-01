import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment, Tabs, Tab,
  IconButton, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Menu,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import { AppShell } from "@/components/metro/AppShell";
import { useStore } from "@/lib/mock-store";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Metro Manaja" }] }),
  component: NotificationsPage,
});

type NotifType = "maintenance" | "alert" | "completed" | "message";
interface Notif {
  id: string;
  type: NotifType;
  title: string;
  property: string;
  body: string;
  createdAt: string; // human time
  read: boolean;
}

const seed: Notif[] = [
  { id: "N1", type: "maintenance", title: "New Maintenance Request", property: "Green Villa Apartments", body: "Plumbing leaked reported by Abdulrauf Fuad", createdAt: "5 minutes ago", read: false },
  { id: "N2", type: "alert", title: "High Priority Alert", property: "Downtown Loft", body: "Electrical issues still pending for 48 hours", createdAt: "1 hour ago", read: false },
  { id: "N3", type: "completed", title: "Maintenance Completed", property: "Blue View Apartment", body: "HVAC repair completed by Irene Isreal", createdAt: "2 days ago", read: true },
  { id: "N4", type: "message", title: "Tenant Message", property: "Blue View Apartment", body: "Message regarding noise issue", createdAt: "2 days ago", read: true },
  { id: "N5", type: "completed", title: "Maintenance Completed", property: "Blue View Apartment", body: "HVAC repair completed by Irene Isreal", createdAt: "2 days ago", read: false },
];

const escalationReasons = ["Delayed too long", "Safety concern", "Tenant complaint", "Legal compliance"];

function iconFor(type: NotifType) {
  if (type === "maintenance") return <BuildIcon sx={{ color: "#F59E0B" }} />;
  if (type === "alert") return <WarningAmberIcon sx={{ color: "#EF4444" }} />;
  if (type === "completed") return <CheckCircleOutlineIcon sx={{ color: "#10B981" }} />;
  return <ChatBubbleOutlineIcon sx={{ color: "#3B82F6" }} />;
}

function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>(seed);
  const [tab, setTab] = useState<"All" | "Unread" | "Message">("All");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Notif | null>(null);
  const [escalating, setEscalating] = useState<Notif | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; id: string } | null>(null);
  const { properties, tenants, notificationLog, logNotification } = useStore();

  const unread = items.filter((n) => !n.read).length;

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        if (tab === "Unread" && n.read) return false;
        if (tab === "Message" && n.type !== "message") return false;
        if (q && !`${n.title} ${n.body} ${n.property}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [items, tab, q]
  );

  const markRead = (id: string) =>
    setItems((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setItems((cur) => cur.map((n) => ({ ...n, read: true })));
  const remove = (id: string) => setItems((cur) => cur.filter((n) => n.id !== id));

  return (
    <AppShell role="manager" title="Notification" subtitle="Manage all the requests across your platform">
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab value="All" label="All" />
              <Tab value="Unread" label={`Unread${unread ? ` (${unread})` : ""}`} />
              <Tab value="Message" label="Message" />
            </Tabs>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
              <TextField
                placeholder="Search…"
                size="small"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ minWidth: 240 }}
              />
              <Button variant="outlined" onClick={markAllRead} disabled={!unread}>Mark all as read</Button>
            </Stack>
          </Box>

          <Stack spacing={1.5}>
            {filtered.map((n) => (
              <Box
                key={n.id}
                sx={{
                  display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 2,
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: n.read ? "transparent" : "var(--card-hover)",
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: n.read ? "transparent" : "primary.main" }} />
                <Box sx={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1.5, bgcolor: "var(--card-hover)" }}>
                  {iconFor(n.type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{n.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{n.property} · {n.createdAt}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" noWrap>{n.body}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {n.type === "message" ? (
                    <Button size="small" variant="contained" onClick={() => toast.message("Opening chat with tenant…")}>Open chat</Button>
                  ) : (
                    <Button size="small" variant="contained" onClick={() => { setViewing(n); markRead(n.id); }}>View request</Button>
                  )}
                  {n.type === "alert" ? (
                    <Button size="small" color="error" variant="contained" onClick={() => setEscalating(n)}>Escalate</Button>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => markRead(n.id)} disabled={n.read}>
                      {n.read ? "Read" : "Mark as read"}
                    </Button>
                  )}
                  <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, id: n.id })} sx={{ color: "text.primary" }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            ))}
            {filtered.length === 0 && (
              <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">No notifications match this filter.</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Menu anchorEl={menu?.el || null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { if (menu) markRead(menu.id); setMenu(null); }}>Mark as read</MenuItem>
        <MenuItem onClick={() => { if (menu) remove(menu.id); setMenu(null); }}>Dismiss</MenuItem>
      </Menu>

      {/* View dialog */}
      <Dialog open={!!viewing} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>View Maintenance Request</Typography>
            <Typography variant="caption" color="text.secondary">Request ID: #{viewing?.id}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setViewing(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <Stack spacing={1.25}>
              <Row k="Property" v={viewing.property} />
              <Row k="Tenant" v={tenants[0]?.name || "—"} />
              <Row k="Linked property" v={properties[0]?.name || "—"} />
              <Row k="Description" v={viewing.body} />
              <Row k="Status" v={<Chip size="small" color={viewing.type === "completed" ? "success" : "warning"} label={viewing.type === "completed" ? "Completed" : "Pending"} />} />
              <Row k="Reported" v={viewing.createdAt} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewing(null)}>Close</Button>
          <Button variant="contained" onClick={() => { toast.success("Note added"); setViewing(null); }}>Add note</Button>
        </DialogActions>
      </Dialog>

      {/* Escalate dialog */}
      <EscalateDialog
        open={!!escalating}
        notif={escalating}
        onClose={() => setEscalating(null)}
        onConfirm={(reason, comment) => {
          if (!escalating) return;
          const entry = logNotification({
            type: "escalation",
            title: `Escalated: ${escalating.title}`,
            body: `${reason}${comment ? ` — ${comment}` : ""}`,
            meta: {
              property: escalating.property,
              originalNotificationId: escalating.id,
              reason,
            },
          });
          markRead(escalating.id);
          toast.success(`Escalated`, { description: `Logged as ${entry.id}` });
          setEscalating(null);
        }}
      />

      {/* Escalation log */}
      {notificationLog.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Escalation Log</Typography>
            <Typography variant="caption" color="text.secondary">All escalations recorded from this device</Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {notificationLog.slice(0, 10).map((e) => (
                <Box key={e.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid var(--border-subtle)", display: "flex", gap: 1.5, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Chip size="small" color={e.type === "escalation" ? "error" : "default"} label={e.type} sx={{ textTransform: "capitalize" }} />
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{e.body}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(e.createdAt), "dd MMM yyyy HH:mm")}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "baseline" }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130 }}>{k}:</Typography>
      <Box sx={{ fontSize: 14 }}>{v}</Box>
    </Box>
  );
}

function EscalateDialog({ open, notif, onClose, onConfirm }: { open: boolean; notif: Notif | null; onClose: () => void; onConfirm: (reason: string, comment: string) => void }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset when dialog opens for a new notif
  useMemo(() => { if (open) { setReason(""); setComment(""); setTouched(false); } }, [open, notif?.id]);

  const reasonValid = reason.length > 0;
  const commentValid = comment.trim().length >= 10;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Escalate Maintenance Request</Typography>
          {notif && <Typography variant="caption" color="text.secondary">{notif.title} · {notif.property}</Typography>}
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          This will increase priority, notify senior staff, and create a permanent record in the escalation log.
        </Typography>
        <TextField
          select fullWidth label="Reason for escalation *" value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && !reasonValid}
          helperText={touched && !reasonValid ? "Choose a reason" : " "}
          sx={{ mb: 2 }}
        >
          {escalationReasons.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <TextField
          fullWidth label="Comment / context *"
          placeholder="Describe what's happened, who's affected, and any actions already taken (min 10 characters)."
          multiline minRows={3} value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && !commentValid}
          helperText={touched && !commentValid ? `Add a bit more context (${comment.trim().length}/10)` : `${comment.trim().length} characters`}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" disabled={!reasonValid || !commentValid} onClick={() => onConfirm(reason, comment.trim())}>
          Confirm escalation
        </Button>
      </DialogActions>
    </Dialog>
  );
}
