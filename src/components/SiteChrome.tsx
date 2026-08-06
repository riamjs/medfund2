import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { connectWallet, disconnectWallet, useWallet } from "@/lib/wallet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { label: "Browse", to: "/fundraisers" },
  { label: "Verifiers", to: "/verifier" },
  { label: "Start a Fundraiser", to: "/create" },
] as const;

export function SiteChrome({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const short = wallet.address
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          backgroundColor: "var(--background)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(232,82,122,0.12)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 32px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: 900,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
              }}
            >
              Med
            </span>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: 900,
                color: "var(--primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Fund
            </span>
          </Link>

          <nav
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
            className="nav-links"
          >
            {NAV.map(({ label, to }) => {
              const active = path === to || path.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "100px",
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    textDecoration: "none",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--foreground)" : "var(--muted-foreground)",
                    backgroundColor: active ? "rgba(232,82,122,0.1)" : "transparent",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
          >
            {wallet.address ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "rgba(232,82,122,0.12)",
                    border: "1.5px solid var(--primary)",
                    borderRadius: "100px",
                    padding: "7px 16px",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: "#4CAF7A",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono-face)",
                      fontSize: "12px",
                      color: "var(--foreground)",
                      fontWeight: 500,
                    }}
                  >
                    {short}
                  </span>
                  {wallet.usdc && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono-face)",
                        fontSize: "11px",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {wallet.usdc} USDC
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      backgroundColor: "#FDE5C8",
                      border: "1.5px solid var(--border)",
                      borderRadius: "16px",
                      padding: "6px",
                      minWidth: "190px",
                      boxShadow: "0 8px 32px rgba(232,82,122,0.15)",
                      zIndex: 100,
                    }}
                  >
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setMenuOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        padding: "9px 14px",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--foreground)",
                        borderRadius: "12px",
                      }}
                    >
                      Disconnect wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {user ? (
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="login-btn"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "7px 16px",
                      fontFamily: "var(--font-body)",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="login-btn"
                    style={{
                      padding: "7px 16px",
                      fontFamily: "var(--font-body)",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "var(--muted-foreground)",
                      textDecoration: "none",
                    }}
                  >
                    Login
                  </Link>
                )}
                <button
                  onClick={() => connectWallet()}
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--primary)",
                    border: "2px solid var(--primary)",
                    borderRadius: "100px",
                    padding: "7px 20px",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {wallet.connecting ? "Connecting…" : "Connect Wallet"}
                </button>
              </>
            )}
          </div>
        </div>
        {wallet.error && (
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#8B2020",
              padding: "6px 16px",
              backgroundColor: "#FFF0F0",
            }}
          >
            {wallet.error}
          </p>
        )}
        {wallet.address && wallet.network && wallet.network !== "TESTNET" && (
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#8A5C10",
              padding: "6px 16px",
              backgroundColor: "#FFF3DC",
            }}
          >
            Freighter is on {wallet.network} — switch to Testnet to donate.
          </p>
        )}
      </header>

      <div style={{ flex: 1 }}>{children}</div>

      <footer
        style={{
          borderTop: "1px solid rgba(232,82,122,0.18)",
          padding: "32px",
          backgroundColor: "rgba(232,82,122,0.06)",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              MedFund
            </span>
            <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
              Transparent medical fundraising for the Philippines, built on Stellar
              testnet.
            </span>
          </div>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono-face)",
                fontSize: "11px",
                color: "var(--muted-foreground)",
                textDecoration: "none",
              }}
            >
              Stellar Network
            </a>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono-face)",
                fontSize: "11px",
                color: "var(--muted-foreground)",
                textDecoration: "none",
              }}
            >
              stellar.expert
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 700px) {
          .nav-links { display: none !important; }
          .login-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
