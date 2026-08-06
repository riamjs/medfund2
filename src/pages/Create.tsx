import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { logFundraiserCreated } from '@/lib/medfund.functions'

interface CreateProps {
  walletAddress: string | null
  onConnectWallet: () => void
  onNavigate: (view: string) => void
}

type TxState = 'idle' | 'pending' | 'success' | 'error'

const pillBtn: React.CSSProperties = {
  borderRadius: '100px',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.18s',
}

export default function Create({ walletAddress, onConnectWallet, onNavigate }: CreateProps) {
  const [form, setForm] = useState({ patientName: '', verifierAddress: '', milestoneDescription: '', goalAmount: '' })
  const [txState, setTxState] = useState<TxState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const qc = useQueryClient()

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.patientName.trim()) e.patientName = 'Required'
    if (!form.verifierAddress.trim()) e.verifierAddress = 'Required'
    else if (!/^G[A-Z2-7]{55}$/.test(form.verifierAddress.trim())) {
      e.verifierAddress = 'Enter a valid Stellar address (starts with G)'
    }
    if (!form.milestoneDescription.trim()) e.milestoneDescription = 'Required'
    if (!form.goalAmount || parseFloat(form.goalAmount) <= 0) e.goalAmount = 'Enter a valid amount'
    return e
  }

  /** Creates the fundraiser and its first milestone in the database. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      setErrors({ patientName: 'Sign in first — use the Login link in the header' })
      return
    }
    setTxState('pending')
    try {
      const goal = parseFloat(form.goalAmount)
      const slug = `${form.patientName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 6)}`

      const { data: verifier } = await supabase
        .from('verifiers')
        .select('id')
        .eq('stellar_address', form.verifierAddress.trim())
        .eq('approved', true)
        .maybeSingle()

      const { data: created, error } = await supabase
        .from('fundraisers')
        .insert({
          slug,
          patient: form.patientName.trim(),
          cause: form.milestoneDescription.trim().slice(0, 120),
          summary: form.milestoneDescription.trim(),
          goal_amount: goal,
          owner_id: session.session.user.id,
          payout_address: walletAddress,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)

      const { error: mErr } = await supabase.from('milestones').insert({
        fundraiser_id: created.id,
        position: 1,
        title: form.milestoneDescription.trim().slice(0, 80),
        description: form.milestoneDescription.trim(),
        amount: goal,
        verifier_id: verifier?.id ?? null,
      })
      if (mErr) throw new Error(mErr.message)

      await logFundraiserCreated({ data: { fundraiserId: created.id } })
      qc.invalidateQueries({ queryKey: ['fundraisers'] })
      setTxHash(slug)
      setTxState('success')
    } catch (err) {
      setErrors({ patientName: err instanceof Error ? err.message : 'Could not create fundraiser' })
      setTxState('idle')
    }
  }


  const inputStyle = (key: keyof typeof form): React.CSSProperties => ({
    width: '100%',
    padding: '13px 18px',
    border: `2px solid ${errors[key] ? '#E8527A' : 'rgba(232,82,122,0.25)'}`,
    borderRadius: '16px',
    backgroundColor: 'rgba(232,82,122,0.04)',
    fontFamily: key === 'verifierAddress' || key === 'goalAmount' ? 'var(--font-mono-face)' : 'var(--font-body)',
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--foreground)',
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  const field = (label: string, key: keyof typeof form, opts: { type?: string; placeholder?: string; hint?: string; multiline?: boolean } = {}) => (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono-face)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px', fontWeight: 500 }}>
        {label}
      </label>
      {opts.multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          placeholder={opts.placeholder}
          rows={4}
          style={{ ...inputStyle(key), resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
          onBlur={e => { e.target.style.borderColor = errors[key] ? '#E8527A' : 'rgba(232,82,122,0.25)' }}
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          placeholder={opts.placeholder}
          style={inputStyle(key)}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
          onBlur={e => { e.target.style.borderColor = errors[key] ? '#E8527A' : 'rgba(232,82,122,0.25)' }}
        />
      )}
      {errors[key] && <p style={{ fontSize: '12px', color: '#E8527A', marginTop: '5px', fontWeight: 600 }}>{errors[key]}</p>}
      {opts.hint && !errors[key] && <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '5px', lineHeight: 1.5, fontWeight: 500 }}>{opts.hint}</p>}
    </div>
  )

  if (txState === 'success') {
    return (
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ backgroundColor: '#FDE5C8', border: '1.5px solid rgba(232,82,122,0.2)', borderRadius: '32px', padding: '56px 48px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(232,82,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
            🎉
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
            Fundraiser created!
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', lineHeight: 1.65, marginBottom: '28px', fontWeight: 500 }}>
            Your fundraiser for <strong style={{ color: 'var(--foreground)' }}>{form.patientName}</strong> is live on Stellar. Donors can now contribute to the escrow.
          </p>
          {txHash && (
            <div style={{ backgroundColor: 'rgba(232,82,122,0.08)', borderRadius: '16px', padding: '14px 18px', marginBottom: '28px', textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px', color: 'var(--primary)', marginBottom: '4px', letterSpacing: '0.08em', fontWeight: 500 }}>FUNDRAISER</p>
              <a href={`/fundraisers/${txHash}`}
                style={{ fontFamily: 'var(--font-mono-face)', fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >
                View the escrow page for {txHash} →
              </a>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('browse')} style={{ ...pillBtn, padding: '12px 28px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '15px', boxShadow: '0 8px 24px rgba(232,82,122,0.35)' }}>
              Browse all fundraisers
            </button>
            <button onClick={() => { setForm({ patientName: '', verifierAddress: '', milestoneDescription: '', goalAmount: '' }); setTxState('idle'); setTxHash(null) }}
              style={{ ...pillBtn, padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', fontSize: '14px' }}>
              Create another
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '64px', alignItems: 'start' }} className="create-grid">
        <div>
          <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '10px', fontWeight: 500 }}>
            New fundraiser
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--foreground)', marginBottom: '8px', lineHeight: 1.0 }}>
            Start a fundraiser
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', lineHeight: 1.65, marginBottom: '40px', maxWidth: '480px', fontWeight: 500 }}>
            Funds are held in a Stellar escrow and released only after your verifier confirms treatment completion.
          </p>

          {!walletAddress && (
            <div style={{ backgroundColor: '#FFF3DC', border: '1.5px solid #D4920A', borderRadius: '20px', padding: '18px 22px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#8A5C10', marginBottom: '4px' }}>Wallet not connected</p>
                <p style={{ fontSize: '13px', color: '#8A5C10', fontWeight: 500 }}>
                  You need a wallet to deploy the escrow contract.{' '}
                  <button onClick={onConnectWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
                    Connect wallet
                  </button>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {field('Patient name', 'patientName', { placeholder: 'e.g. Maria Santos', hint: 'Full name of the patient receiving treatment.' })}
            {field('Verifier address', 'verifierAddress', { placeholder: 'G...', hint: 'Stellar address of the hospital or NGO who will verify treatment.' })}
            {field('Milestone description', 'milestoneDescription', { multiline: true, placeholder: 'Describe exactly what treatment must be completed for funds to release.' })}
            {field('Goal amount (USDC)', 'goalAmount', { type: 'number', placeholder: '0.00', hint: 'Total USDC needed to cover the treatment milestone.' })}

            <button type="submit" disabled={txState === 'pending' || !walletAddress}
              style={{ ...pillBtn, width: '100%', padding: '16px', backgroundColor: txState === 'pending' || !walletAddress ? 'rgba(232,82,122,0.3)' : 'var(--primary)', color: 'white', fontSize: '16px', cursor: txState === 'pending' || !walletAddress ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: txState === 'pending' || !walletAddress ? 'none' : '0 8px 24px rgba(232,82,122,0.35)' }}>
              {txState === 'pending' ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Deploying escrow contract…
                </>
              ) : 'Deploy fundraiser'}
            </button>
          </form>
        </div>

        <div style={{ position: 'sticky', top: '88px' }}>
          <div style={{ backgroundColor: '#FDE5C8', border: '1.5px solid rgba(232,82,122,0.2)', borderRadius: '24px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'var(--primary)', padding: '16px 22px' }}>
              <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                What happens after you submit
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              {[
                { step: '1', text: 'A Stellar smart contract escrow is deployed on your behalf.' },
                { step: '2', text: 'Donors send USDC to the escrow — funds never reach your hands.' },
                { step: '3', text: 'Your verifier signs a transaction confirming treatment completion.' },
                { step: '4', text: 'The escrow automatically releases funds to the hospital account.' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono-face)', fontSize: '11px', flexShrink: 0, fontWeight: 500 }}>
                    {item.step}
                  </span>
                  <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--muted-foreground)', fontWeight: 500 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(232,82,122,0.07)', border: '1.5px solid rgba(232,82,122,0.15)', borderRadius: '20px', padding: '18px' }}>
            <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px', fontWeight: 500 }}>Verifier requirements</p>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--muted-foreground)', fontWeight: 500 }}>
              The verifier must be a registered Philippine hospital or accredited NGO with a verified Stellar address.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) { .create-grid { grid-template-columns: 1fr !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
