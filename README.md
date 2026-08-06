# MedFund 💊💰

A transparent healthcare fundraising platform where donations are held in escrow and released only when a hospital or NGO confirms a treatment milestone.

## Problem

A cancer patient in Quezon City faces ₱150,000 in hospital bills, but donors hesitate to give because existing fundraising platforms don't show how or when the money is actually spent — leaving the patient at risk of delayed treatment.

## Solution

MedFund lets patients launch verified fundraisers where donations sit in a smart-contract escrow. Funds are only released to the patient once a hospital or NGO verifies that a treatment milestone (e.g., "surgery scheduled") has been reached. Every donation, verification, and release is visible on-chain, so donors can see exactly where their money goes and when.

## Vision and Purpose

Metro Manila and provincial hospital patients routinely face partial or delayed coverage from PhilHealth and NGOs. MedFund gives patients a credible way to raise emergency funds by removing the single biggest objection donors have: not knowing where the money goes. For hospitals and NGOs (Caritas Manila, Kythe Foundation, Philippine Red Cross), it offers faster, verifiable disbursement without waiting on reimbursement cycles. For overseas Filipino donors especially, it turns a leap of faith into a transaction they can audit.

## Web Application

The front-end is built with [Lovable](https://lovable.dev) and includes:

- **Landing page** — explains the problem and solution with a "How it works" 4-step visual: Create → Donate → Verify → Release
- **Wallet connect bar** — shows connected wallet address and XLM balance
- **Fundraiser dashboard** — cards displaying patient name, milestone, progress bar (raised vs goal), and status badge
- **Fundraiser detail page** — goal, amount raised, milestone description, verifier info, transaction timeline, and donation form
- **Create fundraiser form** — enter verifier address, milestone description, and goal amount
- **Transaction status feedback** — shows pending/success/error states with links to view transactions on stellar.expert

**Design direction:** warm, trustworthy, non-corporate aesthetic with serif headings, monospace for technical details, muted earthy palette (cream, deep green, gold accents), generous whitespace, and mobile-friendly layout.

**Live app**: https://medfundph.lovable.app

## Smart Contract

The escrow logic runs on Soroban (Stellar's smart-contract platform).

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- `wasm32v1-none` target: `rustup target add wasm32v1-none`
  (note: newer `stellar-cli` versions require this target, **not**
  `wasm32-unknown-unknown` — using the wrong target produces a confusing
  `E0463: can't find crate for 'core'` error)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
  (the tool was renamed from `soroban-cli` to `stellar-cli`). On Windows,
  installing via `cargo install` is extremely slow because it compiles
  Binaryen (`wasm-opt-sys`) from source — download the **prebuilt binary**
  from the [GitHub releases page](https://github.com/stellar/stellar-cli/releases)
  instead.

### How to Build

```bash
stellar contract build
```

The compiled Wasm binary will be output to
`target/wasm32v1-none/release/medfund.wasm`.

### How to Test

```bash
cargo test
```

Runs the 5-test suite in `src/test.rs`, covering the happy path,
authorization checks, state verification, double-release prevention, and
input validation.

### How to Deploy to Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/medfund.wasm \
  --source <YOUR_SOURCE_ACCOUNT> \
  --network testnet
```

This prints the deployed contract ID, referred to below as `<CONTRACT_ID>`.

> **Current testnet deployment:**
> `CCFNZ6SFGX274TKCSYPOKUBVUG3TS762YCQWU54YMW7UAP3KJ6OPM77A`
> Testnet ledgers reset periodically — if calls against this ID fail with
> a "contract not found" error, redeploy and update this line.

### Sample CLI Invocation

Create a fundraiser (dummy arguments):

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <YOUR_SOURCE_ACCOUNT> \
  --network testnet \
  -- \
  create_fundraiser \
  --patient GDPATIENTEXAMPLE... \
  --verifier GDVERIFIEREXAMPLE... \
  --token GDTOKENCONTRACTEXAMPLE... \
  --milestone_label "Surgery scheduled" \
  --goal 150000
```

Donate to it:

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <DONOR_SOURCE_ACCOUNT> \
  --network testnet \
  -- \
  donate \
  --donor GDDONOREXAMPLE... \
  --fundraiser_id 0 \
  --amount 150000
```

## Development

### Web App (Front-end)

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Continue developing in the [Lovable editor](https://lovable.dev/projects/74dd5bc8-dffb-4377-ba07-f1d299b0c75b):
- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable.

### Smart Contract (Soroban)

See Prerequisites and Build sections above.
