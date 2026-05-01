import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/tenant/maintenance")({
  component: () => <StubPage role="tenant" title="Maintenance Requests" description="Raise and track maintenance requests for your apartment." />,
});
