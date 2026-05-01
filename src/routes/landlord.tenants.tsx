import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/landlord/tenants")({
  component: () => <StubPage role="landlord" title="My Tenants" description="Tenants on your properties — view-only with messaging access to your property manager." />,
});
