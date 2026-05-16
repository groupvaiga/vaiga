import { useEffect } from 'react'

export default function ScreenSharePreview({ stream, videoRef }) {
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
      background: '#020617',
      position: 'relative',
    }}>

      {/* Video only — buttons handled by Home.jsx */}
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
            objectFit: 'contain',
          }}
        />
      </div>

    </div>
  )
}