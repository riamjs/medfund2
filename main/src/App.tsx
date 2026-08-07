import { useState, useEffect } from "react"
import WalletBar from "./components/WalletBar.tsx"
import Landing from "./pages/Landing.tsx"
import Browse from "./pages/Browse.tsx"
import Detail from "./pages/Detail.tsx"
import Create from "./pages/Create.tsx"
import Auth from "./pages/Auth.tsx"
import { isConnected, requestAccess, getNetwork } from "@stellar/freighter-api"
import { Horizon } from "@stellar/stellar-sdk"
import { supabase } from "./integrations/supabase/client.ts"

type View = "landing" | "browse" | "detail" | "create" | "auth"


const horizon = new Horizon.Server("https://horizon-testnet.stellar.org")

async function fetchXlmBalance(publicKey: string): Promise<string> {
  const account = await horizon.loadAccount(publicKey)
  const native = account.balances.find((b) => b.asset_type === "native")
  return native?.balance ?? "0"
}

export default function App() {
  const [view, setView] = useState<View>("landing")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [connectingWallet, setConnectingWallet] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleNavigate = (v: string, id?: string) => {
    setView(v as View)
    if (id) setDetailId(id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleConnect = async () => {
    setConnectingWallet(true)
    try {
      const { isConnected: installed } = await isConnected()
      if (!installed) {
        window.open("https://www.freighter.app/", "_blank")
        return
      }

      const { network } = await getNetwork()
      if (network !== "TESTNET") {
        alert("Please switch Freighter to Testnet to use MedFund.")
        return
      }

      const { address, error } = await requestAccess()
      if (error || !address) {
        console.error("Freighter connection failed:", error)
        return
      }

      setWalletAddress(address)
      const bal = await fetchXlmBalance(address)
      setBalance(bal)
    } catch (err) {
      console.error("Wallet connect error:", err)
    } finally {
      setConnectingWallet(false)
    }
  }

  const handleDisconnect = () => {
    setWalletAddress(null)
    setBalance(null)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Wallet connect overlay */}
      {connectingWallet && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(26,20,16,0.45)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#FDE5C8",
              border: "1.5px solid rgba(232,82,122,0.25)",
              borderRadius: "32px",
              padding: "48px",
              textAlign: "center",
              maxWidth: "320px",
              width: "90%",
              boxShadow: "0 24px 64px rgba(232,82,122,0.2)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "3px solid rgba(232,82,122,0.2)",
                borderTopColor: "var(--primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "18px",
                fontWeight: 900,
                marginBottom: "8px",
                color: "var(--foreground)",
              }}
            >
              Connecting wallet
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
              Approve the connection in your Stellar wallet…
            </p>
          </div>
        </div>
      )}

      <WalletBar
        walletAddress={walletAddress}
        balance={balance}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        currentView={view}
        onNavigate={handleNavigate}
      />

      <div style={{ flex: 1 }}>
        {view === "landing" && <Landing onNavigate={handleNavigate} />}
        {view === "browse" && <Browse onNavigate={handleNavigate} />}
        {view === "detail" && detailId && (
          <Detail
            fundraiserId={detailId}
            walletAddress={walletAddress}
            onNavigate={handleNavigate}
            onConnectWallet={handleConnect}
          />
        )}
        {view === "create" && (
          <Create
            walletAddress={walletAddress}
            onConnectWallet={handleConnect}
            onNavigate={handleNavigate}
          />
        )}
        {view === "auth" && <Auth onNavigate={handleNavigate} />}
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(232,82,122,0.18)",
          padding: "32px 32px",
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
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "10px",
              }}
            >
              +
            </span>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              MedFund
            </span>
            <span
              style={{
                fontSize: "13px",
                color: "var(--muted-foreground)",
                marginLeft: "8px",
              }}
            >
              Transparent medical fundraising for the Philippines, built on
              Stellar.
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--foreground)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted-foreground)")
              }
            >
              Stellar Network
            </a>
            <a
              href="https://stellar.expert"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono-face)",
                fontSize: "11px",
                color: "var(--muted-foreground)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--foreground)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted-foreground)")
              }
            >
              stellar.expert
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}