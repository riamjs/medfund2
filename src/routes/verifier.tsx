import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { myVerifierQuery, verifierQueueQuery } from "@/lib/data";
import { formatDate, usd, type MilestoneStatus } from "@/lib/medfund";
import { isStellarAddress } from "@/lib/stellar-config";
import { decideMilestone } from "@/lib/medfund.functions";
import {
  EmptyState,
  Loading,
  MilestoneBadge,
  TxFeedback,
  buttonClass,
  ghostButtonClass,
  inputClass,
  monoInputClass,
  type Tx,
} from "@/components/ui-bits";

export const Route = createFileRoute("/verifier")({
  head: () => ({
    meta: [
      { title: "Verifier Portal — MedFund" },
      {
        name: "description",
        content:
          "Hospitals and NGOs review milestone evidence and release escrowed USDC to patients on the Stellar network.",
      },
      { property: "og:title", content: "Verifier Portal — MedFund" },
      {
        property: "og:description",
        content:
          "Review milestone evidence and release escrowed medical funds on-chain.",
      },
    ],
  }),
  component: VerifierPage,
});

function VerifierPage() {
  const { userId, loading } = useAuth();
  const qc = useQueryClient();
  const { data: verifier, isLoading } = useQuery(myVerifierQuery(userId));
  const { data: queue = [] } = useQuery(verifierQueueQuery(verifier?.id ?? null));

  const [address, setAddress] = useState("");
  const [tx, setTx] = useState<Tx>({ state: "idle" });
  const [apply, setApply] = useState({
    org: "",
    kind: "Hospital" as "Hospital" | "NGO",
    contact: "",
    address: "",
  });

  if (loading || isLoading)
    return (
      <div className="mx-auto max-w-4xl px-5 py-12">
        <Loading />
      </div>
    );

  if (!userId)
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-3xl">Verifier portal</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with your hospital or NGO account to review milestones.
        </p>
        <a href="/auth" className={`${buttonClass} mt-6 inline-block`}>
          Sign in
        </a>
      </div>
    );

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apply.org || !apply.contact) {
      setTx({ state: "error", message: "Organisation and contact are required" });
      return;
    }
    setTx({ state: "pending", message: "Submitting application…" });
    const { error } = await supabase.from("verifiers").insert({
      user_id: userId,
      org: apply.org,
      kind: apply.kind,
      contact: apply.contact,
      stellar_address: apply.address || null,
      approved: false,
      slug: apply.org.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
    });
    if (error) setTx({ state: "error", message: error.message });
    else {
      setTx({ state: "success", message: "Application submitted for review" });
      qc.invalidateQueries({ queryKey: ["verifier", "mine"] });
    }
  };

  if (!verifier)
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl sm:text-4xl">Apply as a verifier</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Hospitals and NGOs confirm that treatment actually happened. Once approved,
          you can release escrowed USDC milestone by milestone.
        </p>
        <form onSubmit={submitApplication} className="mt-8 space-y-4">
          <input
            className={inputClass}
            placeholder="Organisation name"
            value={apply.org}
            onChange={(e) => setApply({ ...apply, org: e.target.value })}
          />
          <select
            className={inputClass}
            value={apply.kind}
            onChange={(e) =>
              setApply({ ...apply, kind: e.target.value as "Hospital" | "NGO" })
            }
          >
            <option value="Hospital">Hospital</option>
            <option value="NGO">NGO</option>
          </select>
          <input
            className={inputClass}
            placeholder="Contact email"
            value={apply.contact}
            onChange={(e) => setApply({ ...apply, contact: e.target.value })}
          />
          <input
            className={monoInputClass}
            placeholder="Stellar address (optional)"
            value={apply.address}
            onChange={(e) => setApply({ ...apply, address: e.target.value })}
          />
          <button type="submit" className={`${buttonClass} w-full`}>
            Submit application
          </button>
          <TxFeedback tx={tx} />
        </form>
      </div>
    );

  const saveAddress = async () => {
    if (!isStellarAddress(address)) {
      setTx({ state: "error", message: "Enter a valid Stellar address (G…)" });
      return;
    }
    setTx({ state: "pending", message: "Saving signing address…" });
    const { error } = await supabase
      .from("verifiers")
      .update({ stellar_address: address })
      .eq("id", verifier.id);
    if (error) setTx({ state: "error", message: error.message });
    else {
      setTx({ state: "success", message: "Signing address updated" });
      qc.invalidateQueries({ queryKey: ["verifier", "mine"] });
    }
  };

  const decide = async (milestoneId: string, approve: boolean) => {
    setTx({
      state: "pending",
      message: approve ? "Releasing funds from escrow…" : "Returning for evidence…",
    });
    try {
      const res = await decideMilestone({ data: { milestoneId, approve } });
      setTx({
        state: "success",
        message: approve ? "Milestone verified and paid out" : "Sent back for evidence",
        hash: res.txHash ?? undefined,
      });
      qc.invalidateQueries();
    } catch (e) {
      setTx({
        state: "error",
        message: e instanceof Error ? e.message : "Could not complete the action",
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-3xl sm:text-4xl">{verifier.org}</h1>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {verifier.kind} · {verifier.approved ? "approved verifier" : "pending approval"}
      </p>

      {!verifier.approved && (
        <p className="mt-6 rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-xs text-gold-foreground">
          Your application is under review. You'll be able to verify milestones once
          MedFund approves your organisation.
        </p>
      )}

      <div className="mt-8 rounded-lg border border-border bg-card p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Signing address
        </p>
        <p className="mt-1 break-all font-mono text-xs">
          {verifier.stellar_address ?? "not set"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${monoInputClass} mt-0 flex-1`}
            placeholder="G…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button onClick={saveAddress} className={ghostButtonClass}>
            Update
          </button>
        </div>
      </div>

      <h2 className="mt-10 text-2xl">Verification queue</h2>
      <div className="mt-5 space-y-4">
        {queue.length === 0 && (
          <EmptyState
            title="Nothing waiting"
            body="Milestones assigned to your organisation will appear here once they're funded."
          />
        )}
        {queue.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg">{m.title}</p>
              <MilestoneBadge status={m.status as MilestoneStatus} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {m.fundraisers?.patient} · ${usd(Number(m.amount))} USDC
            </p>
            <p className="mt-2 text-sm">{m.description}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {m.milestone_evidence.length} evidence file
              {m.milestone_evidence.length === 1 ? "" : "s"} · created{" "}
              {formatDate(m.created_at)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => decide(m.id, true)}
                disabled={!verifier.approved || m.status === "pending"}
                className={buttonClass}
              >
                Verify &amp; release
              </button>
              <button
                onClick={() => decide(m.id, false)}
                disabled={!verifier.approved}
                className={ghostButtonClass}
              >
                Request more evidence
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <TxFeedback tx={tx} />
      </div>
    </div>
  );
}
