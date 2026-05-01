import { useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardActionArea,
  CardContent,
  TextField,
  MenuItem,
  Select,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import BuildIcon from "@mui/icons-material/Build";
import TuneIcon from "@mui/icons-material/Tune";
import ImageIcon from "@mui/icons-material/Image";
import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SendIcon from "@mui/icons-material/Send";
import { properties, tenants, transactions, maintenance } from "@/data/mock";
import { formatNGN, formatDateShort } from "@/lib/format";

type ScopeKey = "snapshot" | "all" | "property" | "financials" | "tenants" | "maintenance" | "custom";
type Format = "png" | "xlsx" | "pdf";

const scopeOptions: { key: ScopeKey; title: string; desc: string; icon: React.ReactNode }[] = [
  { key: "snapshot", title: "Full Dashboard Snapshot", desc: "Visual screenshot of the current dashboard", icon: <DashboardIcon /> },
  { key: "all", title: "All Properties Summary", desc: "Occupancy, rent status, financials across every property", icon: <HomeWorkIcon /> },
  { key: "property", title: "Single Property Report", desc: "Deep-dive on one property — tenants, rent, maintenance", icon: <ApartmentIcon /> },
  { key: "financials", title: "Financials Only", desc: "Revenue, expenses, cash flow for selected period", icon: <BarChartIcon /> },
  { key: "tenants", title: "Tenant Rent Status", desc: "All tenants, due dates, payment history, overdue flags", icon: <PeopleIcon /> },
  { key: "maintenance", title: "Maintenance Log", desc: "Requests with status, category, resolution notes", icon: <BuildIcon /> },
  { key: "custom", title: "Custom Report", desc: "Pick exactly which sections to include", icon: <TuneIcon /> },
];

const customSections = [
  "Property Overview",
  "Tenant List & Rent Status",
  "Payment History",
  "Maintenance Log",
  "Cash Flow Summary",
  "Expense Breakdown",
  "Upcoming Rent Renewals",
  "Vacancy Report",
];

interface Props {
  trigger?: "button" | "menuItem";
  defaultScope?: ScopeKey;
  defaultProperty?: string | null;
  buttonLabel?: string;
  buttonVariant?: "outlined" | "contained" | "text";
  captureElementId?: string;
}

export function ReportSender({
  defaultScope = "all",
  defaultProperty = null,
  buttonLabel = "Send Report",
  buttonVariant = "outlined",
  captureElementId = "manager-dashboard-root",
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<ScopeKey>(defaultScope);
  const [propertyId, setPropertyId] = useState<string>(defaultProperty || properties[0].id);
  const [customSel, setCustomSel] = useState<string[]>([customSections[0], customSections[1]]);
  const [dateRange, setDateRange] = useState("Last 3 Months");
  const [format, setFormat] = useState<Format>("xlsx");
  const [delivery, setDelivery] = useState({ email: true, whatsapp: false, download: true, copyLink: false });
  const [emailTo, setEmailTo] = useState("ceo@manaja.com");
  const [waPhone, setWaPhone] = useState("+2348012345678");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState(
    "Please find attached the Metro Manager property report for the specified period. Generated via the Manaja platform."
  );
  const [progress, setProgress] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setProgress(null);
    setDone(false);
    setShareLink("");
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  // Filter mock data by scope
  const scoped = useMemo(() => {
    if (scope === "property") {
      return {
        properties: properties.filter((p) => p.id === propertyId),
        tenants: tenants.filter((t) => t.propertyId === propertyId),
        transactions: transactions.filter((x) => x.propertyId === propertyId),
        maintenance: maintenance.filter((m) => m.propertyId === propertyId),
      };
    }
    if (scope === "tenants") return { properties: [], tenants, transactions: [], maintenance: [] };
    if (scope === "maintenance") return { properties: [], tenants: [], transactions: [], maintenance };
    if (scope === "financials") return { properties: [], tenants: [], transactions, maintenance: [] };
    return { properties, tenants, transactions, maintenance };
  }, [scope, propertyId]);

  const fileLabel = scope === "property" ? properties.find((p) => p.id === propertyId)?.name.replace(/\s+/g, "_") : "All";
  const fileBase = `MetroManager_Report_${fileLabel}_${dateRange.replace(/\s+/g, "")}`;

  const generateXLSX = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const summary = [
      ["Metro Manager Report"],
      ["Scope", scope],
      ["Date Range", dateRange],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Total Properties", scoped.properties.length || properties.length],
      ["Total Tenants", scoped.tenants.length || tenants.length],
      ["Total Revenue (NGN)", scoped.transactions.filter((t) => t.type === "Revenue").reduce((s, t) => s + t.amount, 0)],
      ["Total Expenses (NGN)", scoped.transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

    if (scoped.properties.length || scope === "all" || scope === "snapshot") {
      const data = (scoped.properties.length ? scoped.properties : properties).map((p) => ({
        ID: p.id,
        Name: p.name,
        Address: p.address,
        Type: p.type,
        Bedrooms: p.bedrooms,
        Bathrooms: p.bathrooms,
        "Annual Rent (NGN)": p.annualRent,
        Status: p.status,
        Registered: formatDateShort(p.registeredOn),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Properties");
    }

    if (scoped.tenants.length || scope === "all" || scope === "snapshot") {
      const data = (scoped.tenants.length ? scoped.tenants : tenants).map((t) => ({
        Name: t.name,
        Email: t.email,
        Phone: t.phone,
        Property: properties.find((p) => p.id === t.propertyId)?.name,
        Type: t.type,
        Start: formatDateShort(t.startDate),
        End: formatDateShort(t.endDate),
        "Rent Status": t.rentStatus,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Tenants");
    }

    if (scoped.transactions.length || scope === "all" || scope === "snapshot") {
      const data = (scoped.transactions.length ? scoped.transactions : transactions).map((x) => ({
        Date: formatDateShort(x.date),
        Property: properties.find((p) => p.id === x.propertyId)?.name,
        Description: x.description,
        Type: x.type,
        "Amount (NGN)": x.amount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Cash Flow");
    }

    if (scoped.maintenance.length || scope === "all" || scope === "snapshot") {
      const data = (scoped.maintenance.length ? scoped.maintenance : maintenance).map((m) => ({
        ID: m.id,
        Property: properties.find((p) => p.id === m.propertyId)?.name,
        Category: m.category,
        Description: m.description,
        Date: formatDateShort(m.date),
        Priority: m.priority,
        Status: m.status,
        "Assigned To": m.assignedTo,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Maintenance");
    }

    const dueData = (scoped.tenants.length ? scoped.tenants : tenants)
      .slice()
      .sort((a, b) => new Date(a.rentDue).getTime() - new Date(b.rentDue).getTime())
      .map((t) => ({
        Tenant: t.name,
        Property: properties.find((p) => p.id === t.propertyId)?.name,
        "Due Date": formatDateShort(t.rentDue),
        Status: t.rentStatus,
      }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dueData), "Rent Due");

    const blob = new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return { blob, filename: `${fileBase}.xlsx` };
  };

  const generatePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    // Cover page
    doc.setFillColor(26, 86, 219);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Metro Manager Report", 14, 20);
    doc.setFontSize(11);
    doc.text("Powered by Manaja · Badij Technologies", 14, 30);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.text(`Scope: ${scopeOptions.find((s) => s.key === scope)?.title}`, 14, 55);
    doc.text(`Date Range: ${dateRange}`, 14, 63);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 71);
    if (scope === "property") {
      doc.text(`Property: ${properties.find((p) => p.id === propertyId)?.name}`, 14, 79);
    }

    // Confidential watermark
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(60);
    doc.text("CONFIDENTIAL", 35, 180, { angle: 30 });

    doc.addPage();
    let y = 20;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.text("Properties", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y + 4,
      head: [["Name", "Type", "Status", "Annual Rent (NGN)"]],
      body: (scoped.properties.length ? scoped.properties : properties).map((p) => [
        p.name,
        p.type,
        p.status,
        formatNGN(p.annualRent),
      ]),
      headStyles: { fillColor: [26, 86, 219] },
      alternateRowStyles: { fillColor: [240, 244, 250] },
    });

    doc.addPage();
    doc.setFontSize(16);
    doc.text("Tenants", 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [["Tenant", "Property", "Type", "Status", "Due"]],
      body: (scoped.tenants.length ? scoped.tenants : tenants).map((t) => [
        t.name,
        properties.find((p) => p.id === t.propertyId)?.name || "",
        t.type,
        t.rentStatus,
        formatDateShort(t.rentDue),
      ]),
      headStyles: { fillColor: [26, 86, 219] },
      alternateRowStyles: { fillColor: [240, 244, 250] },
    });

    if (scope !== "tenants" && scope !== "maintenance") {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Cash Flow", 14, 20);
      autoTable(doc, {
        startY: 28,
        head: [["Date", "Property", "Description", "Type", "Amount (NGN)"]],
        body: (scoped.transactions.length ? scoped.transactions : transactions).map((x) => [
          formatDateShort(x.date),
          properties.find((p) => p.id === x.propertyId)?.name || "",
          x.description,
          x.type,
          formatNGN(x.amount),
        ]),
        headStyles: { fillColor: [26, 86, 219] },
        alternateRowStyles: { fillColor: [240, 244, 250] },
      });
    }

    // Footers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Generated by Metro Manager · Badij Technologies · manaja.com", 14, 290);
      doc.text(`Page ${i} / ${pageCount}`, 180, 290);
    }

    const blob = doc.output("blob");
    return { blob, filename: `${fileBase}.pdf` };
  };

  const generatePNG = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const el = document.getElementById(captureElementId) || document.body;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#0A0C14" });
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
    return { blob, filename: `${fileBase}.png` };
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleGenerate = async () => {
    setProgress("Collecting data...");
    await new Promise((r) => setTimeout(r, 300));
    setProgress(`Generating ${format.toUpperCase()}...`);
    let payload: { blob: Blob; filename: string };
    if (format === "xlsx") payload = await generateXLSX();
    else if (format === "pdf") payload = await generatePDF();
    else payload = await generatePNG();

    setProgress("Sending...");
    await new Promise((r) => setTimeout(r, 400));

    const sentTo: string[] = [];

    if (delivery.download || delivery.email || delivery.whatsapp) {
      // We always have to download to enable sharing in mock since there's no backend
      triggerDownload(payload.blob, payload.filename);
    }

    if (delivery.email) {
      const subject = emailSubject || `Metro Manager Report — ${dateRange} — ${fileLabel}`;
      const body = `${emailMessage}\n\nAttachment: ${payload.filename}`;
      window.open(`mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      sentTo.push(`Email → ${emailTo}`);
    }

    if (delivery.whatsapp) {
      const text = `Hi, please find the Metro Manager property report attached. Generated via Manaja – ${dateRange}.`;
      const phone = waPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
      sentTo.push(`WhatsApp → ${waPhone}`);
    }

    if (delivery.copyLink) {
      const link = `https://app.manaja.com/reports/share/${Math.random().toString(36).slice(2, 12)}`;
      setShareLink(link);
      try {
        await navigator.clipboard.writeText(link);
      } catch {}
      sentTo.push(`Link copied`);
    }

    if (delivery.download) sentTo.push(`Downloaded → ${payload.filename}`);

    setProgress("Done");
    setDone(true);
    setToast(`Report ready · ${sentTo.join(" · ")}`);
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canProceedStep0 = !!scope && (scope !== "property" || !!propertyId);
  const canProceedStep2 = Object.values(delivery).some(Boolean);

  return (
    <>
      <Button
        variant={buttonVariant}
        startIcon={<SendIcon />}
        onClick={() => setOpen(true)}
        sx={{
          borderColor: "rgba(245,166,35,0.5)",
          color: "#F5A623",
          "&:hover": { borderColor: "#F5A623", backgroundColor: "rgba(245,166,35,0.08)" },
        }}
      >
        {buttonLabel}
      </Button>

      <Dialog open={open} onClose={() => {}} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Generate & Send Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose what to include, your format, and how to deliver it.
            </Typography>
          </Box>
          <IconButton onClick={close} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!done ? (
            <>
              <Stepper activeStep={step} sx={{ mb: 3 }}>
                <Step><StepLabel>Scope</StepLabel></Step>
                <Step><StepLabel>Format</StepLabel></Step>
                <Step><StepLabel>Delivery</StepLabel></Step>
                <Step><StepLabel>Review</StepLabel></Step>
              </Stepper>

              {step === 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>What should this report cover?</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    {scopeOptions.map((opt) => (
                      <Card
                        key={opt.key}
                        sx={{
                          border: scope === opt.key ? "2px solid #1A56DB" : "1px solid var(--border-subtle)",
                          backgroundColor: scope === opt.key ? "rgba(26,86,219,0.10)" : "transparent",
                        }}
                      >
                        <CardActionArea onClick={() => setScope(opt.key)} sx={{ p: 0.5 }}>
                          <CardContent sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", py: 1.5 }}>
                            <Box sx={{ color: "#1A56DB", mt: 0.5 }}>{opt.icon}</Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{opt.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>

                  {scope === "property" && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">Select property</Typography>
                      <Select fullWidth size="small" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} sx={{ mt: 0.5 }}>
                        {properties.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                  )}

                  {scope === "custom" && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">Sections to include</Typography>
                      <FormGroup>
                        {customSections.map((s) => (
                          <FormControlLabel
                            key={s}
                            control={
                              <Checkbox
                                size="small"
                                checked={customSel.includes(s)}
                                onChange={(_, c) => setCustomSel((cur) => (c ? [...cur, s] : cur.filter((x) => x !== s)))}
                              />
                            }
                            label={s}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">Date range</Typography>
                    <Select fullWidth size="small" value={dateRange} onChange={(e) => setDateRange(e.target.value)} sx={{ mt: 0.5 }}>
                      {["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"].map((d) => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>
              )}

              {step === 1 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Choose your report format</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
                    {[
                      { k: "png" as const, icon: <ImageIcon sx={{ fontSize: 32 }} />, title: "PNG Snapshot", desc: "High-res screenshot of the live dashboard" },
                      { k: "xlsx" as const, icon: <TableChartIcon sx={{ fontSize: 32 }} />, title: "Excel (XLSX)", desc: "Multi-sheet structured workbook" },
                      { k: "pdf" as const, icon: <PictureAsPdfIcon sx={{ fontSize: 32 }} />, title: "PDF Report", desc: "Branded multi-page document" },
                    ].map((f) => (
                      <Card
                        key={f.k}
                        sx={{
                          border: format === f.k ? "2px solid #1A56DB" : "1px solid var(--border-subtle)",
                          backgroundColor: format === f.k ? "rgba(26,86,219,0.10)" : "transparent",
                        }}
                      >
                        <CardActionArea onClick={() => setFormat(f.k)}>
                          <CardContent sx={{ textAlign: "center", py: 2.5 }}>
                            <Box sx={{ color: "#1A56DB", mb: 1 }}>{f.icon}</Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{f.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}

              {step === 2 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="subtitle2">How would you like to send this?</Typography>

                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={<Switch checked={delivery.email} onChange={(_, c) => setDelivery((d) => ({ ...d, email: c }))} />}
                        label={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><EmailIcon fontSize="small" /> Email</Box>}
                      />
                      {delivery.email && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                          <TextField label="To" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} fullWidth />
                          <TextField label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder={`Metro Manager Report — ${dateRange} — ${fileLabel}`} fullWidth />
                          <TextField label="Message" multiline minRows={3} value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} fullWidth />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Quick contacts:</Typography>
                            <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                              {["ceo@manaja.com", "adebayo@example.com", "folake@example.com"].map((e) => (
                                <Chip key={e} label={e} size="small" onClick={() => setEmailTo(e)} />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={<Switch checked={delivery.whatsapp} onChange={(_, c) => setDelivery((d) => ({ ...d, whatsapp: c }))} />}
                        label={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><WhatsAppIcon fontSize="small" /> WhatsApp</Box>}
                      />
                      {delivery.whatsapp && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                          <TextField label="Phone (with country code)" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} fullWidth />
                          <Alert severity="info" variant="outlined">
                            WhatsApp Web doesn't support auto-attaching files via URL. Your report will download automatically — attach it manually in WhatsApp.
                          </Alert>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={<Switch checked={delivery.download} onChange={(_, c) => setDelivery((d) => ({ ...d, download: c }))} />}
                        label={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><DownloadIcon fontSize="small" /> Download to my device</Box>}
                      />
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={<Switch checked={delivery.copyLink} onChange={(_, c) => setDelivery((d) => ({ ...d, copyLink: c }))} />}
                        label={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><LinkIcon fontSize="small" /> Copy shareable link</Box>}
                      />
                    </CardContent>
                  </Card>

                  {!canProceedStep2 && (
                    <Alert severity="warning">Select at least one delivery method.</Alert>
                  )}
                </Box>
              )}

              {step === 3 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Review & send</Typography>
                  <Card variant="outlined">
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Row label="Scope" value={`${scopeOptions.find((s) => s.key === scope)?.title}${scope === "property" ? ` — ${properties.find((p) => p.id === propertyId)?.name}` : ""}`} />
                      <Row label="Date Range" value={dateRange} />
                      <Row label="Format" value={format.toUpperCase()} />
                      <Row label="Delivery" value={Object.entries(delivery).filter(([, v]) => v).map(([k]) => k).join(", ")} />
                      {delivery.email && <Row label="Email to" value={emailTo} />}
                      {delivery.whatsapp && <Row label="WhatsApp" value={waPhone} />}
                    </CardContent>
                  </Card>

                  {progress && (
                    <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">{progress}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Report sent!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your {format.toUpperCase()} report has been generated and delivered.
              </Typography>
              {shareLink && (
                <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
                  <TextField size="small" value={shareLink} sx={{ minWidth: 360 }} slotProps={{ input: { readOnly: true } }} />
                  <Button variant="outlined" onClick={() => navigator.clipboard.writeText(shareLink)}>Copy</Button>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Link expires in 7 days · requires login to view
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {!done ? (
            <>
              {step > 0 && <Button onClick={back} disabled={!!progress}>Back</Button>}
              <Box sx={{ flex: 1 }} />
              {step < 3 ? (
                <Button
                  variant="contained"
                  onClick={next}
                  disabled={(step === 0 && !canProceedStep0) || (step === 2 && !canProceedStep2)}
                >
                  Next
                </Button>
              ) : (
                <Button variant="contained" onClick={handleGenerate} disabled={!!progress} startIcon={<SendIcon />}>
                  Generate & Send
                </Button>
              )}
            </>
          ) : (
            <Button variant="contained" onClick={close}>Close</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} message={toast || ""} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}
