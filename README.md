# MedFund Trust

Here's a prompt you can paste directly into Lovable:

Build a clean, trustworthy web app called MedFund — a transparent medical fundraising platform for the Philippines.

Concept: Patients create fundraisers for medical bills. Donors send USDC which sits in an escrow smart contract. Funds only release once a hospital or NGO verifies a treatment milestone. Everything is visible on-chain so donors can see exactly when and how money is spent.

Pages/sections needed:

Landing page — headline explaining the problem (donors don't trust where fundraiser money goes) and the solution (escrow + milestone verification). Include a "How it works" 4-step visual: Create → Donate → Verify → Release.

Wallet connect bar — top of the app, shows "Connect Wallet" button, then once connected shows a shortened wallet address and XLM balance.

Fundraiser list/dashboard — cards showing each fundraiser: patient name/cause, milestone label, progress bar (raised vs goal), and status badge (Awaiting donations / Milestone pending verification / Verified — funds released).

Fundraiser detail page — full breakdown: goal, amount raised, milestone description, verifier name (hospital/NGO), a timeline showing Created → Donated → Verified → Released with timestamps, and a donate button/form.

Create fundraiser form — simple form: verifier address, milestone description, goal amount.

Transaction status feedback — every action (donate, verify, release) should show a clear pending → success/error state, with a link to view the transaction on stellar.expert.

Design direction:

Warm, trustworthy, non-corporate — think editorial/ledger aesthetic, not a typical crypto dashboard

Serif headings, monospace for addresses/numbers/technical details, clean sans-serif body text

Muted earthy palette (cream/paper background, deep green, small gold/amber accent for "verified" states) — avoid neon crypto colors

Generous whitespace, calm and human, since this is about medical trust, not speculation

Mobile-friendly, since many donors will be overseas Filipinos on phones

Keep it simple: no unnecessary animations, no dark mode toggle needed, no complex navigation — just landing → browse fundraisers → fundraiser detail → connect wallet → act.

Want me to tailor this further (e.g. specify exact colors/fonts to match the ledger style I used in the HTML mockup, or trim it down even more)?

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://medfundph.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/74dd5bc8-dffb-4377-ba07-f1d299b0c75b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
