// ── Input Bar ────────────────────────────────────────────────

export default function InputBar({
  micState,
  inputText,
  setInputText,
  showAttachMenu,
  setShowAttachMenu,
  onStartListening,
  onStopListening,
  onScreenShare,
}) {
  const isListening = micState === 'listening'

  // ✅ SAFE VALUE (IMPORTANT FIX)
  const safeText = inputText || ''

  return (
    <div style={{ padding: '0 20px 20px', flexShrink: 0, zIndex: 30 }}>
      <div style={{
        background: 'rgba(9,16,30,0.95)',
        border: `1px solid ${isListening ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 700,
        margin: '0 auto',
        boxShadow: isListening
          ? '0 0 0 1px rgba(239,68,68,0.12), 0 4px 24px rgba(0,0,0,0.6)'
          : '0 4px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(14px)',
        position: 'relative',
      }}>

        {/* ➕ Attach button */}
        <button
          onClick={() => setShowAttachMenu(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: '#252f40',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          +
        </button>

        {/* 📂 Dropdown */}
        {showAttachMenu && (
          <div style={{
            position: 'absolute',
            bottom: 52,
            left: 12,
            background: 'rgba(15,15,25,0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '6px',
            zIndex: 50,
            minWidth: 180,
          }}>
            <div
              onClick={onScreenShare}
              style={{
                padding: '9px 12px',
                cursor: 'pointer',
                borderRadius: 8,
                color: '#cbd5f5',
              }}
            >
              📺 Share Screen
            </div>
          </div>
        )}

        {/* 📝 Input */}
        <input
          placeholder={isListening ? '🔴 Listening… speak now' : 'Message Vaiga'}
          value={safeText} // ✅ FIXED
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && safeText.trim()) {
              setInputText('')
            }
          }}
          disabled={isListening || micState === 'loading'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff'
          }}
        />

        {/* 🎤 Mic */}
        <button
          onClick={
            isListening
              ? onStopListening
              : micState === 'idle'
              ? onStartListening
              : undefined
          }
          disabled={micState === 'loading'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: isListening ? '#ef4444' : '#1f2937',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          🎤
        </button>

        {/* 📤 Send */}
        <button
          onClick={() => {
            if (safeText.trim()) setInputText('')
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: safeText.trim()
              ? 'linear-gradient(135deg,#3b82f6,#0ea5e9)'
              : '#0d1117',
            cursor: safeText.trim() ? 'pointer' : 'default',
          }}
        >
          ➤
        </button>

      </div>
    </div>
  )
}