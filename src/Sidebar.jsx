// ── Sidebar ──────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
const NAV_ITEMS = [
  { icon: '✦', label: 'New Session', action: 'onNewChat' },

  { icon: '🎓', label: 'StudentHelper', action: null },

  { icon: '⌕', label: 'Transcripts', action: null },
  { icon: '◎', label: 'Voice Clips', action: null },
  { icon: '⊞', label: 'Notebooks', action: null },
  { icon: '◈', label: 'My Library', action: null },
]

export default function Sidebar({

  onNewChat,

  activeItem,

  setActiveItem,

  savedChats = [],

  onSelectChat,

  onRenameChat,

  onDeleteChat,

  userName,

  userInitials

}) {
 const navigate = useNavigate()
  const resolveAction = (key) =>
    key === 'onNewChat'
      ? onNewChat
      : null

  return (

    <div
      style={{

        width: 220,

        height: '100vh',

        background: '#08111f',

        borderRight: '1px solid rgba(255,255,255,0.05)',

        display: 'flex',

        flexDirection: 'column',

        flexShrink: 0,

        backdropFilter: 'blur(20px)',

        zIndex: 40,

        overflow: 'hidden'
      }}
    >

      {/* ── Logo ───────────────── */}
      <div
        style={{

          padding: '20px 18px 16px',

          borderBottom: '1px solid rgba(255,255,255,0.04)',

          display: 'flex',

          alignItems: 'center',

          gap: 10
        }}
      >

        <div
          style={{

            width: 38,

            height: 38,

            background:
              'linear-gradient(135deg,#3b82f6,#0ea5e9)',

            borderRadius: 12,

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            fontSize: 16,

            flexShrink: 0,

            boxShadow:
              '0 0 18px rgba(14,165,233,0.45)'
          }}
        >
          🎙
        </div>

        <div>

          <div
            style={{

              fontFamily: 'Syne,sans-serif',

              fontWeight: 700,

              fontSize: 14,

              color: '#e2e8f0',

              lineHeight: 1.2
            }}
          >
            Vaiga
          </div>

          <div
            style={{

              fontSize: 9,

              color: '#334155',

              letterSpacing: '0.12em',

              textTransform: 'uppercase',

              marginTop: 2
            }}
          >
            AI Voice Assistant
          </div>

        </div>

      </div>

      {/* ── Navigation ───────────────── */}
      <div
        style={{
          padding: '14px 10px 6px'
        }}
      >

        {NAV_ITEMS.map(item => (

          <button
            key={item.label}

           onClick={() => {

  setActiveItem(item.label)

  // Navigate to StudentHelper
  if (item.label === 'StudentHelper') {
    window.location.href = '/studenthelper'
    return
  }

  const action = resolveAction(item.action)

  if (action) action()
}}

            style={{

              width: '100%',

              display: 'flex',

              alignItems: 'center',

              gap: 10,

              padding: '11px 12px',

              borderRadius: 12,

              border: 'none',

              background:
                activeItem === item.label
                  ? 'linear-gradient(90deg,rgba(14,165,233,0.18),rgba(59,130,246,0.08))'
                  : 'transparent',

              color:
                activeItem === item.label
                  ? '#7dd3fc'
                  : '#64748b',

              cursor: 'pointer',

              textAlign: 'left',

              marginBottom: 4,

              transition: 'all 0.18s',

              borderLeft:
                activeItem === item.label
                  ? '2px solid #0ea5e9'
                  : '2px solid transparent'
            }}
          >

            <span
              style={{
                fontSize: 13,
                width: 18,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              {item.icon}
            </span>

            <span
              style={{

                fontFamily: 'Syne,sans-serif',

                fontSize: 12,

                fontWeight: 600,

                letterSpacing: '0.03em'
              }}
            >
              {item.label}
            </span>

          </button>

        ))}

      </div>

      {/* ── Saved Chats ───────────────── */}
      <div
        style={{

          flex: 1,

          overflowY: 'auto',

          padding: '6px 10px 16px',

          scrollbarWidth: 'none',

          msOverflowStyle: 'none'
        }}
      >

        <div
          style={{

            fontSize: 10,

            color: '#475569',

            letterSpacing: '0.12em',

            textTransform: 'uppercase',

            marginBottom: 10,

            paddingLeft: 6,

            fontWeight: 700
          }}
        >
          Recent Chats
        </div>

        {savedChats.length === 0 && (

          <div
            style={{

              color: '#334155',

              fontSize: 11,

              padding: '10px 8px'
            }}
          >
            No chats yet
          </div>

        )}

        {savedChats.map((chat, i) => (

  <div
    key={i}

    style={{

      position: 'relative',

      marginBottom: '8px'
    }}
  >

    <div

      onClick={() => onSelectChat?.(chat)}

      style={{

        padding: '12px',

        borderRadius: '14px',

        background: 'rgba(255,255,255,0.03)',

        border:
          '1px solid rgba(255,255,255,0.04)',

        color: '#cbd5e1',

        fontSize: '12px',

        lineHeight: 1.4,

        cursor: 'pointer',

        overflow: 'hidden',

        textOverflow: 'ellipsis',

        whiteSpace: 'nowrap',

        transition: 'all 0.18s',

        backdropFilter: 'blur(12px)',

        paddingRight: '54px'
      }}
    >

      💬 {chat.title}

    </div>

    {/* ── Actions ───────────────── */}

    <div
      style={{

        position: 'absolute',

        top: '50%',

        right: '10px',

        transform: 'translateY(-50%)',

        display: 'flex',

        gap: '6px'
      }}
    >

      {/* Rename */}

      <button

        onClick={(e) => {

          e.stopPropagation()

          const newTitle = prompt(
            'Rename chat',
            chat.title
          )

          if (!newTitle) return

          onRenameChat?.(
            chat,
            newTitle
          )
        }}

        style={{

          background: 'transparent',

          border: 'none',

          color: '#94a3b8',

          cursor: 'pointer',

          fontSize: '12px'
        }}
      >
        ✎
      </button>

      {/* Delete */}

      <button

        onClick={(e) => {

          e.stopPropagation()

          onDeleteChat?.(chat)
        }}

        style={{

          background: 'transparent',

          border: 'none',

          color: '#ef4444',

          cursor: 'pointer',

          fontSize: '12px'
        }}
      >
        🗑
      </button>

    </div>

  </div>

))}

      </div>

      {/* ── Footer ───────────────── */}
      <div
        style={{

          padding: '12px 14px',

          borderTop:
            '1px solid rgba(255,255,255,0.04)',

          display: 'flex',

          alignItems: 'center',

          gap: 10,

          flexShrink: 0
        }}
      >

        <div
          style={{

            width: 34,

            height: 34,

            borderRadius: '50%',

            background:
              'linear-gradient(135deg,#7c3aed,#2563eb)',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            fontSize: 11,

            fontWeight: 700,

            color: '#fff',

            flexShrink: 0,

            boxShadow:
              '0 0 10px rgba(124,58,237,0.35)'
          }}
        >
         {userInitials}
        </div>

        <div>

          <div
            style={{

              fontSize: 11,

              color: '#94a3b8',

              fontWeight: 600
            }}
          >
            {userName}
          </div>

          <div
            style={{

              display: 'flex',

              alignItems: 'center',

              gap: 4,

              marginTop: 2
            }}
          >

            <div
              style={{

                width: 5,

                height: 5,

                borderRadius: '50%',

                background: '#4ade80',

                boxShadow: '0 0 6px #4ade80'
              }}
            />

            <span
              style={{

                fontSize: 9,

                color: '#475569',

                letterSpacing: '0.08em'
              }}
            >
              Online
            </span>

          </div>

        </div>

      </div>

    </div>
  )
}