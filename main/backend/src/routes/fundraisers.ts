import { Router } from "express";
import { supabase } from "../supabase";
import { verifyTransactionOnChain } from "../stellar";

const router = Router();

// In-memory store fallback in case Supabase schema/permissions are restricted
let memoryFundraisers: any[] = [
  {
    id: 'mf-001',
    patientName: 'Maria Santos',
    cause: 'Kidney Dialysis — Stage 4 CKD',
    shortCause: 'Kidney dialysis, 3x weekly',
    description:
      'Maria is a 54-year-old grandmother from Cebu diagnosed with Stage 4 Chronic Kidney Disease. She requires hemodialysis three times a week at Cebu Velez General Hospital. Her husband is a retired jeepney driver and her children are overseas workers. This fundraiser covers six months of dialysis sessions plus medications.',
    goal: 4200,
    raised: 3150,
    donorCount: 47,
    status: 'milestone_pending',
    milestoneLabel: 'Month 3 dialysis completion',
    milestoneDescription:
      'Verifier confirms Maria completed all scheduled dialysis sessions for months 1–3 and that funds were applied to her hospital account.',
    verifierName: 'Cebu Velez General Hospital',
    verifierAddress: 'GCVGH7K2M9N8P1Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    escrowAddress: 'GESC1A4NP9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    creatorAddress: 'GCRE1B7QX9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-06-14 09:22 PHT', txHash: 'a1b2c3d4e5f6' },
      { key: 'donated', label: 'Milestone funded', timestamp: '2026-07-01 14:45 PHT', txHash: 'b2c3d4e5f6a7' },
      { key: 'verified', label: 'Awaiting verification', timestamp: null, txHash: null },
      { key: 'released', label: 'Funds to be released', timestamp: null, txHash: null },
    ],
  },
  {
    id: 'mf-002',
    patientName: 'Ernesto Reyes',
    cause: 'Heart Surgery — Coronary Bypass',
    shortCause: 'Coronary bypass surgery',
    description:
      'Ernesto, 61, is a retired public school teacher from Batangas City. He suffered a mild heart attack in May 2026 and his cardiologist has recommended a triple coronary bypass. His pension covers basic living expenses but not surgical costs. This fundraiser covers surgery, ICU care, and two weeks of post-op monitoring at Philippine Heart Center.',
    goal: 12000,
    raised: 12000,
    donorCount: 134,
    status: 'verified_released',
    milestoneLabel: 'Surgery completed & discharged',
    milestoneDescription:
      'Philippine Heart Center confirms the bypass surgery was performed successfully and Ernesto has been discharged from ICU care.',
    verifierName: 'Philippine Heart Center',
    verifierAddress: 'GPHC29XRT9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    escrowAddress: 'GESC2C8WV9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    creatorAddress: 'GCRE2D5YZ9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-05-20 11:00 PHT', txHash: 'c3d4e5f6a7b8' },
      { key: 'donated', label: 'Goal reached', timestamp: '2026-06-03 08:17 PHT', txHash: 'd4e5f6a7b8c9' },
      { key: 'verified', label: 'Surgery verified', timestamp: '2026-07-18 15:30 PHT', txHash: 'e5f6a7b8c9d0' },
      { key: 'released', label: 'Funds released', timestamp: '2026-07-18 15:35 PHT', txHash: 'f6a7b8c9d0e1' },
    ],
  },
  {
    id: 'mf-003',
    patientName: 'Lourdes Mendoza',
    cause: 'Breast Cancer — Chemotherapy Cycle',
    shortCause: 'Chemotherapy, 6-cycle regimen',
    description:
      'Lourdes is a 42-year-old single mother of three from Davao City, recently diagnosed with Stage 2 breast cancer. She works as a market vendor and her income has dropped significantly since her diagnosis. This fundraiser covers her full 6-cycle AC-T chemotherapy regimen at Southern Philippines Medical Center, including anti-nausea medications and lab work.',
    goal: 6800,
    raised: 1240,
    donorCount: 18,
    status: 'awaiting_donations',
    milestoneLabel: 'Cycles 1–3 of chemotherapy',
    milestoneDescription:
      'Southern Philippines Medical Center confirms Lourdes completed the first three cycles of AC-T chemotherapy and that payment was received for those sessions.',
    verifierName: 'Southern Philippines Medical Center',
    verifierAddress: 'GSPMC3BVR9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    escrowAddress: 'GESC3E2KF9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    creatorAddress: 'GCRE3F9HJ9O8P7Q6R5S4T3U2V1W0X9Y8Z7A6B5C4D3E2F1G0',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-07-28 10:14 PHT', txHash: 'g7h8i9j0k1l2' },
      { key: 'donated', label: 'Awaiting milestone funding', timestamp: null, txHash: null },
      { key: 'verified', label: 'Pending', timestamp: null, txHash: null },
      { key: 'released', label: 'Pending', timestamp: null, txHash: null },
    ],
  },
];

