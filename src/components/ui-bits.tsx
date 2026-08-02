import { explorerUrl, type Status, statusLabel } from "@/lib/medfund";

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    awaiting: "border-border bg-secondary text-secondary-foreground",
    pending: "border-gold/50 bg-gold/15 text-gold-foreground",
    released: "border-primary/30 bg-primary/10 text-primary",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-tight ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabel[status]}
    </span>
  );
}

export function Progress({ raised, goal }: { raised: number; goal: number }) {
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export type Tx = {
  state: "idle" | "pending" | "success" | "error";
  message?: string;
  hash?: string;
};

export function TxFeedback({ tx }: { tx: Tx }) {
  if (tx.state === "idle") return null;
  const tone =
    tx.state === "error"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : tx.state === "success"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-gold/50 bg-gold/15 text-gold-foreground";
  return (
    <div className={`rounded-md border px-3 py-2.5 text-xs ${tone}`}>
      <p className="font-mono">
        {tx.state === "pending" && "⟳ Submitting to Stellar network…"}
        {tx.state === "success" && `✓ ${tx.message ?? "Confirmed"}`}
        {tx.state === "error" && `✕ ${tx.message ?? "Transaction failed"}`}
      </p>
      {tx.hash && (
        <a
          href={explorerUrl(tx.hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block font-mono text-[11px] underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          View on stellar.expert ↗
        </a>
      )}
    </div>
  );
}
