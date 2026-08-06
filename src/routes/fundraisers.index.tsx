import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Browse from "@/pages/Browse";

export const Route = createFileRoute("/fundraisers/")({
  head: () => ({
    meta: [
      { title: "Open Medical Fundraisers — MedFund" },
      {
        name: "description",
        content:
          "Browse escrowed medical fundraisers across the Philippines. Every donation is held until a hospital or NGO verifies the milestone on-chain.",
      },
      { property: "og:title", content: "Open Medical Fundraisers — MedFund" },
      {
        property: "og:description",
        content:
          "Browse escrowed medical fundraisers across the Philippines, milestone by milestone.",
      },
    ],
  }),
  component: BrowseRoute,
});

function BrowseRoute() {
  const navigate = useNavigate();
  return (
    <Browse
      onNavigate={(view, id) =>
        view === "detail" && id
          ? navigate({ to: "/fundraisers/$id", params: { id } })
          : navigate({ to: "/fundraisers" })
      }
    />
  );
}
