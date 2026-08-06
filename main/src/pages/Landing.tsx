import heroIllustration from '../imports/medfundlogo.png'

interface LandingProps {
  onNavigate: (view: string) => void
}

const steps = [
  {
    number: '01',
    title: 'Create',
    description: 'A patient or family sets up a fundraiser with a specific medical milestone — surgery, dialysis, chemo.',
  },
  {
    number: '02',
    title: 'Donate',
    description: 'Donors send USDC to a smart contract escrow. Funds are held on-chain, visible to anyone.',
  },
  {
    number: '03',
    title: 'Verify',
    description: 'A partner hospital or NGO confirms treatment completion on-chain. No middlemen.',
  },
  {
    number: '04',
    title: 'Release',
    description: 'Once verified, the escrow releases funds to the hospital. Donors see the transaction.',
  },
]

const stats = [
  { value: '₱6.2M', label: 'raised in USDC' },
  { value: '491', label: 'donors worldwide' },
  { value: '23', label: 'treatments verified' },
  { value: '100%', label: 'on-chain transparent' },
]

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '100px',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.18s',
  letterSpacing: '0.01em',
}

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <main style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 32px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          alignItems: 'center',
          minHeight: '520px',
        }}
        className="hero-grid"
      >
        {/* Left copy */}
        <div style={{ paddingBottom: '48px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(48px, 6.5vw, 88px)',
              fontWeight: 900,
              lineHeight: 1.0,
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            Give with<br />
            <span style={{ color: 'var(--primary)' }}>confidence.</span>
          </h1>
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.7,
              color: 'var(--muted-foreground)',
              marginBottom: '36px',
              maxWidth: '440px',
              fontWeight: 500,
            }}
          >
            MedFund locks donations in escrow and releases them only when a
            verified Philippine hospital confirms treatment happened. Every peso,
            tracked on-chain.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('browse')}
              style={{
                ...pillStyle,
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '14px 32px',
                boxShadow: '0 8px 24px rgba(232,82,122,0.35)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(232,82,122,0.45)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,82,122,0.35)' }}
            >
              Browse fundraisers
            </button>
            <button
              onClick={() => onNavigate('browse')}
              style={{
                ...pillStyle,
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                padding: '14px 8px',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Show more
            </button>
          </div>

          {/* Carousel dots */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '48px', alignItems: 'center' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: i === 1 ? '24px' : '10px',
                height: '10px',
                borderRadius: '100px',
                backgroundColor: i === 1 ? 'var(--primary)' : 'rgba(232,82,122,0.25)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        </div>

        {/* Right — illustration */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <img
            src={heroIllustration}
            alt="Tiny people collecting hearts in a jar — illustration of generous giving"
            style={{
              width: '100%',
              maxWidth: '580px',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '24px 24px 0 0',
            }}
          />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ backgroundColor: 'rgba(232,82,122,0.08)', margin: '0', padding: '0' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
          }}
          className="stats-grid"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '8px 16px',
                borderRight: i < stats.length - 1 ? '1px solid rgba(232,82,122,0.2)' : 'none',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '32px',
                fontWeight: 900,
                color: 'var(--primary)',
                marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '96px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p style={{
            fontFamily: 'var(--font-mono-face)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: '14px',
            fontWeight: 500,
          }}>
            The process
          </p>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--foreground)',
            lineHeight: 1.1,
          }}>
            How every peso is tracked.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            position: 'relative',
          }}
          className="steps-grid"
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                backgroundColor: i === 3 ? 'var(--primary)' : 'rgba(232,82,122,0.08)',
                borderRadius: '24px',
                padding: '32px 24px',
                position: 'relative',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: i === 3 ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono-face)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                }}>
                  {step.number}
                </span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 800,
                marginBottom: '10px',
                color: i === 3 ? 'white' : 'var(--foreground)',
                letterSpacing: '-0.01em',
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: '14px',
                lineHeight: 1.65,
                color: i === 3 ? 'rgba(255,255,255,0.8)' : 'var(--muted-foreground)',
                fontWeight: 500,
              }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section style={{
        backgroundColor: 'var(--foreground)',
        padding: '80px 32px',
        margin: '0',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }}
          className="trust-grid"
        >
          <div>
            <p style={{
              fontFamily: 'var(--font-mono-face)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(252,207,164,0.5)',
              marginBottom: '16px',
              fontWeight: 500,
            }}>
              Why donors trust us
            </p>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: 900,
              color: '#FCCFA4',
              letterSpacing: '-0.03em',
              marginBottom: '32px',
              lineHeight: 1.1,
            }}>
              Funds never touch anyone's hands until treatment is confirmed.
            </h2>
            <button
              onClick={() => onNavigate('browse')}
              style={{
                ...pillStyle,
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '13px 28px',
                boxShadow: '0 8px 24px rgba(232,82,122,0.4)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              See verified fundraisers →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '🔒', title: 'Smart contract escrow', desc: 'USDC is held by code, not a person. The contract is public and auditable on Stellar.' },
              { icon: '🏥', title: 'Hospital & NGO verifiers', desc: 'Only registered Philippine health institutions can release milestone funds.' },
              { icon: '📋', title: 'Full on-chain audit trail', desc: 'Every donation, verification, and release is recorded on Stellar Mainnet.' },
            ].map(item => (
              <div key={item.title} style={{
                backgroundColor: 'rgba(252,207,164,0.07)',
                border: '1px solid rgba(252,207,164,0.12)',
                borderRadius: '20px',
                padding: '18px 22px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#FCCFA4', marginBottom: '4px', fontSize: '15px' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(252,207,164,0.55)', lineHeight: 1.55, fontWeight: 500 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; padding-bottom: 40px !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .stats-grid > div { border-right: none !important; border-bottom: 1px solid rgba(232,82,122,0.15); padding-bottom: 20px; margin-bottom: 8px; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .trust-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 560px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
