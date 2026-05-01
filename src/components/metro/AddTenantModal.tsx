import { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography,
  Stepper, Step, StepLabel, TextField, MenuItem, Button, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useStore } from "@/lib/mock-store";
import { Tenant } from "@/data/mock";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";
import { validateEmail, validatePhone } from "./WelcomeEmailDialog";

interface Props { open: boolean; onClose: () => void; }

const steps = [
  "Tenant information",
  "Lease Details",
  "Documents Upload",
  "Payment Setup",
  "Review & confirm",
];

const buildAgreement = (data: {
  name: string; address: string; type: string; startDate: string; endDate: string; rent: number;
}) => `TENANCY AGREEMENT

This Agreement is made on ${format(new Date(), "dd MMMM yyyy")} between the Landlord (via Metro Manaja) and ${data.name || "[Tenant Name]"} ("Tenant").

1. PROPERTY: The Landlord lets to the Tenant the property at ${data.address || "[Address]"}.
2. TERM: ${data.type} tenancy commencing ${data.startDate} and ending ${data.endDate}.
3. RENT: The Tenant agrees to pay ${formatNGN(data.rent || 0)} per the agreed payment frequency.
4. DEPOSIT: A refundable security deposit equivalent to one month's rent is required.
5. USE: The property shall be used for residential purposes only.
6. MAINTENANCE: The Tenant shall keep the premises in good repair and report issues promptly.
7. TERMINATION: Either party may terminate with 30 days written notice in accordance with applicable law.

By signing electronically via the link emailed to the Tenant, both parties agree to all terms set forth above.`;