function mapDbToFundraiser(row: any) {
  return {
    id: String(row.id),
    patientName: row.patient || row.patient_name || row.title || 'Patient',
    cause: row.cause || row.description || 'Medical Fundraiser',
    shortCause: row.summary || row.short_cause || row.cause || 'Medical Fundraiser',
    description: row.summary || row.description || row.cause || '',
    goal: Number(row.goal_amount || row.target_amount || row.goal || 1000),
    raised: Number(row.raised_amount || row.raised || 0),
    donorCount: Number(row.donor_count || row.donorCount || 0),
    status: row.status || 'awaiting_donations',
    milestoneLabel: row.milestone_label || row.milestoneLabel || 'Treatment milestone',
    milestoneDescription: row.milestone_description || row.milestoneDescription || 'Verification required by hospital.',
    verifierName: row.hospital_name || row.verifier_name || row.verifierName || 'Accredited Verifier',
    verifierAddress: row.verifier_address || row.verifierAddress || 'GVERIFIERADDR123456789012345678901234567890123456',
    escrowAddress: row.contract_id || row.escrow_address || row.escrowAddress || 'GESCROWADDR123456789012345678901234567890123456',
    creatorAddress: row.creator_address || row.creatorAddress || 'GCREATORADDR123456789012345678901234567890123456',
    timeline: row.timeline || [
      { key: 'created', label: 'Fundraiser created', timestamp: row.created_at || new Date().toISOString(), txHash: row.tx_hash || null },
      { key: 'donated', label: 'Donations ongoing', timestamp: null, txHash: null },
      { key: 'verified', label: 'Pending', timestamp: null, txHash: null },
      { key: 'released', label: 'Pending', timestamp: null, txHash: null },
    ],
  };
}

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("fundraisers")
      .select("*");

    if (!error && data && data.length > 0) {
      const dbFundraisers = data.map(mapDbToFundraiser);
      // Merge memory ones that aren't in DB
      const dbIds = new Set(dbFundraisers.map(f => f.id));
      const combined = [...dbFundraisers, ...memoryFundraisers.filter(f => !dbIds.has(f.id))];
      return res.json(combined);
    }
  } catch (e) {
    console.warn("Supabase query failed, returning memory list:", e);
  }

  res.json(memoryFundraisers);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("fundraisers")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return res.json(mapDbToFundraiser(data));
    }
  } catch (e) {
    // fallback below
  }

  const found = memoryFundraisers.find(f => f.id === id);
  if (found) return res.json(found);
  res.status(404).json({ error: "Fundraiser not found" });
});

router.post("/", async (req, res) => {
  console.log("POST /fundraisers body:", req.body);
  const {
    id,
    patientName,
    verifierAddress,
    milestoneDescription,
    goalAmount,
    cause,
    shortCause,
    description,
    verifierName,
    txHash,
  } = req.body;

  const newId = id || `mf-${Date.now()}`;
  const newFundraiser = {
    id: newId,
    patientName: patientName || 'Patient',
    cause: cause || milestoneDescription || 'Medical Fundraiser',
    shortCause: shortCause || milestoneDescription || 'Medical treatment',
    description: description || milestoneDescription || 'Medical campaign',
    goal: Number(goalAmount || 1000),
    raised: 0,
    donorCount: 0,
    status: 'awaiting_donations',
    milestoneLabel: 'Initial Milestone',
    milestoneDescription: milestoneDescription || 'Hospital verification of treatment.',
    verifierName: verifierName || 'Accredited Hospital',
    verifierAddress: verifierAddress || 'GVERIFIERADDRESS',
    escrowAddress: `GESCROW${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    creatorAddress: 'GCREATORADDRESS',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), txHash: txHash || null },
      { key: 'donated', label: 'Awaiting donations', timestamp: null, txHash: null },
      { key: 'verified', label: 'Pending', timestamp: null, txHash: null },
      { key: 'released', label: 'Pending', timestamp: null, txHash: null },
    ],
  };

  // Add to memory fallback
  memoryFundraisers.unshift(newFundraiser);

  // Try inserting into Supabase with exact database columns
  try {
    const { data, error } = await supabase
      .from("fundraisers")
      .insert({
        cause: milestoneDescription || cause || 'Medical Treatment',
        patient: patientName,
        goal_amount: Number(goalAmount || 1000),
        raised_amount: 0,
        status: 'awaiting_donations',
        summary: milestoneDescription,
      })
      .select();

    if (error) {
      console.warn("Supabase insert note:", error.message);
    } else {
      console.log("Supabase insert success:", data);
    }
  } catch (err: any) {
    console.warn("Supabase insert exception:", err.message);
  }

  res.status(201).json(newFundraiser);
});

router.post("/:id/donate", async (req, res) => {
  const { id } = req.params;
  const { amount, txHash, donorWallet } = req.body;
  const numAmount = Number(amount || 0);

  let target = memoryFundraisers.find(f => f.id === id);
  if (target) {
    target.raised += numAmount;
    target.donorCount += 1;
    if (target.raised >= target.goal) {
      target.status = 'milestone_pending';
    }
  }

  // Update in Supabase
  try {
    const { data: dbData } = await supabase.from("fundraisers").select("raised_amount").eq("id", id).single();
    if (dbData) {
      const currentRaised = Number(dbData.raised_amount || 0);
      await supabase
        .from("fundraisers")
        .update({
          raised_amount: currentRaised + numAmount,
        })
        .eq("id", id);
    }
    
    // Also try inserting donation log
    await supabase.from("donations").insert({
      fundraiser_id: id,
      donor_address: donorWallet || 'GXYZ',
      amount: numAmount,
      tx_hash: txHash || null,
    });
  } catch (e) {
    console.warn("Supabase donate sync note:", e);
  }

  res.json({ ok: true, raised: target?.raised, donorCount: target?.donorCount });
});

export default router;
