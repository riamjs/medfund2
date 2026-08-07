import { useState } from "react"
import { supabase } from "../integrations/supabase/client.ts"

interface AuthProps {
  onNavigate: (view: string, id?: string) => void
}

export default function Auth({ onNavigate }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      onNavigate("landing")
    } catch (err: any) {
      setError(err.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
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
          marginBottom: "20px",
          color: "var(--foreground)",
        }}
      >
        {mode === "login" ? "Log in" : "Sign up"}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(232,82,122,0.3)",
            fontSize: "14px",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(232,82,122,0.3)",
            fontSize: "14px",
          }}
        />

        {error && (
          <p style={{ color: "var(--primary)", fontSize: "13px" }}>{error}</p>
        )}

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
          }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p style={{ fontSize: "13px", marginTop: "16px", textAlign: "center" }}>
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  )
}