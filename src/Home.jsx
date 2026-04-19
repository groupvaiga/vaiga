import { useEffect, useRef, useState, useCallback } from 'react'

// ── Local components ──────────────────────────────────────────
import GlobalStyles       from './GlobalStyles'
import Sidebar            from './Sidebar'
import Topbar             from './Topbar'
import SpeakTab           from './Speaktab'
import ScreenSharePreview from './ScreenSharePreview'
import InputBar           from './InputBar'

// ── External / sibling imports (keep as-is from original) ────
import ParticlesBackground from './Particlesbackground'
import FBOScene            from './FBOScene'
import { startScreenShare } from './ScreenShare'

const WS_URL = 'ws://40.76.107.196:8000/live'

// ── WebGL detection (runs once) ───────────────────────────────
const webGLSupported = (() => {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch { return false }
})()

// ── Home ──────────────────────────────────────────────────────
export default function Home() {
  const [micState,          setMicState]          = useState('idle')
  const [transcript,        setTranscript]        = useState('')
  const [error,             setError]             = useState('')
  const [showFBO,           setShowFBO]           = useState(false)
  const [inputText,         setInputText]         = useState('')
  const [activeItem,        setActiveItem]        = useState('New Session')
  const [showSilencePrompt, setShowSilencePrompt] = useState(false)
  const [screenStream,      setScreenStream]      = useState(null)
  const [showAttachMenu,    setShowAttachMenu]    = useState(false)
  const [activeTab,         setActiveTab]         = useState('speak') // 'speak' | 'screen'

  const videoRef            = useRef(null)
  const wsRef               = useRef(null)
  const streamRef           = useRef(null)
  const audioCtxRef         = useRef(null)
  const analyserRef         = useRef(null)
  const volumeRef           = useRef(0)
  const pendingTranscriptRef = useRef('')
  const recorderRef = useRef(null)
  // ── Cleanup ────────────────────────────────────────────────
  const cleanup = useCallback(() => {

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    wsRef.current?.close()

    streamRef.current   = null
    audioCtxRef.current = null
    analyserRef.current = null
    wsRef.current       = null
    volumeRef.current   = 0
  }, [])

  // ── PiP: auto mini-view when switching to speak tab ───────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (screenStream && activeTab === 'speak') {
      video.requestPictureInPicture().catch(() => {})
    }
    if (activeTab === 'screen' && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {})
    }
  }, [activeTab, screenStream])

  // ── Volume tick ────────────────────────────────────────────
  useEffect(() => {
    const dataArr = new Uint8Array(256)
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArr)
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length
        volumeRef.current = Math.min(1, avg / 90)
      } else {
        volumeRef.current = 0
      }
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  // ── Session handlers ───────────────────────────────────────
  const finishSession = useCallback(() => {
    setShowSilencePrompt(false)
    setMicState('loading')
    setShowFBO(false)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setTimeout(() => wsRef.current?.close(), 1500)
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()

    setTimeout(() => {
      setTranscript(pendingTranscriptRef.current || 'No speech detected')
      setMicState('idle')
    }, 1500)
  }, [])

  const continueSession = useCallback(() => {
    setShowSilencePrompt(false)
  }, [])

  // ── Start listening ────────────────────────────────────────
 const startListening = useCallback(async () => {
  setError('')
  setTranscript('Listening...')
  pendingTranscriptRef.current = ''

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

   const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
    await audioCtx.resume()
    audioCtxRef.current = audioCtx

    console.log("🎤 Sample Rate:", audioCtx.sampleRate)

    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256

    const processor = audioCtx.createScriptProcessor(4096, 1, 1)

    const gainNode = audioCtx.createGain()
    gainNode.gain.value = 0

    source.connect(analyser)
    analyser.connect(processor)
    processor.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    analyserRef.current = analyser

    ws.onopen = () => {
      console.log('✅ WS connected')

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return

        const input = e.inputBuffer.getChannelData(0)

        // 🔥 DEBUG: check audio volume
        const avg = input.reduce((a, b) => a + Math.abs(b), 0) / input.length
        console.log("🎧 Audio level:", avg)

        const buffer = new ArrayBuffer(input.length * 2)
        const view = new DataView(buffer)

        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]))
          view.setInt16(i * 2, s * 0x7fff, true)
        }

        ws.send(buffer)
      }
    }

    ws.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data)
    if (data.type === 'transcript') {
      const text = data.full || data.text || ''
      if (text) {
        pendingTranscriptRef.current = text
        setTranscript(text)
      }
    }
    if (data.type === 'answer') {
      // Answer వచ్చాక WS close చేయి!
      wsRef.current?.close()
    }
  } catch (err) {
    console.error("❌ Parse error:", err)
  }
}

    ws.onerror = (e) => {
      console.error("❌ WS ERROR", e)
      setError("WebSocket error")
    }

    ws.onclose = (e) => {
      console.log('❌ WS closed:', e.code)

      // 🔥 IMPORTANT FIX
      if (!pendingTranscriptRef.current) {
        setTranscript('No speech detected (backend issue)')
      }

      setMicState('idle')
    }

    setMicState('listening')
    setShowFBO(true)

  } catch (err) {
    console.error(err)
    setError('Mic permission denied')
  }
}, [])

  // ── Stop listening ─────────────────────────────────────────
  const stopListening = useCallback(() => {
  console.log("🛑 Stopping mic...")

  // Mic + Audio stop చేయి
  streamRef.current?.getTracks().forEach(t => t.stop())
  audioCtxRef.current?.close()
  setMicState('idle')

  // WS close చేయకు! VM2 నుండి transcript వస్తుంది!
  // ws.onmessage లో transcript వచ్చాక close అవుతుంది

  // 10 seconds wait చేసినా transcript రాకపోతే close!
  setTimeout(() => {
    if (!pendingTranscriptRef.current) {
      setTranscript('No speech detected')
      wsRef.current?.close()
    }
  }, 10000)

}, [])

  // ── Screen share ───────────────────────────────────────────
  const handleScreenShare = async () => {
    const stream = await startScreenShare()
    if (!stream) return

    setScreenStream(stream)
    setActiveTab('screen')
    stream.getTracks()[0].onended = () => {
      setScreenStream(null)
      setActiveTab('speak')
    }
    setShowAttachMenu(false)
  }

  const stopScreenShare = () => {
    screenStream?.getTracks().forEach(t => t.stop())
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {})
    }
    setScreenStream(null)
    setActiveTab('speak')
  }

  // ── Clear / new chat ───────────────────────────────────────
  const clearTranscript = () => {
    setTranscript('')
    setError('')
    setShowSilencePrompt(false)
    setActiveItem('New Session')
    cleanup()
    setMicState('idle')
    setShowFBO(false)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />

      <ParticlesBackground>
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

          {/* Sidebar */}
          <Sidebar
            onNewChat={clearTranscript}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />

          {/* Main panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            <Topbar onNewChat={clearTranscript} />

            {/* Content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 25 }}>

              {/* Tab bar (only when screen sharing) */}
              {screenStream && (
                <div style={{
                  display: 'flex',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(11,22,41,0.85)',
                  backdropFilter: 'blur(12px)',
                  flexShrink: 0,
                }}>
                  {[
                    { id: 'speak',  label: '🎙 Speak'  },
                    { id: 'screen', label: '📺 Screen' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '10px 24px', border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        fontFamily: 'Syne, sans-serif', fontWeight: 600,
                        fontSize: 13, letterSpacing: '0.03em',
                        color: activeTab === tab.id ? '#7dd3fc' : '#4b5563',
                        borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Speak tab */}
              <div style={{
                flex: 1,
                display: screenStream && activeTab === 'screen' ? 'none' : 'flex',
                flexDirection: 'column',
              }}>
                <SpeakTab
                  micState={micState}
                  transcript={transcript}
                  error={error}
                  showFBO={showFBO}
                  showSilencePrompt={showSilencePrompt}
                  webGLSupported={webGLSupported}
                  analyserRef={analyserRef}
                  volumeRef={volumeRef}
                  FBOScene={FBOScene}
                  onStart={startListening}
                  onStop={stopListening}
                  onFinish={finishSession}
                  onContinue={continueSession}
                  onClear={clearTranscript}
                />
              </div>

              {/* Screen tab */}
              {screenStream && activeTab === 'screen' && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '20px', overflowY: 'auto',
                }}>
                  <ScreenSharePreview
                    stream={screenStream}
                    onStop={stopScreenShare}
                    videoRef={videoRef}
                  />
                </div>
              )}
            </div>

            {/* Input bar */}
            <InputBar
              micState={micState}
              inputText={inputText}
              setInputText={setInputText}
              showAttachMenu={showAttachMenu}
              setShowAttachMenu={setShowAttachMenu}
              onStartListening={startListening}
              onStopListening={stopListening}
              onScreenShare={handleScreenShare}
            />
          </div>
        </div>
      </ParticlesBackground>
    </>
  )
}