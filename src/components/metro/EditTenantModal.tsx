import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography,
  Stepper, Step, StepLabel, TextField, MenuItem, Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useStore } from "@/lib/mock-store";
import { Tenant } from "@/data/mock";

interface Props {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

export function EditTenantModal({ open, onClose, tenant }: Props) {
  const { properties, updateTenant } = useStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Tenant | null>(tenant);

  useEffect(() => {
    if (open && tenant) {
      setForm(tenant);
      setStep(0);
    }
  }, [open, tenant]);

  if (!form) return null;

  const set = <K extends keyof Tenant>(k: K, v: Tenant[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = () => {
    if (form) updateTenant(form.id, form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Tenant</Typography>
          <Typography variant="body2" color="text.secondary">Update {form.name}'s contact, tenancy, and rent details.</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step><StepLabel>Contact</StepLabel></Step>
          <Step><StepLabel>Tenancy Dates</StepLabel></Step>
          <Step><StepLabel>Rent</StepLabel></Step>
        </Stepper>

        {step === 0 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField label="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} fullWidth />
            <TextField label="Occupation" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} fullWidth />
            <TextField label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} fullWidth />
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField select label="Property" value={form.propertyId} onChange={(e) => set("propertyId", e.target.value)} fullWidth sx={{ gridColumn: "1 / -1" }}>
              {properties.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField select label="Tenancy Type" value={form.type} onChange={(e) => set("type", e.target.value as Tenant["type"])} fullWidth>
              <MenuItem value="Yearly">Yearly</MenuItem>
              <MenuItem value="Shortlet">Shortlet</MenuItem>
            </TextField>
            <TextField label="Start Date" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="End Date" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField label="Rent Due Date" type="date" value={form.rentDue} onChange={(e) => set("rentDue", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField select label="Rent Status" value={form.rentStatus} onChange={(e) => set("rentStatus", e.target.value as Tenant["rentStatus"])} fullWidth>
              {["Active", "Due Soon", "Overdue", "Expiring Soon"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
        {step < 2 ? (
          <Button variant="contained" onClick={() => setStep((s) => s + 1)}>Next</Button>
        ) : (
          <Button variant="contained" onClick={save}>Save Changes</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
