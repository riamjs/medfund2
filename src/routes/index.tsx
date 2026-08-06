import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedFund — Escrowed Medical Fundraising in the Philippines" },
      {
        name: "description",
        content:
          "Donate USDC into escrow. Funds release only when a hospital or NGO verifies the treatment milestone — every step visible on-chain.",
      },
      {
        property: "og:title",
        content: "MedFund — Escrowed Medical Fundraising in the Philippines",
      },
      {
        property: "og:description",
        content:
          "Transparent medical fundraising on Stellar: donations sit in escrow until a verifier signs off.",
      },
    ],
  }),
  component: LandingRoute,
});

function LandingRoute() {
  const navigate = useNavigate();
  return <Landing onNavigate={() => navigate({ to: "/fundraisers" })} />;
}
