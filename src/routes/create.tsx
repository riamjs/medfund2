import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { approvedVerifiersQuery } from "@/lib/data";
import { slugify } from "@/lib/medfund";
import { isStellarAddress } from "@/lib/stellar-config";
import { logFundraiserCreated } from "@/lib/medfund.functions";
import {
  TxFeedback,
  buttonClass,
  inputClass,
  monoInputClass,
  type Tx,
} from "@/components/ui-bits";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Start a Fundraiser — MedFund" },
      {
        name: "description",
        content:
          "Post a medical bill, split it into verifiable milestones, and name the hospital or NGO that releases each payment from escrow.",
      },
      { property: "og:title", content: "Start a Fundraiser — MedFund" },
      {
        property: "og:description",
        content:
          "Create an escrowed medical fundraiser with staged milestones and a named verifier.",
      },
    ],
  }),
  component: CreatePage,
});

const label =
  "block font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

type MilestoneDraft = { title: string; description: string; amount: string };

function CreatePage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: verifiers = [] } = useQuery(approvedVerifiersQuery);

  const [form, setForm] = useState({
    patient: "",
    cause: "",
    summary: "",
    location: "",
    payoutAddress: "",
    verifierId: "",
  });
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: "", description: "", amount: "" },
  ]);
  const [tx, setTx] = useState<Tx>({ state: "idle" });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setM = (i: number, k: keyof MilestoneDraft, v: string) =>
    setMilestones((ms) => ms.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setTx({ state: "error", message: "Sign in before creating a fundraiser" });
      return;
    }
    const parsed = milestones.map((m) => ({ ...m, amount: Number(m.amount) }));
    if (!form.patient || !form.cause || !form.verifierId) {
      setTx({ state: "error", message: "Patient, cause and verifier are required" });
      return;
    }
    if (!isStellarAddress(form.payoutAddress)) {
      setTx({ state: "error", message: "Enter a valid Stellar payout address (G…)" });
      return;
    }
    if (parsed.some((m) => !m.title || !m.amount || m.amount <= 0)) {
      setTx({ state: "error", message: "Every milestone needs a title and amount" });
      return;
    }

    setTx({ state: "pending", message: "Creating the escrow record…" });
    try {
      const goal = parsed.reduce((s, m) => s + m.amount, 0);
      const slug = `${slugify(form.patient, "case")}-${Date.now().toString(36).slice(-4)}`;

      const { data: fundraiser, error } = await supabase
        .from("fundraisers")
        .insert({
          slug,
          patient: form.patient,
          cause: form.cause,
          summary: form.summary || form.cause,
          location: form.location || "Philippines",
          goal_amount: goal,
          payout_address: form.payoutAddress,
          owner_id: userId,
        })
        .select("id, slug")
        .single();
      if (error) throw new Error(error.message);

      const { error: mErr } = await supabase.from("milestones").insert(
        parsed.map((m, i) => ({
          fundraiser_id: fundraiser.id,
          position: i + 1,
          title: m.title,
          description: m.description,
          amount: m.amount,
          verifier_id: form.verifierId,
        })),
      );
      if (mErr) throw new Error(mErr.message);

      await logFundraiserCreated({ data: { fundraiserId: fundraiser.id } });

      setTx({ state: "success", message: "Escrow record created" });
      setTimeout(
        () => navigate({ to: "/fundraisers/$id", params: { id: fundraiser.slug } }),
        900,
      );
    } catch (err) {
      setTx({
        state: "error",
        message: err instanceof Error ? err.message : "Could not create the fundraiser",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl sm:text-4xl">Start a fundraiser</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Split the bill into milestones. Each one is released from escrow only after
        your named hospital or NGO verifies it on-chain.
      </p>

      {!userId && (
        <p className="mt-6 rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-xs text-gold-foreground">
          You need an account to open an escrow.{" "}
          <a href="/auth" className="underline underline-offset-2">
            Sign in or create one
          </a>
          .
        </p>
      )}

      <form onSubmit={submit} className="mt-9 space-y-5">
        <div>
          <label className={label}>Patient name</label>
          <input className={inputClass} value={form.patient} onChange={set("patient")} />
        </div>
        <div>
          <label className={label}>Cause / treatment</label>
          <input
            className={inputClass}
            placeholder="Twice-weekly dialysis, 3 months"
            value={form.cause}
            onChange={set("cause")}
          />
        </div>
        <div>
          <label className={label}>Summary</label>
          <textarea
            rows={3}
            className={inputClass}
            value={form.summary}
            onChange={set("summary")}
          />
        </div>
        <div>
          <label className={label}>City</label>
          <input
            className={inputClass}
            value={form.location}
            onChange={set("location")}
          />
        </div>
        <div>
          <label className={label}>Verifier (hospital or NGO)</label>
          <select
            className={inputClass}
            value={form.verifierId}
            onChange={set("verifierId")}
          >
            <option value="">Select a verifier…</option>
            {verifiers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.org}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Payout address (patient or provider)</label>
          <input
            className={monoInputClass}
            placeholder="G…"
            value={form.payoutAddress}
            onChange={set("payoutAddress")}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className={label}>Milestones</p>
          <div className="mt-3 space-y-4">
            {milestones.map((m, i) => (
              <div key={i} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
                <input
                  className={inputClass}
                  placeholder={`Milestone ${i + 1} title`}
                  value={m.title}
                  onChange={(e) => setM(i, "title", e.target.value)}
                />
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder="What must be proven before release?"
                  value={m.description}
                  onChange={(e) => setM(i, "description", e.target.value)}
                />
                <input
                  inputMode="decimal"
                  className={monoInputClass}
                  placeholder="Amount in USDC"
                  value={m.amount}
                  onChange={(e) => setM(i, "amount", e.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setMilestones((ms) => [...ms, { title: "", description: "", amount: "" }])
            }
            className="mt-3 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary"
          >
            + add milestone
          </button>
        </div>

        <button
          type="submit"
          disabled={tx.state === "pending"}
          className={`${buttonClass} w-full`}
        >
          Open escrow
        </button>
        <TxFeedback tx={tx} />
      </form>
    </div>
  );
}
