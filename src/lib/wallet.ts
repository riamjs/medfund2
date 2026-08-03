import { useSyncExternalStore } from "react";
import { HORIZON, USDC_CODE, USDC_ISSUER } from "./stellar-config";

export type WalletState = {
  address: string | null;
  network: string | null;
  xlm: string | null;
  usdc: string | null;
  hasTrustline: boolean;
  connecting: boolean;
  error: string | null;
};

let state: WalletState = {
  address: null,
  network: null,
  xlm: null,
  usdc: null,
  hasTrustline: false,
  connecting: false,
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (next: Partial<WalletState>) => {
  state = { ...state, ...next };
  emit();
};

export function useWallet() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export const getWallet = () => state;

type HorizonBalance = {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
};

export async function refreshBalances(address: string) {
  try {
    const res = await fetch(`${HORIZON}/accounts/${address}`);
    if (!res.ok) {
      set({ xlm: "0", usdc: null, hasTrustline: false });
      return;
    }
    const account = (await res.json()) as { balances: HorizonBalance[] };
    const native = account.balances.find((b) => b.asset_type === "native");
    const usdc = account.balances.find(
      (b) => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER,
    );
    set({
      xlm: native ? Number(native.balance).toFixed(2) : "0",
      usdc: usdc ? Number(usdc.balance).toFixed(2) : null,
      hasTrustline: !!usdc,
    });
  } catch {
    /* balances are best-effort */
  }
}

export async function connectWallet() {
  set({ connecting: true, error: null });
  try {
    const freighter = await import("@stellar/freighter-api");
    const connected = await freighter.isConnected();
    if ("error" in connected && connected.error) throw new Error(connected.error);
    if (!connected.isConnected) {
      throw new Error("Freighter is not installed in this browser");
    }
    const access = await freighter.requestAccess();
    if (access.error) throw new Error(access.error);

    const net = await freighter.getNetwork();
    if (net.error) throw new Error(net.error);

    set({ address: access.address, network: net.network, connecting: false });
    await refreshBalances(access.address);
  } catch (e) {
    set({
      connecting: false,
      error: e instanceof Error ? e.message : "Could not connect Freighter",
    });
  }
}

export function disconnectWallet() {
  set({
    address: null,
    network: null,
    xlm: null,
    usdc: null,
    hasTrustline: false,
    error: null,
  });
}

export async function signXdr(xdr: string, networkPassphrase: string) {
  const freighter = await import("@stellar/freighter-api");
  const result = await freighter.signTransaction(xdr, { networkPassphrase });
  if (result.error) throw new Error(String(result.error));
  return result.signedTxXdr;
}
