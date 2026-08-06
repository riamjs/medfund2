import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Verifier = Tables<"verifiers">;
export type Fundraiser = Tables<"fundraisers">;
export type Milestone = Tables<"milestones">;
export type Donation = Tables<"donations">;
export type Evidence = Tables<"milestone_evidence">;
export type LedgerEvent = Tables<"ledger_events">;

export type MilestoneWithVerifier = Milestone & { verifiers: Verifier | null };

export type FundraiserDetail = Fundraiser & {
  milestones: MilestoneWithVerifier[];
  donations: Donation[];
  ledger_events: LedgerEvent[];
};

const unwrap = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

export const fundraisersQuery = queryOptions({
  queryKey: ["fundraisers"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("fundraisers")
        .select("*, milestones(*, verifiers(*))")
        .order("created_at", { ascending: false }),
    ) as (Fundraiser & { milestones: MilestoneWithVerifier[] })[],
});

export const fundraiserQuery = (slug: string) =>
  queryOptions({
    queryKey: ["fundraiser", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fundraisers")
        .select(
          "*, milestones(*, verifiers(*)), donations(*), ledger_events(*)",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const detail = data as unknown as FundraiserDetail;
      detail.milestones = [...detail.milestones].sort(
        (a, b) => a.position - b.position,
      );
      detail.donations = [...detail.donations].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
      detail.ledger_events = [...detail.ledger_events].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
      return detail;
    },
  });

export const ledgerQuery = queryOptions({
  queryKey: ["ledger"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("ledger_events")
        .select("*, fundraisers(slug, patient)")
        .order("created_at", { ascending: false })
        .limit(200),
    ) as (LedgerEvent & { fundraisers: { slug: string; patient: string } | null })[],
});

export const approvedVerifiersQuery = queryOptions({
  queryKey: ["verifiers", "approved"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("verifiers")
        .select("*")
        .eq("approved", true)
        .order("org"),
    ) as Verifier[],
});

export const myDonationsQuery = (userId: string | null, address: string | null) =>
  queryOptions({
    queryKey: ["donations", "mine", userId, address],
    enabled: !!(userId || address),
    queryFn: async () => {
      let q = supabase
        .from("donations")
        .select("*, fundraisers(slug, patient, status)")
        .order("created_at", { ascending: false });
      q = userId && address
        ? q.or(`donor_id.eq.${userId},donor_address.eq.${address}`)
        : userId
          ? q.eq("donor_id", userId)
          : q.eq("donor_address", address!);
      return unwrap(await q) as (Donation & {
        fundraisers: { slug: string; patient: string; status: string } | null;
      })[];
    },
  });

export const myFundraisersQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["fundraisers", "mine", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("fundraisers")
          .select("*, milestones(*, verifiers(*))")
          .eq("owner_id", userId!)
          .order("created_at", { ascending: false }),
      ) as (Fundraiser & { milestones: MilestoneWithVerifier[] })[],
  });

export const myVerifierQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["verifier", "mine", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verifiers")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Verifier | null;
    },
  });

export const verifierQueueQuery = (verifierId: string | null) =>
  queryOptions({
    queryKey: ["verifier", "queue", verifierId],
    enabled: !!verifierId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("milestones")
          .select("*, fundraisers(*), milestone_evidence(*)")
          .eq("verifier_id", verifierId!)
          .in("status", ["pending", "awaiting_verification", "rejected"])
          .order("created_at", { ascending: true }),
      ) as (Milestone & {
        fundraisers: Fundraiser | null;
        milestone_evidence: Evidence[];
      })[],
  });

export const evidenceQuery = (milestoneId: string) =>
  queryOptions({
    queryKey: ["evidence", milestoneId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("milestone_evidence")
          .select("*")
          .eq("milestone_id", milestoneId)
          .order("created_at", { ascending: false }),
      ) as Evidence[],
  });

export async function signedEvidenceUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("evidence")
    .createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
