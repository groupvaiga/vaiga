import { useState, useRef } from "react"

export default function MiniAssistant({
  startListening,
  stopListening,
  showFBO,
  fboElement,
  micState
}) {
  const [pos, setPos] = useState({ x: window.innerWidth - 260, y: 100 })
  const [dragging, setDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = (e) => {
    setDragging(true)
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    }
  }

  const onMouseMove = (e) => {
    if (!dragging) return
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y
    })
  }

  const onMouseUp = () => {
    setDragging(false)

    // snap to left/right
    const snapX =
      pos.x < window.innerWidth / 2 ? 20 : window.innerWidth - 260

    setPos(prev => ({ ...prev, x: snapX }))
  }

  // 🔵 Bubble mode
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: "fixed",
          top: pos.y,
          left: pos.x,
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #0ea5e9, #020617)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          cursor: "pointer",
          boxShadow:
            micState === "listening"
              ? "0 0 30px rgba(14,165,233,0.8)"
              : "0 0 15px rgba(14,165,233,0.4)"
        }}
      >
        🎤
      </div>
    )
  }

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        width: "240px",
        background: "rgba(10,15,30,0.95)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 0 40px rgba(0,0,0,0.6)",
        zIndex: 9999,
        padding: "12px"
      }}
    >
      {/* drag bar */}
      <div
        onMouseDown={onMouseDown}
        style={{
          height: "20px",
          cursor: "grab",
          marginBottom: "10px"
        }}
      />

      {/* FBO */}
      <div style={{ height: "120px" }}>
        {showFBO && fboElement}
      </div>

      {/* controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px"
        }}
      >
        <button onClick={startListening}>🎤</button>
        <button onClick={stopListening}>⛔</button>
        <button onClick={() => setIsMinimized(true)}>➖</button>
      </div>
    </div>
  )
}