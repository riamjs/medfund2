import { useState } from "react";
import { connectWallet, disconnectWallet, shortAddr, useStore } from "@/lib/medfund";

export function WalletBar() {
  const { wallet } = useStore();
  const [busy, setBusy] = useState(false);

  if (!wallet) {
    return (
      <button
        onClick={async () => {
          setBusy(true);
          await connectWallet();
          setBusy(false);
        }}
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 font-mono text-xs tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="font-mono text-xs text-foreground">
        {shortAddr(wallet.address)}
      </span>
      <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
        {wallet.balance.toFixed(2)} XLM
      </span>
      <button
        onClick={disconnectWallet}
        className="font-mono text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        exit
      </button>
    </div>
  );
}
