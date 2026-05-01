import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/tenant/documents")({
  component: () => <StubPage role="tenant" title="My Documents" description="Tenancy agreement, rent receipts, and other shared documents." />,
});
