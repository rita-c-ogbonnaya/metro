import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/landlord/financials")({
  component: () => <StubPage role="landlord" title="Financials" description="Revenue, expenses, rent history, and downloadable reports for your portfolio." />,
});
