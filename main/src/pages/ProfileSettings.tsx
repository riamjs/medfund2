import { useState } from "react"
import { useProfile } from "../hooks/useProfile.ts"
import { ArrowLeft, User, Building2, Save, Camera } from "lucide-react"

interface ProfileSettingsProps {
  onNavigate: (v: string, id?: string) => void
}

export default function ProfileSettings({ onNavigate }: ProfileSettingsProps) {
  const { profile, loading, updateProfile } = useProfile()
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [orgName, setOrgName] = useState(profile?.org_name || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await updateProfile({
      full_name: fullName,
      org_name: orgName,
    })

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile" })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(232,82,122,0.2)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}>
      <button
        onClick={() => onNavigate("browse")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          color: "var(--muted-foreground)",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "28px",
          fontWeight: 900,
          marginBottom: "24px",
          color: "var(--foreground)",
        }}
      >
        Profile Settings
      </h1>

      <div
        style={{
          backgroundColor: "#FDE5C8",
          border: "1.5px solid rgba(232,82,122,0.2)",
          borderRadius: "24px",
          padding: "32px",
        }}
      >
        {/* Avatar placeholder */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              fontSize: "32px",
              color: "#fff",
              position: "relative",
            }}
          >
            <User size={32} />
            <button
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "var(--primary)",
                border: "2px solid #FDE5C8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Camera size={12} color="#fff" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "6px",
                fontFamily: "var(--font-heading)",
              }}
            >
              <User size={12} style={{ display: "inline", marginRight: "4px" }} />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1.5px solid rgba(232,82,122,0.2)",
                backgroundColor: "#fff",
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "6px",
                fontFamily: "var(--font-heading)",
              }}
            >
              <Building2 size={12} style={{ display: "inline", marginRight: "4px" }} />
              Organization Name (optional)
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Philippine Red Cross"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1.5px solid rgba(232,82,122,0.2)",
                backgroundColor: "#fff",
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: "6px",
                fontFamily: "var(--font-heading)",
              }}
            >
              Role
            </label>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1.5px solid rgba(232,82,122,0.1)",
                backgroundColor: "rgba(232,82,122,0.04)",
                fontSize: "14px",
                color: "var(--muted-foreground)",
                textTransform: "capitalize",
              }}
            >
              {profile.role}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {saving ? (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>

          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1.5px solid ${message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                fontSize: "13px",
                color: message.type === "success" ? "#166534" : "#991b1b",
                textAlign: "center",
              }}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}