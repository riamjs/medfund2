import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public: escrow account address + live USDC balance (bootstraps on first call). */
export const getEscrowInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureEscrowReady } = await import("@/lib/escrow.server");
  try {
    return await ensureEscrowReady();
  } catch (e) {
    return {
      address: "",
      balance: "0.00",
      ready: false as const,
      error: e instanceof Error ? e.message : "Escrow unavailable",
    };
  }
});

const donationInput = z.object({
  slug: z.string().min(1).max(120),
  txHash: z.string().regex(/^[0-9a-f]{64}$/i, "Invalid transaction hash"),
});

/**
 * Public: records a donation only after confirming on Horizon that the
 * transaction really paid USDC into the MedFund escrow account.
 */
export const recordDonation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => donationInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyDonationTx } = await import("@/lib/escrow.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: fundraiser, error: fErr } = await supabaseAdmin
      .from("fundraisers")
      .select("id, slug, raised_amount, goal_amount, status")
      .eq("slug", data.slug)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!fundraiser) throw new Error("Fundraiser not found");

    const existing = await supabaseAdmin
      .from("donations")
      .select("id, amount")
      .eq("tx_hash", data.txHash)
      .maybeSingle();
    if (existing.data) return { ok: true, amount: Number(existing.data.amount) };

    const payment = await verifyDonationTx(data.txHash);

    const { error: dErr } = await supabaseAdmin.from("donations").insert({
      fundraiser_id: fundraiser.id,
      donor_address: payment.from,
      amount: payment.amount,
      tx_hash: data.txHash,
      confirmed: true,
    });
    if (dErr) throw new Error(dErr.message);

    const raised = Number(fundraiser.raised_amount) + payment.amount;
    await supabaseAdmin
      .from("fundraisers")
      .update({
        raised_amount: raised,
        status:
          raised >= Number(fundraiser.goal_amount) && fundraiser.status === "open"
            ? "funded"
            : fundraiser.status,
      })
      .eq("id", fundraiser.id);

    // Unlock the first unfunded milestone for verification once it is covered.
    const { data: milestones } = await supabaseAdmin
      .from("milestones")
      .select("id, amount, position, status")
      .eq("fundraiser_id", fundraiser.id)
      .order("position");

    let covered = raised;
    for (const m of milestones ?? []) {
      const fundedEnough = covered >= Number(m.amount);
      if (fundedEnough && m.status === "pending") {
        await supabaseAdmin
          .from("milestones")
          .update({ status: "awaiting_verification" })
          .eq("id", m.id);
      }
      covered -= Number(m.amount);
      if (covered < 0) break;
    }

    await supabaseAdmin.from("ledger_events").insert({
      fundraiser_id: fundraiser.id,
      kind: "donated",
      amount: payment.amount,
      tx_hash: data.txHash,
      actor: payment.from,
      detail: `Donation of ${payment.amount} USDC escrowed`,
    });

    return { ok: true, amount: payment.amount };
  });

