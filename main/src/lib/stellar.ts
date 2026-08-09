import {
  Horizon,
  Asset,
  Transaction,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  Memo,
} from "@stellar/stellar-sdk";

export const HORIZON_URL =
  import.meta.env.VITE_HORIZON_URL || "https://horizon-testnet.stellar.org";
export const ESCROW_PUBLIC_KEY =
  import.meta.env.VITE_ESCROW_PUBLIC_KEY || "";
export const USDC_ISSUER =
  import.meta.env.VITE_USDC_ISSUER ||
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const USDC_CODE = import.meta.env.VITE_USDC_CODE || "USDC";

export const horizon = new Horizon.Server(HORIZON_URL);
export const USDC = new Asset(USDC_CODE, USDC_ISSUER);

export function stellarExpertTxUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function stellarExpertAccountUrl(address: string) {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}

export async function buildUsdcPaymentTx(
  sourcePublicKey: string,
  destination: string,
  amount: string,
  memoText?: string
): Promise<Transaction> {
  const account = await horizon.loadAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  });

  if (memoText) {
    tx.addMemo(Memo.text(memoText.slice(0, 28)));
  }

  tx.addOperation(
    Operation.payment({
      destination,
      asset: USDC,
      amount,
    })
  );

  return tx.setTimeout(180).build();
}

export async function submitSignedTx(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  return horizon.submitTransaction(tx);
}

export async function fetchUsdcBalance(publicKey: string): Promise<string> {
  try {
    const account = await horizon.loadAccount(publicKey);
    const balance = account.balances.find(
      (b: any) =>
        b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER
    );
    return balance ? balance.balance : "0";
  } catch {
    return "0";
  }
}

export async function hasUsdcTrustline(publicKey: string): Promise<boolean> {
  try {
    const account = await horizon.loadAccount(publicKey);
    return account.balances.some(
      (b: any) =>
        b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER
    );
  } catch {
    return false;
  }
}

export async function buildTrustlineTx(
  sourcePublicKey: string,
  limit?: string
): Promise<Transaction> {
  const account = await horizon.loadAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  }).addOperation(
    Operation.changeTrust({
      asset: USDC,
      limit: limit || "10000000",
    })
  );

  return tx.setTimeout(180).build();
}