// ── Mic Button ───────────────────────────────────────────────

export default function MicBtn({ state, onStart, onStop }) {
  const isListening = state === 'listening'
  const isLoading   = state === 'loading'

  return (
    <button
      onClick={isListening ? onStop : (isLoading ? null : onStart)}
      disabled={isLoading}
      style={{
        width: 96, height: 96, borderRadius: '50%', border: 'none',
        cursor: isLoading ? 'default' : 'pointer', outline: 'none',
        position: 'relative', zIndex: 10,
        background: isListening
          ? 'radial-gradient(circle at 38% 32%, #3b0764 0%, #1e0533 100%)'
          : isLoading
          ? 'radial-gradient(circle at 38% 32%, #1a2540 0%, #0e1628 100%)'
          : 'radial-gradient(circle at 38% 32%, #1c2233 0%, #0b0f1a 100%)',
        boxShadow: isListening
          ? '0 0 0 3px rgba(167,139,250,0.4), 0 0 40px rgba(124,58,237,0.6)'
          : '0 0 22px rgba(59,130,246,0.27), 0 4px 14px rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.35s cubic-bezier(.4,2,.5,1)',
        animation: isListening ? 'none' : isLoading ? 'none' : 'micFloat 3s ease-in-out infinite',
        transform: isListening ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      {isLoading ? (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="15" cy="15" r="12" stroke="rgba(99,102,241,0.3)" strokeWidth="3" />
          <path d="M15 3 A12 12 0 0 1 27 15" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : isListening ? (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="7" y="7" width="14" height="14" rx="3" fill="#f87171" />
        </svg>
      ) : (
        <svg width="34" height="34" viewBox="0 0 38 38" fill="none">
          <rect x="13" y="4" width="12" height="18" rx="6" fill="#60a5fa" />
          <path d="M7 19c0 6.627 5.373 12 12 12s12-5.373 12-12" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line x1="19" y1="31" x2="19" y2="36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="36" x2="24" y2="36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}