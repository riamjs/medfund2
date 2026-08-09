import { signTransaction } from "@stellar/freighter-api";
import {
  hasUsdcTrustline,
  buildTrustlineTx,
  submitSignedTx,
} from "./stellar.ts";

export type TrustlineResult =
  | { status: "already_trusted" }
  | { status: "trustline_added"; txHash: string }
  | { status: "user_declined" }
  | { status: "error"; message: string };

/**
 * Ensures a wallet can hold USDC. If it already can, resolves immediately.
 * Otherwise builds a changeTrust tx, prompts Freighter to sign it, and submits it.
 *
 * Call this right before a donation or fund release — Freighter will show
 * a second popup for the trustline, then the actual payment popup.
 */
export async function ensureUsdcTrustline(
  publicKey: string
): Promise<TrustlineResult> {
  try {
    const trusted = await hasUsdcTrustline(publicKey);
    if (trusted) return { status: "already_trusted" };

    const tx = await buildTrustlineTx(publicKey);

    const { signedTxXdr, error } = await signTransaction(tx.toXDR(), {
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    if (error || !signedTxXdr) {
      return { status: "user_declined" };
    }

    const result = await submitSignedTx(signedTxXdr);
    return { status: "trustline_added", txHash: result.hash };
  } catch (err: any) {
    console.error("Trustline setup failed:", err);
    return {
      status: "error",
      message: err.message ?? "Failed to set up USDC trustline",
    };
  }
}