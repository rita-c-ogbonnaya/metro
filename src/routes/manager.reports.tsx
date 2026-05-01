import { createFileRoute } from "@tanstack/react-router";
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Menu, MenuItem, TextField, InputAdornment } from "@mui/material";
import { useMemo, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import { AppShell } from "@/components/metro/AppShell";
import { StatCard } from "@/components/metro/StatCard";
import { ReportSender } from "@/components/metro/ReportSender";
import { useStore } from "@/lib/mock-store";
import { monthlyFinancials, transactions } from "@/data/mock";
import { formatNGN, formatDate } from "@/lib/format";

export const Route = createFileRoute("/manager/reports")({
  head: () => ({ meta: [{ title: "Report Analysis — Metro Manaja" }] }),
  component: ReportsPage,
});

const sentReports = [
  { id: "R1", title: "Q1 2025 Portfolio Snapshot", scope: "All Properties", format: "PDF", recipient: "ceo@manaja.com", date: "2025-04-15", status: "Delivered" },
  { id: "R2", title: "Lekki Duplex Deep Dive", scope: "Single Property", format: "XLSX", recipient: "adebayo@example.com", date: "2025-04-10", status: "Delivered" },
  { id: "R3", title: "March Cash Flow", scope: "Financials", format: "PDF", recipient: "+2348012345678 (WA)", date: "2025-04-02", status: "Delivered" },
  { id: "R4", title: "Tenant Rent Status Weekly", scope: "Tenants", format: "XLSX", recipient: "ops@manaja.com", date: "2025-03-28", status: "Delivered" },
];

function ReportsPage() {
  const { properties, tenants } = useStore();
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filteredReports = useMemo(() => {
    return sentReports.filter((r) => {
      if (search && !`${r.title} ${r.recipient} ${r.scope}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  }, [search, from, to]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportCSV = () => {
    const headers = ["ID", "Title", "Scope", "Format", "Recipient", "Sent", "Status"];
    const rows = filteredReports.map((r) => [r.id, r.title, r.scope, r.format, r.recipient, r.date, r.status]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `MetroManaja_SentReports_${new Date().toISOString().slice(0, 10)}.csv`);
    setExportAnchor(null);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFillColor(26, 86, 219);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Sent Reports Log", 14, 18);
    doc.setFontSize(10);
    const filterParts: string[] = [];
    if (search) filterParts.push(`search: "${search}"`);
    if (from) filterParts.push(`from: ${from}`);
    if (to) filterParts.push(`to: ${to}`);
    const filterLine = filterParts.length ? ` · Filters — ${filterParts.join(" · ")}` : "";
    doc.text(`Generated ${new Date().toLocaleString()} · Metro Manaja${filterLine}`, 14, 26);
    doc.setTextColor(20, 20, 20);
    autoTable(doc, {
      startY: 42,
      head: [["Title", "Scope", "Format", "Recipient", "Sent", "Status"]],
      body: filteredReports.map((r) => [r.title, r.scope, r.format, r.recipient, formatDate(r.date), r.status]),
      headStyles: { fillColor: [26, 86, 219] },
      alternateRowStyles: { fillColor: [240, 244, 250] },
    });
    downloadBlob(doc.output("blob"), `MetroManaja_SentReports_${new Date().toISOString().slice(0, 10)}.pdf`);
    setExportAnchor(null);
  };
  const totalRev = transactions.filter((t) => t.type === "Revenue").reduce((s, t) => s + t.amount, 0);

  const reportTypes = [
    { name: "Property", value: 38, color: "#1A56DB" },
    { name: "Financials", value: 27, color: "#10B981" },
    { name: "Tenants", value: 22, color: "#F5A623" },
    { name: "Maintenance", value: 13, color: "#EF4444" },
  ];

  const monthlyReports = monthlyFinancials.map((m) => ({
    month: m.month,
    generated: Math.floor(8 + Math.random() * 14),
    sent: Math.floor(6 + Math.random() * 12),
  }));

  return (
    <AppShell role="manager" title="Report Analysis" subtitle="Insights, generated reports, and delivery history">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard icon={<AssessmentIcon />} value={sentReports.length + 38} label="Reports Generated" sub="Last 90 days" trend={22} />
        <StatCard icon={<DescriptionIcon />} value={sentReports.length + 31} label="Reports Delivered" sub="Email · WA · Download" trend={18} color="#10B981" />
        <StatCard icon={<TableChartIcon />} value={`${properties.length} props`} label="Data Points Tracked" sub={`${tenants.length} tenants · ${transactions.length} txns`} trend={9} color="#F5A623" />
        <StatCard icon={<PictureAsPdfIcon />} value={formatNGN(totalRev)} label="Revenue Reported" sub="Cumulative" trend={14} color="#1A56DB" />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <ReportSender buttonLabel="New Report" buttonVariant="contained" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2, mb: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Reports Generated vs Delivered</Typography>
            <Typography variant="caption" color="text.secondary">Last 6 months</Typography>
            <Box sx={{ mt: 2, height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={monthlyReports}>
                  <defs>
                    <linearGradient id="gen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A56DB" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#1A56DB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="snt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5A623" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="generated" name="Generated" stroke="#1A56DB" fill="url(#gen)" />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke="#F5A623" fill="url(#snt)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Report Type Mix</Typography>
            <Box sx={{ mt: 2, height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={reportTypes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {reportTypes.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Delivery Channel Performance</Typography>
          <Box sx={{ mt: 2, height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={[
                { channel: "Email", delivered: 42, opened: 36 },
                { channel: "WhatsApp", delivered: 28, opened: 27 },
                { channel: "Download", delivered: 19, opened: 19 },
                { channel: "Share Link", delivered: 14, opened: 11 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="channel" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="delivered" name="Delivered" fill="#1A56DB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="opened" name="Opened" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Sent Reports Log</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredReports.length} of {sentReports.length}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                placeholder="Search title / recipient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ minWidth: 220 }}
              />
              <TextField size="small" type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <Button size="small" startIcon={<DownloadIcon />} variant="outlined" onClick={(e) => setExportAnchor(e.currentTarget)}>Export Log</Button>
              <Menu anchorEl={exportAnchor} open={!!exportAnchor} onClose={() => setExportAnchor(null)}>
                <MenuItem onClick={exportCSV}>Download filtered as CSV</MenuItem>
                <MenuItem onClick={exportPDF}>Download filtered as PDF</MenuItem>
              </Menu>
            </Box>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((r, i) => (
                <TableRow key={r.id} sx={{ backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{r.title}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{r.scope}</Typography></TableCell>
                  <TableCell><Chip size="small" label={r.format} variant="outlined" /></TableCell>
                  <TableCell><Typography variant="caption">{r.recipient}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{formatDate(r.date)}</Typography></TableCell>
                  <TableCell><Chip size="small" label={r.status} sx={{ bgcolor: "rgba(16,185,129,0.15)", color: "#10B981", fontWeight: 600 }} /></TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No reports match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
