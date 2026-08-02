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
- `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- [Soroban CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli) v21+: `cargo install --locked soroban-cli`

## How to Build

```bash
soroban contract build
```

The compiled Wasm binary will be output to
`target/wasm32-unknown-unknown/release/medfund.wasm`.

## How to Test

```bash
cargo test
```

Runs the 5-test suite in `src/test.rs`, covering the happy path,
authorization checks, state verification, double-release prevention, and
input validation.

## How to Deploy to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/medfund.wasm \
  --source <YOUR_SOURCE_ACCOUNT> \
  --network testnet
```

This prints the deployed contract ID, referred to below as `<CONTRACT_ID>`.

## Sample CLI Invocation

Create a fundraiser (dummy arguments):

```bash
soroban contract invoke \
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
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <DONOR_SOURCE_ACCOUNT> \
  --network testnet \
  -- \
  donate \
  --donor GDDONOREXAMPLE... \
  --fundraiser_id 0 \
  --amount 150000
```



