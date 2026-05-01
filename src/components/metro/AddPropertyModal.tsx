import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography,
  Stepper, Step, StepLabel, TextField, MenuItem, Button, Chip, Alert, Checkbox,
  FormControlLabel, FormGroup,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useStore } from "@/lib/mock-store";
import { landlords, Property, PropertyType } from "@/data/mock";
import { formatNGN } from "@/lib/format";
import { validateEmail, validatePhone } from "./WelcomeEmailDialog";
import { toast } from "sonner";

const propertyTypes: PropertyType[] = [
  "Bungalow", "Flat", "Terrace Duplex", "Semi-detached Duplex",
  "Fully Detached Duplex", "Semi-detached Duplex with BQ", "Fully Detached Duplex with BQ",
];

const statusOptions: Property["status"][] = ["Vacant", "Occupied", "Shortlet"];
const featureOptions = ["Parking", "Power supply", "Water", "Furnished", "Security", "Internet", "Pool", "Gym"];
const frequencyOptions = ["Yearly", "Monthly", "Quarterly", "Shortlet"] as const;
const states = ["Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Enugu"];
const countries = ["Nigeria", "Ghana", "Kenya"];

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal opens in edit mode for that property. */
  property?: Property | null;
}

const blank = {
  // Basic information
  name: "",
  type: "Flat" as PropertyType,
  status: "Vacant" as Property["status"],
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  description: "",
  landlordId: landlords[0].id,
  // Location & Pricing
  address: "",
  houseNumber: "",
  busStop: "",
  state: "Lagos",
  country: "Nigeria",
  annualRent: 0,
  paymentFrequency: "Yearly" as (typeof frequencyOptions)[number],
  // Features & Media
  bedrooms: 3,
  bathrooms: 3,
  features: ["Parking", "Power supply"] as string[],
  interiorImage: "",
  exteriorImage: "",
};

type Form = typeof blank;

const steps = ["Basic information", "Location & Pricing", "Features & Media", "Review & confirm"];

