import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import IosShareIcon from "@mui/icons-material/IosShare";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import GavelIcon from "@mui/icons-material/Gavel";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import VerifiedIcon from "@mui/icons-material/Verified";
import ImageIcon from "@mui/icons-material/Image";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import { format } from "date-fns";
import { AppShell } from "@/components/metro/AppShell";
import { useStore } from "@/lib/mock-store";
import { persistJSON, readJSON } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/documents")({
  head: () => ({ meta: [{ title: "Documents — Metro Manaja" }] }),
  component: DocumentsPage,
});

type DocType = "Lease" | "Invoice" | "Photo" | "Inspection" | "Compliance";

interface Doc {
  id: string;
  name: string;
  type: DocType;
  property: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  mime: string;
  /** data URL for client-side preview/download (mock environment). */
  dataUrl?: string;
}

const seed: Doc[] = [
  { id: "D1", name: "Lease_Fuad_Abdulrauf.pdf", type: "Lease", property: "Green villa apartment", uploadedBy: "Irene Victor", uploadedAt: "2026-02-10", size: 184_320, mime: "application/pdf" },
  { id: "D2", name: "Invoice_1025.pdf", type: "Invoice", property: "Lakeside apartment", uploadedBy: "Thomas Smith", uploadedAt: "2026-02-14", size: 92_160, mime: "application/pdf" },
  { id: "D3", name: "Maintenance_Photo_1.jpg", type: "Photo", property: "Parkview condos", uploadedBy: "Mary Alan", uploadedAt: "2026-02-18", size: 1_048_576, mime: "image/jpeg" },
  { id: "D4", name: "InspectionReport_Feb.doc", type: "Inspection", property: "Parkview condos", uploadedBy: "Mary Alan", uploadedAt: "2026-02-18", size: 245_760, mime: "application/msword" },
  { id: "D5", name: "InspectionReport_Feb.doc", type: "Inspection", property: "Parkview condos", uploadedBy: "Mary Alan", uploadedAt: "2026-02-18", size: 245_760, mime: "application/msword" },
  { id: "D6", name: "ComplianceCert_2026.pdf", type: "Compliance", property: "Green villa apartment", uploadedBy: "Irene Victor", uploadedAt: "2026-01-30", size: 71_680, mime: "application/pdf" },
];

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg", "image/png", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024;

