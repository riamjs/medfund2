import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Account, Asset, Memo, Operation, TransactionBuilder } from '@stellar/stellar-sdk'
import { useFundraiserDetail, type FundraiserStatus } from '@/lib/adapt'
import { HORIZON, NETWORK_PASSPHRASE, USDC_CODE, USDC_ISSUER, memoForSlug } from '@/lib/stellar-config'
import { signXdr, refreshBalances } from '@/lib/wallet'
import { getEscrowInfo, recordDonation } from '@/lib/medfund.functions'

interface DetailProps {
  fundraiserId: string
  walletAddress: string | null
  onNavigate: (view: string, id?: string) => void
  onConnectWallet: () => void
}

type TxState = 'idle' | 'pending' | 'success' | 'error'

const STATUS_LABELS: Record<FundraiserStatus, string> = {
  awaiting_donations: 'Awaiting donations',
  milestone_pending: 'Pending verification',
  verified_released: 'Verified — funds released',
}

const STATUS_STYLES: Record<FundraiserStatus, { bg: string; color: string }> = {
  awaiting_donations: { bg: 'rgba(232,82,122,0.1)', color: '#B84060' },
  milestone_pending: { bg: '#FFF3DC', color: '#8A5C10' },
  verified_released: { bg: '#E6F7EE', color: '#1A6635' },
}

const TIMELINE_ICONS: Record<string, string> = {
  created: '📄',
  donated: '💸',
  verified: '✅',
  released: '🏥',
}

const pillBtn: React.CSSProperties = {
  borderRadius: '100px',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.18s',
}

