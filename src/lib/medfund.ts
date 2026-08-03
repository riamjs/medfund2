import { useSyncExternalStore } from "react";

export type Status = "awaiting" | "pending" | "released";

export type TimelineEvent = {
  label: "Created" | "Donated" | "Verified" | "Released";
  at: string | null;
  tx?: string;
};

export type Fundraiser = {
  id: string;
  patient: string;
  cause: string;
  summary: string;
  milestone: string;
  verifier: string;
  verifierAddress: string;
  goal: number;
  raised: number;
  status: Status;
  location: string;
  timeline: TimelineEvent[];
};

export type Wallet = { address: string; balance: number } | null;

const EXPLORER = "https://stellar.expert/explorer/testnet/tx/";

export const explorerUrl = (hash: string) => EXPLORER + hash;

export const shortAddr = (a: string, n = 4) =>
  a.length > 12 ? `${a.slice(0, n + 2)}…${a.slice(-n)}` : a;

export const usd = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export const statusLabel: Record<Status, string> = {
  awaiting: "Awaiting donations",
  pending: "Milestone pending verification",
  released: "Verified — funds released",
};

const randHash = () =>
  Array.from({ length: 64 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)],
  ).join("");

const now = () => new Date().toISOString();

const initial: Fundraiser[] = [
  {
    id: "maria-dialysis",
    patient: "Maria Dela Cruz",
    cause: "Twice-weekly dialysis, 3 months",
    summary:
      "Maria, 54, from Cebu City has stage 5 kidney disease. Funds cover 24 dialysis sessions at Chong Hua Hospital while she waits for a transplant match.",
    milestone: "24 dialysis sessions completed and invoiced by Chong Hua Hospital",
    verifier: "Chong Hua Hospital — Billing Office",
    verifierAddress: "GCHONGHUA7Q2XK4M9PJTLVZ8RD3NWFY6BSAE1CQXU2MKD5RTP",
    goal: 4800,
    raised: 4800,
    location: "Cebu City",
    status: "pending",
    timeline: [
      { label: "Created", at: "2026-06-02T09:14:00Z", tx: randHash() },
      { label: "Donated", at: "2026-07-18T22:05:00Z", tx: randHash() },
      { label: "Verified", at: null },
      { label: "Released", at: null },
    ],
  },
  {
    id: "jomar-surgery",
    patient: "Jomar Aquino",
    cause: "Emergency appendectomy & recovery",
    summary:
      "Jomar, 17, was admitted in Davao after an appendix rupture. Escrow covers the surgical package and five days of post-op care.",
    milestone: "Surgery performed and discharge summary issued",
    verifier: "Southern Philippines Medical Center",
    verifierAddress: "GSPMC4KD8LQ2ZX7VNRJ9TYE3WB6MFAH5UCPO1DSKR2XVL9TN",
    goal: 2200,
    raised: 2200,
    location: "Davao City",
    status: "released",
    timeline: [
      { label: "Created", at: "2026-04-11T03:20:00Z", tx: randHash() },
      { label: "Donated", at: "2026-04-19T11:48:00Z", tx: randHash() },
      { label: "Verified", at: "2026-05-02T07:31:00Z", tx: randHash() },
      { label: "Released", at: "2026-05-02T07:33:00Z", tx: randHash() },
    ],
  },
  {
    id: "elena-chemo",
    patient: "Elena Bautista",
    cause: "Breast cancer — 4 chemotherapy cycles",
    summary:
      "Elena, 41, a public school teacher in Quezon City, needs four cycles of chemotherapy. Funds release per completed cycle, verified by her oncology unit.",
    milestone: "First two chemotherapy cycles administered",
    verifier: "Kythe Foundation (NGO)",
    verifierAddress: "GKYTHE9PL3MX2QVD7RNB4TSJ8WCFA6EUHO5KZI1YRXM2DPTV",
    goal: 6500,
    raised: 2140,
    location: "Quezon City",
    status: "awaiting",
    timeline: [
      { label: "Created", at: "2026-07-21T13:02:00Z", tx: randHash() },
      { label: "Donated", at: "2026-07-29T18:40:00Z", tx: randHash() },
      { label: "Verified", at: null },
      { label: "Released", at: null },
    ],
  },
  {
    id: "renz-prosthesis",
    patient: "Renz Villanueva",
    cause: "Below-knee prosthesis fitting",
    summary:
      "Renz, 29, a fisherman from Iloilo, lost his lower leg in a boat accident. Escrow covers the prosthesis and eight rehab sessions.",
    milestone: "Prosthesis fitted and rehabilitation started",
    verifier: "Western Visayas Medical Center",
    verifierAddress: "GWVMC2TR6XK9DLPQ4ZNJ7YBE3MSFA8UHCO5VIK1WRXD2QPTL",
    goal: 3100,
    raised: 950,
    location: "Iloilo City",
    status: "awaiting",
    timeline: [
      { label: "Created", at: "2026-07-26T05:55:00Z", tx: randHash() },
      { label: "Donated", at: "2026-07-30T02:11:00Z", tx: randHash() },
      { label: "Verified", at: null },
      { label: "Released", at: null },
    ],
  },
];

export type VerifierAccount = {
  id: string;
  org: string;
  kind: "Hospital" | "NGO";
  contact: string;
  address: string;
  accessCode: string;
  approved: boolean;
  appliedAt: string;
};

