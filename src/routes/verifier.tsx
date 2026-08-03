import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  applyAsVerifier,
  formatDate,
  updateVerifierAddress,
  usd,
  useStore,
  verifierSignIn,
  verifierSignOut,
  verifyMilestone,
  type VerifierAccount,
} from "@/lib/medfund";
import { Progress, StatusBadge, TxFeedback, type Tx } from "@/components/ui-bits";

export const Route = createFileRoute("/verifier")({
  head: () => ({
    meta: [
      { title: "Verifier Portal — Hospitals & NGOs | MedFund" },
      {
        name: "description",
        content:
          "Approved hospitals and NGOs sign in to manage their Stellar verifier address and review pending milestone verification requests.",
      },
      { property: "og:title", content: "Verifier Portal — Hospitals & NGOs | MedFund" },
      {
        property: "og:description",
        content:
          "Onboard as a MedFund verifier, keep your escrow signing address current, and release funds when treatment milestones are met.",
      },
    ],
  }),
  component: VerifierPage,
});

const input =
  "w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-foreground/40";
const label =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

function VerifierPage() {
  const { verifiers, verifierSession } = useStore();
  const account = verifiers.find((v) => v.id === verifierSession) ?? null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Hospitals & NGOs
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Verifier portal</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Verifiers are the only parties who can release escrowed funds. Sign in
        with your access code to manage your signing address and review the
        milestones waiting on your confirmation.
      </p>

      <div className="my-8 rule-line" />

      {account ? <Dashboard account={account} /> : <SignedOut />}
    </div>
  );
}

function SignedOut() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <SignInPanel />
      <ApplyPanel />
    </div>
  );
}

function SignInPanel() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl">Approved verifier sign-in</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Use the access code issued to your institution when it was approved.
      </p>
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const ok = verifierSignIn(code);
          setError(ok ? "" : "No approved verifier matches that code.");
        }}
      >
        <div className="space-y-1.5">
          <label className={label} htmlFor="code">
            Access code
          </label>
          <input
            id="code"
            className={input}
            placeholder="CHH-2026"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 font-mono text-xs tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </button>
        {error && (
          <p className="font-mono text-[11px] text-destructive">{error}</p>
        )}
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          Demo codes · CHH-2026 · KYT-2026 · SPM-2026
        </p>
      </form>
    </section>
  );
}

function ApplyPanel() {
  const [org, setOrg] = useState("");
  const [kind, setKind] = useState<"Hospital" | "NGO">("Hospital");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<VerifierAccount | null>(null);

  if (done) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl">Application received</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {done.org} is queued for review. MedFund verifies licence and billing
          records before issuing an access code to {done.contact}.
        </p>
        <dl className="mt-4 space-y-2 font-mono text-[11px] text-muted-foreground">
          <div className="flex justify-between gap-3">
            <dt>STATUS</dt>
            <dd className="text-foreground">Pending approval</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>SUBMITTED</dt>
            <dd>{formatDate(done.appliedAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>ADDRESS</dt>
            <dd className="truncate">{done.address}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl">Apply to verify</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Hospitals and NGOs can apply to become milestone verifiers.
      </p>
      <form
        className="mt-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const acct = await applyAsVerifier({ org, kind, contact, address });
          setBusy(false);
          setDone(acct);
        }}
      >
        <div className="space-y-1.5">
          <label className={label} htmlFor="org">
            Institution name
          </label>
          <input
            id="org"
            required
            className={input}
            placeholder="Chong Hua Hospital"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={label} htmlFor="kind">
            Type
          </label>
          <select
            id="kind"
            className={input}
            value={kind}
            onChange={(e) => setKind(e.target.value as "Hospital" | "NGO")}
          >
            <option value="Hospital">Hospital</option>
            <option value="NGO">NGO</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={label} htmlFor="contact">
            Official contact email
          </label>
          <input
            id="contact"
            required
            type="email"
            className={input}
            placeholder="billing@hospital.ph"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={label} htmlFor="addr">
            Stellar verifier address
          </label>
          <input
            id="addr"
            required
            className={input}
            placeholder="G…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md border border-border px-4 py-2 font-mono text-xs tracking-wide text-foreground transition-colors hover:border-foreground/40 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </section>
  );
}

