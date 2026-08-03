import { useEffect } from "react";
import { shortAddr } from "@/lib/medfund";
import {
  connectWallet,
  disconnectWallet,
  refreshBalances,
  useWallet,
} from "@/lib/wallet";

export function WalletBar() {
  const wallet = useWallet();

  useEffect(() => {
    if (!wallet.address) return;
    const id = setInterval(() => refreshBalances(wallet.address!), 20000);
    return () => clearInterval(id);
  }, [wallet.address]);

  if (!wallet.address)
    return (
      <div className="flex items-center gap-2">
        {wallet.error && (
          <span className="hidden max-w-[220px] truncate font-mono text-[10px] text-destructive sm:inline">
            {wallet.error}
          </span>
        )}
        <button
          onClick={() => connectWallet()}
          disabled={wallet.connecting}
          className="rounded-md bg-primary px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {wallet.connecting ? "Connecting…" : "Connect wallet"}
        </button>
      </div>
    );

  const wrongNetwork =
    wallet.network && !wallet.network.toUpperCase().includes("TEST");

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork && (
        <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 font-mono text-[10px] uppercase text-destructive">
          Switch Freighter to Testnet
        </span>
      )}
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[11px] text-foreground">
          {shortAddr(wallet.address)}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {wallet.usdc ? `${wallet.usdc} USDC` : "no USDC trustline"}
        </p>
      </div>
      <button
        onClick={disconnectWallet}
        className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary"
      >
        Disconnect
      </button>
    </div>
  );
}
