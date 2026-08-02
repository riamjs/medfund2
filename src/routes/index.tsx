import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, usd } from "@/lib/medfund";
import { Progress, StatusBadge } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedFund — Escrowed Medical Fundraising in the Philippines" },
      {
        name: "description",
        content:
          "Donate USDC into escrow. Funds release only when a hospital or NGO verifies the treatment milestone — every step visible on-chain.",
      },
      {
        property: "og:title",
        content: "MedFund — Escrowed Medical Fundraising in the Philippines",
      },
      {
        property: "og:description",
        content:
          "Milestone-verified medical fundraising. Donations sit in escrow until a hospital or NGO confirms treatment.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    n: "01",
    t: "Create",
    d: "A patient or family posts the bill, the treatment milestone, and names the hospital or NGO that will verify it.",
  },
  {
    n: "02",
    t: "Donate",
    d: "Donors send USDC. It goes into an escrow contract — not to an individual's wallet.",
  },
  {
    n: "03",
    t: "Verify",
    d: "The named hospital or NGO signs off on-chain once the treatment actually happened.",
  },
  {
    n: "04",
    t: "Release",
    d: "The contract releases funds to the provider. The transaction hash is public forever.",
  },
];

function Landing() {
  const { fundraisers } = useStore();
  const featured = fundraisers.slice(0, 2);

  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="border-b border-border py-16 sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Ledger no. 001 · Philippines
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.1] text-foreground sm:text-6xl">
          Give to a medical bill, not to a black box.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Overseas Filipinos send billions home every year, and the hardest part
          isn't generosity — it's proof. MedFund holds every donation in a USDC
          escrow contract and releases it only when a hospital or NGO verifies
          the treatment actually happened.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            to="/fundraisers"
            className="rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground hover:opacity-90"
          >
            Browse fundraisers
          </Link>
          <Link
            to="/create"
            className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground hover:bg-secondary"
          >
            Start a fundraiser
          </Link>
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["$47,320", "Held in escrow"],
            ["112", "Milestones verified"],
            ["0", "Unverified releases"],
            ["18", "Partner verifiers"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="font-mono text-xl text-foreground">{v}</dt>
              <dd className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {l}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-b border-border py-16">
        <h2 className="text-2xl sm:text-3xl">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="border-t border-foreground/20 pt-4">
              <span className="font-mono text-[11px] text-gold-foreground">
                {s.n}
              </span>
              <h3 className="mt-2 text-xl">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl sm:text-3xl">Open cases</h2>
          <Link
            to="/fundraisers"
            className="font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            see all →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {featured.map((f) => (
            <Link
              key={f.id}
              to="/fundraisers/$id"
              params={{ id: f.id }}
              className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/25"
            >
              <StatusBadge status={f.status} />
              <h3 className="mt-3 text-xl">{f.patient}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.cause}</p>
              <div className="mt-5">
                <Progress raised={f.raised} goal={f.goal} />
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  ${usd(f.raised)} raised of ${usd(f.goal)} USDC
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
