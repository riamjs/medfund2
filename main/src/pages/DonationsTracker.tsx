import { useState, useEffect } from "react"
import { supabase } from "../integrations/supabase/client.ts"
import { useProfile } from "../hooks/useProfile.ts"
import { ArrowLeft, Heart, Wallet, Calendar, ExternalLink } from "lucide-react"

interface Donation {
  id: number
  fundraiser_id: number
  amount: number
  asset_code: string
  status: string
  created_at: string
  tx_hash: string | null
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
  const [stats, setStats] = useState({ total: 0, count: 0 })

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
        setDonations(data as Donation[])
        const total = (data as Donation[])
          .filter((d) => d.status === "completed")
          .reduce((sum, d) => sum + Number(d.amount), 0)
        setStats({ total, count: data.length })
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
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div
          style={{
            textAlign: "center",
            maxWidth: "400px",
            padding: "40px",
            backgroundColor: "#FDE5C8",
            borderRadius: "24px",
            border: "1.5px solid rgba(232,82,122,0.2)",
          }}
        >
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
              padding: "12px 24px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-heading)",
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
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
        Back to fundraisers
      </button>

      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "28px",
            fontWeight: 900,
            color: "var(--foreground)",
            marginBottom: "4px",
          }}
        >
          Your Impact
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
          Track every donation you've made and the lives you've touched.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "#FDE5C8",
            border: "1.5px solid rgba(232,82,122,0.2)",
            borderRadius: "20px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <Wallet size={24} style={{ margin: "0 auto 8px", color: "var(--primary)" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 900, color: "var(--foreground)" }}>
            {stats.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })} USDC
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>Total Donated</div>
        </div>

        <div
          style={{
            backgroundColor: "#FDE5C8",
            border: "1.5px solid rgba(232,82,122,0.2)",
            borderRadius: "20px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <Heart size={24} style={{ margin: "0 auto 8px", color: "var(--primary)" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 900, color: "var(--foreground)" }}>
            {stats.count}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>Donations Made</div>
        </div>
      </div>

      <div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "18px",
            fontWeight: 700,
            marginBottom: "16px",
            color: "var(--foreground)",
          }}
        >
          Donation History
        </h2>

        {donations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              backgroundColor: "rgba(232,82,122,0.04)",
              borderRadius: "20px",
              border: "1.5px dashed rgba(232,82,122,0.2)",
            }}
          >
            <Heart size={32} style={{ margin: "0 auto 12px", color: "var(--muted-foreground)" }} />
            <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
              No donations yet. Browse fundraisers and make your first contribution!
            </p>
            <button
              onClick={() => onNavigate("browse")}
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Browse Fundraisers
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {donations.map((donation) => (
              <div
                key={donation.id}
                style={{
                  backgroundColor: "#FDE5C8",
                  border: "1.5px solid rgba(232,82,122,0.15)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(232,82,122,0.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
                onClick={() => donation.fundraiser_id && onNavigate("detail", String(donation.fundraiser_id))}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--foreground)",
                      }}
                    >
                      {donation.fundraiser?.title || "Unknown Fundraiser"}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        backgroundColor:
                          donation.status === "completed"
                            ? "rgba(34,197,94,0.15)"
                            : donation.status === "pending"
                            ? "rgba(234,179,8,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          donation.status === "completed"
                            ? "#166534"
                            : donation.status === "pending"
                            ? "#854d0e"
                            : "#991b1b",
                      }}
                    >
                      {donation.status}
                    </span>
                  </div>

                  {donation.fundraiser?.beneficiary_name && (
                    <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
                      For {donation.fundraiser.beneficiary_name}
                      {donation.fundraiser.medical_condition && ` · ${donation.fundraiser.medical_condition}`}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--muted-foreground)" }}>
                    <Calendar size={12} />
                    {new Date(donation.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "18px",
                      fontWeight: 900,
                      color: "var(--primary)",
                    }}
                  >
                    {Number(donation.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} {donation.asset_code}
                  </div>

                  {donation.tx_hash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${donation.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        color: "var(--muted-foreground)",
                        textDecoration: "none",
                        marginTop: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Stellar <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}