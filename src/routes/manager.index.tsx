import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Box, Card, CardContent, Typography, Button, Avatar, IconButton, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PeopleIcon from "@mui/icons-material/People";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import BuildIcon from "@mui/icons-material/Build";
import AddIcon from "@mui/icons-material/Add";

import CakeIcon from "@mui/icons-material/Cake";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { AppShell } from "@/components/metro/AppShell";
import { StatCard } from "@/components/metro/StatCard";
import { StatusChip } from "@/components/metro/StatusChip";
import { ReportSender } from "@/components/metro/ReportSender";
import { AddPropertyModal } from "@/components/metro/AddPropertyModal";
import { AddTenantModal } from "@/components/metro/AddTenantModal";
import { useStore } from "@/lib/mock-store";
import { notifications, monthlyFinancials, rentDueTimeline } from "@/data/mock";
import { formatNGN, formatDate } from "@/lib/format";
import { differenceInDays } from "date-fns";

export const Route = createFileRoute("/manager/")({
  head: () => ({
    meta: [
      { title: "Property Manager Dashboard — Metro Manaja" },
      { name: "description", content: "Oversee properties, landlords, tenants, and financials from one dashboard." },
    ],
  }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const { properties, tenants } = useStore();
  const [openProp, setOpenProp] = useState(false);
  const [openTen, setOpenTen] = useState(false);
  const totalProperties = properties.length;
  const occupied = properties.filter((p) => p.status === "Occupied").length;
  const vacant = properties.filter((p) => p.status === "Vacant").length;
  const shortlet = properties.filter((p) => p.status === "Shortlet").length;
  const totalTenants = tenants.length;
  const yearly = tenants.filter((t) => t.type === "Yearly").length;
  const shortletT = tenants.filter((t) => t.type === "Shortlet").length;

  const dueIn30 = tenants.filter((t) => {
    const d = differenceInDays(new Date(t.rentDue), new Date("2025-04-27"));
    return d >= 0 && d <= 30;
  });
  const dueAmount = dueIn30.reduce((s, t) => s + (properties.find((p) => p.id === t.propertyId)?.annualRent || 0), 0);

  const occupancyData = [
    { name: "Occupied", value: occupied, color: "#1A56DB" },
    { name: "Vacant", value: vacant, color: "#F59E0B" },
    { name: "Shortlet", value: shortlet, color: "#F5A623" },
  ];

  const upcomingBdays = tenants.filter((t) => {
    const d = new Date(t.dob);
    const today = new Date("2025-04-27");
    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    const diff = differenceInDays(next, today);
    return diff >= -2 && diff <= 14;
  });

  return (
    <AppShell role="manager" title="Property Manager Dashboard" subtitle="Overview of your portfolio and tenants">
      <div id="manager-dashboard-root">
        {/* KPI Cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          <StatCard
            icon={<HomeWorkIcon />}
            value={totalProperties}
            label="Total Properties"
            sub={`${occupied} active · ${vacant} vacant · ${shortlet} shortlet`}
            trend={8}
            color="#1A56DB"
          />
          <StatCard
            icon={<PeopleIcon />}
            value={totalTenants}
            label="Total Tenants"
            sub={`${yearly} yearly · ${shortletT} shortlet`}
            trend={12}
            color="#F5A623"
          />
          <StatCard
            icon={<RequestQuoteIcon />}
            value={formatNGN(dueAmount)}
            label="Rent Due (30 days)"
            sub={`${dueIn30.length} tenants`}
            trend={-3}
            color="#F59E0B"
          />
          <StatCard
            icon={<BuildIcon />}
            value={2}
            label="Pending Maintenance"
            sub="1 critical"
            trend={-15}
            color="#EF4444"
          />
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenProp(true)}>Add Property</Button>
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setOpenTen(true)}>Onboard Tenant</Button>
          <ReportSender buttonLabel="Generate Report" buttonVariant="outlined" />
          
        </Box>

        <AddPropertyModal open={openProp} onClose={() => setOpenProp(false)} />
        <AddTenantModal open={openTen} onClose={() => setOpenTen(false)} />

        {/* Main Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 2 }}>
          {/* Left */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Rent Due Timeline</Typography>
                <Typography variant="caption" color="text.secondary">Outstanding by property and timeframe</Typography>
                <Box sx={{ mt: 2, height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={rentDueTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} />
                      <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => formatNGN(Number(v))} />
                      <Legend />
                      <Bar dataKey="overdue" name="Overdue" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="days7" name="Due in 7d" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="months3" name="Due in 3m" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="months6" name="Due in 6m" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Revenue vs Expenses</Typography>
                <Typography variant="caption" color="text.secondary">Last 6 months</Typography>
                <Box sx={{ mt: 2, height: 240 }}>
                  <ResponsiveContainer>
                    <AreaChart data={monthlyFinancials}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1A56DB" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#1A56DB" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} />
                      <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => formatNGN(Number(v))} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1A56DB" fill="url(#rev)" />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="url(#exp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Tenants</Typography>
                    <Typography variant="caption" color="text.secondary">Latest activity across your portfolio</Typography>
                  </Box>
                  <Button size="small">View all</Button>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tenant</TableCell>
                        <TableCell>Property</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Rent Due</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell width={40}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tenants.slice(0, 6).map((t, i) => {
                        const prop = properties.find((p) => p.id === t.propertyId);
                        return (
                          <TableRow key={t.id} sx={{ backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.main" }}>
                                  {t.name.split(" ").map((n) => n[0]).join("")}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{t.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary">{prop?.name}</Typography></TableCell>
                            <TableCell><StatusChip status={t.type} /></TableCell>
                            <TableCell><Typography variant="body2">{formatDate(t.rentDue)}</Typography></TableCell>
                            <TableCell><StatusChip status={t.rentStatus} /></TableCell>
                            <TableCell><IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Right */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Property Occupancy</Typography>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={occupancyData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
                        {occupancyData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
                  <Button size="small">View all</Button>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {notifications.slice(0, 5).map((n) => (
                    <Box
                      key={n.id}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        borderLeft: n.read ? "3px solid transparent" : "3px solid #1A56DB",
                        backgroundColor: n.read ? "transparent" : "rgba(26,86,219,0.06)",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{n.body}</Typography>
                      </Box>
                      <StatusChip status={n.type} />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Upcoming Birthdays</Typography>
                {upcomingBdays.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">No upcoming birthdays.</Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {upcomingBdays.map((t) => (
                      <Box key={t.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, borderRadius: 2, backgroundColor: "rgba(245,166,35,0.08)" }}>
                        <CakeIcon sx={{ color: "#F5A623" }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{properties.find((p) => p.id === t.propertyId)?.name}</Typography>
                        </Box>
                        <Button size="small" variant="outlined">Send Wish</Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </div>
    </AppShell>
  );
}
