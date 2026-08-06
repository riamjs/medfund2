/* Pure presentation helpers shared across MedFund. No state, no I/O. */

export const EXPLORER = "https://stellar.expert/explorer/testnet";

export const explorerUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAccount = (address: string) => `${EXPLORER}/account/${address}`;

export const shortAddr = (a: string | null | undefined, n = 4) =>
  !a ? "—" : a.length > 12 ? `${a.slice(0, n + 2)}…${a.slice(-n)}` : a;

export const usd = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export type MilestoneStatus =
  | "pending"
  | "awaiting_verification"
  | "verified"
  | "released"
  | "rejected";

export type FundraiserStatus = "open" | "funded" | "completed" | "cancelled";

export type LedgerKind =
  | "created"
  | "donated"
  | "evidence_submitted"
  | "verified"
  | "rejected"
  | "released";

export const milestoneStatusLabel: Record<MilestoneStatus, string> = {
  pending: "Awaiting funding",
  awaiting_verification: "Pending verification",
  verified: "Verified — releasing",
  released: "Funds released",
  rejected: "More evidence needed",
};

export const fundraiserStatusLabel: Record<FundraiserStatus, string> = {
  open: "Awaiting donations",
  funded: "Fully funded",
  completed: "Complete",
  cancelled: "Cancelled",
};

export const ledgerKindLabel: Record<LedgerKind, string> = {
  created: "Fundraiser created",
  donated: "Donation escrowed",
  evidence_submitted: "Evidence submitted",
  verified: "Milestone verified",
  rejected: "Verification declined",
  released: "Funds released",
};

type Tone = "neutral" | "gold" | "green" | "red";

const toneClass: Record<Tone, string> = {
  neutral: "border-border bg-secondary text-secondary-foreground",
  gold: "border-gold/50 bg-gold/15 text-gold-foreground",
  green: "border-primary/30 bg-primary/10 text-primary",
  red: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const milestoneTone: Record<MilestoneStatus, string> = {
  pending: toneClass.neutral,
  awaiting_verification: toneClass.gold,
  verified: toneClass.gold,
  released: toneClass.green,
  rejected: toneClass.red,
};

export const fundraiserTone: Record<FundraiserStatus, string> = {
  open: toneClass.neutral,
  funded: toneClass.gold,
  completed: toneClass.green,
  cancelled: toneClass.red,
};

export const ledgerTone: Record<LedgerKind, string> = {
  created: toneClass.neutral,
  donated: toneClass.neutral,
  evidence_submitted: toneClass.gold,
  verified: toneClass.gold,
  rejected: toneClass.red,
  released: toneClass.green,
};

export const slugify = (input: string, fallback: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
