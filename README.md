# MedFund 💊💰

A transparent healthcare fundraising platform where donations are held in
Stellar escrow and released only when a hospital or NGO confirms a
treatment milestone.

## Problem

A cancer patient in Quezon City faces ₱150,000 in hospital bills, but
donors hesitate to give because existing fundraising platforms don't show
how or when the money is actually spent — leaving the patient at risk of
delayed treatment.

## Solution

MedFund lets patients launch verified fundraisers where donations sit in
a Soroban smart-contract escrow. Funds are only released to the patient
once a hospital or NGO verifies that a treatment milestone (e.g.,
"surgery scheduled") has been reached. Every donation, verification, and
release is visible on-chain, so donors can see exactly where their money
goes and when.


## Vision and Purpose

Metro Manila and provincial hospital patients routinely face partial or
delayed coverage from PhilHealth and NGOs. MedFund gives patients a
credible way to raise emergency funds by removing the single biggest
objection donors have: not knowing where the money goes. For hospitals
and NGOs (Caritas Manila, Kythe Foundation, Philippine Red Cross), it
offers faster, verifiable disbursement without waiting on reimbursement
cycles. For overseas Filipino donors especially, it turns a leap of faith
into a transaction they can audit.

## Prerequisites

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

## How to Build

```bash
stellar contract build
```

The compiled Wasm binary will be output to
`target/wasm32v1-none/release/medfund.wasm`.

## How to Test

```bash
cargo test
```

Runs the 5-test suite in `src/test.rs`, covering the happy path,
authorization checks, state verification, double-release prevention, and
input validation.

## How to Deploy to Testnet

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

## Sample CLI Invocation

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