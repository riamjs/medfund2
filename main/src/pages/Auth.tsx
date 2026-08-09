import { useState, useEffect } from "react"
import { supabase } from "../integrations/supabase/client.ts"

interface AuthProps {
  onNavigate: (view: string, id?: string) => void
}

type AuthMode = "login" | "signup" | "magic"

const ORG_TYPES: { value: string; label: string }[] = [
  { value: "hospital", label: "Hospital" },
  { value: "ngo", label: "NGO" },
  { value: "clinic", label: "Clinic" },
  { value: "foundation", label: "Foundation" },
  { value: "other", label: "Other" },
]

export default function Auth({ onNavigate }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Verifier registration toggle + fields
  const [isVerifier, setIsVerifier] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] = useState("")
  const [stellarAddress, setStellarAddress] = useState("")
  const [verifierErrors, setVerifierErrors] = useState<{ orgName?: string; orgType?: string; stellarAddress?: string }>({})

  useEffect(() => {
    setError(null)
    setMessage(null)
  }, [mode])

  const handleSocialAuth = async (provider: "google") => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message ?? "Social login failed")
      setLoading(false)
    }
  }

  const validateVerifierFields = () => {
    const e: typeof verifierErrors = {}
    if (!orgName.trim()) e.orgName = "Required"
    if (!orgType) e.orgType = "Select an organization type"
    const addr = stellarAddress.trim()
    if (!addr) e.stellarAddress = "Required"
    else if (!/^G[A-Z0-9]{55}$/.test(addr)) e.stellarAddress = "Enter a valid Stellar address (starts with G, 56 chars)"
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === "signup") {
        if (isVerifier) {
          const vErrs = validateVerifierFields()
          if (Object.keys(vErrs).length > 0) {
            setVerifierErrors(vErrs)
            setLoading(false)
            return
          }
          setVerifierErrors({})
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
              ...(isVerifier
                ? {
                    is_verifier: true,
                    verifier_org_name: orgName.trim(),
                    verifier_org_type: orgType,
                    verifier_stellar_address: stellarAddress.trim(),
                  }
                : {}),
            },
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        setMessage(
          isVerifier
            ? "Check your email to confirm your account. Once confirmed, you can log in and will appear as an approved verifier."
            : "Check your email to confirm your account."
        )
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setMessage("Magic link sent! Check your inbox.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onNavigate("landing")
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setEmail("")
    setPassword("")
    setFullName("")
    setIsVerifier(false)
    setOrgName("")
    setOrgType("")
    setStellarAddress("")
    setVerifierErrors({})
  }

  const textInputStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(232,82,122,0.3)",
    fontSize: "14px",
    backgroundColor: "#fff",
    fontFamily: "var(--font-body)",
    color: "var(--foreground)",
  }

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "60px auto",
        padding: "32px",
        backgroundColor: "#FDE5C8",
        border: "1.5px solid rgba(232,82,122,0.25)",
        borderRadius: "24px",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "22px",
          fontWeight: 900,
          marginBottom: "6px",
          color: "var(--foreground)",
        }}
      >
        {mode === "login" && "Welcome back"}
        {mode === "signup" && "Create your account"}
        {mode === "magic" && "Magic Link Sign In"}
      </h1>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {mode === "login" && "Sign in to track your donations."}
        {mode === "signup" && "Join MedFund to donate or fundraise."}
        {mode === "magic" && "We'll email you a secure sign-in link."}
      </p>

      {/* Social Auth — hidden during verifier signup, email/password only */}
      {!(mode === "signup" && isVerifier) && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => handleSocialAuth("google")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px",
                borderRadius: "12px",
                border: "1.5px solid rgba(232,82,122,0.25)",
                backgroundColor: "#fff",
                color: "var(--foreground)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(232,82,122,0.2)" }} />
            <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "var(--font-mono-face)" }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(232,82,122,0.2)" }} />
          </div>
        </>
      )}

      {/* Verifier toggle — signup mode only */}
      {mode === "signup" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "12px",
            backgroundColor: isVerifier ? "rgba(232,82,122,0.1)" : "rgba(255,255,255,0.5)",
            border: `1.5px solid ${isVerifier ? "var(--primary)" : "rgba(232,82,122,0.25)"}`,
            marginBottom: "16px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={isVerifier}
            onChange={(e) => setIsVerifier(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
          />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Register as a verifier
            </p>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
              For hospitals, NGOs, clinics, and foundations
            </p>
          </div>
        </label>
      )}

      {/* Email Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={textInputStyle}
          />
        )}

        {mode === "signup" && isVerifier && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "14px",
              borderRadius: "14px",
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px dashed rgba(232,82,122,0.35)",
            }}
          >
            <div>
              <input
                type="text"
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                style={{ ...textInputStyle, width: "100%", boxSizing: "border-box" }}
              />
              {verifierErrors.orgName && (
                <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0" }}>{verifierErrors.orgName}</p>
              )}
            </div>

            <div>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                style={{ ...textInputStyle, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Organization type…</option>
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {verifierErrors.orgType && (
                <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0" }}>{verifierErrors.orgType}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Stellar wallet address (G...)"
                value={stellarAddress}
                onChange={(e) => setStellarAddress(e.target.value)}
                style={{ ...textInputStyle, width: "100%", boxSizing: "border-box", fontFamily: "var(--font-mono-face)" }}
              />
              {verifierErrors.stellarAddress && (
                <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0" }}>{verifierErrors.stellarAddress}</p>
              )}
              <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: "4px 0 0" }}>
                Funds are released to this address when milestones are approved.
              </p>
            </div>
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={textInputStyle}
        />

        {mode !== "magic" && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={textInputStyle}
          />
        )}

        {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>{error}</p>}
        {message && <p style={{ color: "#166534", fontSize: "13px", margin: 0 }}>{message}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "var(--primary)",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "var(--font-heading)",
            fontSize: "14px",
          }}
        >
          {loading
            ? "Please wait…"
            : mode === "login"
            ? "Log in"
            : mode === "signup"
            ? isVerifier
              ? "Register as verifier"
              : "Sign up"
            : "Send Magic Link"}
        </button>
      </form>

      {/* Mode Switchers */}
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        {mode === "login" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
              Don't have an account?{" "}
              <button
                onClick={() => switchMode("signup")}
                style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {mode === "signup" && (
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
            Already have an account?{" "}
            <button
              onClick={() => switchMode("login")}
              style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Log in
            </button>
          </p>
        )}

        {mode === "magic" && (
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
            Remember your password?{" "}
            <button
              onClick={() => switchMode("login")}
              style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Log in with password
            </button>
          </p>
        )}
      </div>
    </div>
  )
}