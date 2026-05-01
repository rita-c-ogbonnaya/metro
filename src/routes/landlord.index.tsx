import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/landlord/")({
  component: () => <StubPage role="landlord" title="My Property Portfolio" subtitle="Welcome back, Adebayo Ogunlesi" description="Landlord dashboard — KPI overview, monthly revenue/expenses, occupancy breakdown, top-performing properties, and rent due timeline scoped to your portfolio." />,
});
