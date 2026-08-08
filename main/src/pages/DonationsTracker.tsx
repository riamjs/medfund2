import { useState, useEffect } from "react"
import { supabase } from "../integrations/supabase/client.ts"
import { useProfile } from "../hooks/useProfile.ts"
import { ArrowLeft, Heart, FileText, Users, ChevronRight } from "lucide-react"

interface Donation {
  id: string
  fundraiser_id: string
  amount: number
  asset_code: string
  status: string
  created_at: string
  transaction_hash: string | null
  fundraiser: {
    title: string
    medical_condition: string | null
    beneficiary_name: string | null
  } | null
}

interface DonationsTrackerProps {
  onNavigate: (v: string, id?: string) => void
}

export default function DonationsTracker({ onNavigate }: DonationsTrackerProps) {
  const { profile, loading: profileLoading } = useProfile()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    fundraisersSupported: 0,
  })

  useEffect(() => {
    if (!profile) return

    const fetchDonations = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          fundraiser:fundraiser_id (
            title,
            medical_condition,
            beneficiary_name
          )
        `)
        .eq("donor_id", profile.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching donations:", error)
      } else {
        const donationList = data as Donation[]
        setDonations(donationList)

        const completed = donationList.filter((d) => d.status === "completed")
        const total = completed.reduce((sum, d) => sum + Number(d.amount), 0)
        const uniqueFundraisers = new Set(completed.map((d) => d.fundraiser_id)).size

        setStats({
          total,
          count: completed.length,
          fundraisersSupported: uniqueFundraisers,
        })
      }

      setLoading(false)
    }

    fetchDonations()

    const channel = supabase
      .channel("donations_tracker")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
          filter: `donor_id=eq.${profile.id}`,
        },
        (payload) => {
          setDonations((prev) => [payload.new as Donation, ...prev])
          if (payload.new.status === "completed") {
            setStats((prev) => ({
              total: prev.total + Number(payload.new.amount),
              count: prev.count + 1,
              fundraisersSupported: prev.fundraisersSupported,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  if (profileLoading || loading) {
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
          <Heart size={48} style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 900, marginBottom: "8px" }}>
            Sign in to track donations
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "24px" }}>
            Connect your account to see all your contributions and their impact.
          </p>
          <button
            onClick={() => onNavigate("auth")}
            style={{
              padding: "12px 24px", borderRadius: "14px",
              border: "none", backgroundColor: "var(--primary)",
              color: "#fff", fontSize: "15px", fontWeight: 700,
              cursor: "pointer", fontFamily: "var(--font-heading)",
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
      {/* Back button */}
      <button
        onClick={() => onNavigate("browse")}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "none", border: "none",
          color: "var(--muted-foreground)", fontSize: "13px",
          cursor: "pointer", marginBottom: "32px",
        }}
      >
        <ArrowLeft size={16} /> Back to fundraisers
      </button>

      {/* Avatar */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{
              width: "64px", height: "64px", borderRadius: "50%",
              objectFit: "cover", margin: "0 auto",
              border: "2px solid rgba(232,82,122,0.2)",
            }}
          />
        ) : (
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            backgroundColor: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto", fontSize: "24px", color: "#fff", fontWeight: 700,
          }}>
            {(profile.full_name || "?")[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Total Impact */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{
          fontFamily: "var(--font-heading)", fontSize: "48px",
          fontWeight: 900, color: "var(--foreground)", lineHeight: 1,
        }}>
          ${stats.total.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
        </div>
        <p style={{
          fontSize: "14px", color: "var(--muted-foreground)",
          marginTop: "8px",
        }}>
          Your total impact from donating, organizing and sharing
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "12px", marginTop: "24px", marginBottom: "24px",
      }}>
        <div style={{
          backgroundColor: "#fff",
          border: "1.5px solid rgba(232,82,122,0.15)",
          borderRadius: "16px", padding: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <FileText size={18} color="var(--primary)" />
            <span style={{
              fontFamily: "var(--font-heading)", fontSize: "20px",
              fontWeight: 900, color: "var(--foreground)",
            }}>
              {stats.fundraisersSupported}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
            Fundraisers supported
          </p>
        </div>

        <div style={{
          backgroundColor: "#fff",
          border: "1.5px solid rgba(232,82,122,0.15)",
          borderRadius: "16px", padding: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Users size={18} color="var(--primary)" />
            <span style={{
              fontFamily: "var(--font-heading)", fontSize: "20px",
              fontWeight: 900, color: "var(--foreground)",
            }}>
              {stats.count}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
            Donations made
          </p>
        </div>
      </div>

      {/* CTA Card */}
      {stats.count === 0 && (
        <div style={{
          backgroundColor: "#1a2e1a",
          borderRadius: "16px", padding: "24px",
          color: "#fff", marginBottom: "24px",
        }}>
          <h3 style={{
            fontFamily: "var(--font-heading)", fontSize: "16px",
            fontWeight: 700, marginBottom: "8px", color: "#fff",
          }}>
            Start seeing your impact
          </h3>
          <p style={{
            fontSize: "13px", color: "rgba(255,255,255,0.7)",
            marginBottom: "16px", lineHeight: 1.5,
          }}>
            When you donate to and share fundraisers, you can view the total impact above.
          </p>
          <button
            onClick={() => onNavigate("browse")}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "none", border: "none",
              color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", padding: 0,
            }}
          >
            Find a fundraiser <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Donation History */}
      {donations.length > 0 && (
        <div>
          <h2 style={{
            fontFamily: "var(--font-heading)", fontSize: "16px",
            fontWeight: 700, marginBottom: "12px", color: "var(--foreground)",
          }}>
            Recent Donations
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {donations.map((donation) => (
              <div
                key={donation.id}
                onClick={() => donation.fundraiser_id && onNavigate("detail", donation.fundraiser_id)}
                style={{
                  backgroundColor: "#fff",
                  border: "1.5px solid rgba(232,82,122,0.1)",
                  borderRadius: "12px", padding: "16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(232,82,122,0.3)"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(232,82,122,0.1)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <div>
                  <p style={{
                    fontSize: "14px", fontWeight: 600,
                    color: "var(--foreground)", marginBottom: "2px",
                  }}>
                    {donation.fundraiser?.title || "Unknown Fundraiser"}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                    {new Date(donation.created_at).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{
                    fontFamily: "var(--font-heading)", fontSize: "16px",
                    fontWeight: 700, color: "var(--primary)",
                  }}>
                    ${Number(donation.amount).toLocaleString("en-PH")}
                  </p>
                  <span style={{
                    fontSize: "10px", padding: "2px 8px", borderRadius: "10px",
                    fontWeight: 600, textTransform: "uppercase",
                    backgroundColor: donation.status === "completed" ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                    color: donation.status === "completed" ? "#166534" : "#854d0e",
                  }}>
                    {donation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}