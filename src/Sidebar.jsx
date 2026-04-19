// ── Sidebar ──────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: '✦', label: 'New Session', action: 'onNewChat' },
  { icon: '⌕', label: 'Transcripts',  action: null },
  { icon: '◎', label: 'Voice Clips',  action: null },
  { icon: '⊞', label: 'Notebooks',    action: null },
  { icon: '◈', label: 'My Library',   action: null },
]

export default function Sidebar({ onNewChat, activeItem, setActiveItem }) {
  const resolveAction = (key) => key === 'onNewChat' ? onNewChat : null

  return (
    <div style={{
      width: 220, height: '100vh',
      background: '#0b1629',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, backdropFilter: 'blur(20px)', zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)',
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, flexShrink: 0,
          boxShadow: '0 0 18px rgba(14,165,233,0.5)',
        }}>🎙</div>
        <div>
          <div style={{
            fontFamily: 'Syne,sans-serif', fontWeight: 700,
            fontSize: 13, color: '#e2e8f0', lineHeight: 1.2,
          }}>
            Vaiga
          </div>
          <div style={{
            fontSize: 9, color: '#334155',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2,
          }}>
            AI Voice Assistant
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '14px 10px', flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => {
              setActiveItem(item.label)
              const action = resolveAction(item.action)
              if (action) action()
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none',
              background: activeItem === item.label
                ? 'linear-gradient(90deg,rgba(14,165,233,0.18),rgba(59,130,246,0.08))'
                : 'transparent',
              color: activeItem === item.label ? '#7dd3fc' : '#4b5563',
              cursor: 'pointer', textAlign: 'left', marginBottom: 3,
              transition: 'all 0.18s',
              borderLeft: activeItem === item.label
                ? '2px solid #0ea5e9'
                : '2px solid transparent',
            }}
            onMouseEnter={e => {
              if (activeItem !== item.label) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#94a3b8'
              }
            }}
            onMouseLeave={e => {
              if (activeItem !== item.label) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#4b5563'
              }
            }}
          >
            <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>
              {item.icon}
            </span>
            <span style={{
              fontFamily: 'Syne,sans-serif', fontSize: 12,
              fontWeight: 600, letterSpacing: '0.03em',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* User footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 10px rgba(124,58,237,0.35)',
        }}>MP</div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            Mudunuri Prashanth
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#4ade80', boxShadow: '0 0 6px #4ade80',
            }} />
            <span style={{ fontSize: 9, color: '#374151', letterSpacing: '0.08em' }}>
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}