const decisionInput = z.object({
  milestoneId: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

/**
 * Verifier-only: approve a milestone (releases USDC from escrow to the
 * patient payout address) or send it back for more evidence.
 */
export const decideMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decisionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: verifier, error: vErr } = await supabase
      .from("verifiers")
      .select("id, org, approved, stellar_address")
      .eq("user_id", userId)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!verifier?.approved) throw new Error("Your verifier account is not approved yet");

    const { data: milestone, error: mErr } = await supabase
      .from("milestones")
      .select("id, title, amount, status, verifier_id, fundraiser_id")
      .eq("id", data.milestoneId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!milestone) throw new Error("Milestone not found");
    if (milestone.verifier_id !== verifier.id) {
      throw new Error("This milestone is assigned to a different verifier");
    }
    if (milestone.status === "released") {
      throw new Error("This milestone has already been released");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: fundraiser } = await supabaseAdmin
      .from("fundraisers")
      .select("id, slug, patient, payout_address, released_amount, goal_amount")
      .eq("id", milestone.fundraiser_id)
      .single();

    if (!data.approve) {
      await supabaseAdmin
        .from("milestones")
        .update({ status: "rejected", verifier_note: data.note ?? null })
        .eq("id", milestone.id);
      await supabaseAdmin.from("ledger_events").insert({
        fundraiser_id: milestone.fundraiser_id,
        milestone_id: milestone.id,
        kind: "rejected",
        actor: verifier.org,
        detail: data.note || "Verifier requested further evidence",
      });
      return { released: false, txHash: null as string | null };
    }

    if (!fundraiser?.payout_address) {
      throw new Error("This fundraiser has no payout address set");
    }

    await supabaseAdmin
      .from("milestones")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        verifier_note: data.note ?? null,
      })
      .eq("id", milestone.id);

    await supabaseAdmin.from("ledger_events").insert({
      fundraiser_id: milestone.fundraiser_id,
      milestone_id: milestone.id,
      kind: "verified",
      actor: verifier.org,
      detail: `${verifier.org} verified “${milestone.title}”`,
    });

    const { payoutFromEscrow } = await import("@/lib/escrow.server");
    const amount = Number(milestone.amount);
    const txHash = await payoutFromEscrow({
      destination: fundraiser.payout_address,
      amount,
      slug: fundraiser.slug,
    });

    await supabaseAdmin
      .from("milestones")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
        release_tx: txHash,
      })
      .eq("id", milestone.id);

    const releasedTotal = Number(fundraiser.released_amount) + amount;
    const { count: remaining } = await supabaseAdmin
      .from("milestones")
      .select("id", { count: "exact", head: true })
      .eq("fundraiser_id", fundraiser.id)
      .neq("status", "released");

    await supabaseAdmin
      .from("fundraisers")
      .update({
        released_amount: releasedTotal,
        ...(remaining === 0 ? { status: "completed" as const } : {}),
      })
      .eq("id", fundraiser.id);

    await supabaseAdmin.from("ledger_events").insert({
      fundraiser_id: fundraiser.id,
      milestone_id: milestone.id,
      kind: "released",
      amount,
      tx_hash: txHash,
      actor: "MedFund escrow",
      detail: `${amount} USDC released to ${fundraiser.patient}`,
    });

    return { released: true, txHash };
  });

const evidenceInput = z.object({
  milestoneId: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
});

/** Patient-side: flag a milestone as ready for verification after uploading evidence. */
export const submitForVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => evidenceInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: milestone, error } = await supabase
      .from("milestones")
      .select("id, title, status, fundraiser_id, fundraisers(owner_id)")
      .eq("id", data.milestoneId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!milestone) throw new Error("Milestone not found");
    const owner = (milestone.fundraisers as { owner_id: string | null } | null)?.owner_id;
    if (owner !== userId) throw new Error("You do not own this fundraiser");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("milestones")
      .update({ status: "awaiting_verification" })
      .eq("id", milestone.id);

    await supabaseAdmin.from("ledger_events").insert({
      fundraiser_id: milestone.fundraiser_id,
      milestone_id: milestone.id,
      kind: "evidence_submitted",
      detail: data.note || `Evidence submitted for “${milestone.title}”`,
    });

    return { ok: true };
  });

const createdInput = z.object({
  fundraiserId: z.string().uuid(),
});

/** Records the ledger entry for a newly created fundraiser. */
export const logFundraiserCreated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: fundraiser } = await context.supabase
      .from("fundraisers")
      .select("id, patient, owner_id")
      .eq("id", data.fundraiserId)
      .maybeSingle();
    if (!fundraiser || fundraiser.owner_id !== context.userId) {
      throw new Error("Fundraiser not found");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ledger_events").insert({
      fundraiser_id: fundraiser.id,
      kind: "created",
      actor: fundraiser.patient,
      detail: `Escrow opened for ${fundraiser.patient}`,
    });
    return { ok: true };
  });
