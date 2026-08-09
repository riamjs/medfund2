import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client.ts'

type FundraiserStatus =
  | 'pending_review'
  | 'awaiting_donations'
  | 'milestone_pending'
  | 'verified_released'

interface BrowseCard {
  id: string
  patientName: string
  shortCause: string
  milestoneLabel: string
  raised: number
  goal: number
  donorCount: number
  verifierName: string
  status: FundraiserStatus
}

interface BrowseProps {
  onNavigate: (view: string, id?: string) => void
}

const STATUS_LABELS: Record<FundraiserStatus, string> = {
  pending_review: 'Pending verifier review',
  awaiting_donations: 'Awaiting donations',
  milestone_pending: 'Pending verification',
  verified_released: 'Verified — released',
}

const STATUS_STYLES: Record<FundraiserStatus, { bg: string; color: string; dot: string }> = {
  pending_review: { bg: '#EDEDED', color: '#5A5A5A', dot: '#9A9A9A' },
  awaiting_donations: { bg: 'rgba(232,82,122,0.1)', color: '#B84060', dot: '#E8527A' },
  milestone_pending: { bg: '#FFF3DC', color: '#8A5C10', dot: '#D4920A' },
  verified_released: { bg: '#E6F7EE', color: '#1A6635', dot: '#3CAB6A' },
}

const FILTERS: { label: string; value: FundraiserStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending review', value: 'pending_review' },
  { label: 'Awaiting donations', value: 'awaiting_donations' },
  { label: 'Pending verification', value: 'milestone_pending' },
  { label: 'Verified & released', value: 'verified_released' },
]

function deriveStatus(row: any): FundraiserStatus {
  if (row.verification_status !== 'approved') return 'pending_review'
  const milestones = row.milestones ?? []
  const hasMilestones = milestones.length > 0
  const allReleased = hasMilestones && milestones.every((m: any) => m.status === 'released')
  if (allReleased) return 'verified_released'
  const raised = Number(row.current_amount ?? 0)
  const goal = Number(row.target_amount ?? 0)
  if (goal > 0 && raised >= goal) return 'milestone_pending'
  return 'awaiting_donations'
}

function mapRow(row: any): BrowseCard {
  const milestones = row.milestones ?? []
  const nextMilestone = milestones.find((m: any) => m.status !== 'released')
  return {
    id: String(row.id),
    patientName: row.beneficiary_name || row.title || 'Patient',
    shortCause: row.description || row.medical_condition || 'Medical fundraiser',
    milestoneLabel: nextMilestone?.title ?? (milestones.length ? 'All milestones complete' : 'No milestones set'),
    raised: Number(row.current_amount ?? 0),
    goal: Number(row.target_amount ?? 0),
    donorCount: row.donations?.[0]?.count ?? 0,
    verifierName: row.verifier?.verifier_org_name || 'Verifier pending',
    status: deriveStatus(row),
  }
}

export default function Browse({ onNavigate }: BrowseProps) {
  const [filter, setFilter] = useState<FundraiserStatus | 'all'>('all')
  const [fundraisers, setFundraisers] = useState<BrowseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      const { data, error } = await supabase
        .from('fundraisers')
        .select(`
          *,
          verifier:profiles!fundraisers_verifier_id_fkey(verifier_org_name),
          milestones(id, title, status),
          donations(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load fundraisers:', error)
        setLoadError(error.message)
        setLoading(false)
        return
      }

      setFundraisers((data ?? []).map(mapRow))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? fundraisers : fundraisers.filter(f => f.status === filter)

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px' }}>
      <div style={{ marginBottom: '40px' }}>
        <p style={{
          fontFamily: 'var(--font-mono-face)',
          fontSize: '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: '10px',
          fontWeight: 500,
        }}>
          Active fundraisers — Philippines
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: 'var(--foreground)',
          marginBottom: '28px',
          lineHeight: 1.0,
        }}>
          Browse & donate
        </h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 18px',
                borderRadius: '100px',
                border: '2px solid',
                borderColor: filter === f.value ? 'var(--primary)' : 'rgba(232,82,122,0.25)',
                backgroundColor: filter === f.value ? 'var(--primary)' : 'transparent',
                color: filter === f.value ? 'white' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }} className="cards-grid">
        {filtered.map(f => {
          const pct = Math.min(100, Math.round((f.raised / f.goal) * 100))
          const st = STATUS_STYLES[f.status]

          return (
            <article
              key={f.id}
              onClick={() => onNavigate('detail', f.id)}
              style={{
                backgroundColor: '#FDE5C8',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.18s, box-shadow 0.18s',
                display: 'flex',
                flexDirection: 'column',
                border: '1.5px solid rgba(232,82,122,0.15)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(232,82,122,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                height: '6px',
                backgroundColor:
                  f.status === 'verified_released' ? '#3CAB6A'
                  : f.status === 'milestone_pending' ? '#D4920A'
                  : 'var(--primary)',
              }} />

              <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: st.bg,
                  color: st.color,
                  borderRadius: '100px',
                  padding: '4px 12px',
                  marginBottom: '14px',
                  alignSelf: 'flex-start',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.dot, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono-face)', fontSize: '10px', letterSpacing: '0.06em', fontWeight: 500 }}>
                    {STATUS_LABELS[f.status]}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '20px',
                  fontWeight: 800,
                  marginBottom: '4px',
                  color: 'var(--foreground)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}>
                  {f.patientName}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--muted-foreground)',
                  marginBottom: '18px',
                  flex: 1,
                  fontWeight: 500,
                }}>
                  {f.shortCause}
                </p>

                <div style={{
                  backgroundColor: 'rgba(232,82,122,0.08)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-mono-face)',
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                    marginBottom: '3px',
                    fontWeight: 500,
                  }}>Milestone</p>
                  <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.4, fontWeight: 600 }}>
                    {f.milestoneLabel}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono-face)',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: 'var(--primary)',
                    }}>
                      {f.raised.toLocaleString()}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono-face)',
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                    }}>
                      of {f.goal.toLocaleString()} USDC · {pct}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: 'rgba(232,82,122,0.18)',
                    borderRadius: '100px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: pct >= 100 ? '#3CAB6A' : 'var(--primary)',
                      borderRadius: '100px',
                    }} />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '6px', fontWeight: 500 }}>
                    {f.donorCount} donor{f.donorCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{
                padding: '14px 22px',
                borderTop: '1px solid rgba(232,82,122,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono-face)',
                  fontSize: '10px',
                  color: 'var(--muted-foreground)',
                }}>
                  {f.verifierName.split(' ').slice(0, 3).join(' ')}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--primary)',
                  fontWeight: 800,
                }}>
                  Donate →
                </span>
              </div>
            </article>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 900px) { .cards-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 560px) { .cards-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  )
}
