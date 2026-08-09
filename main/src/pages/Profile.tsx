import { useState, useEffect } from "react"
import { useProfile } from "../hooks/useProfile.ts"
import { supabase } from "../integrations/supabase/client.ts"
import { 
  ArrowLeft, Camera, Wallet, Mail, Shield, 
  Heart, FileText, Share2, Edit3, Check, X,
  Upload
} from "lucide-react"

interface Activity {
  id: string
  activity_type: string
  title: string
  description: string | null
  metadata: any
  created_at: string
}

interface ProfileProps {
  onNavigate: (v: string, id?: string) => void
}

export default function Profile({ onNavigate }: ProfileProps) {
  const { profile, loading, updateProfile, uploadAvatar } = useProfile()
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editOrg, setEditOrg] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || "")
      setEditOrg(profile.org_name || "")
      fetchActivities()
    }
  }, [profile])

  const fetchActivities = async () => {
    if (!profile) return
    setActivityLoading(true)
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (!error && data) setActivities(data as Activity[])
    setActivityLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({ full_name: editName, org_name: editOrg })
    setSaving(false)
    setIsEditing(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await uploadAvatar(file)
    setUploading(false)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'donation_made': return <Heart size={16} />
      case 'fundraiser_created': return <FileText size={16} />
      case 'fundraiser_shared': return <Share2 size={16} />
      case 'wallet_connected': return <Wallet size={16} />
      default: return <Shield size={16} />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'donation_made': return '#E8527A'
      case 'fundraiser_created': return '#22c55e'
      case 'fundraiser_shared': return '#3b82f6'
      case 'wallet_connected': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "3px solid rgba(232,82,122,0.2)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{
          textAlign: "center", maxWidth: "400px", padding: "40px",
          backgroundColor: "#FDE5C8", borderRadius: "24px",
          border: "1.5px solid rgba(232,82,122,0.2)",
        }}>
          <Shield size={48} style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 900 }}>
            Please sign in to view your profile
          </h2>
          <button
            onClick={() => onNavigate("auth")}
            style={{
              marginTop: "20px", padding: "12px 24px", borderRadius: "14px",
              border: "none", backgroundColor: "var(--primary)", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px" }}>
      {/* Back button */}
      <button
        onClick={() => onNavigate("browse")}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "none", border: "none",
          color: "var(--muted-foreground)", fontSize: "13px",
          cursor: "pointer", marginBottom: "24px",
        }}
      >
        <ArrowLeft size={16} /> Back to fundraisers
      </button>

      {/* Profile Header Card */}
      <div style={{
        backgroundColor: "#FDE5C8",
        border: "1.5px solid rgba(232,82,122,0.2)",
        borderRadius: "24px", padding: "32px",
        textAlign: "center", marginBottom: "24px",
      }}>
        {/* Avatar with upload */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              style={{
                width: "96px", height: "96px", borderRadius: "50%",
                objectFit: "cover", border: "3px solid var(--primary)",
              }}
            />
          ) : (
            <div style={{
              width: "96px", height: "96px", borderRadius: "50%",
              backgroundColor: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", color: "#fff", fontWeight: 700,
              border: "3px solid var(--primary)",
            }}>
              {(profile.full_name || profile.email || "?")[0].toUpperCase()}
            </div>
          )}

          <label style={{
            position: "absolute", bottom: "0", right: "0",
            width: "32px", height: "32px", borderRadius: "50%",
            backgroundColor: "var(--primary)", border: "3px solid #FDE5C8",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "transform 0.2s",
          }}>
            {uploading ? (
              <div style={{
                width: "14px", height: "14px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              <Camera size={14} color="#fff" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Name */}
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "300px", margin: "0 auto 12px" }}>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Full Name"
              style={{
                padding: "10px 14px", borderRadius: "12px",
                border: "1.5px solid rgba(232,82,122,0.3)",
                fontSize: "15px", fontFamily: "var(--font-body)",
                textAlign: "center", backgroundColor: "#fff",
              }}
            />
            <input
              value={editOrg}
              onChange={(e) => setEditOrg(e.target.value)}
              placeholder="Organization (optional)"
              style={{
                padding: "10px 14px", borderRadius: "12px",
                border: "1.5px solid rgba(232,82,122,0.3)",
                fontSize: "14px", fontFamily: "var(--font-body)",
                textAlign: "center", backgroundColor: "#fff",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "8px 16px", borderRadius: "10px",
                  border: "none", backgroundColor: "var(--primary)",
                  color: "#fff", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <Check size={14} /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditName(profile.full_name || "") }}
                style={{
                  padding: "8px 16px", borderRadius: "10px",
                  border: "1.5px solid rgba(232,82,122,0.3)",
                  backgroundColor: "transparent", color: "var(--foreground)",
                  fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: "var(--font-heading)", fontSize: "22px",
              fontWeight: 900, color: "var(--foreground)", marginBottom: "4px",
            }}>
              {profile.full_name || "MedFund User"}
            </h1>
            {profile.org_name && (
              <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
                {profile.org_name}
              </p>
            )}
          </>
        )}

        {/* Meta info */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "16px", flexWrap: "wrap", marginTop: "12px",
        }}>
          <span style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontSize: "12px", color: "var(--muted-foreground)",
          }}>
            <Mail size={12} /> {profile.email}
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontSize: "12px", color: "var(--muted-foreground)",
          }}>
            <Shield size={12} /> {profile.auth_provider || "email"}
          </span>
          {profile.wallet_address && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "12px", color: "var(--muted-foreground)",
              fontFamily: "var(--font-mono-face)",
            }}>
              <Wallet size={12} /> {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
            </span>
          )}
        </div>

        {/* Role badge */}
        <span style={{
          display: "inline-block", marginTop: "12px",
          padding: "4px 12px", borderRadius: "20px",
          fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
          backgroundColor: profile.role === 'admin' ? 'rgba(239,68,68,0.15)' : 
                          profile.role === 'verifier' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
          color: profile.role === 'admin' ? '#991b1b' : 
                 profile.role === 'verifier' ? '#1e40af' : '#166534',
        }}>
          {profile.role}
        </span>

        {/* Edit button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              margin: "16px auto 0", padding: "8px 16px",
              borderRadius: "10px", border: "1.5px solid rgba(232,82,122,0.3)",
              backgroundColor: "transparent", color: "var(--primary)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontFamily: "var(--font-heading)", fontSize: "18px",
          fontWeight: 700, marginBottom: "16px", color: "var(--foreground)",
        }}>
          Recent Activity
        </h2>

        {activityLoading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div style={{
              width: "24px", height: "24px", margin: "0 auto",
              border: "2px solid rgba(232,82,122,0.2)",
              borderTopColor: "var(--primary)", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : activities.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "32px 24px",
            backgroundColor: "rgba(232,82,122,0.04)",
            borderRadius: "16px", border: "1.5px dashed rgba(232,82,122,0.2)",
          }}>
            <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
              No activity yet. Start by donating or creating a fundraiser!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activities.map((activity) => (
              <div key={activity.id} style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "16px", borderRadius: "14px",
                backgroundColor: "#FDE5C8",
                border: "1.5px solid rgba(232,82,122,0.1)",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  backgroundColor: getActivityColor(activity.activity_type) + "20",
                  color: getActivityColor(activity.activity_type),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: "14px", fontWeight: 600,
                    color: "var(--foreground)", marginBottom: "2px",
                  }}>
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                      {activity.description}
                    </p>
                  )}
                  <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px" }}>
                    {new Date(activity.created_at).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}