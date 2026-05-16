import { useEffect, useRef } from 'react'

export default function ChatArea({
  messages,
  chatActive,
  onEndChat
}) {

  const bottomRef = useRef(null)

  // ✅ Auto scroll
  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    })

  }, [messages])

  // ✅ Hide when inactive
  const hidden = !chatActive

  return (

   <div
  style={{

    flex: 1,

    height: '100%',

    opacity: hidden ? 0 : 1,

    pointerEvents: hidden ? 'none' : 'auto',

    transition: 'opacity 0.25s ease',

    overflowY: 'auto',

    overflowX: 'hidden',

    padding: '12px',

    scrollbarWidth: 'none',

    msOverflowStyle: 'none',

    position: 'relative'
  }}
>

      {/* ── Chat Messages ───────────────── */}
      <div
        style={{

          minHeight: '100%',

          display: 'flex',

          flexDirection: 'column',

          gap: '14px',

          paddingBottom: '100px',

          background: 'transparent'
        }}
      >

        {messages.map((m, i) => {

          const isUser   = m.role === 'user'
          const isSystem = m.role === 'system'

          return (

            <div
              key={i}
              style={{

                display: 'flex',

                justifyContent:
                  isUser
                    ? 'flex-end'
                    : isSystem
                      ? 'center'
                      : 'flex-start'
              }}
            >

              <div
                style={{

                  maxWidth: '88%',

                  background:
                    isUser
                      ? 'rgba(99,102,241,0.16)'
                      : isSystem
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(255,255,255,0.06)',

                  border:
                    isUser
                      ? '1px solid rgba(99,102,241,0.18)'
                      : isSystem
                        ? '1px solid rgba(16,185,129,0.18)'
                        : '1px solid rgba(255,255,255,0.06)',

                  borderRadius:
                    isSystem
                      ? '999px'
                      : isUser
                        ? '18px 18px 6px 18px'
                        : '18px 18px 18px 6px',

                  padding:
                    isSystem
                      ? '7px 14px'
                      : '14px 18px',

                  color:
                    isSystem
                      ? '#6ee7b7'
                      : '#f3f4f6',

                  lineHeight: 1.65,

                  fontSize:
                    isSystem
                      ? '11px'
                      : '14px',

                  fontWeight:
                    isSystem
                      ? 600
                      : 400,

                  letterSpacing:
                    isSystem
                      ? '0.04em'
                      : 'normal',

                  boxShadow:
                    isUser
                      ? '0 2px 12px rgba(99,102,241,0.10)'
                      : '0 2px 12px rgba(0,0,0,0.10)',

                  whiteSpace: 'pre-wrap',

                  wordBreak: 'break-word',

                  overflowWrap: 'break-word',

                  textAlign: 'left',

                  animation: 'fadeIn 0.2s ease',

                  transition: 'all 0.2s ease'
                }}
              >

                {m.text}

              </div>

            </div>

          )
        })}

        <div ref={bottomRef} />

      </div>

      {/* ── END CHAT BUTTON ───────────────── */}
      <div
        style={{
          position: 'sticky',
          bottom: '10px',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '14px'
        }}
      >

        <button
          onClick={onEndChat}
          style={{

            background: 'rgba(239,68,68,0.14)',

            border: '1px solid rgba(239,68,68,0.28)',

            color: '#fca5a5',

            padding: '10px 22px',

            borderRadius: '999px',

            fontSize: '13px',

            fontWeight: 600,

            cursor: 'pointer',

            backdropFilter: 'blur(12px)',

            WebkitBackdropFilter: 'blur(12px)',

            transition: '0.2s ease',

            boxShadow: '0 4px 20px rgba(239,68,68,0.18)',

            outline: 'none'
          }}
        >
          End Chat
        </button>

      </div>

      {/* ── Styles ───────────────── */}
      <style>{`

        @keyframes fadeIn {

          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        div::-webkit-scrollbar {
          display: none;
        }

      `}</style>

    </div>

  )
}