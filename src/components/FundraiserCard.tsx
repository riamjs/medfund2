import { Link } from "@tanstack/react-router";
import { Progress, StatusBadge } from "./ui-bits";
import type { Fundraiser, MilestoneWithVerifier } from "@/lib/data";
import type { FundraiserStatus } from "@/lib/medfund";

export function FundraiserCard({
  f,
}: {
  f: Fundraiser & { milestones: MilestoneWithVerifier[] };
}) {
  const next =
    [...f.milestones]
      .sort((a, b) => a.position - b.position)
      .find((m) => m.status !== "released") ?? f.milestones[0];

  return (
    <Link
      to="/fundraisers/$id"
      params={{ id: f.slug }}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <StatusBadge status={f.status as FundraiserStatus} />
      <h3 className="mt-3 text-xl">{f.patient}</h3>
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {f.location}
      </p>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{f.cause}</p>
      <div className="mt-4">
        <Progress raised={Number(f.raised_amount)} goal={Number(f.goal_amount)} />
      </div>
      {next && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Next milestone: <span className="text-foreground">{next.title}</span>
          {next.verifiers?.org ? ` · verified by ${next.verifiers.org}` : ""}
        </p>
      )}
    </Link>
  );
}
