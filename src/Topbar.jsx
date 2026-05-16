// ── Topbar ───────────────────────────────────────────────────

export default function Topbar({ onNewChat }) {
  return (
    <div style={{
      height: 50, flexShrink: 0,
      background: 'rgba(11,22,41,0.9)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', justifyContent: 'space-between',
      backdropFilter: 'blur(16px)', zIndex: 30,
    }}>
      <span style={{
        fontFamily: 'Syne,sans-serif', fontWeight: 600,
        fontSize: 13, color: '#374151',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        Vaiga
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2d3748" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>

        {/* New chat */}
        <button
          onClick={onNewChat}
          title="New chat"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
          onMouseLeave={e => e.currentTarget.style.color = '#374151'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Settings */}
        <button
          title="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
          onMouseLeave={e => e.currentTarget.style.color = '#374151'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Mini View */}
        <button
          title="Mini View"
          onClick={() => window.open(
            window.location.origin + '?mini=true',
            'vaiga-mini',
            'width=300,height=380,resizable=no,menubar=no,toolbar=no,location=no,status=no'
          )}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
          onMouseLeave={e => e.currentTarget.style.color = '#374151'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer',
          boxShadow: '0 0 10px rgba(124,58,237,0.3)',
        }}>MP</div>

      </div>
    </div>
  )
}