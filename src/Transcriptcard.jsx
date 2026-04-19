// ── Transcript Card ──────────────────────────────────────────

export default function TranscriptCard({ text, onClear }) {
  return (
    <div style={{
      marginTop: 28, maxWidth: 560, width: '90%',
      background: 'rgba(15,15,25,0.92)',
      border: '1px solid rgba(99,102,241,0.35)',
      borderRadius: 16, padding: '20px 24px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{
            fontSize: 11, color: '#6ee7b7',
            letterSpacing: '.1em', textTransform: 'uppercase',
            fontFamily: 'Syne,sans-serif',
          }}>
            Telugu Transcript
          </span>
        </div>
        <button
          onClick={onClear}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}
        >
          ×
        </button>
      </div>
      <p style={{
        fontSize: 17, lineHeight: 1.75, color: '#e2e8f0',
        fontFamily: 'Noto Sans Telugu, Syne, sans-serif',
        wordBreak: 'break-word',
      }}>
        {text}
      </p>
    </div>
  )
}