export default function Detail({ fundraiserId, walletAddress, onNavigate, onConnectWallet }: DetailProps) {
  const { fundraiser, isLoading } = useFundraiserDetail(fundraiserId)
  const qc = useQueryClient()
  const [donateAmount, setDonateAmount] = useState('')
  const [txState, setTxState] = useState<TxState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  if (!fundraiser) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px' }}>
        <p style={{ color: 'var(--muted-foreground)' }}>
          {isLoading ? 'Loading fundraiser…' : 'Fundraiser not found.'}
        </p>
        <button onClick={() => onNavigate('browse')} style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700 }}>
          ← Back to browse
        </button>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((fundraiser.raised / fundraiser.goal) * 100))
  const st = STATUS_STYLES[fundraiser.status]

  /** Real Stellar testnet donation: build → sign in Freighter → submit → confirm server-side. */
  const handleDonate = async () => {
    const value = parseFloat(donateAmount)
    if (!value || value <= 0) return
    if (!walletAddress) { onConnectWallet(); return }
    setTxState('pending')
    setTxError(null)
    try {
      const escrow = await getEscrowInfo()
      if (!escrow?.address) throw new Error('Escrow account is not ready yet')

      const accRes = await fetch(`${HORIZON}/accounts/${walletAddress}`)
      if (!accRes.ok) throw new Error('Your wallet has no testnet account yet — fund it with Friendbot first')
      const acc = (await accRes.json()) as {
        sequence: string
        balances: { asset_code?: string; asset_issuer?: string; balance: string }[]
      }
      const usdc = acc.balances.find(b => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER)
      if (!usdc) throw new Error('Add a USDC trustline in Freighter before donating')
      if (Number(usdc.balance) < value) throw new Error('Not enough testnet USDC')

      const built = new TransactionBuilder(new Account(walletAddress, acc.sequence), {
        fee: '10000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.payment({
          destination: escrow.address,
          asset: new Asset(USDC_CODE, USDC_ISSUER),
          amount: value.toFixed(7),
        }))
        .addMemo(Memo.text(memoForSlug(fundraiser.id)))
        .setTimeout(180)
        .build()

      const signed = await signXdr(built.toXDR(), NETWORK_PASSPHRASE)
      const res = await fetch(`${HORIZON}/transactions`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ tx: signed }).toString(),
      })
      const body = (await res.json()) as { hash?: string; extras?: { result_codes?: unknown } }
      if (!res.ok || !body.hash) {
        throw new Error(`Stellar rejected the payment: ${JSON.stringify(body.extras?.result_codes ?? body)}`)
      }
      await recordDonation({ data: { slug: fundraiser.id, txHash: body.hash } })
      refreshBalances(walletAddress)
      qc.invalidateQueries({ queryKey: ['fundraiser', fundraiser.id] })
      qc.invalidateQueries({ queryKey: ['fundraisers'] })
      setTxHash(body.hash)
      setTxState('success')
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Donation failed')
      setTxState('error')
    }
  }


  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
      <button
        onClick={() => onNavigate('browse')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '32px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)' }}
      >
        ← All fundraisers
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }} className="detail-grid">

        {/* Left */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: st.bg, color: st.color, borderRadius: '100px', padding: '5px 14px', marginBottom: '20px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px', letterSpacing: '0.06em', fontWeight: 500 }}>
              {STATUS_LABELS[fundraiser.status]}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '8px', color: 'var(--foreground)' }}>
            {fundraiser.patientName}
          </h1>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontStyle: 'italic', color: 'var(--muted-foreground)', marginBottom: '28px', fontWeight: 600 }}>
            {fundraiser.cause}
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.75, color: '#5A4020', marginBottom: '40px', maxWidth: '560px', fontWeight: 500 }}>
            {fundraiser.description}
          </p>

          {/* Milestone */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '16px', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              Treatment milestone
            </h2>
            <div style={{ backgroundColor: '#FDE5C8', borderRadius: '20px', overflow: 'hidden', border: '1.5px solid rgba(232,82,122,0.15)' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(232,82,122,0.12)', backgroundColor: 'rgba(232,82,122,0.07)' }}>
                <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Milestone</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--foreground)' }}>{fundraiser.milestoneLabel}</p>
              </div>
              <div style={{ padding: '18px 22px' }}>
                <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#5A4020', marginBottom: '16px', fontWeight: 500 }}>
                  {fundraiser.milestoneDescription}
                </p>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Verifier</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{fundraiser.verifierName}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Verifier address</p>
                    <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '12px', color: 'var(--foreground)' }}>{fundraiser.verifierAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '24px', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              Transaction timeline
            </h2>
            <div style={{ position: 'relative', paddingLeft: '28px' }}>
              <div style={{ position: 'absolute', left: '10px', top: '16px', bottom: '16px', width: '1px', backgroundColor: 'rgba(232,82,122,0.2)' }} />
              {fundraiser.timeline.map((event, i) => {
                const completed = event.timestamp !== null
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: i < fundraiser.timeline.length - 1 ? '28px' : '0', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-22px',
                      top: '3px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: completed ? 'var(--primary)' : 'rgba(232,82,122,0.15)',
                      border: `2px solid ${completed ? 'var(--primary)' : 'rgba(232,82,122,0.3)'}`,
                      flexShrink: 0,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {completed && <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'white' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: completed ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                          {TIMELINE_ICONS[event.key]} {event.label}
                        </p>
                        {event.timestamp && (
                          <span style={{ fontFamily: 'var(--font-mono-face)', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                            {event.timestamp}
                          </span>
                        )}
                      </div>
                      {event.txHash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontFamily: 'var(--font-mono-face)', fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                        >
                          {event.txHash.slice(0, 8)}...{event.txHash.slice(-4)} ↗
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right — donate panel */}
        <div style={{ position: 'sticky', top: '88px' }}>
          {/* Progress */}
          <div style={{ backgroundColor: '#FDE5C8', border: '1.5px solid rgba(232,82,122,0.2)', borderRadius: '24px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono-face)', fontSize: '30px', fontWeight: 500, color: 'var(--primary)' }}>
                {fundraiser.raised.toLocaleString()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono-face)', fontSize: '12px', color: 'var(--muted-foreground)' }}>USDC</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '14px', fontWeight: 500 }}>
              raised of {fundraiser.goal.toLocaleString()} USDC goal · {pct}%
            </p>
            <div style={{ height: '8px', backgroundColor: 'rgba(232,82,122,0.18)', borderRadius: '100px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 100 ? '#3CAB6A' : 'var(--primary)', borderRadius: '100px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>
              <span>{fundraiser.donorCount} donors</span>
              <span style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px' }}>ESCROW: {fundraiser.escrowAddress}</span>
            </div>
          </div>

          {/* Donate form */}
          {fundraiser.status !== 'verified_released' && (
            <div style={{ backgroundColor: '#FDE5C8', border: '1.5px solid rgba(232,82,122,0.2)', borderRadius: '24px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
                Donate USDC
              </h3>

              {txState === 'success' ? (
                <div>
                  <div style={{ backgroundColor: '#E6F7EE', border: '1px solid #A8DFC0', borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
                    <p style={{ fontWeight: 700, color: '#1A6635', fontSize: '14px', marginBottom: '6px' }}>✓ Donation received</p>
                    <p style={{ fontSize: '13px', color: '#1A6635', marginBottom: '10px', fontWeight: 500 }}>
                      Your {donateAmount} USDC is held in escrow until treatment is verified.
                    </p>
                    {txHash && (
                      <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'var(--font-mono-face)', fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                      >
                        View on stellar.expert ↗
                      </a>
                    )}
                  </div>
                  <button onClick={() => { setTxState('idle'); setDonateAmount(''); setTxHash(null) }}
                    style={{ ...pillBtn, width: '100%', padding: '10px', background: 'none', border: '1.5px solid rgba(232,82,122,0.3)', fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                    Donate again
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {['10', '25', '50', '100'].map(preset => (
                      <button key={preset} onClick={() => setDonateAmount(preset)}
                        style={{ ...pillBtn, flex: 1, padding: '8px 4px', border: '2px solid', borderColor: donateAmount === preset ? 'var(--primary)' : 'rgba(232,82,122,0.25)', backgroundColor: donateAmount === preset ? 'var(--primary)' : 'transparent', color: donateAmount === preset ? 'white' : 'var(--foreground)', fontSize: '13px', fontWeight: 700 }}>
                        ${preset}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', border: '2px solid rgba(232,82,122,0.25)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', backgroundColor: 'rgba(232,82,122,0.05)', transition: 'border-color 0.15s' }}
                    onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                    onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(232,82,122,0.25)' }}
                  >
                    <span style={{ padding: '11px 14px', fontFamily: 'var(--font-mono-face)', fontSize: '13px', color: 'var(--primary)', borderRight: '1px solid rgba(232,82,122,0.2)', fontWeight: 500 }}>USDC</span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={donateAmount}
                      onChange={e => setDonateAmount(e.target.value)}
                      style={{ flex: 1, padding: '11px 14px', border: 'none', backgroundColor: 'transparent', fontFamily: 'var(--font-mono-face)', fontSize: '14px', color: 'var(--foreground)', outline: 'none' }}
                    />
                  </div>

                  {txState === 'error' && txError && (
                    <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #F4BCBC', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#8B2020', fontWeight: 500 }}>{txError}</p>
                    </div>
                  )}

                  {walletAddress ? (
                    <button onClick={handleDonate} disabled={txState === 'pending' || !donateAmount}
                      style={{ ...pillBtn, width: '100%', padding: '14px', backgroundColor: txState === 'pending' || !donateAmount ? 'rgba(232,82,122,0.3)' : 'var(--primary)', color: 'white', fontSize: '15px', cursor: txState === 'pending' || !donateAmount ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: txState === 'pending' || !donateAmount ? 'none' : '0 8px 24px rgba(232,82,122,0.35)' }}>
                      {txState === 'pending' ? (
                        <>
                          <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                          Sending…
                        </>
                      ) : `Donate ${donateAmount ? donateAmount + ' USDC' : 'USDC'}`}
                    </button>
                  ) : (
                    <button onClick={onConnectWallet}
                      style={{ ...pillBtn, width: '100%', padding: '14px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '15px', boxShadow: '0 8px 24px rgba(232,82,122,0.35)' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                      Connect wallet to donate
                    </button>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5, fontWeight: 500 }}>
                    Funds held in escrow on Stellar until treatment is verified.
                  </p>
                </div>
              )}
            </div>
          )}

          {fundraiser.status === 'verified_released' && (
            <div style={{ backgroundColor: '#E6F7EE', border: '1px solid #A8DFC0', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 800, color: '#1A6635', marginBottom: '6px', fontSize: '15px' }}>✓ Treatment verified & funds released</p>
              <p style={{ fontSize: '13px', color: '#1E6B3A', lineHeight: 1.55, fontWeight: 500 }}>
                This fundraiser reached its goal and treatment was confirmed. Funds have been released to the hospital.
              </p>
            </div>
          )}

          <div style={{ backgroundColor: 'rgba(232,82,122,0.06)', border: '1.5px solid rgba(232,82,122,0.15)', borderRadius: '20px', padding: '18px' }}>
            <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '12px', fontWeight: 500 }}>
              On-chain details
            </p>
            {[{ label: 'Escrow', value: fundraiser.escrowAddress }, { label: 'Verifier', value: fundraiser.verifierAddress }, { label: 'Creator', value: fundraiser.creatorAddress }].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '2px', fontWeight: 600 }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-mono-face)', fontSize: '11px', color: 'var(--foreground)', wordBreak: 'break-all' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) { .detail-grid { grid-template-columns: 1fr !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
