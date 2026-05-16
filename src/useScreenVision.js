import { useRef, useCallback, useEffect } from 'react'

const VAST_URL = 'https://hidden-thunder-teddy-installing.trycloudflare.com'

const SCREEN_KEYWORDS = ['screen', 'open', 'what', 'show',
  'see', 'doing', 'next', 'window', 'browser', 'watching']

export function useScreenVision(videoRef, screenStream) {
  const screenStreamRef = useRef(null)

  useEffect(() => {
    screenStreamRef.current = screenStream
  }, [screenStream])

  const captureScreenFrame = useCallback(() => {
    const video = videoRef.current
    const stream = screenStreamRef.current
    if (!video || !stream) return null
    try {
      const canvas = document.createElement('canvas')
      canvas.width  = video.videoWidth  || 1280
      canvas.height = video.videoHeight || 800
      canvas.getContext('2d').drawImage(video, 0, 0)
      return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
    } catch {
      return null
    }
  }, [videoRef])

  const handleScreenQuestion = useCallback(async (text) => {
    const isScreenQ = screenStreamRef.current &&
      SCREEN_KEYWORDS.some(k => text.toLowerCase().includes(k))

    if (!isScreenQ) return null

    const img_b64 = captureScreenFrame()
    if (!img_b64) return null

    const r = await fetch(`${VAST_URL}/screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: img_b64, question: text })
    })
    const d = await r.json()
    return (d.description || '').replace(/\n/g, ' ').trim()
  }, [captureScreenFrame])

  return { handleScreenQuestion }
}