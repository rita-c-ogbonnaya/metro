import { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Stack,
  Tabs, Tab, Button, TextField, Typography, Chip, Divider, List, ListItemButton,
  ListItemText, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { format } from "date-fns";
import { toast } from "sonner";
import { useStore, AgreementVersion } from "@/lib/mock-store";
import { Tenant } from "@/data/mock";
import { formatNGN, formatDate } from "@/lib/format";

interface Props {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
}

function defaultAgreement(t: Tenant, propertyName: string, propertyAddress: string, rent: number) {
  return `TENANCY AGREEMENT

This agreement is made on ${format(new Date(), "dd MMMM yyyy")} between Metro Manaja (Landlord/Manager) and ${t.name} (Tenant).

1. PROPERTY
   ${propertyName}
   ${propertyAddress}

2. TERM
   This tenancy runs from ${formatDate(t.startDate)} to ${formatDate(t.endDate)}.

3. RENT
   The Tenant agrees to pay ${formatNGN(rent)} per ${t.type === "Shortlet" ? "stay" : "year"}, payable in advance on or before the start of each term.

4. USE OF PREMISES
   The premises shall be used solely as a private residence for the Tenant and immediate household.

5. MAINTENANCE
   The Tenant shall keep the premises in good and tenantable condition (fair wear and tear excepted) and report defects promptly via the Metro Manaja portal.

6. NOTICE
   Either party may terminate this agreement by giving three (3) months' written notice.

7. RENEWAL
   This agreement may be renewed by mutual consent at the prevailing market rate.

Signed (Tenant): ____________________________
Signed (Landlord): __________________________
Date: ${format(new Date(), "dd MMMM yyyy")}
`;
}

export function AgreementEditor({ tenant, open, onClose }: Props) {
  const { agreements, properties, saveAgreementVersion, markAgreementSent, sendWelcomeEmail } = useStore();
  const property = tenant ? properties.find((p) => p.id === tenant.propertyId) : null;

  const versions = tenant ? agreements[tenant.id]?.versions ?? [] : [];
  const latest = versions[versions.length - 1];

  const initialText = useMemo(() => {
    if (!tenant) return "";
    if (latest) return latest.text;
    if (tenant.agreementText) return tenant.agreementText;
    return defaultAgreement(tenant, property?.name || "—", property?.address || "—", property?.annualRent ?? tenant.rentAmount ?? 0);
  }, [tenant, latest, property]);

  const [tab, setTab] = useState<"edit" | "preview" | "history">("edit");
  const [text, setText] = useState(initialText);
  const [viewingVersion, setViewingVersion] = useState<AgreementVersion | null>(null);

  // Reset text when switching tenant or opening
  useMemo(() => { setText(initialText); }, [initialText]);

  if (!tenant) return null;

  const dirty = text !== initialText;

  const handleSaveDraft = () => {
    const v = saveAgreementVersion(tenant.id, text, "draft");
    toast.success(`Saved draft v${v.version}`);
  };

  const handleSendForSigning = () => {
    if (!tenant.email) { toast.error("Tenant has no email on file"); return; }
    const v = dirty || !latest
      ? saveAgreementVersion(tenant.id, text, "sent")
      : (markAgreementSent(tenant.id, latest.version), latest);
    sendWelcomeEmail({
      to: tenant.email,
      recipientName: tenant.name,
      audience: "tenant",
    });
    toast.success(`Agreement v${v.version} emailed to ${tenant.email} for signing`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Tenancy Agreement</Typography>
          <Typography variant="caption" color="text.secondary">
            {tenant.name} · {property?.name || "—"} · {versions.length ? `v${versions.length}` : "no versions yet"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, borderBottom: "1px solid var(--border-subtle)" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab value="edit" icon={<EditIcon fontSize="small" />} iconPosition="start" label="Edit" />
          <Tab value="preview" icon={<VisibilityIcon fontSize="small" />} iconPosition="start" label="Preview" />
          <Tab value="history" icon={<HistoryIcon fontSize="small" />} iconPosition="start" label={`History (${versions.length})`} />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {tab === "edit" && (
          <Stack spacing={2}>
            {dirty && <Alert severity="info">You have unsaved changes. Save a draft or send for signing to keep them.</Alert>}
            <TextField
              multiline
              minRows={14}
              maxRows={20}
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              slotProps={{ input: { sx: { fontFamily: "ui-monospace, monospace", fontSize: 13, lineHeight: 1.6 } } }}
            />
          </Stack>
        )}

        {tab === "preview" && (
          <Box
            sx={{
              p: { xs: 2, sm: 4 },
              minHeight: 360,
              border: "1px solid var(--border-subtle)",
              borderRadius: 2,
              backgroundColor: "var(--card)",
              fontFamily: "Georgia, serif",
              fontSize: 14,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </Box>
        )}

        {tab === "history" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "240px 1fr" }, gap: 2 }}>
            <List dense sx={{ border: "1px solid var(--border-subtle)", borderRadius: 2, maxHeight: 360, overflow: "auto" }}>
              {versions.length === 0 && (
                <Box sx={{ p: 2, color: "text.secondary" }}>
                  <Typography variant="caption">No versions saved yet.</Typography>
                </Box>
              )}
              {[...versions].reverse().map((v) => (
                <ListItemButton
                  key={v.version}
                  selected={viewingVersion?.version === v.version}
                  onClick={() => setViewingVersion(v)}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>v{v.version}</Typography>
                        <Chip
                          size="small"
                          label={v.status}
                          color={v.status === "signed" ? "success" : v.status === "sent" ? "info" : "default"}
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(v.editedAt), "dd MMM yyyy HH:mm")} · {v.editedBy}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
            <Box sx={{ border: "1px solid var(--border-subtle)", borderRadius: 2, p: 2, minHeight: 200, fontFamily: "ui-monospace, monospace", fontSize: 12, whiteSpace: "pre-wrap", overflow: "auto", maxHeight: 360 }}>
              {viewingVersion ? viewingVersion.text : (
                <Typography variant="caption" color="text.secondary">Select a version to preview.</Typography>
              )}
            </Box>
            {viewingVersion && (
              <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" }, display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button size="small" onClick={() => { setText(viewingVersion.text); setTab("edit"); toast.message(`Loaded v${viewingVersion.version} into editor`); }}>
                  Restore into editor
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            Recipient: {tenant.email || "—"}
          </Typography>
        </Box>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" onClick={handleSaveDraft} disabled={!dirty && !!latest}>
          Save draft
        </Button>
        <Button variant="contained" startIcon={<EmailIcon />} onClick={handleSendForSigning}>
          Send for signing
        </Button>
      </DialogActions>

      <Divider />
    </Dialog>
  );
}
