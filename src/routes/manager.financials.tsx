import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, TextField,
} from "@mui/material";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { AppShell } from "@/components/metro/AppShell";
import { StatCard } from "@/components/metro/StatCard";
import { ReportSender } from "@/components/metro/ReportSender";
import { useStore } from "@/lib/mock-store";
import { transactions, monthlyFinancials } from "@/data/mock";
import { formatNGN, formatDate } from "@/lib/format";

export const Route = createFileRoute("/manager/financials")({
  head: () => ({ meta: [{ title: "Financials — Metro Manaja" }] }),
  component: FinancialsPage,
});

function FinancialsPage() {
  const [tab, setTab] = useState(0);
  const totalRev = transactions.filter((t) => t.type === "Revenue").reduce((s, t) => s + t.amount, 0);
  const totalExp = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
  const net = totalRev - totalExp;
  const margin = Math.round((net / totalRev) * 100);

  return (
    <AppShell role="manager" title="Financials" subtitle="Cash flow · Rent analysis · Expense tracker">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard icon={<TrendingUpIcon />} value={formatNGN(totalRev)} label="Total Revenue" sub="Last 6 months" trend={14} color="#10B981" />
        <StatCard icon={<TrendingDownIcon />} value={formatNGN(totalExp)} label="Total Expenses" sub="Last 6 months" trend={-6} color="#EF4444" />
        <StatCard icon={<AccountBalanceIcon />} value={formatNGN(net)} label="Net Cash Flow" sub={`${margin}% margin`} trend={11} color="#1A56DB" />
        <StatCard icon={<RequestQuoteIcon />} value="92%" label="Collection Rate" sub="Of yearly rent due" trend={4} color="#F5A623" />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: "1px solid var(--border-subtle)", flex: 1 }}>
          <Tab label="Cash Flow" />
          <Tab label="Rent Analysis" />
          <Tab label="Expense Tracker" />
        </Tabs>
        <ReportSender buttonLabel="Export Financials" defaultScope="financials" />
      </Box>

      {tab === 0 && <CashFlow />}
      {tab === 1 && <RentAnalysis />}
      {tab === 2 && <ExpenseTracker />}
    </AppShell>
  );
}

function CashFlow() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2, mt: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Cash Flow Trend</Typography>
          <Typography variant="caption" color="text.secondary">Revenue vs expenses by month</Typography>
          <Box sx={{ mt: 2, height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyFinancials}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => formatNGN(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" fill="url(#rev2)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="url(#exp2)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Net Cash Flow</Typography>
          <Typography variant="caption" color="text.secondary">Per month</Typography>
          <Box sx={{ mt: 2, height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyFinancials.map((m) => ({ month: m.month, net: m.revenue - m.expenses }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => formatNGN(Number(v))} />
                <Bar dataKey="net" name="Net" fill="#1A56DB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ gridColumn: { lg: "1 / -1" } }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Recent Transactions</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.slice().reverse().map((t, i) => (
                <TableRow key={t.id} sx={{ backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}>
                  <TableCell><Typography variant="caption">{formatDate(t.date)}</Typography></TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: t.type === "Revenue" ? "#10B981" : "#EF4444", fontWeight: 600 }}>{t.type}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: t.type === "Revenue" ? "#10B981" : "#EF4444" }}>
                      {t.type === "Revenue" ? "+" : "−"}{formatNGN(t.amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

function RentAnalysis() {
  const { properties, tenants } = useStore();
  const collected = properties.filter((p) => p.tenantId).reduce((s, p) => s + p.annualRent, 0);
  const potential = properties.reduce((s, p) => s + p.annualRent, 0);
  const rate = Math.round((collected / potential) * 100);

  const byProperty = properties.map((p) => ({
    name: p.name.split(" ")[0],
    rent: p.annualRent / 1_000_000,
  }));

  const radial = [{ name: "Collected", value: rate, fill: "#10B981" }];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Rent Collection Rate</Typography>
          <Typography variant="caption" color="text.secondary">Collected vs potential annual</Typography>
          <Box sx={{ mt: 2, height: 280, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <ResponsiveContainer>
              <RadialBarChart innerRadius={80} outerRadius={120} data={radial} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <Box sx={{ position: "absolute", textAlign: "center" }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: "#10B981" }}>{rate}%</Typography>
              <Typography variant="caption" color="text.secondary">{formatNGN(collected)} of {formatNGN(potential)}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Annual Rent by Property (₦M)</Typography>
          <Box sx={{ mt: 2, height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={byProperty} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => `₦${v}M`} />
                <Bar dataKey="rent" fill="#F5A623" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ gridColumn: { lg: "1 / -1" } }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Rent Status Distribution</Typography>
          <Box sx={{ mt: 2, height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={[
                { status: "Active", value: tenants.filter((t) => t.rentStatus === "Active").length },
                { status: "Due Soon", value: tenants.filter((t) => t.rentStatus === "Due Soon").length },
                { status: "Expiring Soon", value: tenants.filter((t) => t.rentStatus === "Expiring Soon").length },
                { status: "Overdue", value: tenants.filter((t) => t.rentStatus === "Overdue").length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="status" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} />
                <Bar dataKey="value" fill="#1A56DB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function ExpenseTracker() {
  const [period, setPeriod] = useState("All");
  const expenses = useMemo(() => transactions.filter((t) => t.type === "Expense"), []);

  // Crude category mapping from description keywords
  const categorize = (d: string) => {
    if (/plumb/i.test(d)) return "Plumbing";
    if (/electric|generator/i.test(d)) return "Electrical";
    if (/repaint|renovat/i.test(d)) return "Renovation";
    if (/legal/i.test(d)) return "Legal";
    if (/roof|inspect/i.test(d)) return "Inspection";
    return "General";
  };

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { const c = categorize(e.description); map[c] = (map[c] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const COLORS = ["#1A56DB", "#F5A623", "#10B981", "#EF4444", "#3B82F6", "#9CA3AF"];

  const monthly = useMemo(() => monthlyFinancials.map((m) => ({ month: m.month, expenses: m.expenses })), []);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Expenses by Category</Typography>
            <TextField select size="small" value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 130 }}>
              {["All", "Last 30 days", "Last 90 days", "YTD"].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ mt: 2, height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => formatNGN(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Monthly Expenses Trend</Typography>
          <Box sx={{ mt: 2, height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v: any) => formatNGN(Number(v))} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ gridColumn: { lg: "1 / -1" } }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Expense Log</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((e, i) => (
                <TableRow key={e.id} sx={{ backgroundColor: i % 2 ? "var(--table-alt)" : "transparent" }}>
                  <TableCell><Typography variant="caption">{formatDate(e.date)}</Typography></TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{categorize(e.description)}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600, color: "#EF4444" }}>−{formatNGN(e.amount)}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
