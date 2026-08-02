import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  donate,
  formatDate,
  explorerUrl,
  useStore,
  usd,
  verifyMilestone,
} from "@/lib/medfund";
import { Progress, StatusBadge, TxFeedback, type Tx } from "@/components/ui-bits";

export const Route = createFileRoute("/fundraisers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Fundraiser ${params.id} — MedFund` },
      {
        name: "description",
        content:
          "Escrow balance, milestone description, named verifier and full on-chain timeline for this MedFund case.",
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
  const { fundraisers, wallet } = useStore();
  const f = fundraisers.find((x) => x.id === id);
  const [amount, setAmount] = useState("50");
  const [tx, setTx] = useState<Tx>({ state: "idle" });

  if (!f) throw notFound();

  const act = async (fn: () => Promise<string>, message: string) => {
    setTx({ state: "pending" });
    try {
      const hash = await fn();
      setTx({ state: "success", message, hash });
    } catch {
      setTx({ state: "error", message: "Transaction rejected by the network" });
    }
  };

  const onDonate = async () => {
    const value = Number(amount);
    if (!wallet) {
      setTx({ state: "error", message: "Connect a wallet to donate" });
      return;
    }
    if (!value || value <= 0) {
      setTx({ state: "error", message: "Enter an amount greater than zero" });
      return;
    }
    await act(() => donate(f.id, value), `Donated $${usd(value)} USDC to escrow`);
  };

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
          <StatusBadge status={f.status} />
          <h1 className="mt-4 text-3xl sm:text-4xl">{f.patient}</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {f.location}
          </p>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
            {f.summary}
          </p>

          <div className="mt-8 rounded-lg border border-border bg-card p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Raised
                </p>
                <p className="mt-1 font-mono text-2xl">${usd(f.raised)}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Goal
                </p>
                <p className="mt-1 font-mono text-2xl">${usd(f.goal)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress raised={f.raised} goal={f.goal} />
            </div>
            <div className="my-5 rule-line" />
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Milestone
            </p>
            <p className="mt-1 text-sm">{f.milestone}</p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Verifier
            </p>
            <p className="mt-1 text-sm">{f.verifier}</p>
            <p className="font-mono text-[11px] break-all text-muted-foreground">
              {f.verifierAddress}
            </p>
          </div>

          <h2 className="mt-10 text-2xl">Timeline</h2>
          <ol className="mt-5 border-l border-border pl-5">
            {f.timeline.map((t) => (
              <li key={t.label} className="relative pb-6 last:pb-0">
                <span
                  className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border ${
                    t.at
                      ? "border-primary bg-primary"
                      : "border-border bg-background"
                  }`}
                />
                <p className="text-sm text-foreground">{t.label}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(t.at)}
                </p>
                {t.at && t.tx && (
                  <a
                    href={explorerUrl(t.tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-primary underline underline-offset-2"
                  >
                    {t.tx.slice(0, 16)}… ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-xl">Donate USDC</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Your donation is locked in escrow until {f.verifier} verifies the
            milestone.
          </p>

          <label className="mt-5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Amount (USDC)
          </label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring"
          />
          <div className="mt-2 flex gap-2">
            {[25, 50, 100, 250].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="rounded-md border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:bg-secondary"
              >
                ${v}
              </button>
            ))}
          </div>

          <button
            onClick={onDonate}
            disabled={tx.state === "pending" || f.status === "released"}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {f.status === "released" ? "Fundraiser complete" : "Donate to escrow"}
          </button>

          {f.status === "pending" && (
            <button
              onClick={() =>
                act(() => verifyMilestone(f.id), "Milestone verified — funds released")
              }
              disabled={tx.state === "pending"}
              className="mt-2 w-full rounded-md border border-gold/60 bg-gold/15 px-4 py-2.5 text-sm text-gold-foreground hover:bg-gold/25 disabled:opacity-50"
            >
              Verify milestone & release (verifier only)
            </button>
          )}

          <div className="mt-4">
            <TxFeedback tx={tx} />
          </div>
        </aside>
      </div>
    </div>
  );
}
