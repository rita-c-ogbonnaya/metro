import { Chip } from "@mui/material";

const map: Record<string, { color: string; bg: string; label?: string }> = {
  Active: { color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  Occupied: { color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  Paid: { color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  Resolved: { color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  Closed: { color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" },
  Vacant: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  "Due Soon": { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  "Expiring Soon": { color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  Overdue: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  Critical: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  Open: { color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  "In Progress": { color: "#F5A623", bg: "rgba(245,166,35,0.15)" },
  Shortlet: { color: "#F5A623", bg: "rgba(245,166,35,0.15)" },
  High: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  Medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  Low: { color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" },
  Yearly: { color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
};

export function StatusChip({ status }: { status: string }) {
  const cfg = map[status] || { color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" };
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        fontWeight: 600,
        border: `1px solid ${cfg.color}33`,
      }}
    />
  );
}
