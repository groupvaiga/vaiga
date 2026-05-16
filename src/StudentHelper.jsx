/* global chrome */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
const VM2_URL    = 'https://40.76.107.196'
const WS_URL     = 'wss://40.76.107.196/live'
const AGENT      = 'https://127.0.0.1:9999'
const SILENCE_MS = 2500

function speakText(text, onStart, onEnd) {
  if (!text) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const speak = () => {
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'; utt.rate = 1; utt.pitch = 1; utt.volume = 1
    const voices    = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Microsoft'))
    if (preferred) utt.voice = preferred
    utt.onstart = () => onStart?.()
    utt.onend   = () => onEnd?.()
    utt.onerror = () => onEnd?.()
    window.speechSynthesis.speak(utt)
  }
  if (window.speechSynthesis.getVoices().length > 0) speak()
  else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; speak() } }
}

export default function StudentHelper() {
 const navigate = useNavigate()
  const [sessionId,     setSessionId]     = useState('')
  const [connected,     setConnected]     = useState(false)
  const [screenStream,  setScreenStream]  = useState(null)
  const [answer,        setAnswer]        = useState('')
  const [question,      setQuestion]      = useState('')
  const [arrow,         setArrow]         = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [speaking,      setSpeaking]      = useState(false)
  const [micState,      setMicState]      = useState('idle')
  const [transcript,    setTranscript]    = useState('')
  const [autoMode,      setAutoMode]      = useState(false)
  const [autoCountdown, setAutoCountdown] = useState(0)
  const [stepResult,    setStepResult]    = useState('')
  const [pageState,     setPageState]     = useState('')

  // ── GPS State ─────────────────────────────────────────────
  const [steps,       setSteps]       = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [stepCount,   setStepCount]   = useState(0)

  const videoRef        = useRef(null)
  const wsRef           = useRef(null)
  const micStreamRef    = useRef(null)
  const audioCtxRef     = useRef(null)
  const processorRef    = useRef(null)
  const silenceTimer    = useRef(null)
  const lastText        = useRef('')
  const isSpeaking      = useRef(false)
  const currentUrlRef   = useRef('')
  const currentTitleRef = useRef('')
  const autoTimerRef    = useRef(null)
  const countdownRef    = useRef(null)
  const autoModeRef     = useRef(false)
  const stepsRef        = useRef([])
  const currentStepRef  = useRef(0)

  useEffect(() => { autoModeRef.current    = autoMode    }, [autoMode])
  useEffect(() => { stepsRef.current       = steps       }, [steps])
  useEffect(() => { currentStepRef.current = currentStep }, [currentStep])

  // Fix ResizeObserver
  useEffect(() => {
    const h = (e) => {
      if (e.message?.includes('ResizeObserver')) {
        const el = document.getElementById('webpack-dev-server-client-overlay')
        if (el) el.style.display = 'none'
      }
    }
    window.addEventListener('error', h)
    return () => window.removeEventListener('error', h)
  }, [])

  // Keep speech alive
  useEffect(() => {
    const iv = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause(); window.speechSynthesis.resume()
      }
    }, 10000)
    return () => clearInterval(iv)
  }, [])

  // URL sync
  useEffect(() => {
    const iv = setInterval(() => {
      if (!window.chrome?.runtime?.id) return
      try {
        chrome.runtime.sendMessage({ type:'get-page-info' }, (res) => {
          if (chrome.runtime.lastError) return
          if (!res) return
          currentUrlRef.current   = res.url   || ''
          currentTitleRef.current = res.title || ''
        })
      } catch {}
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    return () => {
      screenStream?.getTracks().forEach(t => t.stop())
      window.speechSynthesis.cancel()
    }
  }, [screenStream])

  // ── Screenshot — 1280x800 for HiDPI ──────────────────────
  const captureScreen = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width  = 1280  // ✅ was 640
    canvas.height = 800   // ✅ was 400
    canvas.getContext('2d').drawImage(v, 0, 0, 1280, 800)
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
  }, [])

    const detectCurrentStep = useCallback((loadedSteps) => {
  const currUrl = currentUrlRef.current
  if (!currUrl) return 0
  let bestMatch = 0
  loadedSteps.forEach((step, idx) => {
    if (!step.url) return
    try {
      const stepHost = new URL(step.url).hostname
      const currHost = new URL(currUrl).hostname
      if (stepHost === currHost) {
        bestMatch = idx
      }
    } catch {}
  })
  return bestMatch
}, [])

  // ── Auto click ────────────────────────────────────────────
  const doClick = useCallback(async (x_pct, y_pct, typed='', target='') => {
    if (y_pct > 92 || y_pct < 5 || x_pct < 3 || x_pct > 97) {
      console.log('⚠️ Unsafe coords skipped:', x_pct, y_pct)
      return
    }
    console.log('🖱️ Sending:', { x_pct, y_pct, typed, target })
    try {
      const r    = await fetch(`${AGENT}/click`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ x_pct, y_pct, typed, target })
      })
      const data = await r.json()
      console.log('Agent:', data)
    } catch (e) { console.log('⚠️ agent.py not running', e) }
  }, [])

  // ── GPS: Guide current step ───────────────────────────────
  const guideCurrentStep = useCallback((idx) => {
    const all = stepsRef.current
    if (!all.length || idx >= all.length) {
      setAnswer('✅ All steps complete! Workflow done!')
      setArrow(null); return
    }
    const step = all[idx]
    const desc = step.voice || step.description || `Step ${step.step}`

    setAnswer(`Step ${idx+1}/${all.length}: ${desc}`)
    setStepResult(`📍 Step ${idx+1} of ${all.length}`)

    if (step.x_pct && step.y_pct) {
      setArrow({ x: step.x_pct, y: step.y_pct })
      setTimeout(() => setArrow(null), 8000)
    }

    isSpeaking.current = true
    speakText(desc,
      () => setSpeaking(true),
      () => { setSpeaking(false); isSpeaking.current = false })

    console.log(`📍 GPS Step ${idx+1}: ${desc}`)
  }, [])

  // ── GPS: Verify + Advance ─────────────────────────────────
  const verifyAndAdvance = useCallback(async () => {
    const all = stepsRef.current
    const idx = currentStepRef.current
    if (idx >= all.length) return

    const step = all[idx]

    // URL check — right page?
    try {
      const stepHost = step.url ? new URL(step.url).hostname : ''
      const currHost = currentUrlRef.current ? new URL(currentUrlRef.current).hostname : ''
      if (stepHost && currHost && stepHost !== currHost) {
        setStepResult(`⚠️ Go to: ${step.url} first!`)
        setAnswer(`Please navigate to ${step.url}`)
        return
      }
    } catch {}

    // Auto click using GPS coordinates
    if (step.x_pct && step.y_pct && autoModeRef.current) {
      setStepResult('🖱️ Clicking...')
      await doClick(step.x_pct, step.y_pct, step.typed || '', step.target || '')
      await new Promise(r => setTimeout(r, 2000))
      setStepResult(`✅ Step ${idx+1} done!`)

      const next = idx + 1
      setCurrentStep(next)
      currentStepRef.current = next
      setTimeout(() => guideCurrentStep(next), 1500)
    }
  }, [doClick, guideCurrentStep])

  // ── Manual question → guided_ask ─────────────────────────
  const askVaiga = useCallback(async (text) => {
    if (!text || !connected) return
    if (!screenStream) { setAnswer('Share your screen first!'); return }

    setLoading(true); setArrow(null); setStepResult('')
    try {
      const img = captureScreen()
      const r   = await fetch(`${VM2_URL}/guided_ask`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          session_id:    sessionId,
          question:      text,
          image:         img || '',
          url:           currentUrlRef.current   || '',
          title:         currentTitleRef.current || '',
          screen_width:  window.screen.width,
          screen_height: window.screen.height,
        })
      })
      const data        = await r.json()
      const finalAnswer = data.answer || 'No guidance available.'
      setAnswer(finalAnswer)
      if (data.page_state) setPageState(data.page_state)

      if (data.next_x !== null && data.next_x !== undefined) {
        setArrow({ x: data.next_x, y: data.next_y })
        setTimeout(() => setArrow(null), 10000)
      }

      isSpeaking.current = true
      speakText(finalAnswer,
        () => setSpeaking(true),
        () => { setSpeaking(false); isSpeaking.current = false })

    } catch (err) {
      if (err.name === 'AbortError') setAnswer('Request timed out.')
      else setAnswer('Error connecting.')
      setSpeaking(false)
    } finally { setLoading(false) }
  }, [connected, sessionId, captureScreen, screenStream])

  // ── Auto mode — GPS ONLY, no Qwen ────────────────────────
  useEffect(() => {
    clearInterval(autoTimerRef.current)
    clearInterval(countdownRef.current)
    setAutoCountdown(0)
    if (!autoMode || !connected || !screenStream) return

    // Guide current step immediately
    guideCurrentStep(currentStepRef.current)

    let count = 8; setAutoCountdown(count)
    countdownRef.current = setInterval(() => {
      count -= 1; setAutoCountdown(count)
      if (count <= 0) count = 8
    }, 1000)

    // GPS only — NO askVaiga ✅
    autoTimerRef.current = setInterval(() => {
      if (loading || isSpeaking.current) return
      if (!screenStream) return
      verifyAndAdvance()
    }, 8000)

    return () => {
      clearInterval(autoTimerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [autoMode, connected, screenStream, loading, guideCurrentStep, verifyAndAdvance])

  // ── Mic ───────────────────────────────────────────────────
  const stopMic = useCallback(() => {
    clearTimeout(silenceTimer.current)
    processorRef.current?.disconnect(); processorRef.current = null
    micStreamRef.current?.getTracks().forEach(t => t.stop()); micStreamRef.current = null
    audioCtxRef.current?.close(); audioCtxRef.current = null
    wsRef.current?.close(); wsRef.current = null
    lastText.current = ''; setMicState('idle')
  }, [])

  const startListening = useCallback(async () => {
    if (isSpeaking.current) return
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio:true })
      micStreamRef.current = micStream
      const audioCtx  = new (window.AudioContext || window.webkitAudioContext)({ sampleRate:16000 })
      await audioCtx.resume(); audioCtxRef.current = audioCtx
      const source    = audioCtx.createMediaStreamSource(micStream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      const gainNode  = audioCtx.createGain(); gainNode.gain.value = 0
      source.connect(processor); processor.connect(gainNode); gainNode.connect(audioCtx.destination)
      processorRef.current = processor

      const ws = new WebSocket(WS_URL); wsRef.current = ws
      const sendAudio = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const input  = e.inputBuffer.getChannelData(0)
        const buffer = new ArrayBuffer(input.length * 2)
        const view   = new DataView(buffer)
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]))
          view.setInt16(i * 2, s * 0x7fff, true)
        }
        ws.send(buffer)
      }

      ws.onopen = () => {
        setMicState('listening'); setTranscript('Listening...')
        processor.onaudioprocess = sendAudio
      }

      ws.onmessage = async (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'transcript') {
            const text = (data.full || '').trim()
            if (!text) return
            setTranscript(text)
            if (text !== lastText.current) {
              lastText.current = text
              clearTimeout(silenceTimer.current)
              silenceTimer.current = setTimeout(async () => {
                setMicState('thinking')
                processor.onaudioprocess = null

                // Voice command: "next/done" → GPS advance
                if (/\b(next|done|continue|proceed)\b/i.test(text)) {
                  const next = currentStepRef.current + 1
                  setCurrentStep(next)
                  currentStepRef.current = next
                  guideCurrentStep(next)
                } else {
                  // Other questions → guided_ask
                  await askVaiga(text)
                }

                lastText.current = ''; setTranscript('')
                if (processor && ws.readyState === WebSocket.OPEN) {
                  setMicState('listening'); processor.onaudioprocess = sendAudio
                }
              }, SILENCE_MS)
            }
          }
        } catch {}
      }
      ws.onerror = () => console.log('WS error')
      ws.onclose = () => console.log('WS closed')
    } catch (e) { console.error('Mic error:', e); setMicState('idle') }
  }, [askVaiga, guideCurrentStep])

  const handleMicClick = () => {
    if (micState === 'idle') startListening()
    else { window.speechSynthesis.cancel(); stopMic(); setTranscript('') }
  }

  // ── Connect session — store steps ────────────────────────
  // Current connectSession:
const connectSession = async () => {
  if (!sessionId.trim()) return alert('Enter session ID')
  try {
    const r    = await fetch(`${VM2_URL}/load_session/${encodeURIComponent(sessionId)}`)
    const data = await r.json()
    if (data.events?.length > 0) {
      setSteps(data.events)
      stepsRef.current   = data.events
      setStepCount(data.events.length)

      // ✅ Replace this:
      // setCurrentStep(0)
      // currentStepRef.current = 0

      // ✅ With this:
      const startStep = detectCurrentStep(data.events)
      setCurrentStep(startStep)
      currentStepRef.current = startStep

      setConnected(true)
      setAnswer(`✅ ${data.events.length} steps loaded! Starting from step ${startStep + 1}.`)
    } else alert('Session not found or empty!')
  } catch { alert('Connection failed!') }
}

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width:{ ideal:1920 }, height:{ ideal:1080 } }, audio:false
      })
      setScreenStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null)
        if (videoRef.current) videoRef.current.srcObject = null
      }
    } catch (err) { console.error(err) }
  }

  const askTextQuestion = async () => {
    if (!question.trim()) return
    await askVaiga(question); setQuestion('')
  }

  const micColor = { idle:'#6366f1', listening:'#10b981', thinking:'#f59e0b' }
  const micLabel = { idle:'🎤 Start Assistant', listening:'🟢 Always Listening', thinking:'🧠 Thinking...' }

  const s = {
    page: {
      minHeight: '100vh',
      background: `
        radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 25%),
        radial-gradient(circle at top right, rgba(168,85,247,0.15), transparent 25%),
        linear-gradient(180deg,#020617 0%, #050816 45%, #020617 100%)
      `,
      color: '#fff', padding: '42px',
      fontFamily: 'Inter, sans-serif', overflowX: 'hidden'
    },
    heroTitle: {
      fontSize: '3.2rem', fontWeight: 800,
      background: 'linear-gradient(90deg,#ffffff,#a78bfa,#7dd3fc)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.04em', marginBottom: '10px',
    },
    heroSub: { color: '#64748b', fontSize: '1rem', marginBottom: '34px' },
    card: {
      background: 'linear-gradient(180deg, rgba(15,23,42,0.72), rgba(15,23,42,0.48))',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: '28px',
      padding: '24px', marginBottom: '22px', backdropFilter: 'blur(24px)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
    },
    input: {
      width: '100%', padding: '16px 18px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '18px', color: '#fff', fontSize: '0.96rem',
      outline: 'none', boxSizing: 'border-box',
    },
    btn: (bg) => ({
      padding: '14px 26px', background: bg,
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '18px', color: '#fff', fontWeight: 700,
      cursor: 'pointer', fontSize: '0.95rem',
    }),
    floatingOrb: {
      position: 'fixed', width: '420px', height: '420px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)',
      filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
    }
  }

  return (
    <div style={s.page}>
      <div style={{ marginBottom: '20px' }}>
  <button
    onClick={() => navigate('/home')}
    style={{
      padding: '12px 20px',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(135deg,#1e293b,#0f172a)',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: '0.92rem'
    }}
  >
    ← Back to Home
  </button>
</div>
      <div style={s.floatingOrb} />
      <h1 style={s.heroTitle}>Vaiga AI</h1>
      <p style={s.heroSub}>GPS-style workflow navigation assistant</p>

      {/* Screen */}
      <div style={{ position:'relative', borderRadius:'22px', overflow:'hidden',
        border:'1px solid rgba(255,255,255,0.08)', background:'#000', marginBottom:'24px' }}>
        <video ref={videoRef} autoPlay muted playsInline
          style={{ width:'100%', maxHeight:'520px', objectFit:'contain', display:screenStream?'block':'none' }} />
        {!screenStream && (
          <div style={{ height:'220px', display:'flex', alignItems:'center',
            justifyContent:'center', color:'#64748b', fontSize:'1.1rem' }}>
            🖥️ Share your screen
          </div>
        )}

        {/* Arrow */}
        {arrow && screenStream && (
          <div style={{ position:'absolute', left:`${arrow.x}%`, top:`${arrow.y}%`,
            transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:999 }}>
            <div style={{ width:'70px', height:'70px', borderRadius:'50%',
              border:'4px solid #ef4444', background:'rgba(239,68,68,0.15)',
              position:'absolute', transform:'translate(-50%,-50%)', animation:'pulse 1.2s infinite' }} />
            <div style={{ position:'absolute', top:'-55px', left:'-16px', fontSize:'2.5rem' }}>👆</div>
            <div style={{ position:'absolute', top:'-88px', left:'50%', transform:'translateX(-50%)',
              background:'#ef4444', color:'#fff', padding:'3px 10px', borderRadius:'8px',
              fontSize:'0.72rem', whiteSpace:'nowrap', fontWeight:700 }}>Click here!</div>
          </div>
        )}

        {/* Auto badge */}
        {autoMode && screenStream && (
          <div style={{ position:'absolute', bottom:'8px', right:'8px',
            background:'rgba(16,185,129,0.2)', border:'1px solid #10b981',
            padding:'3px 10px', borderRadius:'8px', fontSize:'0.75rem', color:'#10b981' }}>
            🤖 GPS Auto: {autoCountdown}s
          </div>
        )}

        {pageState && (
          <div style={{ position:'absolute', bottom:'8px', left:'8px',
            background:'rgba(99,102,241,0.2)', border:'1px solid #6366f1',
            padding:'3px 10px', borderRadius:'8px', fontSize:'0.75rem', color:'#a78bfa' }}>
            📍 {pageState}
          </div>
        )}
      </div>

      {!connected ? (
        <div style={{ maxWidth:'500px' }}>
          <p style={{ color:'#f59e0b', fontSize:'0.82rem', marginBottom:'10px' }}>
            ⚠️ Accept SSL: <a href="https://40.76.107.196" target="_blank"
            rel="noreferrer" style={{ color:'#f59e0b' }}>https://40.76.107.196</a> → Advanced → Proceed
          </p>
          <input value={sessionId} onChange={e => setSessionId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connectSession()}
            placeholder="Paste Session ID"
            style={{ ...s.input, marginBottom:'16px' }} />
          <button onClick={connectSession} style={s.btn('linear-gradient(135deg,#4f46e5,#7c3aed)')}>
            🔗 Connect Session
          </button>
        </div>
      ) : (
        <div style={{ maxWidth:'900px' }}>

          {/* GPS Progress */}
          <div style={{ ...s.card, borderColor:'#10b981' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
              <p style={{ color:'#10b981', margin:0, fontWeight:700 }}>
                ✅ {stepCount} steps loaded
              </p>
              <p style={{ color:'#f59e0b', margin:0, fontWeight:700 }}>
                Step {currentStep + 1} / {stepCount}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ background:'#1f2937', borderRadius:'8px', height:'8px', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:'8px',
                background:'linear-gradient(90deg,#7c3aed,#10b981)',
                width:`${stepCount ? ((currentStep/stepCount)*100) : 0}%`,
                transition:'width 0.5s ease'
              }} />
            </div>

            {stepResult && (
              <p style={{ margin:'10px 0 0',
                color:stepResult.startsWith('✅')?'#10b981':'#f59e0b',
                fontSize:'0.85rem', fontWeight:700 }}>
                {stepResult}
              </p>
            )}

            {/* Step navigation */}
            <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
              <button onClick={() => {
                const prev = Math.max(0, currentStep-1)
                setCurrentStep(prev); currentStepRef.current = prev
                guideCurrentStep(prev)
              }} style={{ ...s.btn('#374151'), padding:'8px 16px', fontSize:'0.85rem' }}>
                ← Prev
              </button>
              <button onClick={() => {
                const next = Math.min(stepCount-1, currentStep+1)
                setCurrentStep(next); currentStepRef.current = next
                guideCurrentStep(next)
              }} style={{ ...s.btn('#374151'), padding:'8px 16px', fontSize:'0.85rem' }}>
                Next →
              </button>
              <button onClick={() => guideCurrentStep(currentStep)}
                style={{ ...s.btn('#4f46e5'), padding:'8px 16px', fontSize:'0.85rem' }}>
                🔁 Repeat
              </button>
            </div>
          </div>

          {/* Screen share */}
          {!screenStream && (
            <div style={s.card}>
              <button onClick={startScreenShare}
                style={s.btn('linear-gradient(135deg,#7c3aed,#6d28d9)')}>
                🖥️ Share Entire Screen
              </button>
            </div>
          )}

          {/* Mic + Auto */}
          <div style={{ ...s.card, textAlign:'center' }}>
            <button onClick={handleMicClick} style={{
              width:'125px', height:'125px', borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', fontSize:'2.8rem',
              background:`radial-gradient(circle at 30% 30%, ${micColor[micState]}, #020617)`,
              boxShadow:`0 0 70px ${micColor[micState]}55, inset 0 1px 14px rgba(255,255,255,0.08)`,
              transition:'all 0.35s ease',
              transform:micState==='listening'?'scale(1.08)':'scale(1)',
              animation:micState==='listening'?'pulseGlow 1.5s infinite':'none',
              margin:'0 auto 18px', display:'block',
            }}>
              {micState==='idle'?'🎤':micState==='thinking'?'🧠':'🎙️'}
            </button>
            <p style={{ color:micColor[micState], margin:0, fontWeight:700 }}>
              {micLabel[micState]}
            </p>
            {transcript && (
              <p style={{ color:'#7dd3fc', fontSize:'0.9rem', marginTop:'10px', fontStyle:'italic' }}>
                "{transcript}"
              </p>
            )}
            <p style={{ color:'#475569', fontSize:'0.75rem', marginTop:'6px' }}>
              Say "next" or "done" to advance steps
            </p>

            {/* Auto mode */}
            <div style={{ marginTop:'22px' }}>
              <button onClick={() => setAutoMode(p => !p)} style={{
                width:'80px', height:'80px', borderRadius:'50%', border:'none',
                cursor:'pointer', fontSize:'2rem',
                background:autoMode
                  ?'radial-gradient(circle at top,#10b981,#111827)'
                  :'radial-gradient(circle at top,#374151,#111827)',
                boxShadow:autoMode?'0 0 40px #10b98188':'none',
                transition:'all 0.35s ease',
                animation:autoMode?'pulseGlow 1.5s infinite':'none',
                margin:'0 auto', display:'block'
              }}>🤖</button>
              <p style={{ color:autoMode?'#10b981':'#6b7280', margin:'10px 0 0', fontWeight:700 }}>
                {autoMode?`GPS Auto ON (${autoCountdown}s)`:'Auto OFF'}
              </p>
              {autoMode && (
                <p style={{ color:'#475569', fontSize:'0.75rem', margin:'4px 0 0' }}>
                  Expert steps follow chestundi — agent.py needed for auto click
                </p>
              )}
            </div>
          </div>

          {/* Manual ask */}
          <div style={s.card}>
            <p style={{ color:'#6b7280', fontSize:'0.8rem', margin:'0 0 10px' }}>
              Ask anything — Vaiga searches expert recording
            </p>
            <div style={{ display:'flex', gap:'10px' }}>
              <input value={question} onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askTextQuestion()}
                placeholder="e.g. where do I click next?"
                style={{ ...s.input, flex:1 }} />
              <button onClick={askTextQuestion} disabled={loading || speaking}
                style={s.btn('linear-gradient(135deg,#4f46e5,#7c3aed)')}>
                {loading?'⏳':speaking?'🔊':'Ask'}
              </button>
            </div>
          </div>

          {/* Answer */}
          {answer && (
            <div style={{ ...s.card, borderColor:speaking?'#10b981':'rgba(124,58,237,0.4)' }}>
              <p style={{ color:speaking?'#10b981':'#7c3aed', fontSize:'0.8rem',
                marginBottom:'10px', letterSpacing:'1px' }}>
                {speaking?'🔊 VAIGA SPEAKING':'VAIGA'}
              </p>
              <p style={{ color:'#ddd6fe', margin:0, lineHeight:'1.8' }}>{answer}</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%   { box-shadow: 0 0 20px rgba(16,185,129,0.4); }
          50%  { box-shadow: 0 0 60px rgba(16,185,129,0.9); }
          100% { box-shadow: 0 0 20px rgba(16,185,129,0.4); }
        }
        @keyframes pulse {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity:1; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity:0; }
        }
      `}</style>
    </div>
  )
}