function Dashboard({ account }: { account: VerifierAccount }) {
  const { fundraisers } = useStore();
  const requests = fundraisers.filter(
    (f) => f.verifierAddress === account.address && f.status !== "released",
  );

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl">{account.org}</h2>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {account.kind} · approved verifier
            </p>
          </div>
          <button
            onClick={verifierSignOut}
            className="font-mono text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            sign out
          </button>
        </div>
        <div className="my-4 rule-line" />
        <AddressManager account={account} />
      </section>

      <section>
        <h2 className="text-xl">Pending verification requests</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {requests.length === 0
            ? "Nothing is waiting on your signature right now."
            : `${requests.length} case${requests.length > 1 ? "s" : ""} assigned to your address.`}
        </p>
        <div className="mt-5 space-y-4">
          {requests.map((f) => (
            <RequestCard key={f.id} id={f.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AddressManager({ account }: { account: VerifierAccount }) {
  const [addr, setAddr] = useState(account.address);
  const [tx, setTx] = useState<Tx>({ state: "idle" });

  const dirty = addr.trim() !== account.address;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!dirty) return;
        setTx({ state: "pending" });
        try {
          const hash = await updateVerifierAddress(account.id, addr.trim());
          setTx({
            state: "success",
            message: "Verifier address updated on escrow contracts",
            hash,
          });
        } catch {
          setTx({ state: "error", message: "Could not update address" });
        }
      }}
    >
      <div className="space-y-1.5">
        <label className={label} htmlFor="verifier-address">
          Signing address
        </label>
        <input
          id="verifier-address"
          className={input}
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          Escrows naming your institution will require signatures from this
          address. Changing it re-points every open escrow.
        </p>
      </div>
      <button
        type="submit"
        disabled={!dirty || tx.state === "pending"}
        className="rounded-md bg-primary px-4 py-2 font-mono text-xs tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {tx.state === "pending" ? "Signing…" : "Update address"}
      </button>
      <TxFeedback tx={tx} />
    </form>
  );
}

function RequestCard({ id }: { id: string }) {
  const { fundraisers } = useStore();
  const f = fundraisers.find((x) => x.id === id);
  const [tx, setTx] = useState<Tx>({ state: "idle" });
  if (!f) return null;

  const funded = f.raised >= f.goal;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/fundraisers/$id"
            params={{ id: f.id }}
            className="text-xl hover:underline underline-offset-4"
          >
            {f.patient}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{f.cause}</p>
        </div>
        <StatusBadge status={f.status} />
      </div>

      <div className="my-4 rule-line" />

      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
        MILESTONE · {f.milestone}
      </p>
      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>
          ${usd(f.raised)} / ${usd(f.goal)} in escrow
        </span>
        <span>{f.location}</span>
      </div>
      <div className="mt-2">
        <Progress raised={f.raised} goal={f.goal} />
      </div>

      <div className="mt-4 space-y-3">
        <button
          disabled={!funded || tx.state === "pending"}
          onClick={async () => {
            setTx({ state: "pending" });
            try {
              const hash = await verifyMilestone(f.id);
              setTx({
                state: "success",
                message: "Milestone verified — funds released",
                hash,
              });
            } catch {
              setTx({ state: "error", message: "Verification failed" });
            }
          }}
          className="rounded-md bg-primary px-4 py-2 font-mono text-xs tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {tx.state === "pending"
            ? "Signing…"
            : funded
              ? "Verify milestone & release"
              : "Awaiting full funding"}
        </button>
        <TxFeedback tx={tx} />
      </div>
    </div>
  );
}
