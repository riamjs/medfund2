import type { ReactNode } from "react";
import {
  explorerUrl,
  fundraiserStatusLabel,
  fundraiserTone,
  ledgerKindLabel,
  ledgerTone,
  milestoneStatusLabel,
  milestoneTone,
  usd,
  type FundraiserStatus,
  type LedgerKind,
  type MilestoneStatus,
} from "@/lib/medfund";

const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider";

export function StatusBadge({ status }: { status: FundraiserStatus }) {
  return (
    <span className={`${badgeBase} ${fundraiserTone[status]}`}>
      {fundraiserStatusLabel[status]}
    </span>
  );
}

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  return (
    <span className={`${badgeBase} ${milestoneTone[status]}`}>
      {milestoneStatusLabel[status]}
    </span>
  );
}

export function LedgerBadge({ kind }: { kind: LedgerKind }) {
  return (
    <span className={`${badgeBase} ${ledgerTone[kind]}`}>{ledgerKindLabel[kind]}</span>
  );
}

export function Progress({ raised, goal }: { raised: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        ${usd(raised)} of ${usd(goal)} USDC · {pct}%
      </p>
    </div>
  );
}

export type Tx =
  | { state: "idle" }
  | { state: "pending"; message?: string }
  | { state: "success"; message: string; hash?: string }
  | { state: "error"; message: string };

export function TxFeedback({ tx }: { tx: Tx }) {
  if (tx.state === "idle") return null;

  if (tx.state === "pending")
    return (
      <p className="font-mono text-[11px] text-muted-foreground">
        {tx.message ?? "Submitting to the Stellar test network…"}
      </p>
    );

  if (tx.state === "error")
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        {tx.message}
      </p>
    );

  return (
    <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
      <p>{tx.message}</p>
      {tx.hash && (
        <a
          href={explorerUrl(tx.hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block font-mono text-[11px] underline underline-offset-2"
        >
          {tx.hash.slice(0, 20)}… ↗
        </a>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring";

export const monoInputClass = `${inputClass} font-mono text-xs`;

export const buttonClass =
  "rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export const ghostButtonClass =
  "rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-lg">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="font-mono text-[11px] text-muted-foreground">{label}</p>;
}
