import { createFileRoute } from "@tanstack/react-router";
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, Link as MuiLink,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { AppShell } from "@/components/metro/AppShell";
import { useStore } from "@/lib/mock-store";
import { format } from "date-fns";

export const Route = createFileRoute("/manager/emails")({
  head: () => ({ meta: [{ title: "Sent Emails — Metro Manaja" }] }),
  component: SentEmailsPage,
});

function SentEmailsPage() {
  const { sentEmails } = useStore();

  return (
    <AppShell role="manager" title="Sent Emails" subtitle="Mock log of welcome emails dispatched to tenants and landlords">
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Welcome email log</Typography>
              <Typography variant="caption" color="text.secondary">{sentEmails.length} email{sentEmails.length === 1 ? "" : "s"} sent this session</Typography>
            </Box>
            <EmailIcon color="action" />
          </Box>

          <Box sx={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "var(--table-alt)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, color: "text.secondary" } }}>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Login link</TableCell>
                  <TableCell>Sent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sentEmails.map((e, i) => (
                  <TableRow
                    key={e.id}
                    hover
                    sx={{
                      backgroundColor: i % 2 ? "var(--table-alt)" : "transparent",
                      "& td": { py: 1.25 },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.recipientName}</Typography>
                      <Typography variant="caption" color="text.secondary">{e.subject}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{e.to}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={e.audience}
                        sx={{ textTransform: "capitalize", fontWeight: 600 }}
                        color={e.audience === "landlord" ? "primary" : "default"}
                        variant={e.audience === "landlord" ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <MuiLink href={e.loginUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13, wordBreak: "break-all" }}>
                        {e.loginUrl}
                      </MuiLink>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(e.sentAt), "dd MMM yyyy, HH:mm")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {sentEmails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No welcome emails sent yet. Add a tenant or property to populate this log.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </AppShell>
  );
}
