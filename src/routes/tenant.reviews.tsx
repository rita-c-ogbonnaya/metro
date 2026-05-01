import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/metro/StubPage";

export const Route = createFileRoute("/tenant/reviews")({
  component: () => <StubPage role="tenant" title="Apartment Reviews" description="Rate cleanliness, maintenance response, landlord communication, and more." />,
});