export function AddTenantModal({ open, onClose }: Props) {
  const { properties, addTenant, sendWelcomeEmail } = useStore();
  const vacant = properties.filter((p) => !p.tenantId || p.status === "Vacant" || p.status === "Shortlet");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", emergencyContact: "",
    propertyId: vacant[0]?.id || properties[0]?.id || "",
    unit: "",
    type: "Yearly" as Tenant["type"],
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
    rentAmount: 0,
    paymentFrequency: "Monthly" as NonNullable<Tenant["paymentFrequency"]>,
    paymentMethod: "Bank transfer" as NonNullable<Tenant["paymentMethod"]>,
    paymentStatus: "Not paid" as NonNullable<Tenant["paymentStatus"]>,
    initialPaymentDate: "",
    leaseAgreementName: "",
    idDocumentName: "",
    agreementText: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setStep(0); setDone(false); };
  const close = () => { onClose(); setTimeout(reset, 300); };

  const property = properties.find((p) => p.id === form.propertyId);
  const fullName = `${form.firstName} ${form.lastName}`.trim();

  // Auto-prefill agreement when entering review step the first time.
  const ensureAgreement = () => {
    if (form.agreementText) return;
    const text = buildAgreement({
      name: fullName,
      address: property?.address || "",
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      rent: form.rentAmount || property?.annualRent || 0,
    });
    set("agreementText", text);
  };

  const handleFile = (key: "leaseAgreementName" | "idDocumentName") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
      set(key, file.name);
    };

  const emailValid = validateEmail(form.email);
  const phoneValid = validatePhone(form.phone);
  // Emergency contact must be a real phone AND must NOT be the tenant's own number.
  const digits = (s: string) => s.replace(/\D/g, "");
  const emergencySameAsPhone =
    !!form.emergencyContact && !!form.phone && digits(form.emergencyContact) === digits(form.phone);
  const emergencyValid =
    !!form.emergencyContact && validatePhone(form.emergencyContact) && !emergencySameAsPhone;
  const emergencyError = !form.emergencyContact
    ? "Emergency contact is required"
    : !validatePhone(form.emergencyContact)
    ? "Enter a valid phone number (10–15 digits)"
    : emergencySameAsPhone
    ? "Emergency contact cannot be the tenant's own phone number"
    : " ";

  const canNext = useMemo(() => {
    if (step === 0) return !!form.firstName && !!form.lastName && emailValid && phoneValid && emergencyValid;
    if (step === 1) return !!form.propertyId && !!form.startDate && !!form.endDate && form.rentAmount > 0;
    if (step === 2) return true; // documents optional
    if (step === 3) return !!form.paymentMethod && !!form.paymentStatus;
    return true;
  }, [step, form, emailValid, phoneValid, emergencyValid]);

  const submit = () => {
    const t: Tenant = {
      id: `T${Date.now()}`,
      name: fullName,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      emergencyContact: form.emergencyContact,
      propertyId: form.propertyId,
      unit: form.unit,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      rentDue: form.endDate,
      rentStatus: "Active",
      occupation: "",
      dob: "1990-01-01",
      rentAmount: form.rentAmount,
      paymentFrequency: form.paymentFrequency,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      initialPaymentDate: form.initialPaymentDate,
      leaseAgreementName: form.leaseAgreementName,
      idDocumentName: form.idDocumentName,
      agreementText: form.agreementText,
    };
    addTenant(t);
    const email = sendWelcomeEmail({
      to: form.email,
      recipientName: fullName,
      audience: "tenant",
    });
    toast.success(`Welcome email sent to ${email.to}`, {
      description: `Tenancy agreement attached for e-signing • Login link: ${email.loginUrl}`,
    });
    setDone(true);
  };

  const goNext = () => {
    if (step === 3) ensureAgreement();
    setStep((s) => s + 1);
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add New Tenants</Typography>
          <Typography variant="body2" color="text.secondary">Enter your tenants details here</Typography>
        </Box>
        <IconButton onClick={close} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!done ? (
          <>
            <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
              {steps.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
            </Stepper>

            {step === 0 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tenant Information</Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField label="Tenant first name" placeholder="Enter tenant first name here" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} fullWidth />
                  <TextField label="Tenant last name" placeholder="Enter tenant last name here" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} fullWidth />
                </Box>
                <TextField
                  label="Phone number"
                  placeholder="Enter tenant phone number here"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  error={!!form.phone && !phoneValid}
                  helperText={form.phone && !phoneValid ? "Enter a valid phone (10–15 digits)" : " "}
                  fullWidth
                />
                <TextField
                  label="Email address"
                  placeholder="Enter tenant email here"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  error={!!form.email && !emailValid}
                  helperText={form.email && !emailValid ? "Enter a valid email address" : " "}
                  fullWidth
                />
                <TextField
                  label="Emergency contact"
                  placeholder="A different phone number from the tenant's"
                  value={form.emergencyContact}
                  onChange={(e) => set("emergencyContact", e.target.value)}
                  error={!!form.emergencyContact && !emergencyValid}
                  helperText={emergencyError}
                  fullWidth
                />
              </Box>
            )}

            {step === 1 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lease Details</Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField select label="Property" value={form.propertyId} onChange={(e) => set("propertyId", e.target.value)} fullWidth>
                    {properties.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </TextField>
                  <TextField label="Unit" placeholder="Select unit here" value={form.unit} onChange={(e) => set("unit", e.target.value)} fullWidth />
                  <TextField label="Lease start date" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField label="Lease end date" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                </Box>
                <TextField
                  label="Rent amount"
                  type="number"
                  placeholder="Enter rent amount here in naira"
                  value={form.rentAmount || ""}
                  onChange={(e) => set("rentAmount", Number(e.target.value))}
                  fullWidth
                />
                <TextField select label="Payment frequency" value={form.paymentFrequency} onChange={(e) => set("paymentFrequency", e.target.value as typeof form.paymentFrequency)} fullWidth>
                  {(["Monthly", "Quarterly", "Yearly", "Shortlet"] as const).map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Document Upload</Typography>
                <UploadField label="Upload lease agreement" placeholder="Upload or drag and drop lease agreement PDF, JPG or PNG not more than 5mb here" filename={form.leaseAgreementName} onChange={handleFile("leaseAgreementName")} />
                <UploadField label="Upload ID document" placeholder="Upload or drag and drop ID document PDF, JPG or PNG not more than 5mb here" filename={form.idDocumentName} onChange={handleFile("idDocumentName")} />
                <Alert severity="info">A signed tenancy agreement will be auto-emailed to the tenant — you can edit it in the next step.</Alert>
              </Box>
            )}

            {step === 3 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Payment Details</Typography>
                <TextField select label="Payment method" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as typeof form.paymentMethod)} fullWidth>
                  {(["Bank transfer", "Cash", "Card", "Cheque"] as const).map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
                <TextField select label="Payment status" value={form.paymentStatus} onChange={(e) => set("paymentStatus", e.target.value as typeof form.paymentStatus)} fullWidth>
                  {(["Not paid", "Pending", "Paid"] as const).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField
                  label="Initial payment date"
                  type="date"
                  value={form.initialPaymentDate}
                  onChange={(e) => set("initialPaymentDate", e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            )}

            {step === 4 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Preview</Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Row k="Tenant name" v={fullName || "—"} />
                  <Row k="Property name" v={property?.name || "—"} />
                  <Row k="Rent amount" v={`${formatNGN(form.rentAmount)}/${form.paymentFrequency.toLowerCase()}`} />
                  <Row k="Property location" v={property?.address || "—"} />
                  <Row k="Lease" v={`${form.startDate} – ${form.endDate}`} />
                  <Row k="Payment" v={`${form.paymentMethod} · ${form.paymentStatus}`} />
                  <Row k="Email" v={form.email} />
                  <Row k="Phone" v={form.phone} />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  Tenancy agreement (editable)
                </Typography>
                <Alert severity="info">
                  This agreement will be emailed to <strong>{form.email || "the tenant"}</strong> for e-signing along with their portal login link. Edit any clause below before sending.
                </Alert>
                <TextField
                  multiline
                  minRows={10}
                  value={form.agreementText}
                  onChange={(e) => set("agreementText", e.target.value)}
                  fullWidth
                  sx={{ "& .MuiInputBase-input": { fontFamily: "ui-monospace, monospace", fontSize: 13, lineHeight: 1.6 } }}
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "success.main", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Tenant Onboarded</Typography>
            <Typography variant="body2" color="text.secondary">{fullName} has been added — agreement emailed for signing.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!done ? (
          <>
            <Button onClick={close}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            {step > 0 && <Button variant="outlined" onClick={() => setStep((s) => s - 1)}>Prev</Button>}
            {step < steps.length - 1 ? (
              <Button variant="contained" onClick={goNext} disabled={!canNext}>Next</Button>
            ) : (
              <Button variant="contained" onClick={submit}>Add tenant</Button>
            )}
          </>
        ) : (
          <Button variant="contained" onClick={close}>Done</Button>
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

function UploadField({ label, placeholder, filename, onChange }: {
  label: string; placeholder: string; filename?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>{label}</Typography>
      <Box
        component="label"
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          gap: 1, minHeight: 120, p: 2, border: "1px dashed var(--border-subtle)", borderRadius: 2,
          cursor: "pointer", color: "text.secondary", textAlign: "center",
        }}
      >
        {filename ? (
          <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>{filename}</Typography>
        ) : (
          <>
            <Typography variant="caption">{placeholder}</Typography>
            <CloudUploadIcon fontSize="small" />
          </>
        )}
        <input hidden type="file" accept="image/*,application/pdf" onChange={onChange} />
      </Box>
    </Box>
  );
}
