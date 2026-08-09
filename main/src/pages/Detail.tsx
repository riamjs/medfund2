import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { signTransaction } from "@stellar/freighter-api";
import {
  buildUsdcPaymentTx,
  submitSignedTx,
  ESCROW_PUBLIC_KEY,
  stellarExpertTxUrl,
  hasUsdcTrustline,
} from "../lib/stellar";
import { ensureUsdcTrustline } from "../lib/trustline";
import { releaseMilestone } from "../lib/milestone-release";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";

interface DetailProps {
  fundraiserId: string;
  walletAddress: string | null;
  onNavigate: (v: string, id?: string) => void;
  onConnectWallet: () => void;
}

export default function Detail({
  fundraiserId,
  walletAddress,
  onConnectWallet,
}: DetailProps) {
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [donating, setDonating] = useState(false);
  const [donateError, setDonateError] = useState<string | null>(null);
  const [lastDonationTx, setLastDonationTx] = useState<string | null>(null);
  const [verifierActionLoading, setVerifierActionLoading] = useState(false);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const id = Number(fundraiserId);

  const fetchAll = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const [{ data: f, error: fErr }, { data: m, error: mErr }, { data: { session } }] =
        await Promise.all([
          supabase.from("fundraisers").select("*").eq("id", id).single(),
          supabase.from("milestones").select("*").eq("fundraiser_id", id).order("id"),
          supabase.auth.getSession(),
        ]);

      if (fErr) {
        console.error("Fundraiser fetch error:", fErr);
        setFetchError(fErr.message);
        setLoading(false);
        return;
      }

      setFundraiser(f);
      setMilestones(m ?? []);

      if (session?.user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(p);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fundraiserId]);

  const isAssignedVerifier =
    profile &&
    fundraiser &&
    profile.id === fundraiser.verifier_id &&
    profile.is_verifier;

  const handleVerifierDecision = async (decision: "approved" | "rejected") => {
    setVerifierActionLoading(true);
    const { error } = await supabase
      .from("fundraisers")
      .update({ verification_status: decision })
      .eq("id", id);

    if (error) {
      console.error("Verifier decision error:", error);
      alert("Failed to update: " + error.message);
    } else {
      await fetchAll();
    }
    setVerifierActionLoading(false);
  };

  const handleDonate = async () => {
    if (!walletAddress) {
      onConnectWallet();
      return;
    }

    const amount = Number(donationAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setDonateError("Enter a valid amount.");
      return;
    }

    setDonating(true);
    setDonateError(null);
    setLastDonationTx(null);

    try {
      // Check trustline first
      const trust = await ensureUsdcTrustline(walletAddress);
if (trust.status === "error") throw new Error(trust.message);
if (trust.status === "user_declined") throw new Error("Trustline setup was declined.");
if (trust.status === "trustline_added") {
  // optional: show a toast that trustline was just created
  console.log("Trustline added:", trust.txHash);
}

      const tx = await buildUsdcPaymentTx(
        walletAddress,
        ESCROW_PUBLIC_KEY,
        String(amount),
        `MedFund #${id}`
      );

      const { signedTxXdr, error: signError } = await signTransaction(
        tx.toXDR(),
        {
          networkPassphrase: "Test SDF Network ; September 2015",
        }
      );

      if (signError || !signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      const result = await submitSignedTx(signedTxXdr);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error: donationError } = await supabase.from("donations").insert({
        fundraiser_id: id,
        donor_wallet: walletAddress,
        amount,
        tx_hash: result.hash,
        donor_id: session?.user?.id ?? null,
        donor_name: profile?.full_name ?? null,
        donor_email: profile?.email ?? null,
        status: "completed",
      });

      if (donationError) {
        console.error("Donation record error:", donationError);
        // Don't throw — the on-chain tx succeeded, we just failed to log it
      }

      const { error: rpcError } = await supabase.rpc(
        "increment_fundraiser_amount",
        {
          fundraiser_id_param: id,
          amount_param: amount,
        }
      );

      if (rpcError) {
        console.error("Increment error:", rpcError);
      }

      setLastDonationTx(result.hash);
      setDonationAmount("");
      await fetchAll();
    } catch (err: any) {
      console.error("Donation error:", err);
      setDonateError(err.message ?? "Donation failed.");
    } finally {
      setDonating(false);
    }
  };

  const handleReleaseMilestone = async (milestone: any) => {
    if (!fundraiser?.verifier_address) {
      alert("This fundraiser has no verifier Stellar address on file.");
      return;
    }

    const amount = milestone.target_amount ?? fundraiser.current_amount ?? 0;
    if (amount <= 0) {
      alert("Invalid release amount.");
      return;
    }

    setReleasingId(milestone.id);

    try {
      await releaseMilestone(
        milestone.id,
        fundraiser.verifier_address,
        amount
      );
      await fetchAll();
    } catch (err: any) {
      console.error("Release error:", err);
      alert(err.message ?? "Release failed.");
    } finally {
      setReleasingId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={28}
          style={{ color: "var(--primary)", animation: "spin 0.8s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <AlertCircle size={32} style={{ color: "#dc2626", marginBottom: "12px" }} />
        <p style={{ color: "#dc2626" }}>Error loading fundraiser: {fetchError}</p>
      </div>
    );
  }

  if (!fundraiser) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        Fundraiser not found.
      </div>
    );
  }

  const progress = fundraiser.target_amount
    ? Math.min(100, (fundraiser.current_amount / fundraiser.target_amount) * 100)
    : 0;

  return (
    <div
      style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px 60px" }}
    >
      {fundraiser.image_url && (
        <img
          src={fundraiser.image_url}
          alt={fundraiser.title}
          style={{
            width: "100%",
            height: "280px",
            objectFit: "cover",
            borderRadius: "24px",
            marginBottom: "20px",
          }}
        />
      )}

      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "26px",
          fontWeight: 900,
          marginBottom: "6px",
        }}
      >
        {fundraiser.title}
      </h1>

      {fundraiser.beneficiary_name && (
        <p
          style={{
            fontSize: "14px",
            color: "var(--muted-foreground)",
            marginBottom: "16px",
          }}
        >
          For {fundraiser.beneficiary_name}{" "}
          {fundraiser.hospital_name && `· ${fundraiser.hospital_name}`}
        </p>
      )}

      <div
        style={{
          backgroundColor: "#FDE5C8",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            marginBottom: "8px",
          }}
        >
          <strong>{fundraiser.current_amount ?? 0} USDC raised</strong>
          <span style={{ color: "var(--muted-foreground)" }}>
            of {fundraiser.target_amount} USDC
          </span>
        </div>
        <div
          style={{
            height: "8px",
            borderRadius: "10px",
            backgroundColor: "rgba(232,82,122,0.15)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: "10px",
              backgroundColor: "var(--primary)",
            }}
          />
        </div>
      </div>

      <p style={{ fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
        {fundraiser.description}
      </p>

      {/* Verifier review banner */}
      {fundraiser.verification_status !== "approved" && isAssignedVerifier && (
        <div
          style={{
            backgroundColor: "rgba(234,179,8,0.1)",
            border: "1.5px solid rgba(234,179,8,0.3)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Verifier Action Required
          </h3>
          {(fundraiser.medical_documents ?? []).map(
            (doc: any, i: number) => (
              <a
                key={i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                <FileText size={14} /> {doc.name}{" "}
                <ExternalLink size={11} />
              </a>
            )
          )}
          <div
            style={{ display: "flex", gap: "10px", marginTop: "12px" }}
          >
            <button
              onClick={() => handleVerifierDecision("rejected")}
              disabled={verifierActionLoading}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "100px",
                border: "1.5px solid #dc2626",
                background: "none",
                color: "#dc2626",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reject
            </button>
            <button
              onClick={() => handleVerifierDecision("approved")}
              disabled={verifierActionLoading}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "100px",
                border: "none",
                backgroundColor: "#22c55e",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Approve Fundraiser
            </button>
          </div>
        </div>
      )}

      {fundraiser.verification_status === "pending" && !isAssignedVerifier && (
        <div
          style={{
            fontSize: "13px",
            color: "var(--muted-foreground)",
            marginBottom: "24px",
          }}
        >
          This fundraiser is awaiting verifier approval before it can accept
          donations.
        </div>
      )}

      {/* Donation section */}
      {fundraiser.verification_status === "approved" && (
        <div
          style={{
            backgroundColor: "#FDE5C8",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Donate
          </h3>
          {!walletAddress ? (
            <button
              onClick={onConnectWallet}
              style={{
                padding: "12px 20px",
                borderRadius: "100px",
                border: "2px solid var(--primary)",
                background: "none",
                color: "var(--primary)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Connect Wallet to Donate
            </button>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                min="1"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Amount (USDC)"
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid rgba(232,82,122,0.3)",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={handleDonate}
                disabled={donating}
                style={{
                  padding: "11px 24px",
                  borderRadius: "100px",
                  border: "none",
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: donating ? 0.7 : 1,
                }}
              >
                {donating ? "Sending…" : "Donate"}
              </button>
            </div>
          )}
          {donateError && (
            <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "8px" }}>
              {donateError}
            </p>
          )}
          {lastDonationTx && (
            <a
              href={stellarExpertTxUrl(lastDonationTx)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                marginTop: "10px",
                color: "#166534",
              }}
            >
              <CheckCircle2 size={14} /> Donation confirmed — view on Stellar
              Expert <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {/* Milestones */}
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          marginBottom: "12px",
        }}
      >
        Milestones
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {milestones.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              border: "1px solid rgba(232,82,122,0.15)",
              borderRadius: "14px",
              padding: "14px 18px",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>
                {m.title || m.description || "Untitled milestone"}
              </div>
              {m.target_amount && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {m.target_amount} USDC
                </div>
              )}
              {m.tx_hash && (
                <a
                  href={stellarExpertTxUrl(m.tx_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "11px",
                    color: "var(--muted-foreground)",
                  }}
                >
                  View release on Stellar Expert{" "}
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            {m.status === "released" || m.tx_hash ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#166534",
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={14} /> Released
              </span>
            ) : isAssignedVerifier ? (
              <button
                onClick={() => handleReleaseMilestone(m)}
                disabled={releasingId === m.id}
                style={{
                  padding: "8px 16px",
                  borderRadius: "100px",
                  border: "none",
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {releasingId === m.id
                  ? "Releasing…"
                  : "Verify & Release Funds"}
              </button>
            ) : (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                }}
              >
                Pending
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}