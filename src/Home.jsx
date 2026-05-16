import { useEffect, useRef, useState, useCallback } from 'react'
import { useScreenVision }  from './useScreenVision'
import { useVoiceCommands } from './useVoiceCommands'
import GlobalStyles         from './GlobalStyles'
import Sidebar              from './Sidebar'
import Topbar               from './Topbar'
import SpeakTab             from './Speaktab'
import ScreenSharePreview   from './ScreenSharePreview'
import InputBar             from './InputBar'
import ParticlesBackground  from './Particlesbackground'
import FBOScene             from './FBOScene'
import { startScreenShare } from './ScreenShare'
import ExpertRecorder       from './ExpertRecorder'
import ChatArea from './ChatArea'
const WS_URL         = 'wss://40.76.107.196/live'
const SILENCE_GAP_MS = 4000

// ── Browser TTS — no ElevenLabs ──
function speakText(text, onStart, onEnd) {
  if (!text) { onEnd?.(); return }
  window.speechSynthesis.cancel()

  const speak = () => {
    const utt   = new SpeechSynthesisUtterance(text)
    utt.lang    = 'en-US'
    utt.rate    = 1
    utt.pitch   = 1
    utt.volume  = 1
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Google') && v.lang.startsWith('en') ||
      v.name.includes('Microsoft') && v.lang.startsWith('en')
    )
    if (preferred) utt.voice = preferred
    utt.onstart = () => onStart?.()
    utt.onend   = () => onEnd?.()
    utt.onerror = () => onEnd?.()
    window.speechSynthesis.speak(utt)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    onStart?.()
    speak()
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      onStart?.()
      speak()
    }
  }
}

const webGLSupported = (() => {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch { return false }
})()

