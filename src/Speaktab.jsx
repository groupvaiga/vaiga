import MicBtn from './Micbtn'
import ChromeFallbackOrb from './ChromeFallbackOrb'
import SilencePrompt from './SilencePrompt'
import TranscriptCard from './Transcriptcard'

// ── Speak Tab ─────────────────────────────────────────────────

export default function SpeakTab({
  micState,
  transcript,
  error,
  showFBO,
  showSilencePrompt,
  webGLSupported,
  analyserRef,
  volumeRef,
  FBOScene,
  onStart,
  onStop,
  onFinish,
  onContinue,
  onClear,
}) {
  const isListening = micState === 'listening'

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px', overflowY: 'auto',
    }}>
      {/* Heading */}
      <h1 style={{
        fontFamily: 'Syne,sans-serif', fontWeight: 700,
        fontSize: 'clamp(18px,2.8vw,28px)', color: '#e2e8f0',
        marginBottom: 6, letterSpacing: '-.02em',
        textAlign: 'center', transition: 'all .4s',
      }}>
        {micState === 'idle' && !transcript && 'Hi, welcome back'}
        {micState === 'listening' && '🎙 Listening now…'}
        {micState === 'loading' && 'Processing…'}
        {micState === 'idle' && transcript && "Here's what you said"}
      </h1>

      <p style={{
        fontSize: 12, letterSpacing: '.05em', marginBottom: 36,
        textAlign: 'center', transition: 'all .4s',
        color: isListening ? '#94a3b8' : '#3d4a5c',
      }}>
        {micState === 'idle' && !transcript && 'Click the mic and speak in Telugu'}
        {micState === 'listening' && 'Streaming to Azure · speak freely'}
        {micState === 'loading' && 'Finalising transcript…'}
        {micState === 'idle' && transcript && 'Powered by Azure · Telugu'}
      </p>

      {/* Orb */}
      <div style={{
        position: 'relative', width: 400, height: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {showFBO && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: 360, height: 360,
            animation: 'fboFadeIn 0.5s ease both',
            zIndex: 1, overflow: 'hidden',
          }}>
            {webGLSupported ? (
              <FBOScene containerSize={360} analyserRef={analyserRef} volumeRef={volumeRef} />
            ) : (
              <ChromeFallbackOrb volumeRef={volumeRef} />
            )}
          </div>
        )}
        <div style={{
          position: 'relative', zIndex: 2,
          opacity: showFBO ? 0 : 1,
          pointerEvents: showFBO ? 'none' : 'auto',
          transition: 'opacity 0.4s ease',
        }}>
          <MicBtn state={micState} onStart={onStart} onStop={onStop} />
        </div>
      </div>

      {/* Status label */}
      <div style={{
        marginTop: 12, fontSize: 11,
        letterSpacing: '.16em', textTransform: 'uppercase',
        fontFamily: 'Syne,sans-serif',
        color: isListening
          ? '#a78bfa'
          : micState === 'loading'
          ? '#60a5fa'
          : '#374151',
        animation: isListening ? 'labelPulse 1.1s ease-in-out infinite alternate' : 'none',
      }}>
        {micState === 'idle' && 'Click to speak'}
        {micState === 'listening' && 'Streaming live · 4s silence = auto submit'}
        {micState === 'loading' && 'Processing…'}
      </div>

      {/* Silence prompt */}
      {showSilencePrompt && micState === 'listening' && (
        <SilencePrompt onYes={onFinish} onNo={onContinue} />
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 20, padding: '12px 20px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, color: '#fca5a5',
          fontSize: 13, maxWidth: 480,
          textAlign: 'center', animation: 'fadeUp .3s ease both',
        }}>
          {error}
        </div>
      )}

      {/* Transcript */}
      {transcript && <TranscriptCard text={transcript} onClear={onClear} />}
    </div>
  )
}