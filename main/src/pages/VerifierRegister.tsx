import { useState, useEffect } from "react"
import { supabase } from "../integrations/supabase/client.ts"
import {
  Building2,
  HeartHandshake,
  Stethoscope,
  Landmark,
  MoreHorizontal,
  Upload,
  FileText,
  X,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
} from "lucide-react"

interface VerifierRegisterProps {
  onNavigate: (view: string, id?: string) => void
}

type OrgType = "hospital" | "ngo" | "clinic" | "foundation" | "other"

const ORG_TYPES: { value: OrgType; label: string; icon: typeof Building2 }[] = [
  { value: "hospital", label: "Hospital", icon: Building2 },
  { value: "ngo", label: "NGO", icon: HeartHandshake },
  { value: "clinic", label: "Clinic", icon: Stethoscope },
  { value: "foundation", label: "Foundation", icon: Landmark },
  { value: "other", label: "Other", icon: MoreHorizontal },
]

const MAX_FILES = 5
const MAX_FILE_MB = 10

function isValidStellarAddress(addr: string) {
  return /^G[A-Z2-7]{55}$/.test(addr.trim())
}

export default function VerifierRegister({ onNavigate }: VerifierRegisterProps) {
  const [step, setStep] = useState(1) // 1, 2, 3, 4=success
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] = useState<OrgType | null>(null)
  const [orgDescription, setOrgDescription] = useState("")

  // Step 2
  const [stellarAddress, setStellarAddress] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")

  // Step 3
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    const checkExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setCheckingExisting(false)
        return
      }
      setContactEmail(session.user.email ?? "")

      const { data } = await supabase
        .from("verifier_applications")
        .select("status")
        .eq("applicant_id", session.user.id)
        .in("status", ["pending", "approved"])
        .maybeSingle()

      if (data) setExistingStatus(data.status)
      setCheckingExisting(false)
    }
    checkExisting()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter((f) => {
      const okType = f.type === "application/pdf" || f.type.startsWith("image/")
      const okSize = f.size <= MAX_FILE_MB * 1024 * 1024
      return okType && okSize
    })
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES))
    e.target.value = ""
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const canProceedStep1 = orgName.trim().length > 0 && orgType !== null
  const canProceedStep2 =
    isValidStellarAddress(stellarAddress) && contactEmail.trim().length > 0

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setError("You need to be signed in to submit an application.")
        setSubmitting(false)
        return
      }

      // Upload documents
      const uploadedDocs: { name: string; url: string }[] = []
      for (const file of files) {
        const path = `${session.user.id}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file)

        if (uploadError) {
          console.error("Upload failed for", file.name, uploadError)
          continue
        }

        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path)
        uploadedDocs.push({ name: file.name, url: urlData.publicUrl })
      }

      const { error: insertError } = await supabase.from("verifier_applications").insert({
        applicant_id: session.user.id,
        applicant_email: session.user.email,
        applicant_name: session.user.user_metadata?.full_name ?? null,
        org_name: orgName.trim(),
        org_type: orgType,
        org_description: orgDescription.trim() || null,
        stellar_address: stellarAddress.trim(),
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim(),
        documents: uploadedDocs,
      })

      if (insertError) throw insertError

      setStep(4)
    } catch (err: any) {
      setError(err.message ?? "Something went wrong submitting your application.")
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingExisting) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} className="spin" style={{ color: "var(--primary)" }} />
        <style>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (existingStatus) {
    return (
      <div style={{ maxWidth: "480px", margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
        <div
          style={{
            backgroundColor: "#FDE5C8",
            border: "1.5px solid rgba(232,82,122,0.2)",
            borderRadius: "24px",
            padding: "40px 32px",
          }}
        >
          <Shield size={40} style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 900, marginBottom: "8px" }}>
            {existingStatus === "approved" ? "You're already an approved verifier" : "Application already submitted"}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
            {existingStatus === "approved"
              ? "You can start reviewing fundraisers assigned to you."
              : "Your application is pending review. We'll notify you once it's been processed."}
          </p>
          <button
            onClick={() => onNavigate("landing")}
            style={{
              padding: "11px 24px",
              borderRadius: "100px",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div style={{ maxWidth: "480px", margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
        <div
          style={{
            backgroundColor: "#FDE5C8",
            border: "1.5px solid rgba(232,82,122,0.2)",
            borderRadius: "24px",
            padding: "40px 32px",
          }}
        >
          <CheckCircle2 size={44} style={{ margin: "0 auto 16px", color: "#22c55e" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 900, marginBottom: "8px" }}>
            Application submitted!
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
            Thanks for applying to become a MedFund verifier. Here's what happens next:
          </p>
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {[
              "Our team reviews your organization details and documents",
              "You'll be notified once a decision is made",
              "Once approved, patients can select you when creating fundraisers",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--foreground)" }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate("landing")}
            style={{
              padding: "11px 24px",
              borderRadius: "100px",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "560px", margin: "40px auto", padding: "0 24px 60px" }}>
      <button
        onClick={() => onNavigate("auth")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          color: "var(--muted-foreground)",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "26px",
          fontWeight: 900,
          color: "var(--foreground)",
          marginBottom: "6px",
        }}
      >
        Register as a Verifier
      </h1>
      <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "24px" }}>
        Help MedFund keep fundraisers honest by reviewing medical documents and approving requests.
      </p>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "5px",
              borderRadius: "10px",
              backgroundColor: s <= step ? "var(--primary)" : "rgba(232,82,122,0.15)",
              transition: "background-color 0.2s",
            }}
          />
        ))}
      </div>

      <div
        style={{
          backgroundColor: "#FDE5C8",
          border: "1.5px solid rgba(232,82,122,0.2)",
          borderRadius: "24px",
          padding: "32px",
        }}
      >
        {/* STEP 1: Org info */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Philippine General Hospital"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Organization Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {ORG_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOrgType(value)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "14px 8px",
                      borderRadius: "14px",
                      border: orgType === value ? "2px solid var(--primary)" : "1.5px solid rgba(232,82,122,0.2)",
                      backgroundColor: orgType === value ? "rgba(232,82,122,0.1)" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={20} color={orgType === value ? "var(--primary)" : "var(--muted-foreground)"} />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: orgType === value ? "var(--foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                placeholder="What does your organization do?"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-body)" }}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Wallet + contact */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Stellar Wallet Address</label>
              <input
                type="text"
                value={stellarAddress}
                onChange={(e) => setStellarAddress(e.target.value.toUpperCase())}
                placeholder="G..."
                style={{
                  ...inputStyle,
                  fontFamily: "var(--font-mono-face)",
                  fontSize: "12px",
                  borderColor:
                    stellarAddress.length > 0 && !isValidStellarAddress(stellarAddress)
                      ? "#dc2626"
                      : "rgba(232,82,122,0.3)",
                }}
              />
              {stellarAddress.length > 0 && !isValidStellarAddress(stellarAddress) && (
                <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>
                  Must start with G and be 56 characters.
                </p>
              )}
              <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px" }}>
                Funds are released to this address once milestones are verified.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@organization.org"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Contact Phone (optional)</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Documents */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Verification Documents</label>
              <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "10px" }}>
                Business registration, accreditation, or ID — PDF or image, up to {MAX_FILE_MB}MB each, max {MAX_FILES} files.
              </p>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "24px",
                  borderRadius: "14px",
                  border: "1.5px dashed rgba(232,82,122,0.35)",
                  backgroundColor: "#fff",
                  cursor: files.length >= MAX_FILES ? "default" : "pointer",
                  opacity: files.length >= MAX_FILES ? 0.5 : 1,
                }}
              >
                <Upload size={22} color="var(--primary)" />
                <span style={{ fontSize: "13px", color: "var(--foreground)", fontWeight: 600 }}>
                  Click to upload files
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={files.length >= MAX_FILES}
                  style={{ display: "none" }}
                />
              </label>

              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: "#fff",
                        border: "1px solid rgba(232,82,122,0.15)",
                      }}
                    >
                      <FileText size={14} color="var(--muted-foreground)" />
                      <span style={{ fontSize: "12px", color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                      >
                        <X size={14} color="var(--muted-foreground)" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary card */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "14px",
                border: "1px solid rgba(232,82,122,0.15)",
                padding: "16px",
                fontSize: "12px",
                color: "var(--foreground)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>Application Summary</div>
              <div><strong>Org:</strong> {orgName} ({orgType})</div>
              <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "10px", wordBreak: "break-all" }}>
                <strong style={{ fontFamily: "var(--font-body)" }}>Wallet:</strong> {stellarAddress}
              </div>
              <div><strong>Contact:</strong> {contactEmail}{contactPhone && ` · ${contactPhone}`}</div>
              <div><strong>Documents:</strong> {files.length} file{files.length !== 1 ? "s" : ""}</div>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>{error}</p>}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "100px",
                border: "1.5px solid rgba(232,82,122,0.3)",
                backgroundColor: "transparent",
                color: "var(--foreground)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              onClick={() => setStep(step + 1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "100px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                opacity: (step === 1 ? !canProceedStep1 : !canProceedStep2) ? 0.5 : 1,
              }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "100px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          )}
        </div>
      </div>

      <style>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--foreground)",
  marginBottom: "6px",
  fontFamily: "var(--font-heading)",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "12px",
  border: "1.5px solid rgba(232,82,122,0.3)",
  backgroundColor: "#fff",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  color: "var(--foreground)",
  outline: "none",
  boxSizing: "border-box",
}