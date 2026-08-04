import { Router } from "express";
import { supabase } from "../supabase";

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

export default router;