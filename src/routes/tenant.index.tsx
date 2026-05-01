import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/tenant/")({
  component: () => <StubPage role="tenant" title="Welcome home, Tunde" subtitle="Your tenancy at a glance" description="Tenant dashboard — tenancy timeline, rent countdown, payment history, maintenance requests, and quick actions." />,
});
