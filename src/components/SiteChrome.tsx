import { Link } from "@tanstack/react-router";
import { WalletBar } from "./WalletBar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg text-foreground">MedFund</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            escrowed care · PH
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/fundraisers"
            className="text-sm text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-sm text-foreground" }}
          >
            Browse
          </Link>
          <Link
            to="/create"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            activeProps={{ className: "hidden sm:inline text-sm text-foreground" }}
          >
            Start
          </Link>
          <Link
            to="/verifier"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            activeProps={{ className: "hidden sm:inline text-sm text-foreground" }}
          >
            Verifiers
          </Link>

          <WalletBar />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          MedFund · USDC escrow on Stellar · every release is recorded on-chain
          and viewable on stellar.expert. Demo data for illustration.
        </p>
      </div>
    </footer>
  );
}
