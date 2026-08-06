import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fundraiserQuery } from "@/lib/data";
import {
  explorerUrl,
  formatDate,
  ledgerKindLabel,
  usd,
  type FundraiserStatus,
  type LedgerKind,
  type MilestoneStatus,
} from "@/lib/medfund";
import {
  LedgerBadge,
  Loading,
  MilestoneBadge,
  Progress,
  StatusBadge,
} from "@/components/ui-bits";
import { DonateCard } from "@/components/DonateCard";

export const Route = createFileRoute("/fundraisers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Fundraiser ${params.id} — MedFund` },
      {
        name: "description",
        content:
          "Escrow balance, milestone schedule, named verifiers and the full on-chain ledger for this MedFund case.",
      },
      { property: "og:title", content: `Fundraiser ${params.id} — MedFund` },
      {
        property: "og:description",
        content:
          "Follow this medical fundraiser from donation to verified release, on-chain.",
      },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: f, isLoading } = useQuery(fundraiserQuery(id));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Loading label="Loading fundraiser…" />
      </div>
    );
  }
  if (!f) throw notFound();

  const verifierName =
    f.milestones.find((m) => m.verifiers)?.verifiers?.org ?? "the named verifier";

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link
        to="/fundraisers"
        className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
      >
        ← all fundraisers
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <StatusBadge status={f.status as FundraiserStatus} />
          <h1 className="mt-4 text-3xl sm:text-4xl">{f.patient}</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {f.location}
          </p>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
            {f.summary || f.cause}
          </p>

          <div className="mt-8 rounded-lg border border-border bg-card p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Raised
                </p>
                <p className="mt-1 font-mono text-2xl">${usd(Number(f.raised_amount))}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Released
                </p>
                <p className="mt-1 font-mono text-2xl">
                  ${usd(Number(f.released_amount))}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Goal
                </p>
                <p className="mt-1 font-mono text-2xl">${usd(Number(f.goal_amount))}</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress
                raised={Number(f.raised_amount)}
                goal={Number(f.goal_amount)}
              />
            </div>
          </div>

          <h2 className="mt-10 text-2xl">Milestones</h2>
          <div className="mt-5 space-y-4">
            {f.milestones.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg">{m.title}</p>
                  <MilestoneBadge status={m.status as MilestoneStatus} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-muted-foreground">
                  <span>${usd(Number(m.amount))} USDC</span>
                  <span>Verifier: {m.verifiers?.org ?? "unassigned"}</span>
                  {m.released_at && <span>Released {formatDate(m.released_at)}</span>}
                </div>
                {m.verifier_note && (
                  <p className="mt-2 text-xs italic text-muted-foreground">
                    “{m.verifier_note}”
                  </p>
                )}
                {m.release_tx && (
                  <a
                    href={explorerUrl(m.release_tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-mono text-[11px] text-primary underline underline-offset-2"
                  >
                    release {m.release_tx.slice(0, 16)}… ↗
                  </a>
                )}
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-2xl">On-chain ledger</h2>
          <ol className="mt-5 space-y-4 border-l border-border pl-5">
            {f.ledger_events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[26px] top-2 h-2.5 w-2.5 rounded-full border border-primary bg-primary" />
                <LedgerBadge kind={e.kind as LedgerKind} />
                <p className="mt-1.5 text-sm">
                  {e.detail || ledgerKindLabel[e.kind as LedgerKind]}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(e.created_at)}
                </p>
                {e.tx_hash && (
                  <a
                    href={explorerUrl(e.tx_hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-primary underline underline-offset-2"
                  >
                    {e.tx_hash.slice(0, 16)}… ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>

        <DonateCard
          slug={f.slug}
          verifierName={verifierName}
          disabled={f.status === "completed" || f.status === "cancelled"}
        />
      </div>
    </div>
  );
}
