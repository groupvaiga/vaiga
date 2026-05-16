/* global chrome */
import { useEffect, useRef, useState, useCallback } from 'react'

const VM2_URL = 'https://40.76.107.196'
const WS_URL  = 'wss://40.76.107.196/live'

export default function ExpertRecorder() {

  const [recording,    setRecording]    = useState(false)
  const [title,        setTitle]        = useState('')
  const [taskName,     setTaskName]     = useState('')
  const [status,       setStatus]       = useState('Idle')
  const [eventsCount,  setEventsCount]  = useState(0)
  const [voiceText,    setVoiceText]    = useState('')
  const [liveState,    setLiveState]    = useState('')
  const [liveAction,   setLiveAction]   = useState('')
  const [lastEvent,    setLastEvent]    = useState('')
  const [micActive,    setMicActive]    = useState(false)

  const sessionIdRef    = useRef('')
  const streamRef       = useRef(null)
  const videoRef        = useRef(null)
  const chunkTimerRef   = useRef(null)
  const wsRef           = useRef(null)
  const micStreamRef    = useRef(null)
  const audioCtxRef     = useRef(null)
  const processorRef    = useRef(null)
  const currentUrlRef   = useRef('')
  const currentTitleRef = useRef('')
  const queueRef        = useRef([])
  const recordingRef    = useRef(false)
  const timeOffsetRef   = useRef(0)

  // 60 sec audio collection
  const audioFramesRef  = useRef([])
  const audioWindowRef  = useRef(null)

  useEffect(() => { recordingRef.current = recording }, [recording])

  // ── Server time sync ──────────────────────────────────────────
  const syncServerTime = useCallback(async () => {
    try {
      const r      = await fetch(`${VM2_URL}/server_time`)
      const data   = await r.json()
      const offset = data.ts - Date.now()
      timeOffsetRef.current = offset
      console.log(`⏱️ Time offset: ${offset}ms`)
    } catch (e) {
      console.log('⚠️ Time sync failed:', e)
      timeOffsetRef.current = 0
    }
  }, [])

  const adjustedTs = useCallback(() => {
    return Date.now() + timeOffsetRef.current
  }, [])

  // ── IndexedDB local backup ────────────────────────────────────
  const getDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('vaiga_backup', 1)
      req.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id', autoIncrement: true })
        }
      }
      req.onsuccess = (e) => resolve(e.target.result)
      req.onerror   = () => reject(req.error)
    })
  }, [])

  const saveToIndexedDB = useCallback(async (event) => {
    try {
      const db = await getDB()
      const tx = db.transaction('events', 'readwrite')
      tx.objectStore('events').add({ ...event, flushed: false })
    } catch (e) {
      console.log('[IndexedDB] save error:', e)
    }
  }, [getDB])

  const recoverFromIndexedDB = useCallback(async () => {
    try {
      const db  = await getDB()
      const tx  = db.transaction('events', 'readonly')
      const req = tx.objectStore('events').getAll()
      req.onsuccess = () => {
        const unflushed = (req.result || []).filter(e =>
          !e.flushed && e.session_id === sessionIdRef.current)
        if (unflushed.length > 0) {
          console.log(`🔄 Recovering ${unflushed.length} events`)
          const existingTs = new Set(
  queueRef.current.map(
    e => `${e.ts}_${e.type}_${e.x_pct}_${e.y_pct}`
  )
)

unflushed.forEach(e => {
  const key =
  `${e.ts}_${e.type}_${e.x_pct}_${e.y_pct}`

  if (!existingTs.has(key)) {
    queueRef.current.push(e)
  }
})
          // ← no flushQueue() call needed
          // auto flush every 10 sec handles it ✅
        }
      }
    } catch (e) {
      console.log('[IndexedDB] recover error:', e)
    }
}, [getDB])  // ← clean deps, no flushQueue needed

  // ── Queue flush → /queue endpoint ────────────────────────────
  const flushQueue = useCallback(async () => {
    if (queueRef.current.length === 0) return
    const batch = [...queueRef.current]
    queueRef.current = []
    try {
      const r = await fetch(`${VM2_URL}/queue`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ events: batch })
      })
      const data = await r.json()
      setEventsCount(prev => prev + batch.filter(e => e.type === 'click').length)
      console.log(`📤 Flushed ${data.saved} events`)
      try {
  const db = await getDB()
  const tx = db.transaction('events', 'readwrite')
  const store = tx.objectStore('events')

  const req = store.getAll()

  req.onsuccess = () => {
    const rows = req.result || []

    rows.forEach(row => {
      if (
        !row.flushed &&
        row.session_id === sessionIdRef.current
      ) {
        row.flushed = true
        store.put(row)
      }
    })
  }

} catch (e) {
  console.log('[IndexedDB] flush mark error:', e)
}
    } catch (e) {
      console.error('❌ Flush failed:', e)
      queueRef.current.push(...batch)
    }
  }, [getDB])

  // Auto flush every 10 sec
  useEffect(() => {
    if (!recording) return
    const iv = setInterval(flushQueue, 10000)
    return () => clearInterval(iv)
  }, [recording, flushQueue])

  // ── Enqueue event ─────────────────────────────────────────────
  const enqueue = useCallback((etype, extra = {}) => {
    const event = {
      session_id: sessionIdRef.current,
      type:       etype,
      ts:         adjustedTs(),
      url:        currentUrlRef.current   || '',
      source:     'web',
      ...extra,
    }
    queueRef.current.push(event)
    saveToIndexedDB(event)

    if (etype === 'click') {
      setLiveAction(`click @ ${extra.x_pct?.toFixed(1)}%, ${extra.y_pct?.toFixed(1)}%`)
      setLastEvent((extra.text || '').slice(0, 60))
    }
  }, [adjustedTs, saveToIndexedDB])

  // ── Screenshot ────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width = 640; canvas.height = 400
    canvas.getContext('2d').drawImage(v, 0, 0, 640, 400)
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
  }, [])

  // ── Click handler — instant save, no voice wait ───────────────
  const handleClickEvent = useCallback((data) => {
    const { x_pct, y_pct, text, url, image } = data
    if (x_pct == null || y_pct == null) return
    if (y_pct < 8) return
    if (url) currentUrlRef.current = url

    const img = image || captureFrame()

    enqueue('click', {
      x_pct,
      y_pct,
      text:      text || `Clicked at (${x_pct}%, ${y_pct}%)`,
      image_b64: img || '',
    })

    console.log(`🖱️ Click saved @ (${x_pct}%, ${y_pct}%) ts=${adjustedTs()}`)
  }, [enqueue, captureFrame, adjustedTs])

  // ── Window messages — same tab + cross-tab relay ──────────────