export default function Home() {
  const [micState,          setMicState]          = useState('idle')
  const [transcript,        setTranscript]        = useState('')
  const [error,             setError]             = useState('')
  const [showFBO,           setShowFBO]           = useState(false)
  const [isSpeaking,        setIsSpeaking]        = useState(false)
  const [inputText,         setInputText]         = useState('')
  const [activeItem,        setActiveItem]        = useState('New Session')
  const [showSilencePrompt, setShowSilencePrompt] = useState(false)
  const [screenStream,      setScreenStream]      = useState(null)
  const [showAttachMenu,    setShowAttachMenu]    = useState(false)
  const [activeTab,         setActiveTab]         = useState('speak')
  const [isMini,            setIsMini]            = useState(false)
  const [isMiniMode,        setIsMiniMode]        = useState(false)
  const [showRecorder,      setShowRecorder]      = useState(false)
  const [messages, setMessages] = useState([])
const [chatActive, setChatActive] = useState(false)
const [savedChats, setSavedChats] = useState([])
const [openedChatId, setOpenedChatId] = useState(null)
const user = JSON.parse(

  localStorage.getItem('user') || '{}'

)

const userName = user?.name || 'User'

const initials = userName
  .split(' ')
  .map(n => n[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

  const videoRef             = useRef(null)
  const wsRef                = useRef(null)
  const streamRef            = useRef(null)
  const audioCtxRef          = useRef(null)
  const processorRef         = useRef(null)
  const analyserRef          = useRef(null)
  const volumeRef            = useRef(0)
  const pendingTranscriptRef = useRef('')
  const silenceTimerRef      = useRef(null)
  const lastTextRef          = useRef('')
  const userStoppedRef       = useRef(false)
  const aiActiveRef          = useRef(false)
  const startListeningRef    = useRef(null)

  const { handleScreenQuestion } = useScreenVision(videoRef, screenStream)
  const { handleVoiceCommand }   = useVoiceCommands()
   
  useEffect(() => {
const loadChats = async () => {

  try {

    const user = JSON.parse(

      localStorage.getItem('user')

    )

    const res = await fetch(

      `https://vaigabackend.onrender.com/api/chat/${user._id}`

    )

    const data = await res.json()

    setSavedChats(data)

  } catch (err) {

    console.log(err)

  }

}

  loadChats()

}, [])
  // Chrome speechSynthesis keep-alive fix
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const clearSilence = useCallback(() => {
    clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
  }, [])

  useEffect(() => {
    setIsMini(window.location.search.includes("mini=true"))
  }, [])

  const stopMicOnly = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    streamRef.current    = null
    audioCtxRef.current  = null
    analyserRef.current  = null
  }, [])

  const cleanup = useCallback(() => {
    clearSilence()
    window.speechSynthesis.cancel()
    userStoppedRef.current = true
    aiActiveRef.current    = false
    stopMicOnly()
    wsRef.current?.close()
    wsRef.current     = null
    volumeRef.current = 0
    setIsSpeaking(false)
  }, [clearSilence, stopMicOnly])

  const startListening = useCallback(async () => {
    userStoppedRef.current       = false
    aiActiveRef.current          = false
    pendingTranscriptRef.current = ''
    lastTextRef.current          = ''
    setError('')
    setTranscript('Listening...')
    setChatActive(true)

setMessages(prev => {

  // ✅ don't duplicate system message
  if (
    prev.length > 0 &&
    prev[0]?.role === 'system'
  ) {
    return prev
  }

  return [
    {
      role: 'system',
      text: 'Voice session started'
    },
    ...prev
  ]
})
    setIsSpeaking(false)
    clearSilence()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
      await audioCtx.resume()
      audioCtxRef.current = audioCtx

      const source   = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      const gainNode  = audioCtx.createGain()
      gainNode.gain.value = 0

      source.connect(analyser)
      analyser.connect(processor)
      processor.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      analyserRef.current  = analyser
      processorRef.current = processor

      ws.onopen = () => {
        console.log('✅ WS open — streaming audio')
        processor.onaudioprocess = (e) => {
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
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)

          if (data.type === 'transcript') {
            const text = (data.full || data.text || '').trim()
            if (!text) return
            pendingTranscriptRef.current = text
            setTranscript(text)
             setMessages(prev => {

  const last = prev[prev.length - 1]

  // ✅ Update live user transcript
  if (last?.role === 'user') {

    const updated = [...prev]

    updated[updated.length - 1] = {
      ...last,
      text
    }

    return updated
  }

  // ✅ First transcript bubble
  return [
    ...prev,
    {
      role: 'user',
      text
    }
  ]
})
            if (text !== lastTextRef.current) {
              lastTextRef.current = text
              clearSilence()

              silenceTimerRef.current = setTimeout(async () => {
  stopMicOnly()
  setMicState('loading')

  // 1. Voice commands
  const commandResult = handleVoiceCommand(pendingTranscriptRef.current)
  if (commandResult) {
    setTranscript(commandResult)
    ws.close(); wsRef.current = null
    speakText(
      commandResult,
      () => { setMicState('speaking'); setShowFBO(true); setIsSpeaking(true) },
      () => {
        aiActiveRef.current = false; setIsSpeaking(false)
        if (!userStoppedRef.current) startListeningRef.current?.()
        else { setShowFBO(false); setMicState('idle') }
      }
    )
    return
  }

  // 2. Screen vision
  const screenAnswer = await handleScreenQuestion(pendingTranscriptRef.current)
  if (screenAnswer) {
    setTranscript(screenAnswer)
    ws.close(); wsRef.current = null
    speakText(
      screenAnswer,
      () => { setMicState('speaking'); setShowFBO(true); setIsSpeaking(true) },
      () => {
        aiActiveRef.current = false; setIsSpeaking(false)
        if (!userStoppedRef.current) startListeningRef.current?.()
        else { setShowFBO(false); setMicState('idle') }
      }
    )
    return
  }

  // 3. Mini screen keywords
  const SCREEN_KEYWORDS = ['screen', 'open', 'what', 'show', 'see', 'doing', 'next', 'window', 'browser', 'watching']
  const question  = pendingTranscriptRef.current
  const isScreenQ = isMini && SCREEN_KEYWORDS.some(k => question.toLowerCase().includes(k))
  if (isScreenQ) {
    window.parent.postMessage({ type: 'vaiga-screenshot-request', question }, '*')
    return
  }

  // ── ✅ ADD THIS — send voice to StudentHelper if open ──
  if (isMini) {
    window.parent.postMessage({
      type: 'vaiga-voice-question',
      text: pendingTranscriptRef.current
    }, '*')
  }

  // 4. AI backend
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'end_of_speech' }))
    console.log('📤 Sent end_of_speech to server')
  }
}, SILENCE_GAP_MS)
            }
          }

          if (data.type === 'answer') {
            console.log('📥 Answer received:', data.answer)
            clearSilence()
            aiActiveRef.current = true
            const clean = (data.answer || data.text || '')
              .replace(/\u001b\[[0-9;]*[mK]/g, '')
              .replace(/\n/g, ' ')
              .trim()
            setTranscript(clean)
            setMessages(prev => [
  ...prev,
  {
    role: 'assistant',
    text: clean
  }
])
            ws.close()
            wsRef.current = null
            speakText(
              clean,
              () => { setMicState('speaking'); setShowFBO(true); setIsSpeaking(true) },
              () => {
                aiActiveRef.current = false
                setIsSpeaking(false)
                if (!userStoppedRef.current) startListeningRef.current?.()
                else { setShowFBO(false); setMicState('idle') }
              }
            )
          }

        } catch (err) { console.error('Parse error:', err) }
      }

      ws.onerror = () => {
        setError('WebSocket error')
        stopMicOnly()
        setMicState('idle')
        setShowFBO(false)
        setIsSpeaking(false)
      }

      ws.onclose = () => {
        console.log('WS closed')
        if (!aiActiveRef.current && !userStoppedRef.current) {
          setMicState('idle')
          if (!pendingTranscriptRef.current) setTranscript('No speech detected')
        }
      }

      setMicState('listening')
      setShowFBO(true)

    } catch (err) {
      console.error(err)
      setError('Mic permission denied')
      setMicState('idle')
    }
  }, [clearSilence, stopMicOnly, handleScreenQuestion, isMini, handleVoiceCommand])

  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  const stopListening = useCallback(() => {
    userStoppedRef.current = true
    clearSilence()
    window.speechSynthesis.cancel()
    stopMicOnly()
    wsRef.current?.close()
    wsRef.current = null
    setShowFBO(false)
    setMicState('idle')
    setIsSpeaking(false)
    setTranscript(pendingTranscriptRef.current || 'No speech detected')
  }, [clearSilence, stopMicOnly])

  useEffect(() => {
    const dataArr = new Uint8Array(256)
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArr)
        volumeRef.current = Math.min(1, dataArr.reduce((a, b) => a + b, 0) / dataArr.length / 90)
      } else {
        volumeRef.current = 0
      }
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const finishSession   = useCallback(() => { setShowSilencePrompt(false); cleanup(); setMicState('idle'); setShowFBO(false) }, [cleanup])
  const continueSession = useCallback(() => setShowSilencePrompt(false), [])

  const handleScreenShare = async () => {
    const stream = await startScreenShare()
    if (!stream) return
    setScreenStream(stream)
    setActiveTab('screen')
    stream.getTracks()[0].onended = () => { setScreenStream(null); setActiveTab('speak') }
    setShowAttachMenu(false)
  }

  const stopScreenShare = () => {
    screenStream?.getTracks().forEach(t => t.stop())
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {})
    setScreenStream(null)
    setActiveTab('speak')
    setIsMiniMode(false)
  }

  const clearTranscript = () => {
    setTranscript(''); setError(''); setShowSilencePrompt(false)
    setActiveItem('New Session'); cleanup(); setMicState('idle'); setShowFBO(false);setMessages([])
setChatActive(false)
  }

