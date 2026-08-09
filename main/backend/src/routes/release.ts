import { Router } from "express";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
  Horizon,
} from "@stellar/stellar-sdk";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const horizon = new Horizon.Server(
  process.env.HORIZON_URL || "https://horizon-testnet.stellar.org"
);
const USDC_ISSUER =
  process.env.USDC_ISSUER ||
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC = new Asset("USDC", USDC_ISSUER);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post("/release", async (req, res) => {
  const { milestoneId, destination, amount } = req.body;

  if (!milestoneId || !destination || !amount) {
    return res.status(400).json({
      error: "milestoneId, destination, and amount are required",
    });
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const escrowSecret = process.env.ESCROW_SECRET_KEY;
  if (!escrowSecret) {
    return res.status(500).json({ error: "Escrow not configured" });
  }

  try {
    // Verify milestone exists and is pending
    const { data: milestone, error: mErr } = await supabase
      .from("milestones")
      .select("*, fundraisers(verifier_id, verifier_address)")
      .eq("id", milestoneId)
      .single();

    if (mErr || !milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    if (milestone.tx_hash) {
      return res.status(400).json({ error: "Milestone already released" });
    }

    const escrowKeypair = Keypair.fromSecret(escrowSecret);
    const account = await horizon.loadAccount(escrowKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: USDC,
          amount: String(amount),
        })
      )
      .setTimeout(180)
      .build();

    tx.sign(escrowKeypair);
    const result = await horizon.submitTransaction(tx);

    const { error: dbError } = await supabase
      .from("milestones")
      .update({
        status: "released",
        verified_at: new Date().toISOString(),
        tx_hash: result.hash,
      })
      .eq("id", milestoneId);

    if (dbError) {
      console.error(
        "Milestone DB update failed after successful release:",
        dbError
      );
      return res.status(500).json({
        error: "Funds released on-chain but failed to update the record",
        txHash: result.hash,
      });
    }

    return res.json({ txHash: result.hash });
  } catch (err: any) {
    console.error("Release failed:", err);

console.error("FULL EXTRAS:", JSON.stringify(err?.response?.data?.extras, null, 2));

    if (err?.response?.data?.extras?.result_codes) {
      return res.status(400).json({
        error: "Stellar transaction failed",
        details: err.response.data.extras.result_codes,
      });
    }

    return res.status(500).json({
      error: err.message ?? "Release failed",
    });
  }
});

export default router;