# MedFund — full MVP build plan

You picked: real Stellar testnet, all four features, and document uploads. That is a big
build, so it is split into five shippable stages. I will ask before starting each one.

## Honest constraint on "real Stellar testnet"

Two halves, with very different risk:

- **Doable here now:** Freighter wallet connection, reading real testnet balances,
  building and submitting real testnet payment transactions, real tx hashes that open on
  stellar.expert, and reading confirmed transactions back from Horizon.
- **Not doable from inside this editor:** compiling and deploying a Soroban escrow
  contract. That needs the Rust toolchain and the `stellar` CLI on your machine. I can
  write the contract source and the deploy commands, and wire the app to a contract ID you
  paste in — but you run the deploy.

So the recommended shape is: **custodial-style escrow account on real testnet** for stage 2
(real transactions, funds held by a platform account, release is a real payment signed by
the app), with the Soroban contract as an optional stage 5 upgrade.

## Stage 1 — Backend foundation (Lovable Cloud)

Everything else depends on data that survives a refresh.

- Tables: `profiles`, `fundraisers`, `milestones`, `donations`, `verifiers`,
  `milestone_evidence`, `ledger_events`.
- Auth: email/password + Google. Roles in a separate `user_roles` table
  (`patient`, `verifier`, `admin`) — never on the profile row.
- RLS: fundraisers and ledger events publicly readable; donations readable by the donor
  and the fundraiser owner; evidence readable only by owner, assigned verifier, admin.
- Storage bucket `evidence` (private) with signed-URL access.
- Migrate the current mock seed data in as real rows so the app looks identical after.

## Stage 2 — Real Stellar testnet

- Freighter detection, connect, network check (must be Testnet), address display.
- Real USDC (testnet asset) balance and trustline check, with a "add trustline" action.
- Donation = real transaction signed in Freighter, sent to the platform escrow account,
  polled on Horizon, stored with its real hash.
- Release = real payment from escrow to the patient payout address, signed server-side by
  the platform key (stored as a secret, never in the browser).
- Every tx link points at the real stellar.expert testnet explorer.
- Needs from you: a testnet escrow secret key (I generate and store it, or you supply one).

## Stage 3 — Multi-milestone escrow

- A fundraiser becomes an ordered list of milestones, each with its own amount, status and
  verifier.
- Funds release per verified milestone, not all at once; remaining balance stays escrowed.
- Create-fundraiser form gains a milestone builder with an amount total check.
- Fundraiser detail shows a staged progress bar: funded / verified / released per stage.

## Stage 4 — Evidence uploads and the verifier queue

- Patient uploads invoices, discharge summaries, photos against a specific milestone.
- Verifier queue shows pending milestones with the evidence preview inline, and
  approve / request-more-info / reject with a written note.
- Rejection notifies the patient and keeps funds escrowed.
- File limits: 10 MB, PDF and images only, virus-safe content-type check.

## Stage 5 — Transparency surfaces

- **Public ledger page** `/ledger`: every event across every fundraiser, filterable by
  type and fundraiser, each row linking to the real explorer entry.
- **Donor dashboard** `/donations`: your donations, current escrow status, which milestone
  your money is sitting behind, and release proof once verified.
- **Patient dashboard** `/dashboard`: your fundraisers, milestone status, evidence to
  upload, payouts received.

## Optional stage 6 — Soroban contract

I write `contracts/escrow/src/lib.rs` (init, deposit, verify, release, refund) plus a
deploy script. You run the deploy locally and paste the contract ID into the app settings;
I switch stage 2's custodial path over to contract calls.

## Technical notes

- Stellar work uses `@stellar/stellar-sdk` plus `@stellar/freighter-api`. Signing happens
  in the browser for donations; the escrow release key lives only in a server function.
- Horizon testnet at `https://horizon-testnet.stellar.org`, explorer at
  `stellar.expert/explorer/testnet`.
- All transaction submission and confirmation polling runs in server functions so a closed
  tab cannot lose a donation record.
- The current in-memory store in `src/lib/medfund.ts` is replaced by database-backed
  queries; the UI components stay as they are.

## What I need before stage 1

Just your go-ahead. Stage 2 is the only one that needs anything from you (the testnet
escrow key), and I will ask when we get there.