const verifierSeed: VerifierAccount[] = [
  {
    id: "chong-hua",
    org: "Chong Hua Hospital — Billing Office",
    kind: "Hospital",
    contact: "billing@chonghua.example.ph",
    address: "GCHONGHUA7Q2XK4M9PJTLVZ8RD3NWFY6BSAE1CQXU2MKD5RTP",
    accessCode: "CHH-2026",
    approved: true,
    appliedAt: "2026-01-12T08:00:00Z",
  },
  {
    id: "kythe",
    org: "Kythe Foundation (NGO)",
    kind: "NGO",
    contact: "verify@kythe.example.ph",
    address: "GKYTHE9PL3MX2QVD7RNB4TSJ8WCFA6EUHO5KZI1YRXM2DPTV",
    accessCode: "KYT-2026",
    approved: true,
    appliedAt: "2026-02-04T08:00:00Z",
  },
  {
    id: "spmc",
    org: "Southern Philippines Medical Center",
    kind: "Hospital",
    contact: "records@spmc.example.ph",
    address: "GSPMC4KD8LQ2ZX7VNRJ9TYE3WB6MFAH5UCPO1DSKR2XVL9TN",
    accessCode: "SPM-2026",
    approved: true,
    appliedAt: "2026-02-20T08:00:00Z",
  },
];

type State = {
  fundraisers: Fundraiser[];
  wallet: Wallet;
  verifiers: VerifierAccount[];
  verifierSession: string | null;
};

let state: State = {
  fundraisers: initial,
  wallet: null,
  verifiers: verifierSeed,
  verifierSession: null,
};
const listeners = new Set<() => void>();

const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => state;

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function connectWallet() {
  await wait(700);
  set({
    wallet: {
      address: "GDONOR4X7KQ2ZP9WNMRT6LVJ3BYEC8SAFH5UDO1KIX2QRPTL",
      balance: 1240.5,
    },
  });
}

export function disconnectWallet() {
  set({ wallet: null });
}

function update(id: string, fn: (f: Fundraiser) => Fundraiser) {
  set({
    fundraisers: state.fundraisers.map((f) => (f.id === id ? fn(f) : f)),
  });
}

export async function donate(id: string, amount: number): Promise<string> {
  await wait(1400);
  const hash = randHash();
  update(id, (f) => {
    const raised = Math.min(f.goal, f.raised + amount);
    return {
      ...f,
      raised,
      status: raised >= f.goal && f.status === "awaiting" ? "pending" : f.status,
      timeline: f.timeline.map((t) =>
        t.label === "Donated" ? { ...t, at: now(), tx: hash } : t,
      ),
    };
  });
  if (state.wallet)
    set({
      wallet: {
        ...state.wallet,
        balance: Math.max(0, state.wallet.balance - amount),
      },
    });
  return hash;
}

export async function verifyMilestone(id: string): Promise<string> {
  await wait(1400);
  const hash = randHash();
  update(id, (f) => ({
    ...f,
    status: "released",
    timeline: f.timeline.map((t) =>
      t.label === "Verified"
        ? { ...t, at: now(), tx: hash }
        : t.label === "Released"
          ? { ...t, at: now(), tx: randHash() }
          : t,
    ),
  }));
  return hash;
}

export async function createFundraiser(input: {
  patient: string;
  cause: string;
  milestone: string;
  verifier: string;
  verifierAddress: string;
  goal: number;
}): Promise<{ id: string; hash: string }> {
  await wait(1400);
  const hash = randHash();
  const id =
    input.patient.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    `fundraiser-${state.fundraisers.length + 1}`;
  const f: Fundraiser = {
    id,
    patient: input.patient,
    cause: input.cause,
    summary: input.cause,
    milestone: input.milestone,
    verifier: input.verifier || "Verifier",
    verifierAddress: input.verifierAddress,
    goal: input.goal,
    raised: 0,
    status: "awaiting",
    location: "Philippines",
    timeline: [
      { label: "Created", at: now(), tx: hash },
      { label: "Donated", at: null },
      { label: "Verified", at: null },
      { label: "Released", at: null },
    ],
  };
  set({ fundraisers: [f, ...state.fundraisers] });
  return { id, hash };
}

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

/* ---------- verifier onboarding ---------- */

export function verifierSignIn(code: string): VerifierAccount | null {
  const norm = code.trim().toUpperCase();
  const acct = state.verifiers.find(
    (v) => v.approved && v.accessCode.toUpperCase() === norm,
  );
  if (!acct) return null;
  set({ verifierSession: acct.id });
  return acct;
}

export function verifierSignOut() {
  set({ verifierSession: null });
}

export function currentVerifier(): VerifierAccount | null {
  return state.verifiers.find((v) => v.id === state.verifierSession) ?? null;
}

export async function applyAsVerifier(input: {
  org: string;
  kind: "Hospital" | "NGO";
  contact: string;
  address: string;
}): Promise<VerifierAccount> {
  await wait(1200);
  const id =
    input.org.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    `verifier-${state.verifiers.length + 1}`;
  const acct: VerifierAccount = {
    id,
    org: input.org,
    kind: input.kind,
    contact: input.contact,
    address: input.address,
    accessCode: `${id.slice(0, 3).toUpperCase()}-PENDING`,
    approved: false,
    appliedAt: now(),
  };
  set({ verifiers: [...state.verifiers, acct] });
  return acct;
}

export async function updateVerifierAddress(
  id: string,
  address: string,
): Promise<string> {
  await wait(1300);
  const hash = randHash();
  const prev = state.verifiers.find((v) => v.id === id);
  set({
    verifiers: state.verifiers.map((v) =>
      v.id === id ? { ...v, address } : v,
    ),
    fundraisers: prev
      ? state.fundraisers.map((f) =>
          f.verifierAddress === prev.address ? { ...f, verifierAddress: address } : f,
        )
      : state.fundraisers,
  });
  return hash;
}

export function requestsForVerifier(address: string) {
  return state.fundraisers.filter(
    (f) => f.verifierAddress === address && f.status !== "released",
  );
}
