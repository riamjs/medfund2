import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Detail from "@/pages/Detail";
import { connectWallet, useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/fundraisers/$id")({
  head: () => ({
    meta: [
      { title: "Fundraiser — MedFund" },
      {
        name: "description",
        content:
          "Follow this medical fundraiser milestone by milestone: escrowed USDC, verifier sign-off and every release visible on the Stellar ledger.",
      },
      { property: "og:title", content: "Fundraiser — MedFund" },
      {
        property: "og:description",
        content:
          "Escrowed USDC, verifier sign-off and every release visible on the Stellar ledger.",
      },
    ],
  }),
  component: DetailRoute,
});

function DetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  return (
    <Detail
      fundraiserId={id}
      walletAddress={wallet.address}
      onConnectWallet={() => connectWallet()}
      onNavigate={(view, next) =>
        view === "detail" && next
          ? navigate({ to: "/fundraisers/$id", params: { id: next } })
          : navigate({ to: "/fundraisers" })
      }
    />
  );
}
