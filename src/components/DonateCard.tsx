import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account, Asset, Memo, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  HORIZON,
  NETWORK_PASSPHRASE,
  USDC_CODE,
  USDC_ISSUER,
  memoForSlug,
} from "@/lib/stellar-config";
import { connectWallet, signXdr, refreshBalances, useWallet } from "@/lib/wallet";
import { getEscrowInfo, recordDonation } from "@/lib/medfund.functions";
import { explorerAccount, shortAddr } from "@/lib/medfund";
import { TxFeedback, buttonClass, type Tx } from "./ui-bits";

async function submitToHorizon(xdr: string) {
  const res = await fetch(`${HORIZON}/transactions`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: xdr }).toString(),
  });
  const body = (await res.json()) as {
    hash?: string;
    extras?: { result_codes?: unknown };
  };
  if (!res.ok || !body.hash) {
    throw new Error(
      `Stellar rejected the payment: ${JSON.stringify(body.extras?.result_codes ?? body)}`,
    );
  }
  return body.hash;
}

export function DonateCard({
  slug,
  verifierName,
  disabled,
}: {
  slug: string;
  verifierName: string;
  disabled?: boolean;
}) {
  const wallet = useWallet();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("25");
  const [tx, setTx] = useState<Tx>({ state: "idle" });

  const escrow = useQuery({
    queryKey: ["escrow"],
    queryFn: () => getEscrowInfo(),
    staleTime: 60_000,
  });

  const donate = useMutation({
    mutationFn: async (value: number) => {
      if (!wallet.address) throw new Error("Connect Freighter to donate");
      if (!escrow.data?.address) throw new Error("Escrow account is not ready yet");

      const accRes = await fetch(`${HORIZON}/accounts/${wallet.address}`);
      if (!accRes.ok) {
        throw new Error(
          "Your wallet has no testnet account yet — fund it with Friendbot first",
        );
      }
      const acc = (await accRes.json()) as {
        sequence: string;
        balances: { asset_code?: string; asset_issuer?: string; balance: string }[];
      };
      const usdc = acc.balances.find(
        (b) => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER,
      );
      if (!usdc) throw new Error("Add a USDC trustline in Freighter before donating");
      if (Number(usdc.balance) < value) throw new Error("Not enough testnet USDC");

      const built = new TransactionBuilder(new Account(wallet.address, acc.sequence), {
        fee: "10000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination: escrow.data.address,
            asset: new Asset(USDC_CODE, USDC_ISSUER),
            amount: value.toFixed(7),
          }),
        )
        .addMemo(Memo.text(memoForSlug(slug)))
        .setTimeout(180)
        .build();

      const signed = await signXdr(built.toXDR(), NETWORK_PASSPHRASE);
      const hash = await submitToHorizon(signed);
      await recordDonation({ data: { slug, txHash: hash } });
      return hash;
    },
    onMutate: () => setTx({ state: "pending", message: "Signing in Freighter…" }),
    onSuccess: (hash) => {
      setTx({ state: "success", message: "Donation locked in escrow", hash });
      if (wallet.address) refreshBalances(wallet.address);
      qc.invalidateQueries({ queryKey: ["fundraiser", slug] });
      qc.invalidateQueries({ queryKey: ["fundraisers"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["donations"] });
    },
    onError: (e) =>
      setTx({
        state: "error",
        message: e instanceof Error ? e.message : "Donation failed",
      }),
  });

  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
      <h2 className="text-xl">Donate USDC</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Your USDC is held by the MedFund escrow account until {verifierName} verifies
        the milestone on-chain.
      </p>

      {escrow.data?.address && (
        <a
          href={explorerAccount(escrow.data.address)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          Escrow {shortAddr(escrow.data.address, 6)} · {escrow.data.balance} USDC ↗
        </a>
      )}

      <label className="mt-5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Amount (USDC)
      </label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring"
      />
      <div className="mt-2 flex gap-2">
        {[10, 25, 50, 100].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className="rounded-md border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:bg-secondary"
          >
            ${v}
          </button>
        ))}
      </div>

      {!wallet.address ? (
        <button onClick={() => connectWallet()} className={`${buttonClass} mt-4 w-full`}>
          Connect Freighter to donate
        </button>
      ) : (
        <button
          onClick={() => {
            const value = Number(amount);
            if (!value || value <= 0) {
              setTx({ state: "error", message: "Enter an amount greater than zero" });
              return;
            }
            donate.mutate(value);
          }}
          disabled={disabled || donate.isPending || escrow.isLoading}
          className={`${buttonClass} mt-4 w-full`}
        >
          {disabled ? "Fundraiser complete" : "Donate to escrow"}
        </button>
      )}

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Testnet only. Get XLM from Friendbot, then add a USDC trustline to issuer{" "}
        {shortAddr(USDC_ISSUER, 4)} in Freighter.
      </p>

      <div className="mt-4">
        <TxFeedback tx={tx} />
      </div>
    </aside>
  );
}
