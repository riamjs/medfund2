/**
 * Adapts the live database rows into the display shape the MedFund pages use.
 * Keeps the uploaded page markup untouched while the data stays real.
 */
import { useQuery } from "@tanstack/react-query";
import { fundraisersQuery, fundraiserQuery, type FundraiserDetail } from "./data";
import type { Tables } from "@/integrations/supabase/types";

export type FundraiserStatus =
  | "awaiting_donations"
  | "milestone_pending"
  | "verified_released";

export type TimelineEventKey = "created" | "donated" | "verified" | "released";

export interface TimelineEvent {
  key: TimelineEventKey;
  label: string;
  timestamp: string | null;
  txHash: string | null;
}

export interface Fundraiser {
  id: string;
  patientName: string;
  cause: string;
  shortCause: string;
  description: string;
  goal: number;
  raised: number;
  donorCount: number;
  status: FundraiserStatus;
  milestoneLabel: string;
  milestoneDescription: string;
  verifierName: string;
  verifierAddress: string;
  escrowAddress: string;
  creatorAddress: string;
  timeline: TimelineEvent[];
}

type Row = Tables<"fundraisers"> & {
  milestones: (Tables<"milestones"> & { verifiers: Tables<"verifiers"> | null })[];
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

function statusOf(row: Row): FundraiserStatus {
  const ms = row.milestones ?? [];
  if (ms.length > 0 && ms.every((m) => m.status === "released")) {
    return "verified_released";
  }
  if (ms.some((m) => m.status === "awaiting_verification" || m.status === "verified")) {
    return "milestone_pending";
  }
  return "awaiting_donations";
}

function activeMilestone(row: Row) {
  const ms = [...(row.milestones ?? [])].sort((a, b) => a.position - b.position);
  return ms.find((m) => m.status !== "released") ?? ms[ms.length - 1] ?? null;
}

export function adapt(row: Row, donorCount = 0): Fundraiser {
  const m = activeMilestone(row);
  return {
    id: row.slug,
    patientName: row.patient,
    cause: row.cause,
    shortCause: row.summary || row.cause,
    description: row.summary || row.cause,
    goal: Number(row.goal_amount),
    raised: Number(row.raised_amount),
    donorCount,
    status: statusOf(row),
    milestoneLabel: m?.title ?? "Milestone pending",
    milestoneDescription: m?.description ?? "",
    verifierName: m?.verifiers?.org ?? "Awaiting verifier",
    verifierAddress: m?.verifiers?.stellar_address ?? "not set",
    escrowAddress: row.payout_address ?? "MedFund escrow",
    creatorAddress: row.location,
    timeline: [],
  };
}

export function useFundraisers() {
  const { data } = useQuery(fundraisersQuery);
  return (data ?? []).map((f) => adapt(f as Row));
}

const LABELS: Record<string, string> = {
  created: "Fundraiser created",
  donated: "Donation into escrow",
  evidence_submitted: "Evidence submitted",
  verified: "Milestone verified",
  rejected: "Verification rejected",
  released: "Funds released",
};

function timelineOf(detail: FundraiserDetail): TimelineEvent[] {
  const events = [...(detail.ledger_events ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const live = events.map((e) => ({
    key: (e.kind === "evidence_submitted" || e.kind === "rejected"
      ? "verified"
      : e.kind) as TimelineEventKey,
    label: e.detail || LABELS[e.kind] || e.kind,
    timestamp: fmt(e.created_at),
    txHash: e.tx_hash,
  }));
  const has = (k: TimelineEventKey) => live.some((e) => e.key === k);
  const pending: TimelineEvent[] = [];
  if (!has("donated"))
    pending.push({ key: "donated", label: "Awaiting donations", timestamp: null, txHash: null });
  if (!has("verified"))
    pending.push({ key: "verified", label: "Awaiting verification", timestamp: null, txHash: null });
  if (!has("released"))
    pending.push({ key: "released", label: "Funds to be released", timestamp: null, txHash: null });
  return [...live, ...pending];
}

export function useFundraiserDetail(slug: string) {
  const { data, isLoading } = useQuery(fundraiserQuery(slug));
  if (!data) return { fundraiser: null, isLoading };
  const donors = new Set((data.donations ?? []).map((d) => d.donor_address)).size;
  const base = adapt(data as unknown as Row, donors);
  return {
    fundraiser: { ...base, timeline: timelineOf(data) },
    isLoading,
  };
}
