import {
  Account,
  Asset,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  HORIZON,
  NETWORK_PASSPHRASE,
  USDC_CODE,
  USDC_ISSUER,
  memoForSlug,
} from "./stellar-config";

/** Deterministic platform escrow keypair derived from a stored secret. */
export async function escrowKeypair() {
  const seedSecret = process.env["STELLAR_ESCROW_SEED"];
  if (!seedSecret) throw new Error("Escrow signing key is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`medfund-escrow:${seedSecret}`),
  );
  return Keypair.fromRawEd25519Seed(Buffer.from(new Uint8Array(digest)));
}

export const usdcAsset = () => new Asset(USDC_CODE, USDC_ISSUER);

type HorizonAccount = {
  sequence: string;
  balances: {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }[];
};

export async function loadAccount(address: string): Promise<HorizonAccount | null> {
  const res = await fetch(`${HORIZON}/accounts/${address}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Horizon error ${res.status}`);
  return (await res.json()) as HorizonAccount;
}

export async function submitXdr(xdr: string) {
  const res = await fetch(`${HORIZON}/transactions`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: xdr }).toString(),
  });
  const body = (await res.json()) as {
    hash?: string;
    successful?: boolean;
    extras?: { result_codes?: unknown };
    detail?: string;
  };
  if (!res.ok || !body.hash) {
    const codes = JSON.stringify(body.extras?.result_codes ?? body.detail ?? body);
    throw new Error(`Stellar rejected the transaction: ${codes}`);
  }
  return body.hash;
}

async function friendbot(address: string) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
  if (!res.ok && res.status !== 400) {
    throw new Error("Could not fund the escrow account on testnet");
  }
}

/** Make sure the escrow account exists and can hold USDC. */
export async function ensureEscrowReady() {
  const kp = await escrowKeypair();
  const address = kp.publicKey();
  let account = await loadAccount(address);

  if (!account) {
    await friendbot(address);
    for (let i = 0; i < 10 && !account; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      account = await loadAccount(address);
    }
    if (!account) throw new Error("Escrow account funding timed out");
  }

  const hasTrustline = account.balances.some(
    (b) => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER,
  );

  if (!hasTrustline) {
    const tx = new TransactionBuilder(new Account(address, account.sequence), {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.changeTrust({ asset: usdcAsset() }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    await submitXdr(tx.toXDR());
    account = await loadAccount(address);
  }

  const usdc = account?.balances.find(
    (b) => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER,
  );

  return {
    address,
    balance: usdc ? Number(usdc.balance).toFixed(2) : "0.00",
    ready: true as const,
  };
}

/** Pay out a released milestone from escrow to the patient payout address. */
export async function payoutFromEscrow(input: {
  destination: string;
  amount: number;
  slug: string;
}) {
  const kp = await escrowKeypair();
  const address = kp.publicKey();
  const account = await loadAccount(address);
  if (!account) throw new Error("Escrow account is not initialised yet");

  const destAccount = await loadAccount(input.destination);
  if (!destAccount) {
    throw new Error("Payout address does not exist on the Stellar test network");
  }
  const destTrust = destAccount.balances.some(
    (b) => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER,
  );
  if (!destTrust) {
    throw new Error("Payout address has no USDC trustline");
  }

  const tx = new TransactionBuilder(new Account(address, account.sequence), {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: input.destination,
        asset: usdcAsset(),
        amount: input.amount.toFixed(7),
      }),
    )
    .addMemo(Memo.text(memoForSlug(input.slug)))
    .setTimeout(120)
    .build();

  tx.sign(kp);
  return submitXdr(tx.toXDR());
}

type HorizonOperation = {
  type: string;
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  amount?: string;
};

/** Confirm an on-chain USDC payment into escrow and return its details. */
export async function verifyDonationTx(txHash: string) {
  const txRes = await fetch(`${HORIZON}/transactions/${txHash}`);
  if (!txRes.ok) throw new Error("Transaction not found on the Stellar network");
  const tx = (await txRes.json()) as { successful: boolean; created_at: string };
  if (!tx.successful) throw new Error("Transaction failed on-chain");

  const kp = await escrowKeypair();
  const escrow = kp.publicKey();

  const opsRes = await fetch(`${HORIZON}/transactions/${txHash}/operations?limit=50`);
  if (!opsRes.ok) throw new Error("Could not read transaction operations");
  const ops = (await opsRes.json()) as { _embedded: { records: HorizonOperation[] } };

  const payment = ops._embedded.records.find(
    (o) =>
      (o.type === "payment" || o.type === "path_payment_strict_receive") &&
      o.to === escrow &&
      o.asset_code === USDC_CODE &&
      o.asset_issuer === USDC_ISSUER,
  );

  if (!payment || !payment.amount || !payment.from) {
    throw new Error("This transaction does not pay USDC into the MedFund escrow");
  }

  return {
    amount: Number(payment.amount),
    from: payment.from,
    createdAt: tx.created_at,
  };
}