const typeIcon: Record<DocType, React.ReactNode> = {
  Lease: <GavelIcon fontSize="small" sx={{ color: "#10B981" }} />,
  Invoice: <ReceiptLongIcon fontSize="small" sx={{ color: "#10B981" }} />,
  Photo: <ImageIcon fontSize="small" sx={{ color: "#3B82F6" }} />,
  Inspection: <FactCheckIcon fontSize="small" sx={{ color: "#F59E0B" }} />,
  Compliance: <VerifiedIcon fontSize="small" sx={{ color: "#1A56DB" }} />,
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function downloadDoc(d: Doc) {
  if (d.dataUrl) {
    const a = document.createElement("a");
    a.href = d.dataUrl;
    a.download = d.name;
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Downloading ${d.name}`);
  } else {
    // Seed/legacy doc with no real bytes — produce a placeholder text file
    const placeholder = `Placeholder for ${d.name}\nUploaded by ${d.uploadedBy} on ${d.uploadedAt}\n\n(Original file not available in mock environment.)`;
    const url = URL.createObjectURL(new Blob([placeholder], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${d.name}.txt`; a.click(); URL.revokeObjectURL(url);
    toast.message(`Downloaded placeholder for ${d.name}`, { description: "Original file unavailable" });
  }
}

function DocumentsPage() {
  const { properties } = useStore();
  const [docs, setDocs] = useState<Doc[]>(() => {
    const stored = readJSON<Doc[] | null>("metro-documents", null);
    return stored && stored.length ? stored : seed;
  });
  useEffect(() => { persistJSON("metro-documents", docs); }, [docs]);

  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploadForm, setUploadForm] = useState<{ file: File | null; type: DocType; property: string; error: string }>({
    file: null, type: "Lease", property: properties[0]?.name || "", error: "",
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      docs.filter((d) => {
        if (type !== "All" && d.type !== type) return false;
        if (q && !`${d.name} ${d.property} ${d.uploadedBy}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [docs, q, type]
  );

  const counts = {
    All: docs.length,
    Lease: docs.filter((d) => d.type === "Lease").length,
    Inspection: docs.filter((d) => d.type === "Inspection").length,
    Compliance: docs.filter((d) => d.type === "Compliance").length,
    Photo: docs.filter((d) => d.type === "Photo").length,
    Invoice: docs.filter((d) => d.type === "Invoice").length,
  };

  const pickFile = (f: File | null) => {
    if (!f) { setUploadForm((c) => ({ ...c, file: null, error: "" })); return; }
    if (!ALLOWED_MIME.includes(f.type)) {
      setUploadForm((c) => ({ ...c, file: null, error: `Unsupported file type "${f.type || "unknown"}". Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX.` }));
      return;
    }
    if (f.size > MAX_SIZE) {
      setUploadForm((c) => ({ ...c, file: null, error: `File is too large (${formatSize(f.size)}). Maximum is 10 MB.` }));
      return;
    }
    setUploadForm((c) => ({ ...c, file: f, error: "" }));
  };

  const submitUpload = async () => {
    if (!uploadForm.file) { toast.error("Choose a file to upload"); return; }
    setUploadProgress(0);
    // Simulated chunked progress
    for (let p = 10; p <= 90; p += 15) {
      await new Promise((r) => setTimeout(r, 90));
      setUploadProgress(p);
    }
    let dataUrl: string | undefined;
    try {
      dataUrl = await readAsDataUrl(uploadForm.file);
    } catch {
      setUploadProgress(null);
      toast.error("Could not read file");
      return;
    }
    setUploadProgress(100);
    await new Promise((r) => setTimeout(r, 150));

    const f = uploadForm.file;
    setDocs((cur) => [
      {
        id: `D${Date.now()}`,
        name: f.name,
        type: uploadForm.type,
        property: uploadForm.property,
        uploadedBy: "Adesuwa Edun",
        uploadedAt: format(new Date(), "yyyy-MM-dd"),
        size: f.size,
        mime: f.type,
        dataUrl,
      },
      ...cur,
    ]);
    toast.success(`${f.name} uploaded`);
    setUploadProgress(null);
    setUploadOpen(false);
    setUploadForm({ file: null, type: "Lease", property: properties[0]?.name || "", error: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const exportCsv = () => {
    const rows = [["Name", "Type", "Property", "Uploaded by", "Date", "Size"]];
    filtered.forEach((d) => rows.push([d.name, d.type, d.property, d.uploadedBy, d.uploadedAt, formatSize(d.size)]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "documents.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} document${filtered.length === 1 ? "" : "s"}`);
  };

  return (
    <AppShell role="manager" title="Document" subtitle="Manage all the requests across your platform">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 2, mb: 3 }}>
        <StatTile icon={<DescriptionIcon />} label="All Documents" value={counts.All} color="#3B82F6" />
        <StatTile icon={<GavelIcon />} label="Lease Agreement" value={counts.Lease} color="#10B981" />
        <StatTile icon={<FactCheckIcon />} label="Inspection" value={counts.Inspection} color="#F59E0B" />
        <StatTile icon={<VerifiedIcon />} label="Compliance" value={counts.Compliance} color="#1A56DB" />
        <StatTile icon={<ImageIcon />} label="Photo" value={counts.Photo} color="#6366F1" />
        <StatTile icon={<ReceiptLongIcon />} label="Invoice" value={counts.Invoice} color="#10B981" />
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <TextField
              placeholder="Search by name or address"
              size="small"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ minWidth: { xs: "100%", sm: 260 } }}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField select size="small" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 160 }} label="Document type">
                {["All", "Lease", "Invoice", "Photo", "Inspection", "Compliance"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={dateRange} onChange={(e) => setDateRange(e.target.value)} sx={{ minWidth: 160 }} label="Date uploaded">
                {["All", "Last 7 days", "Last 30 days", "This year"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <Button variant="outlined" startIcon={<IosShareIcon />} onClick={exportCsv}>Export</Button>
              <Button variant="contained" startIcon={<UploadFileIcon />} onClick={() => setUploadOpen(true)}>Upload document</Button>
            </Box>
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell>Date Uploaded</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((d, i) => (
                  <TableRow key={d.id} hover sx={{ backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" icon={typeIcon[d.type] as any} label={d.type} variant="outlined" />
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.property}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.uploadedBy}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{format(new Date(d.uploadedAt), "dd - MMM - yyyy")}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{formatSize(d.size)}</Typography></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ color: "text.primary" }} onClick={() => downloadDoc(d)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: "primary.main" }} onClick={() => setViewing(d)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>No documents found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Upload */}
      <Dialog open={uploadOpen} onClose={() => uploadProgress === null && setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Upload Document</Typography>
            <Typography variant="caption" color="text.secondary">PDF, JPG, PNG, WEBP, DOC, DOCX up to 10 MB</Typography>
          </Box>
          <IconButton size="small" onClick={() => setUploadOpen(false)} disabled={uploadProgress !== null}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField select label="Document type" value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as DocType })}>
              {(["Lease", "Invoice", "Photo", "Inspection", "Compliance"] as DocType[]).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Property" value={uploadForm.property} onChange={(e) => setUploadForm({ ...uploadForm, property: e.target.value })}>
              {properties.map((p) => <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>)}
            </TextField>
            <Box
              component="label"
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 1, minHeight: 140, border: "1px dashed var(--border-subtle)", borderRadius: 2,
                cursor: uploadProgress === null ? "pointer" : "default",
                opacity: uploadProgress === null ? 1 : 0.7,
                color: "text.secondary", textAlign: "center", p: 2,
              }}
            >
              {uploadForm.file ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main", wordBreak: "break-all" }}>{uploadForm.file.name}</Typography>
                  <Typography variant="caption">{uploadForm.file.type || "file"} · {formatSize(uploadForm.file.size)}</Typography>
                </>
              ) : (
                <>
                  <UploadFileIcon />
                  <Typography variant="caption">Click to choose a file</Typography>
                </>
              )}
              <input
                ref={fileRef}
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={uploadProgress !== null}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </Box>

            {uploadForm.error && <Alert severity="error">{uploadForm.error}</Alert>}

            {uploadProgress !== null && (
              <Box>
                <Typography variant="caption" color="text.secondary">Uploading… {uploadProgress}%</Typography>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 0.5, borderRadius: 1, height: 8 }} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadOpen(false)} disabled={uploadProgress !== null}>Cancel</Button>
          <Button variant="contained" onClick={submitUpload} disabled={!uploadForm.file || uploadProgress !== null}>
            {uploadProgress !== null ? "Uploading…" : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View */}
      <Dialog open={!!viewing} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Document Preview</Typography>
          <IconButton size="small" onClick={() => setViewing(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Row k="Name" v={viewing.name} />
              <Row k="Type" v={viewing.type} />
              <Row k="Property" v={viewing.property} />
              <Row k="Uploaded by" v={viewing.uploadedBy} />
              <Row k="Date uploaded" v={format(new Date(viewing.uploadedAt), "dd MMM yyyy")} />
              <Row k="Size" v={formatSize(viewing.size)} />
              {viewing.dataUrl && viewing.mime.startsWith("image/") ? (
                <Box sx={{ mt: 1, p: 1, border: "1px dashed var(--border-subtle)", borderRadius: 2, textAlign: "center" }}>
                  <img src={viewing.dataUrl} alt={viewing.name} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }} />
                </Box>
              ) : (
                <Box sx={{ mt: 1, p: 3, border: "1px dashed var(--border-subtle)", borderRadius: 2, textAlign: "center", color: "text.secondary" }}>
                  <DescriptionIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="caption" sx={{ display: "block" }}>
                    {viewing.dataUrl ? "Inline preview unavailable for this file type — use Download." : "Original file not stored (seed entry). Download will produce a placeholder."}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewing(null)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => { if (viewing) downloadDoc(viewing); setViewing(null); }}>Download</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: `${color}1A`, color,
        }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.1 }}>{label}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "baseline" }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130 }}>{k}:</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>{v}</Typography>
    </Box>
  );
}
