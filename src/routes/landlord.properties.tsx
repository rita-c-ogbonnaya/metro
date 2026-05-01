import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/landlord/properties")({
  component: () => <StubPage role="landlord" title="My Properties" description="All properties in your portfolio with occupancy, tenant info, and rent status." />,
});
