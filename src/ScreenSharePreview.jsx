import { useEffect } from 'react'

export default function ScreenSharePreview({ stream, onStop, videoRef }) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020617', // dark clean bg
      position: 'relative',
    }}>

      {/* 🎥 Video container */}
      <div style={{
        width: '90%',
        maxWidth: 1200,
        aspectRatio: '16 / 9',
        background: '#000',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // 🔥 IMPORTANT FIX
          }}
        />
      </div>

      {/* 🎮 Controls */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        gap: 12,
      }}>
        <button
          onClick={async () => {
            if (videoRef.current !== document.pictureInPictureElement) {
              await videoRef.current.requestPictureInPicture()
            } else {
              await document.exitPictureInPicture()
            }
          }}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#1e293b',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          📺 Mini View
        </button>

        <button
          onClick={onStop}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          🛑 Stop Sharing
        </button>
      </div>
    </div>
  )
}