<img width="1858" height="867" alt="image" src="https://github.com/user-attachments/assets/864e9e72-8581-4070-9f8f-da8dbcf7e332" /># MedFund

**A transparent healthcare fundraising platform where donations are held in Stellar escrow and released only when a hospital or NGO confirms a treatment milestone.**

## Problem

A cancer patient in Quezon City faces ₱150,000 in hospital bills, but donors hesitate to contribute because existing fundraising platforms don't show how or when the money is actually spent — leaving the patient at risk of delayed treatment.

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

---
### Landing Page 
![Landing page](https://i.imgur.com/BjOjxHf.jpeg)

### Browse Page
![Browse](https://i.imgur.com/K6PY7xA.jpeg)

### Connected Wallet State
![Connect](https://i.imgur.com/SiLsYHV.jpeg)
![Connected with Balance Displayed](https://i.imgur.com/RXuky2O.jpeg) 

### Transaction
![Confirm Transaction](https://imgur.com/SHT0oGA)
![Show Transaction](https://imgur.com/KQWLvQ9)

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
| _Riam Jaye Santiago_ | _Founder (Solo Builder)_ |


---

## Links

- **Stellar Network:** [stellar.org](https://stellar.org)
- **Stellar Expert (Testnet Explorer):** [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)
