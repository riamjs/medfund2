import { Router } from "express";
import { supabase } from "../supabase";
import { verifyTransactionOnChain } from "../stellar";

const router = Router();

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("fundraisers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("fundraisers")
    .select("*, milestones(*)")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Fundraiser not found" });
  res.json(data);
});


router.post("/", async (req, res) => {
  const { txHash, id, contractId, title, description, hospitalName, targetAmount, imageUrl, patientId } = req.body;

  try {
    await verifyTransactionOnChain(txHash);
  } catch (err: any) {
    return res.status(400).json({ error: `On-chain verification failed: ${err.message}` });
  }

  const { data, error } = await supabase
    .from("fundraisers")
    .insert({
      id,
      contract_id: contractId,
      title,
      description,
      hospital_name: hospitalName,
      target_amount: targetAmount,
      image_url: imageUrl,
      patient_id: patientId || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;