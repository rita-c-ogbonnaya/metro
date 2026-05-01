import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/tenant/rent")({
  component: () => <StubPage role="tenant" title="My Rent" description="Tenancy details, rent payment history, and one-click rent payment." />,
});
