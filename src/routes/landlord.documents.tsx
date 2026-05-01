import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/landlord/documents")({
  component: () => <StubPage role="landlord" title="Documents" description="Tenancy agreements, receipts, legal letters shared by your property manager." />,
});
