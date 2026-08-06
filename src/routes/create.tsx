import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Create from "@/pages/Create";
import { connectWallet, useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Start an Escrowed Fundraiser — MedFund" },
      {
        name: "description",
        content:
          "Open a medical fundraiser whose donations stay in escrow until your hospital or NGO verifier confirms the treatment milestone.",
      },
      { property: "og:title", content: "Start an Escrowed Fundraiser — MedFund" },
      {
        property: "og:description",
        content:
          "Open a fundraiser whose donations stay escrowed until a verifier confirms treatment.",
      },
    ],
  }),
  component: CreateRoute,
});

function CreateRoute() {
  const navigate = useNavigate();
  const wallet = useWallet();
  return (
    <Create
      walletAddress={wallet.address}
      onConnectWallet={() => connectWallet()}
      onNavigate={() => navigate({ to: "/fundraisers" })}
    />
  );
}
