import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fundraisersQuery } from "@/lib/data";
import { FundraiserCard } from "@/components/FundraiserCard";
import { EmptyState, Loading } from "@/components/ui-bits";

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
  component: FundraiserList,
});

function FundraiserList() {
  const { data, isLoading, error } = useQuery(fundraisersQuery);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl sm:text-4xl">Open cases</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Each case names the hospital or NGO that must sign off before any USDC
        leaves escrow.
      </p>

      <div className="mt-9">
        {isLoading && <Loading label="Loading fundraisers…" />}
        {error && (
          <p className="text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}
        {data && data.length === 0 && (
          <EmptyState
            title="No fundraisers yet"
            body="Be the first to open an escrowed medical fundraiser."
          />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {data?.map((f) => <FundraiserCard key={f.id} f={f} />)}
        </div>
      </div>
    </div>
  );
}
