import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { WalletBar } from "./WalletBar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/fundraisers", label: "Fundraisers" },
  { to: "/verifier", label: "Verifiers" },
  { to: "/create", label: "Start" },
] as const;


export function SiteChrome({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <Link to="/" className="text-lg tracking-tight">
            Med<span className="text-primary">Fund</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="hidden rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary sm:block"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="hidden rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary sm:block"
              >
                Sign in
              </Link>
            )}
            <WalletBar />
          </div>
        </div>
        <div className="border-t border-border/60 bg-secondary/40 md:hidden">
          <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-5 py-2">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>MedFund — escrowed medical giving for the Philippines.</p>
          <p className="font-mono text-[11px]">
            Running on the Stellar test network. No real funds move.
          </p>
        </div>
      </footer>
    </div>
  );
}
