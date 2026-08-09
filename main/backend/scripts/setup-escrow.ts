import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
dotenv.config();

const horizon = new Horizon.Server(process.env.HORIZON_URL || "https://horizon-testnet.stellar.org");
const USDC_ISSUER = process.env.USDC_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC = new Asset("USDC", USDC_ISSUER);

async function main() {
  const secret = process.env.ESCROW_SECRET_KEY;
  if (!secret) throw new Error("Set ESCROW_SECRET_KEY in backend/.env first");
  const kp = Keypair.fromSecret(secret);

  try {
    await horizon.loadAccount(kp.publicKey());
    console.log("Escrow account already funded.");
  } catch {
    console.log("Funding via Friendbot...");
    await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  }

  const account = await horizon.loadAccount(kp.publicKey());
  if (account.balances.some((b: any) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER)) {
    console.log("Escrow already trusts USDC."); return;
  }

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: USDC, limit: "1000000000" }))
    .setTimeout(180).build();
  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  console.log("USDC trustline established:", result.hash);
}

main().catch((e) => { console.error(e); process.exit(1); });