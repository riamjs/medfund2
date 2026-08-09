# MedFund

**A transparent healthcare fundraising platform.**

---
![Landing page](https://imgur.com/a/ULBSHG1)

![Browse](https://imgur.com/K6PY7xA)

## Problem

A cancer patient in Quezon City faces ₱150,000 in hospital bills, but donors hesitate to contribute because existing fundraising platforms don't show how or when the money is actually spent — leaving the patient at risk of delayed treatment.

## Solution

MedFund enables patients to launch verified fundraisers where donations are held in **Stellar escrow** and released only when hospitals or NGOs confirm treatment milestones — giving donors transparent, on-chain visibility of fund disbursement.

## Stellar Features Used

- **USDC transfers** for low-cost, stable-value donations
- **Soroban smart contracts** to enforce milestone-based escrow release
- **Transparent payments** viewable on-chain by donors

## Target Users

- **Patients** in Metro Manila and provincial hospitals who need urgent financial support
- **Hospitals** that want faster, verified payments without waiting for PhilHealth reimbursements
- **NGOs** like Caritas Manila, Kythe Foundation, and Philippine Red Cross that coordinate medical aid campaigns
- **Donors**, including overseas Filipinos, who want assurance their contributions reach the right patient

## Core Feature (MVP)

**Transaction Flow:**

1. Patient creates fundraiser → Smart contract escrow initialized.
2. Donor sends USDC → Transaction recorded on the Stellar ledger.
3. Hospital/NGO verifies treatment milestones (e.g., surgery scheduled).
4. Smart contract releases funds → Donor sees milestone completion and fund release on-chain.

## Why This Wins

MedFund directly addresses a real-world healthcare transparency gap in the Philippines, where PhilHealth and NGOs often cover only partial or delayed costs. It demonstrates Stellar's escrow, speed, and transparency in a sector with immediate human impact.

---

## Tech Stack

- **Frontend:** React + Vite, TypeScript
- **Backend:** Express (Node.js/TypeScript)
- **Database/Auth:** Supabase (Postgres, Row-Level Security, Google OAuth)
- **Blockchain:** Stellar Testnet (Horizon + Soroban), Freighter wallet
- **Stablecoin:** Circle USDC (Stellar testnet issuer)

---

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Freighter Wallet](https://www.freighter.app/) browser extension, set to **Testnet**
- A [Supabase](https://supabase.com/) project
- Git

### 1. Clone the repository

```bash
git clone https://github.com/riamjs/medfund2.git
cd medfund2/main
```

### 2. Install dependencies

```bash
# Frontend (project root)
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Configure environment variables

**Frontend `.env`** (project root):

```dotenv
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_ESCROW_PUBLIC_KEY=your_escrow_stellar_public_key
VITE_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
VITE_USDC_CODE=USDC
VITE_BACKEND_URL=http://localhost:3001
```

**Backend `.env`** (`backend/.env`):

```dotenv
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
CONTRACT_ID=your_deployed_soroban_contract_id
ESCROW_SECRET_KEY=your_escrow_stellar_secret_key
PORT=3001
```

> ⚠️ **Never commit `.env` files.** Rotate `ESCROW_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` immediately if they're ever shared or exposed.

### 4. Set up the escrow account

1. Generate a Stellar testnet keypair for escrow (or use an existing one).
2. Fund it with XLM via [Friendbot](https://laboratory.stellar.org/#account-creator?network=test).
3. Establish a USDC trustline (see `backend/src/setup-escrow.ts` — run with `npx tsx src/setup-escrow.ts` from `backend/`).
4. Fund it with testnet USDC via the [Circle Faucet](https://faucet.circle.com) (select **Stellar**, paste your escrow public key).

### 5. Run the app

In two separate terminals:

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173)
npm run dev
```

Visit **http://localhost:5173**.

### 6. Try it out

1. Sign in with Google.
2. Connect your Freighter wallet (make sure it's set to **Testnet**).
3. Browse fundraisers, donate USDC, or (as a verifier) approve fundraisers and release milestone funds.

---

## Team Members

| Name | Role |
|---|---|
| _Add name_ | _Add role (e.g. Full-stack Dev)_ |
| _Add name_ | _Add role_ |
| _Add name_ | _Add role_ |

---

## Links

- **Stellar Network:** [stellar.org](https://stellar.org)
- **Stellar Expert (Testnet Explorer):** [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)