import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Avatar, Menu,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AppShell } from "@/components/metro/AppShell";
import { StatCard } from "@/components/metro/StatCard";
import { StatusChip } from "@/components/metro/StatusChip";
import { AddPropertyModal } from "@/components/metro/AddPropertyModal";
import { useStore } from "@/lib/mock-store";
import { formatNGN, formatDate } from "@/lib/format";
import { landlords } from "@/data/mock";

export const Route = createFileRoute("/manager/properties")({
  head: () => ({ meta: [{ title: "Properties — Metro Manaja" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const { properties, tenants, deleteProperty } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof properties[number] | null>(null);
  const [deleting, setDeleting] = useState<typeof properties[number] | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        if (status !== "All" && p.status !== status) return false;
        if (type !== "All" && p.type !== type) return false;
        if (q && !`${p.name} ${p.address}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [properties, q, status, type]
  );

  const totalRent = properties.reduce((s, p) => s + p.annualRent, 0);
  const occupancyRate = Math.round((properties.filter((p) => p.status !== "Vacant").length / properties.length) * 100);

  return (
    <AppShell role="manager" title="Properties" subtitle="Manage your full property portfolio">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard icon={<HomeWorkIcon />} value={properties.length} label="Total Properties" sub="Across Lagos" trend={5} />
        <StatCard icon={<HomeWorkIcon />} value={properties.filter((p) => p.status === "Occupied").length} label="Occupied" sub={`${occupancyRate}% occupancy`} trend={3} color="#10B981" />
        <StatCard icon={<HomeWorkIcon />} value={properties.filter((p) => p.status === "Vacant").length} label="Vacant" sub="Need tenants" trend={-2} color="#F59E0B" />
        <StatCard icon={<HomeWorkIcon />} value={formatNGN(totalRent)} label="Portfolio Annual Rent" sub="At full occupancy" trend={9} color="#F5A623" />
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>All Properties</Typography>
              <Typography variant="caption" color="text.secondary">{filtered.length} of {properties.length}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <TextField
                placeholder="Search name or address…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ minWidth: 240 }}
              />
              <TextField select value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 130 }}>
                {["All", "Occupied", "Vacant", "Shortlet"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField select value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 180 }}>
                {["All", "Flat", "Bungalow", "Terrace Duplex", "Semi-detached Duplex", "Fully Detached Duplex", "Semi-detached Duplex with BQ", "Fully Detached Duplex with BQ"].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Property</Button>
            </Box>
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Beds / Baths</TableCell>
                  <TableCell>Annual Rent</TableCell>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Landlord</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell width={40}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p, i) => {
                  const tenant = tenants.find((t) => t.id === p.tenantId);
                  const landlord = landlords.find((l) => l.id === p.landlordId);
                  return (
                    <TableRow key={p.id} sx={{ backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(26,86,219,0.15)", color: "primary.main" }}>
                            <HomeWorkIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.address}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2">{p.type}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{p.bedrooms} / {p.bathrooms}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatNGN(p.annualRent)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{tenant?.name || "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{landlord?.name}</Typography></TableCell>
                      <TableCell><StatusChip status={p.status} /></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{formatDate(p.registeredOn)}</Typography></TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, id: p.id })}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>No properties match your filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor?.el || null}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            const p = properties.find((x) => x.id === menuAnchor?.id) || null;
            setEditing(p);
            setMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" style={{ marginRight: 8 }} /> Edit Property
        </MenuItem>
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            const p = properties.find((x) => x.id === menuAnchor?.id) || null;
            setDeleting(p);
            setMenuAnchor(null);
          }}
        >
          <DeleteIcon fontSize="small" style={{ marginRight: 8 }} /> Delete Property
        </MenuItem>
      </Menu>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Property?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove <strong>{deleting?.name}</strong> from your portfolio,
            along with any tenants and maintenance records linked to it. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleting) deleteProperty(deleting.id);
              setDeleting(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <AddPropertyModal open={open} onClose={() => setOpen(false)} />
      <AddPropertyModal open={!!editing} onClose={() => setEditing(null)} property={editing} />

    </AppShell>
  );
}