export function AddPropertyModal({ open, onClose, property }: Props) {
  const { addProperty, updateProperty, sendWelcomeEmail } = useStore();
  const isEdit = !!property;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<Form>(blank);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDone(false);
    if (property) {
      setForm({
        ...blank,
        name: property.name,
        type: property.type,
        status: property.status,
        ownerName: property.ownerName ?? landlords.find((l) => l.id === property.landlordId)?.name ?? "",
        ownerPhone: property.ownerPhone ?? "",
        ownerEmail: property.ownerEmail ?? "",
        description: property.description ?? "",
        landlordId: property.landlordId,
        address: property.address,
        houseNumber: property.houseNumber ?? "",
        busStop: property.busStop ?? "",
        state: property.state ?? "Lagos",
        country: property.country ?? "Nigeria",
        annualRent: property.annualRent,
        paymentFrequency: property.paymentFrequency ?? "Yearly",
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        features: property.features ?? [],
        interiorImage: property.interiorImage ?? "",
        exteriorImage: property.exteriorImage ?? "",
      });
    } else {
      setForm(blank);
    }
  }, [open, property]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleFeature = (f: string) =>
    setForm((cur) => ({
      ...cur,
      features: cur.features.includes(f) ? cur.features.filter((x) => x !== f) : [...cur.features, f],
    }));

  const handleFile = (key: "interiorImage" | "exteriorImage") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => set(key, String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const emailValid = !form.ownerEmail || validateEmail(form.ownerEmail);
  const phoneValid = validatePhone(form.ownerPhone);

  const canNext = useMemo(() => {
    if (step === 0) return !!form.name && !!form.ownerName && emailValid && phoneValid;
    if (step === 1) return !!form.address && form.annualRent > 0;
    if (step === 2) return form.bedrooms > 0 && form.bathrooms > 0;
    return true;
  }, [step, form, emailValid, phoneValid]);

  const submit = () => {
    const fullAddress = form.address || `${form.houseNumber} ${form.busStop}, ${form.state}`.trim();
    if (isEdit && property) {
      updateProperty(property.id, {
        name: form.name,
        type: form.type,
        status: form.status,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        annualRent: Number(form.annualRent),
        landlordId: form.landlordId,
        address: fullAddress,
        description: form.description,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        houseNumber: form.houseNumber,
        busStop: form.busStop,
        state: form.state,
        country: form.country,
        paymentFrequency: form.paymentFrequency,
        features: form.features,
        interiorImage: form.interiorImage,
        exteriorImage: form.exteriorImage,
      });
    } else {
      const p: Property = {
        id: `P${Date.now()}`,
        name: form.name,
        address: fullAddress,
        type: form.type,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        annualRent: Number(form.annualRent),
        status: form.status,
        tenantId: null,
        landlordId: form.landlordId,
        registeredOn: new Date().toISOString().slice(0, 10),
        description: form.description,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        houseNumber: form.houseNumber,
        busStop: form.busStop,
        state: form.state,
        country: form.country,
        paymentFrequency: form.paymentFrequency,
        features: form.features,
        interiorImage: form.interiorImage,
        exteriorImage: form.exteriorImage,
      };
      addProperty(p);
      // Auto-send a welcome email to the landlord/owner so they get their portal link.
      if (form.ownerEmail && validateEmail(form.ownerEmail)) {
        const email = sendWelcomeEmail({
          to: form.ownerEmail.trim(),
          recipientName: form.ownerName || "Landlord",
          audience: "landlord",
        });
        toast.success(`Welcome email sent to ${email.to}`, {
          description: `Login link: ${email.loginUrl}`,
        });
      }
    }
    setDone(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{isEdit ? "Edit Property" : "Add New Property"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isEdit ? `Update ${property?.name} across all sections.` : "Enter your property details here"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!done ? (
          <>
            <Stepper activeStep={step} sx={{ mb: 3 }}>
              {steps.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
            </Stepper>

            {step === 0 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Basic Information</Typography>
                <TextField
                  label="Property name"
                  placeholder="Enter property name here"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField select label="Property type" value={form.type} onChange={(e) => set("type", e.target.value as PropertyType)} fullWidth>
                    {propertyTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                  <TextField select label="Property status" value={form.status} onChange={(e) => set("status", e.target.value as Property["status"])} fullWidth>
                    {statusOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Box>
                <TextField
                  label="Property owner name"
                  placeholder="Enter property owner name here"
                  value={form.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField
                    label="Property owner phone no."
                    placeholder="Enter property owner phone no. here"
                    value={form.ownerPhone}
                    onChange={(e) => set("ownerPhone", e.target.value)}
                    error={!!form.ownerPhone && !phoneValid}
                    helperText={form.ownerPhone && !phoneValid ? "Invalid phone number" : " "}
                    fullWidth
                  />
                  <TextField
                    label="Property owner email address"
                    placeholder="Enter property owner email address here"
                    value={form.ownerEmail}
                    onChange={(e) => set("ownerEmail", e.target.value)}
                    error={!!form.ownerEmail && !emailValid}
                    helperText={form.ownerEmail && !emailValid ? "Invalid email" : " "}
                    fullWidth
                  />
                </Box>
                <TextField select label="Link to landlord record" value={form.landlordId} onChange={(e) => set("landlordId", e.target.value)} fullWidth>
                  {landlords.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </TextField>
                <TextField
                  label="Description"
                  placeholder="Enter a description..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  multiline rows={4} fullWidth
                />
              </Box>
            )}

            {step === 1 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Location</Typography>
                <TextField
                  label="Property address"
                  placeholder="Enter property address here"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField label="House number" placeholder="Enter house number here" value={form.houseNumber} onChange={(e) => set("houseNumber", e.target.value)} fullWidth />
                  <TextField label="Nearest bus stop" placeholder="Enter the nearest bus stop here" value={form.busStop} onChange={(e) => set("busStop", e.target.value)} fullWidth />
                  <TextField select label="State" value={form.state} onChange={(e) => set("state", e.target.value)} fullWidth>
                    {states.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                  <TextField select label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} fullWidth>
                    {countries.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Pricing</Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField
                    type="number"
                    label="Price/rent amount (₦)"
                    placeholder="Enter price or rent amount here"
                    value={form.annualRent || ""}
                    onChange={(e) => set("annualRent", Number(e.target.value))}
                    fullWidth
                  />
                  <TextField select label="Payment frequency" value={form.paymentFrequency} onChange={(e) => set("paymentFrequency", e.target.value as Form["paymentFrequency"])} fullWidth>
                    {frequencyOptions.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                  </TextField>
                </Box>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Features</Typography>
                <FormGroup sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 0 }}>
                  {featureOptions.map((f) => (
                    <FormControlLabel
                      key={f}
                      control={<Checkbox size="small" checked={form.features.includes(f)} onChange={() => toggleFeature(f)} />}
                      label={f}
                    />
                  ))}
                </FormGroup>

                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField select label="Bathrooms" value={form.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} fullWidth>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                  <TextField select label="Bedrooms" value={form.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} fullWidth>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Media upload</Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <UploadBox label="Upload property interior image" image={form.interiorImage} onChange={handleFile("interiorImage")} />
                  <UploadBox label="Upload property exterior image" image={form.exteriorImage} onChange={handleFile("exteriorImage")} />
                </Box>
              </Box>
            )}

            {step === 3 && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>Preview your property details before saving.</Alert>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Preview</Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Row k="Property name" v={form.name} />
                  <Row k="Property type" v={form.type} />
                  <Row k="Property owner" v={form.ownerName} />
                  <Row k="Owner phone" v={form.ownerPhone || "—"} />
                  <Row k="Owner email" v={form.ownerEmail || "—"} />
                  <Row k="Status" v={<Chip size="small" label={form.status} />} />
                  <Row k="Location" v={`${form.address}${form.state ? `, ${form.state}` : ""}`} />
                  <Row k="Price" v={`${formatNGN(form.annualRent)}/${form.paymentFrequency.toLowerCase()}`} />
                  <Row k="Beds / Baths" v={`${form.bedrooms} / ${form.bathrooms}`} />
                  <Row k="Features" v={form.features.join(", ") || "—"} />
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "success.main", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{isEdit ? "Property Updated" : "Property Added"}</Typography>
            <Typography variant="body2" color="text.secondary">{form.name} {isEdit ? "has been updated." : "is now part of your portfolio."}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!done ? (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            {step > 0 && <Button variant="outlined" onClick={() => setStep((s) => s - 1)}>Prev</Button>}
            {step < steps.length - 1 ? (
              <Button variant="contained" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Next
              </Button>
            ) : (
              <Button variant="contained" onClick={submit}>{isEdit ? "Save changes" : "Add property"}</Button>
            )}
          </>
        ) : (
          <Button variant="contained" onClick={onClose}>Done</Button>
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

function UploadBox({ label, image, onChange }: { label: string; image?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>{label}</Typography>
      <Box
        component="label"
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          gap: 1, height: 140, border: "1px dashed var(--border-subtle)", borderRadius: 2,
          cursor: "pointer", overflow: "hidden", color: "text.secondary",
          backgroundImage: image ? `url(${image})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        {!image && (
          <>
            <Typography variant="caption" sx={{ textAlign: "center", px: 1 }}>
              Upload or drag and drop image not more than 5mb here
            </Typography>
            <CloudUploadIcon fontSize="small" />
          </>
        )}
        <input hidden type="file" accept="image/*" onChange={onChange} />
      </Box>
    </Box>
  );
}
