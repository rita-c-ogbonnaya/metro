import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography,
  TextField, Button, Alert, Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import { toast } from "sonner";
import { useStore, SentEmail } from "@/lib/mock-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Accept 10–15 digits, optional leading + and spaces/dashes/parens.
const PHONE_RE = /^\+?[\d\s().-]{10,20}$/;

export function validateEmail(v: string) {
  return EMAIL_RE.test(v.trim());
}
export function validatePhone(v: string) {
  if (!v) return true; // optional
  const digits = v.replace(/\D/g, "");
  return PHONE_RE.test(v) && digits.length >= 10 && digits.length <= 15;
}

interface Props {
  open: boolean;
  onClose: () => void;
  audience: "tenant" | "landlord";
  /** Optional pre-filled values, e.g. when triggered from another flow. */
  initial?: { name?: string; email?: string; phone?: string };
  /** Called after the email is "sent" so callers can run extra side-effects. */
  onSent?: (email: SentEmail) => void;
  title?: string;
  description?: string;
}

/**
 * Shared dialog for mock welcome-email flows. Used by both
 * Add Tenant and Onboard Landlord.
 *
 * Steps: details → review → sent.
 */
export function WelcomeEmailDialog({
  open, onClose, audience, initial, onSent, title, description,
}: Props) {
  const { sendWelcomeEmail } = useStore();
  const [step, setStep] = useState<"form" | "review" | "sent">("form");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [sent, setSent] = useState<SentEmail | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setSent(null);
      setForm({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        phone: initial?.phone ?? "",
      });
    }
  }, [open, initial?.name, initial?.email, initial?.phone]);

  const emailValid = validateEmail(form.email);
  const phoneValid = validatePhone(form.phone);
  const canReview = !!form.name.trim() && emailValid && phoneValid;

  const handleSend = () => {
    const email = sendWelcomeEmail({
      to: form.email.trim(),
      recipientName: form.name.trim(),
      audience,
    });
    setSent(email);
    setStep("sent");
    onSent?.(email);
    toast.success(`Welcome email sent to ${email.to}`, {
      description: `Login link: ${email.loginUrl}`,
    });
  };

  const heading = title ?? (audience === "landlord" ? "Onboard New Landlord" : "Send Tenant Welcome Email");
  const sub = description ?? `We'll send the ${audience} a welcome email with their login link to the ${audience} portal.`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{heading}</Typography>
          <Typography variant="body2" color="text.secondary">{sub}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {step === "form" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={!!form.email && !emailValid}
              helperText={form.email && !emailValid ? "Enter a valid email address" : " "}
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              error={!!form.phone && !phoneValid}
              helperText={form.phone && !phoneValid ? "Enter a valid phone (10–15 digits)" : "Optional"}
              placeholder="+234..."
              fullWidth
            />
          </Box>
        )}

        {step === "review" && (
          <Box>
            <Alert severity="info" icon={<EmailIcon fontSize="small" />} sx={{ mb: 2 }}>
              Review the details below. Sending will deliver a welcome email with portal access.
            </Alert>
            <Box sx={{ display: "grid", gap: 1 }}>
              <Row k="Recipient" v={form.name} />
              <Row k="Email" v={form.email} />
              <Row k="Phone" v={form.phone || "—"} />
              <Row k="Portal" v={<Chip size="small" label={audience === "landlord" ? "Landlord portal" : "Tenant portal"} />} />
              <Row k="Subject" v={`Welcome to Metro Manaja — your ${audience} portal`} />
            </Box>
          </Box>
        )}

        {step === "sent" && sent && (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "success.main", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Welcome email sent</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {sent.recipientName} will receive their login link at {sent.to}.
            </Typography>
            <Box sx={{ p: 1.5, border: "1px dashed var(--border-subtle)", borderRadius: 2, fontSize: 12, wordBreak: "break-all" }}>
              {sent.loginUrl}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {step === "form" && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" disabled={!canReview} onClick={() => setStep("review")}>
              Review
            </Button>
          </>
        )}
        {step === "review" && (
          <>
            <Button onClick={() => setStep("form")}>Back</Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={handleSend}>Send Welcome Email</Button>
          </>
        )}
        {step === "sent" && (
          <Button variant="contained" onClick={onClose} sx={{ ml: "auto" }}>Done</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75, borderBottom: "1px solid var(--border-subtle)" }}>
      <Typography variant="caption" color="text.secondary">{k}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{v}</Typography>
    </Box>
  );
}
