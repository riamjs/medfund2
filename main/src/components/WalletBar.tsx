import { useState } from 'react'

interface WalletBarProps {
  walletAddress: string | null
  balance: string | null
  onConnect: () => void
  onDisconnect: () => void
  currentView: string
  onNavigate: (view: string) => void
  session: any
  onSignOut: () => void
}

export default function WalletBar({
  walletAddress,
  balance,
  onConnect,
  onDisconnect,
  currentView,
  onNavigate,
  session,
  onSignOut,
}: WalletBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  const short = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null

  const initials = session?.user?.user_metadata?.full_name
    ? session.user.user_metadata.full_name
        .split(' ')
        .map((p: string) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      style={{
        backgroundColor: 'var(--background)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(232,82,122,0.12)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 32px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => onNavigate('landing')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            Med
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Fund
          </span>
        </button>

        {/* Nav links */}
        <nav
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          className="nav-links"
        >
          {[
            { label: 'Browse', view: 'browse' },
            { label: 'About', view: 'landing' },
            { label: 'Start a Fundraiser', view: 'create' },
            ...(session ? [{ label: 'My Donations', view: 'donations' }] : []),
          ].map(({ label, view }) => (
            <button
              key={view + label}
              onClick={() => onNavigate(view)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 16px',
                borderRadius: '100px',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: currentView === view ? 700 : 500,
                color: currentView === view ? 'var(--foreground)' : 'var(--muted-foreground)',
                backgroundColor: currentView === view ? 'rgba(232,82,122,0.1)' : 'transparent',
                transition: 'all 0.15s',
                textDecoration: currentView === view && label === 'About' ? 'underline' : 'none',
                textUnderlineOffset: '3px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--foreground)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = currentView === view ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Wallet / account / actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {walletAddress ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(232,82,122,0.12)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '100px',
                  padding: '7px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(232,82,122,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(232,82,122,0.12)' }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF7A',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono-face)',
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    fontWeight: 500,
                  }}
                >
                  {short}
                </span>
                {balance && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono-face)',
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {balance} USDC
                  </span>
                )}
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: '#FDE5C8',
                    border: '1.5px solid var(--border)',
                    borderRadius: '16px',
                    padding: '6px',
                    minWidth: '170px',
                    boxShadow: '0 8px 32px rgba(232,82,122,0.15)',
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={() => { onDisconnect(); setMenuOpen(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '9px 14px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--foreground)',
                      borderRadius: '12px',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(232,82,122,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    Disconnect wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onConnect}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                border: '2px solid var(--primary)',
                borderRadius: '100px',
                padding: '7px 20px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 700,
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--primary)'
              }}
            >
              Connect Wallet
            </button>
          )}

          {/* Supabase account menu */}
          {session ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {initials}
              </button>
              {accountMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: '#FDE5C8',
                    border: '1.5px solid var(--border)',
                    borderRadius: '16px',
                    padding: '6px',
                    minWidth: '170px',
                    boxShadow: '0 8px 32px rgba(232,82,122,0.15)',
                    zIndex: 100,
                  }}
                >
                  {[
                    { label: 'My Donations', view: 'donations' },
                    { label: 'Profile', view: 'profile' },
                  ].map(({ label, view }) => (
                    <button
                      key={view}
                      onClick={() => { onNavigate(view); setAccountMenuOpen(false) }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '9px 14px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--foreground)',
                        borderRadius: '12px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(232,82,122,0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {label}
                    </button>
                  ))}
                  <div style={{ height: '1px', backgroundColor: 'rgba(232,82,122,0.15)', margin: '4px 6px' }} />
                  <button
                    onClick={() => { onSignOut(); setAccountMenuOpen(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '9px 14px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#C0392B',
                      borderRadius: '12px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(192,57,43,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '7px 16px',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--muted-foreground)',
                borderRadius: '100px',
              }}
              className="login-btn"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 700px) {
          .nav-links { display: none !important; }
          .login-btn { display: none !important; }
        }
      `}</style>
    </header>
  )
}