useEffect(() => {
  if (!isMini) return
  const handler = (e) => {

    // Screenshot answer
    if (e.data?.type === 'vaiga-screenshot-answer') {
      const answer = e.data.answer
      setTranscript(answer)
      speakText(
        answer,
        () => { setMicState('speaking'); setShowFBO(true); setIsSpeaking(true) },
        () => { setIsSpeaking(false); setShowFBO(false); setMicState('idle') }
      )
    }

    // ✅ StudentHelper answer → FBO animates and speaks
    if (e.data?.type === 'vaiga-speak') {
      const text = e.data.text
      window.speechSynthesis.cancel()
      setTimeout(() => {
        setTranscript(text)
        setShowFBO(true)
        setMicState('speaking')
        setIsSpeaking(true)

        const fallback = setTimeout(() => {
          setIsSpeaking(false)
          setMicState('idle')
        }, 30000)

        speakText(
          text,
          () => {},
          () => {
            clearTimeout(fallback)
            setIsSpeaking(false)
            setMicState('idle')
          }
        )
      }, 300)
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [isMini])

  const btnStyle = (color) => ({
    background: `rgba(${color},0.12)`,
    border: `1px solid rgba(${color},0.35)`,
    borderRadius: '50px', padding: '10px 28px',
    fontFamily: 'Syne, sans-serif',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', letterSpacing: '0.05em'
  })
const handleEndChat = async () => {
  if (messages.length === 0) return

  // ── Opened old chat → UPDATE it with new messages ──
  if (openedChatId) {
    try {
      const res = await fetch(`https://vaigabackend.onrender.com/api/chat/${openedChatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })
      const updatedChat = await res.json()

      // reflect in sidebar too
      setSavedChats(prev =>
        prev.map(c => c._id === openedChatId ? { ...c, messages: updatedChat.messages } : c)
      )
    } catch (err) {
      console.error('Failed to update chat', err)
    }

    stopListening()
    setMessages([])
    setTranscript('')
    setChatActive(false)
    setOpenedChatId(null)
    return
  }

  // ── New chat → SAVE it ──
  const firstUserMessage = messages.find(m => m.role === 'user')
   const user = JSON.parse(

  localStorage.getItem('user')

)
  const title = firstUserMessage?.text ? firstUserMessage.text.slice(0, 32) : 'New Chat'
 
  try {
    const res = await fetch('https://vaigabackend.onrender.com/api/chat/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({

  userId: user._id,

  title,

  messages,

  createdAt: new Date() })
    })
    const savedChat = await res.json()
    setSavedChats(prev => [savedChat, ...prev])
    setOpenedChatId(null)
  } catch (err) {
    console.error('Mongo save failed', err)
  }

  stopListening()
  setMessages([])
  setTranscript('')
  setChatActive(false)
}
  return (
    <>
      <GlobalStyles />

      {isMini ? (
        <div style={{
          width: "100vw", height: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#060d1a"
        }}>
          <div style={{
            width: "260px", height: "340px",
            background: "#0f1423", borderRadius: "24px",
            boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-end",
            paddingBottom: "28px", overflow: "hidden", position: "relative"
          }}>
            {micState !== "idle" ? (
              <>
                <div style={{
                  position: "absolute", top: "20px", left: "50%",
                  transform: "translateX(-50%)",
                  width: "140px", height: "140px",
                  borderRadius: "50%", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <FBOScene analyserRef={analyserRef} volumeRef={volumeRef} />
                </div>
                <button onClick={stopListening} style={{
                  position: "relative", zIndex: 2,
                  background: "#ef4444", border: "none", color: "white",
                  fontSize: "15px", fontWeight: 500,
                  padding: "10px 32px", borderRadius: "14px",
                  cursor: "pointer", letterSpacing: "0.02em"
                }}>Stop</button>
                <span style={{
                  position: "relative", zIndex: 2, marginTop: "8px",
                  fontSize: "12px", color: "rgba(125,211,252,0.7)", letterSpacing: "0.05em"
                }}>
                  {micState === "listening" ? "Listening..." : "Speaking..."}
                </span>
              </>
            ) : (
              <div onClick={startListening} style={{
                width: "68px", height: "68px", borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #1e3a5f, #0a1628)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 0 6px rgba(14,165,233,0.08), 0 0 18px rgba(14,165,233,0.25)"
              }}>
                <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                  <rect x="17" y="6" width="14" height="22" rx="7" fill="white" fillOpacity="0.95"/>
                  <path d="M10 22c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="24" y1="36" x2="24" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="17" y1="42" x2="31" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ParticlesBackground>
          <div style={{
  display: 'flex',
  height: '100dvh',
  width: '100vw',
  overflow: 'hidden'
}}>
  <Sidebar

  userName={userName}

  userInitials={initials}

  savedChats={savedChats}

  onNewChat={clearTranscript}

  activeItem={activeItem}

  setActiveItem={setActiveItem}

  onSelectChat={(chat) => {

    setMessages(chat.messages)

    setChatActive(true)

    setActiveItem(chat.title)

    setOpenedChatId(chat._id)

  }}

  onDeleteChat={async (chat) => {

    try {

      await fetch(

        `https://vaigabackend.onrender.com/api/chat/${chat._id}`,

        {

          method: 'DELETE'

        }

      )

      setSavedChats(prev =>

        prev.filter(c => c._id !== chat._id)

      )

      setMessages([])

      setChatActive(false)

    } catch (err) {

      console.log(err)

    }

  }}

  onRenameChat={async (chat, newTitle) => {

    try {

      await fetch(

        `https://vaigabackend.onrender.com/api/chat/${chat._id}`,

        {

          method: 'PUT',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            title: newTitle

          })

        }

      )

      setSavedChats(prev =>

        prev.map(c =>

          c._id === chat._id

            ? {

                ...c,

                title: newTitle

              }

            : c

        )

      )

    } catch (err) {

      console.log(err)

    }

  }}
/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Topbar onNewChat={clearTranscript} />

              {(!screenStream || activeTab === 'speak') && (

<div style={{
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
  minHeight: 0
}}>

  {/* ── CHAT COLUMN ───────────────── */}
<div
  style={{

    width: '390px',

    minWidth: '390px',

    maxWidth: '390px',

    flexShrink: 0,

    height: 'calc(100dvh - 90px)',

    margin: '18px',

    borderRadius: '32px',

    overflow: 'hidden',

    display: 'flex',

    flexDirection: 'column',

    position: 'relative',

    background: 'none',

    border: 'none',

    boxShadow: 'none',

    backdropFilter: 'none',

    WebkitBackdropFilter: 'none'
  }}
>

  <ChatArea
  messages={messages}
  chatActive={chatActive}
  onEndChat={handleEndChat}
/>

</div>

  {/* ── FBO AREA ───────────────── */}
  <div style={{
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>

    <SpeakTab
      micState={micState}
      error={error}
      showFBO={showFBO}
      isSpeaking={isSpeaking}
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

</div>
)}

              {screenStream && activeTab === 'screen' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <ScreenSharePreview stream={screenStream} videoRef={videoRef} />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => localStorage.setItem('vaiga-mini-open', Date.now().toString())}
                      style={{ ...btnStyle('14,165,233'), color: '#7dd3fc' }}
                    >🎤 Mini View</button>
                    <button
                      onClick={() => setShowRecorder(true)}
                      style={{ ...btnStyle('239,68,68'), color: '#fca5a5' }}
                    >🔴 Record Session</button>
                    <button
                      onClick={stopScreenShare}
                      style={{ ...btnStyle('100,100,100'), color: '#9ca3af' }}
                    >✕ Stop Share</button>
                  </div>
                </div>
              )}

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

              {isMiniMode && (
                <div style={{
                  position: 'fixed', bottom: '30px', right: '30px',
                  width: '260px', height: '340px',
                  background: '#0f1423', borderRadius: '24px',
                  boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'flex-end',
                  paddingBottom: '28px', overflow: 'hidden', zIndex: 9999
                }}>
                  {micState !== 'idle' ? (
                    <>
                      <div style={{
                        position: 'absolute', top: '20px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: '140px', height: '140px',
                        borderRadius: '50%', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FBOScene analyserRef={analyserRef} volumeRef={volumeRef} />
                      </div>
                      <button onClick={stopListening} style={{
                        position: 'relative', zIndex: 2,
                        background: '#ef4444', border: 'none', color: 'white',
                        fontSize: '15px', fontWeight: 500,
                        padding: '10px 32px', borderRadius: '14px',
                        cursor: 'pointer', letterSpacing: '0.02em'
                      }}>Stop</button>
                      <span style={{
                        position: 'relative', zIndex: 2, marginTop: '8px',
                        fontSize: '12px', color: 'rgba(125,211,252,0.7)', letterSpacing: '0.05em'
                      }}>
                        {micState === 'listening' ? 'Listening...' : micState === 'loading' ? 'Thinking...' : 'Speaking...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div onClick={startListening} style={{
                        width: '68px', height: '68px', borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #1e3a5f, #0a1628)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 0 0 6px rgba(14,165,233,0.08), 0 0 18px rgba(14,165,233,0.25)'
                      }}>
                        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                          <rect x="17" y="6" width="14" height="22" rx="7" fill="white" fillOpacity="0.95"/>
                          <path d="M10 22c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="24" y1="36" x2="24" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="17" y1="42" x2="31" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <button onClick={() => setIsMiniMode(false)} style={{
                        marginTop: '12px', background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50px', padding: '6px 20px',
                        color: '#6b7280', fontSize: '11px', cursor: 'pointer'
                      }}>✕ Close</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </ParticlesBackground>
      )}

      {/* Record Session Modal */}
      {showRecorder && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '720px', maxHeight: '90vh',
            overflowY: 'auto', borderRadius: '20px',
            position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.7)'
          }}>
            <button
              onClick={() => setShowRecorder(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '50%',
                width: '32px', height: '32px',
                color: '#fff', cursor: 'pointer',
                fontSize: '16px', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
            <ExpertRecorder />
          </div>
        </div>
      )}
    </>
  )
}