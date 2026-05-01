import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/tenant/loan")({
  component: () => <StubPage role="tenant" title="Rent Loan" description="Apply for a rent loan with eligibility based on payment history." />,
});
