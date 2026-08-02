import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createFundraiser } from "@/lib/medfund";
import { TxFeedback, type Tx } from "@/components/ui-bits";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Start a Fundraiser — MedFund" },
      {
        name: "description",
        content:
          "Post a medical bill, name your hospital or NGO verifier, and set a goal. Donations stay in escrow until the milestone is verified.",
      },
      { property: "og:title", content: "Start a Fundraiser — MedFund" },
      {
        property: "og:description",
        content:
          "Create an escrowed medical fundraiser with a named verifier and a clear treatment milestone.",
      },
    ],
  }),
  component: CreatePage,
});

const field =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring";
const label =
  "block font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

function CreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    patient: "",
    cause: "",
    verifier: "",
    verifierAddress: "",
    milestone: "",
    goal: "",
  });
  const [tx, setTx] = useState<Tx>({ state: "idle" });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = Number(form.goal);
    if (!form.patient || !form.milestone || !form.verifierAddress || !goal) {
      setTx({ state: "error", message: "Fill in every field before deploying" });
      return;
    }
    setTx({ state: "pending" });
    try {
      const { id, hash } = await createFundraiser({ ...form, goal });
      setTx({ state: "success", message: "Escrow contract deployed", hash });
      setTimeout(() => navigate({ to: "/fundraisers/$id", params: { id } }), 1200);
    } catch {
      setTx({ state: "error", message: "Could not deploy the escrow contract" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl sm:text-4xl">Start a fundraiser</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        You'll name the hospital or NGO that signs off on the treatment. Until
        they do, nothing leaves escrow — that's what makes donors comfortable.
      </p>

      <form onSubmit={submit} className="mt-9 space-y-5">
        <div>
          <label className={label}>Patient name</label>
          <input className={field} value={form.patient} onChange={set("patient")} />
        </div>
        <div>
          <label className={label}>Cause / treatment</label>
          <input
            className={field}
            placeholder="Twice-weekly dialysis, 3 months"
            value={form.cause}
            onChange={set("cause")}
          />
        </div>
        <div>
          <label className={label}>Verifier name (hospital or NGO)</label>
          <input className={field} value={form.verifier} onChange={set("verifier")} />
        </div>
        <div>
          <label className={label}>Verifier wallet address</label>
          <input
            className={`${field} font-mono text-xs`}
            placeholder="G..."
            value={form.verifierAddress}
            onChange={set("verifierAddress")}
          />
        </div>
        <div>
          <label className={label}>Milestone description</label>
          <textarea
            rows={3}
            className={field}
            placeholder="What must happen before funds are released?"
            value={form.milestone}
            onChange={set("milestone")}
          />
        </div>
        <div>
          <label className={label}>Goal amount (USDC)</label>
          <input
            inputMode="decimal"
            className={`${field} font-mono`}
            value={form.goal}
            onChange={set("goal")}
          />
        </div>

        <button
          type="submit"
          disabled={tx.state === "pending"}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Deploy escrow contract
        </button>
        <TxFeedback tx={tx} />
      </form>
    </div>
  );
}
