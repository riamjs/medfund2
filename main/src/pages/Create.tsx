import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { ESCROW_PUBLIC_KEY } from "../lib/stellar";
import { Plus, X, Upload, Loader2, CheckCircle2 } from "lucide-react";

interface CreateProps {
  walletAddress: string | null;
  onConnectWallet: () => void;
  onNavigate: (v: string, id?: string) => void;
}

interface VerifierOption {
  id: string;
  verifier_org_name: string | null;
  verifier_org_type: string | null;
  verifier_stellar_address: string | null;
}

interface MilestoneDraft {
  title: string;
  description: string;
  target_amount: string;
}

export default function Create({ onNavigate }: CreateProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [medicalDocs, setMedicalDocs] = useState<File[]>([]);
  const [verifiers, setVerifiers] = useState<VerifierOption[]>([]);
  const [verifierId, setVerifierId] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: "", description: "", target_amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, verifier_org_name, verifier_org_type, verifier_stellar_address")
      .eq("is_verifier", true)
      .eq("verifier_status", "approved")
      .then(({ data, error }) => {
        if (error) console.error("Failed to load verifiers:", error);
        setVerifiers((data as VerifierOption[]) ?? []);
      });
  }, []);

  const addMilestone = () =>
    setMilestones((prev) => [
      ...prev,
      { title: "", description: "", target_amount: "" },
    ]);

  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const updateMilestone = (
    i: number,
    field: keyof MilestoneDraft,
    value: string
  ) =>
    setMilestones((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m))
    );

  const canSubmit =
    title.trim() &&
    targetAmount &&
    Number(targetAmount) > 0 &&
    verifierId &&
    milestones.every((m) => m.title.trim());

  const uploadFile = async (file: File, folder: string, userId: string) => {
    const path = `${folder}/${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!ESCROW_PUBLIC_KEY) {
      setError("Escrow wallet not configured. Check .env.local");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw new Error("You need to be signed in to create a fundraiser.");
      }

      let imageUrl: string | null = null;
      if (coverImage) {
        imageUrl = await uploadFile(coverImage, "covers", session.user.id);
      }

      const medicalDocUrls: { name: string; url: string }[] = [];
      for (const doc of medicalDocs) {
        const url = await uploadFile(doc, "medical", session.user.id);
        medicalDocUrls.push({ name: doc.name, url });
      }

      const verifier = verifiers.find((v) => v.id === verifierId);

      const { data: fundraiser, error: insertError } = await supabase
        .from("fundraisers")
        .insert({
          contract_id: ESCROW_PUBLIC_KEY,
          patient_id: session.user.id,
          title: title.trim(),
          description: description.trim() || null,
          hospital_name: hospitalName.trim() || null,
          beneficiary_name: beneficiaryName.trim() || null,
          medical_condition: medicalCondition.trim() || null,
          target_amount: Number(targetAmount),
          image_url: imageUrl,
          verification_status: "pending",
          status: "active",
          verifier_id: verifierId,
          verifier_address: verifier?.verifier_stellar_address ?? null,
          medical_documents: medicalDocUrls,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Fundraiser insert error:", insertError);
        throw new Error(insertError.message || "Failed to create fundraiser.");
      }

      if (!fundraiser?.id) {
        throw new Error("Fundraiser created but no ID returned.");
      }

      const milestoneRows = milestones
        .filter((m) => m.title.trim())
        .map((m) => ({
          fundraiser_id: fundraiser.id,
          title: m.title.trim(),
          description: m.description.trim() || null,
          target_amount: m.target_amount ? Number(m.target_amount) : null,
          status: "pending",
        }));

      if (milestoneRows.length > 0) {
        const { error: milestoneError } = await supabase
          .from("milestones")
          .insert(milestoneRows);

        if (milestoneError) {
          console.error("Milestone insert error:", milestoneError);
          throw new Error("Fundraiser created but milestones failed.");
        }
      }

      onNavigate("detail", String(fundraiser.id));
    } catch (err: any) {
      console.error("Create fundraiser error:", err);
      setError(err.message ?? "Something went wrong creating your fundraiser.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 24px 60px" }}>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "28px",
          fontWeight: 900,
          marginBottom: "6px",
        }}
      >
        Start a Fundraiser
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--muted-foreground)",
          marginBottom: "28px",
        }}
      >
        Every fundraiser is reviewed by a verifier before it can accept donations.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Field label="Fundraiser Title *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Heart Surgery for Maria"
            style={inputStyle}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Beneficiary Name">
            <input
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Hospital / Clinic">
            <input
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Medical Condition">
          <input
            value={medicalCondition}
            onChange={(e) => setMedicalCondition(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Target Amount (USDC) *">
          <input
            type="number"
            min="1"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Cover Image">
          <label style={uploadBoxStyle}>
            <Upload size={18} color="var(--primary)" />
            <span style={{ fontSize: "13px" }}>
              {coverImage ? coverImage.name : "Click to upload"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
          </label>
        </Field>

        <Field label="Medical Documents (for verifier review)">
          <label style={uploadBoxStyle}>
            <Upload size={18} color="var(--primary)" />
            <span style={{ fontSize: "13px" }}>
              Click to upload (PDF or image, multiple allowed)
            </span>
            <input
              type="file"
              accept="application/pdf,image/*"
              multiple
              onChange={(e) =>
                setMedicalDocs((prev) => [
                  ...prev,
                  ...Array.from(e.target.files ?? []),
                ])
              }
              style={{ display: "none" }}
            />
          </label>
          {medicalDocs.map((f, i) => (
            <div
              key={i}
              style={{
                fontSize: "12px",
                color: "var(--muted-foreground)",
                marginTop: "4px",
              }}
            >
              {f.name}
            </div>
          ))}
        </Field>

        <Field label="Assign a Verifier *">
          <select
            value={verifierId}
            onChange={(e) => setVerifierId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select an approved verifier…</option>
            {verifiers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.verifier_org_name} ({v.verifier_org_type})
              </option>
            ))}
          </select>
          {verifiers.length === 0 && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--muted-foreground)",
                marginTop: "4px",
              }}
            >
              No approved verifiers yet — one needs to register and be approved
              before fundraisers can go live.
            </p>
          )}
        </Field>

        <div>
          <label style={labelStyle}>Milestones</label>
          {milestones.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "8px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <input
                  placeholder="Milestone title (e.g. Surgery scheduled)"
                  value={m.title}
                  onChange={(e) => updateMilestone(i, "title", e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Target amount (USDC, optional)"
                  type="number"
                  value={m.target_amount}
                  onChange={(e) =>
                    updateMilestone(i, "target_amount", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  <X size={16} color="var(--muted-foreground)" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMilestone}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Plus size={14} /> Add another milestone
          </button>
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            padding: "14px",
            borderRadius: "100px",
            border: "none",
            backgroundColor: "var(--primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            cursor: canSubmit ? "pointer" : "default",
            opacity: canSubmit ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {submitting ? (
            <Loader2
              size={16}
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {submitting ? "Creating…" : "Create Fundraiser"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--foreground)",
  marginBottom: "6px",
  fontFamily: "var(--font-heading)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "12px",
  border: "1.5px solid rgba(232,82,122,0.3)",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  backgroundColor: "#fff",
  color: "var(--foreground)",
  boxSizing: "border-box",
};

const uploadBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1.5px dashed rgba(232,82,122,0.35)",
  backgroundColor: "#fff",
  cursor: "pointer",
};