useEffect(() => {

  const handler = (e) => {

    if (e.data?.type === 'vaiga-url-response') {
      currentUrlRef.current   = e.data.url   || ''
      currentTitleRef.current = e.data.title || ''
    }

    // Same tab click
    if (e.data?.type === 'vaiga-click-info' && recordingRef.current) {
      handleClickEvent(e.data)
    }

    // Cross-tab relay
    if (e.data?.type === 'vaiga-click-relay' && recordingRef.current) {

      console.log(
        `📡 Cross-tab: "${e.data.text}" @ (${e.data.x_pct}%, ${e.data.y_pct}%)`
      )

      handleClickEvent(e.data)
    }

    // ✅ Typed text capture
    if (e.data?.type === 'vaiga-typed-info' && recordingRef.current) {

      enqueue('type', {
        x_pct:  e.data.x_pct,
        y_pct:  e.data.y_pct,
        text:   e.data.text,
        typed:  e.data.typed,
        target: e.data.target,
      })

      console.log(
        `⌨️ Typed: "${e.data.typed}" in ${e.data.target}`
      )
    }

  }

  window.addEventListener('message', handler)

  return () => {
    window.removeEventListener('message', handler)
  }

}, [handleClickEvent, enqueue])

  // ── URL sync ──────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (!recordingRef.current) return
      window.postMessage({ type: 'vaiga-get-url' }, '*')
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  // ── PCM → WAV base64 ─────────────────────────────────────────
  const pcmToWavBase64 = useCallback((frames) => {
    const pcm    = new Int16Array(frames.reduce((a, f) => a + f.length, 0))
    let offset   = 0
    frames.forEach(f => { pcm.set(f, offset); offset += f.length })

    const buffer = new ArrayBuffer(44 + pcm.length * 2)
    const view   = new DataView(buffer)
    const write  = (o, s) => s.split('').forEach((c, i) =>
      view.setUint8(o + i, c.charCodeAt(0)))

    write(0, 'RIFF')
    view.setUint32(4, 36 + pcm.length * 2, true)
    write(8, 'WAVE'); write(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, 16000, true)
    view.setUint32(28, 32000, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    write(36, 'data')
    view.setUint32(40, pcm.length * 2, true)
    pcm.forEach((v, i) => view.setInt16(44 + i * 2, v, true))

    const bytes = new Uint8Array(buffer)
    let binary  = ''
    bytes.forEach(b => binary += String.fromCharCode(b))
    return btoa(binary)
  }, [])

  // ── Start mic ─────────────────────────────────────────────────
  const startMic = useCallback(async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = micStream

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
      await audioCtx.resume()
      audioCtxRef.current = audioCtx

      const source    = audioCtx.createMediaStreamSource(micStream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      const gainNode  = audioCtx.createGain()
      gainNode.gain.value = 0
      source.connect(processor)
      processor.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      processorRef.current = processor

      // WebSocket for live transcript feedback
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setMicActive(true)
        console.log('🎤 Mic active')

        // Track audio window start time
        audioWindowRef.current = adjustedTs()
        audioFramesRef.current = []

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return

          const input  = e.inputBuffer.getChannelData(0)
          const buffer = new ArrayBuffer(input.length * 2)
          const view   = new DataView(buffer)
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]))
            view.setInt16(i * 2, s * 0x7fff, true)
          }

          // Send to WebSocket for live transcript
          ws.send(buffer)

          // Collect frames for 60-sec window
          audioFramesRef.current.push(new Int16Array(buffer))

          // Every 60 sec → save audio window to queue
          const elapsed = adjustedTs() - audioWindowRef.current
          if (elapsed >= 60000) {
            const frames    = [...audioFramesRef.current]
            const windowTs  = audioWindowRef.current

            // Reset for next window
            audioFramesRef.current = []
            audioWindowRef.current = adjustedTs()

            if (frames.length > 0) {
              const wavB64 = pcmToWavBase64(frames)
              enqueue('voice_chunk', {
                ts:          windowTs,
                audio_b64:   wavB64,
                duration_ms: 60000,
              })
              console.log(`🎤 60sec audio window saved @ ts=${windowTs}`)
            }
          }
        }
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'transcript') {
            const text = (data.chunk || '').trim()
            if (text.length > 2) {
              setVoiceText(text)
              console.log(`🎤 Live: "${text}"`)
            }
          }
        } catch {}
      }

      ws.onerror = () => { console.error('Mic WS error'); setMicActive(false) }
      ws.onclose = () => { console.log('Mic WS closed');  setMicActive(false) }

    } catch (e) {
      console.error('Mic failed:', e)
      setMicActive(false)
    }
  }, [adjustedTs, enqueue, pcmToWavBase64])

  // ── Stop mic — flush remaining audio ─────────────────────────
  const stopMic = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null

    // Flush remaining audio frames (incomplete last window)
    if (audioFramesRef.current.length > 0) {
      const frames   = [...audioFramesRef.current]
      const windowTs = audioWindowRef.current
      const wavB64   = pcmToWavBase64(frames)
      const duration = adjustedTs() - windowTs
      enqueue('voice_chunk', {
        ts:          windowTs,
        audio_b64:   wavB64,
        duration_ms: duration,
      })
      console.log(`🎤 Final audio window saved (${Math.round(duration/1000)}sec)`)
      audioFramesRef.current = []
    }

    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null

    audioCtxRef.current?.close()
    audioCtxRef.current = null

    wsRef.current?.close()
    wsRef.current = null

    setMicActive(false)
    setVoiceText('')
  }, [adjustedTs, enqueue, pcmToWavBase64])

  // ── Start recording ───────────────────────────────────────────
  const startRecording = async () => {
    if (!title.trim())    return alert('Enter workflow title')
    if (!taskName.trim()) return alert('Enter task name')

    // Extension check
    let detected = false
    const detectHandler = (e) => {
      if (e.data?.type === 'vaiga-extension-loaded') detected = true
    }
    window.addEventListener('message', detectHandler)
    window.postMessage({ type: 'vaiga-check-extension' }, '*')
    await new Promise(r => setTimeout(r, 1000))
    window.removeEventListener('message', detectHandler)

    if (!detected) {
      alert('⚠️ VAIGA extension not detected — install and reload')
      return
    }

    const sessionId = title.trim().replace(/\s+/g, '_')
    sessionIdRef.current = sessionId

    // Server time sync
    await syncServerTime()

    // Recover unflushed events from previous session
    await recoverFromIndexedDB()

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setRecording(true)
      setStatus('Recording 🔴')
      setEventsCount(0)
      setLiveState('')
      setLastEvent('')

      await startMic()

      // Periodic screenshots every 30 sec
      chunkTimerRef.current = setInterval(() => {
        const img = captureFrame()
        if (img) enqueue('snapshot', { image_b64: img })
      }, 30000)

      stream.getVideoTracks()[0].onended = () => stopRecording()

    } catch (err) {
      console.error(err)
      alert('Screen share failed')
    }
  }

  // ── Stop recording ────────────────────────────────────────────
  const stopRecording = async () => {
    setStatus('Stopping... ⏳')
    clearInterval(chunkTimerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null

    // Stop mic — flushes remaining audio
    stopMic()

    // Flush all queued events
    setStatus('Uploading events... ⏳')
    await flushQueue()
    await new Promise(r => setTimeout(r, 2000))

    try {
      setStatus('Summarizing... 🧠')
      const r = await fetch(`${VM2_URL}/summarize_session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          session_id: sessionIdRef.current,
          goal:       taskName
        })
      })
      const data = await r.json()

      if (data.total_steps) {
        setStatus(`✅ Done! ${data.total_steps} steps`)
        console.log('📋 Summary:', data.summary)
        console.log('📝 Steps:', data.steps?.map(s => `${s.step}. ${s.description}`))
      } else {
        setStatus('⚠️ No steps found')
      }
    } catch (err) {
      console.error('Summarize failed:', err)
      setStatus('Stopped ✅')
    }

    setRecording(false)
  }

  // ── Cleanup ───────────────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(chunkTimerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    stopMic()
  }, [stopMic])

  // ── Styles ────────────────────────────────────────────────────
  const s = {
    page:  { background: '#060612', minHeight: '100vh', color: '#fff', padding: '40px', fontFamily: 'Inter, sans-serif' },
    card:  { background: '#0f0f1a', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', maxWidth: '900px', margin: '0 auto' },
    input: { width: '100%', padding: '14px 16px', background: '#09090f', border: '1px solid #1f2937', borderRadius: '12px', color: '#fff', fontSize: '1rem', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' },
    btn:   (bg) => ({ padding: '12px 24px', border: 'none', borderRadius: '12px', background: bg, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }),
    badge: (color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', background: `${color}22`, border: `1px solid ${color}55`, color, fontSize: '0.75rem', fontWeight: 700, marginRight: '6px' }),
  }

  const stateColor = {
    login_page: '#f59e0b', search_results: '#3b82f6', checkout_page: '#10b981',
    error_page: '#ef4444', homepage: '#8b5cf6', loaded_page: '#94a3b8'
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={{ marginTop: 0, marginBottom: '6px' }}>🎥 Expert Recorder</h1>
        <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '20px' }}>
          Record any workflow — voice + clicks auto-saved with timestamps!
        </p>

        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Workflow Title (becomes Session ID)" style={s.input} />
        <input value={taskName} onChange={e => setTaskName(e.target.value)}
          placeholder="Task Name (e.g. Check KLU attendance)" style={s.input} />

        {title && (
          <div style={{ background: '#060612', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f59e0b', marginBottom: '14px' }}>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>Session ID:</p>
            <p style={{ margin: '4px 0 0', color: '#f59e0b', fontWeight: 700 }}>{title.replace(/\s+/g, '_')}</p>
          </div>
        )}

        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>💡 How to record:</p>
          <p style={{ margin: '4px 0 0', color: '#6ee7b7', fontSize: '0.8rem' }}>
            1. Start Recording → share entire screen<br/>
            2. Open any website in another tab and click<br/>
            3. Speak naturally — voice matched by timestamp<br/>
            4. Stop when done — summary auto-generated
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {!recording
            ? <button onClick={startRecording} style={s.btn('linear-gradient(135deg,#7c3aed,#4f46e5)')}>▶️ Start Recording</button>
            : <button onClick={stopRecording}  style={s.btn('linear-gradient(135deg,#ef4444,#dc2626)')}>⏹ Stop Recording</button>
          }
        </div>

        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: micActive ? '#10b981' : '#ef4444',
              animation: micActive ? 'micPulse 1s infinite' : 'none',
            }} />
            <span style={{ color: micActive ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
              {micActive ? '🎤 Mic Active — recording voice' : '⚠️ Mic not connected'}
            </span>
          </div>
        )}

        {voiceText && (
          <div style={{ padding: '8px 14px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem', color: '#7dd3fc' }}>
            🎤 Live: <strong>"{voiceText}"</strong>
          </div>
        )}

        <div style={{ background: '#09090f', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
          <p style={{ margin: 0 }}><strong>Status:</strong> {status}</p>
          <p style={{ margin: '8px 0 0', color: '#10b981' }}>Clicks saved: {eventsCount}</p>
          {recording && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {liveState && <span style={s.badge(stateColor[liveState] || '#94a3b8')}>📍 {liveState}</span>}
              {micActive  && <span style={s.badge('#06b6d4')}>🎤 Mic ON</span>}
              {liveAction && <span style={{ ...s.badge('#6366f1'), maxWidth: '400px' }}>⚡ {liveAction}</span>}
            </div>
          )}
          {lastEvent && (
            <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '0.78rem', fontStyle: 'italic' }}>
              Last: {lastEvent}...
            </p>
          )}
        </div>

        <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937' }}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ width: '100%', maxHeight: '500px', objectFit: 'fill', display: recording ? 'block' : 'none' }} />
          {!recording && (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
              🖥️ Screen preview will appear here
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes micPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>
    </div>
  )
}