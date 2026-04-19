// ── Silence Prompt ───────────────────────────────────────────

export default function SilencePrompt({ onYes, onNo }) {
  return (
    <div style={{
      marginTop: 20,
      background: 'rgba(15,15,30,0.95)',
      border: '1px solid rgba(167,139,250,0.35)',
      borderRadius: 14, padding: '16px 22px',
      backdropFilter: 'blur(14px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'fadeUp 0.3s ease both',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      maxWidth: 340, width: '90%',
    }}>
      <p style={{
        fontSize: 14, color: '#c4b5fd',
        fontFamily: 'Syne,sans-serif', textAlign: 'center', margin: 0,
      }}>
        Are you finished speaking?
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onYes}
          style={{
            padding: '8px 28px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 600,
            fontSize: 13, cursor: 'pointer',
            boxShadow: '0 0 14px rgba(124,58,237,0.4)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Yes, done
        </button>
        <button
          onClick={onNo}
          style={{
            padding: '8px 28px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8', fontFamily: 'Syne,sans-serif', fontWeight: 600,
            fontSize: 13, cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          No, continue
        </button>
      </div>
    </div>
  )
}