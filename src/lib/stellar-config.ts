/* Stellar testnet constants shared by client and server. */

export const HORIZON = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

/** Circle's USDC issuer on the Stellar test network. */
export const USDC_CODE = "USDC";
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const isStellarAddress = (v: string | null | undefined) =>
  !!v && /^G[A-Z2-7]{55}$/.test(v);

/** Stellar text memos are capped at 28 bytes. */
export const memoForSlug = (slug: string) => slug.slice(0, 28);
