import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, usd, shortAddr } from "@/lib/medfund";
import { Progress, StatusBadge } from "@/components/ui-bits";

export const Route = createFileRoute("/fundraisers/")({
  head: () => ({
    meta: [
      { title: "Browse Fundraisers — MedFund" },
      {
        name: "description",
        content:
          "Every open medical fundraiser on MedFund, with escrow balance, milestone, verifier and on-chain status.",
      },
      { property: "og:title", content: "Browse Fundraisers — MedFund" },
      {
        property: "og:description",
        content:
          "Escrowed medical fundraisers in the Philippines, each with a named hospital or NGO verifier.",
      },
    ],
  }),
  component: List,
});

function List() {
  const { fundraisers } = useStore();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl sm:text-4xl">Fundraisers</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Each case names the hospital or NGO that must sign off before a single
        dollar leaves escrow.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {fundraisers.map((f) => (
          <Link
            key={f.id}
            to="/fundraisers/$id"
            params={{ id: f.id }}
            className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/25"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{f.patient}</h2>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {f.location}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{f.cause}</p>

            <div className="my-4 rule-line" />

            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              MILESTONE · {f.milestone}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              VERIFIER · {f.verifier} ({shortAddr(f.verifierAddress, 3)})
            </p>

            <div className="mt-auto pt-5">
              <Progress raised={f.raised} goal={f.goal} />
              <div className="mt-2 flex items-center justify-between">
                <p className="font-mono text-[11px] text-foreground">
                  ${usd(f.raised)} / ${usd(f.goal)} USDC
                </p>
                <StatusBadge status={f.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
