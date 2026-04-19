import { useState, useRef } from 'react'
import { startScreenShare } from '../ScreenShare'

export default function useScreenShare() {
  const [screenStream, setScreenStream] = useState(null)
  const videoRef = useRef(null)

  const startShare = async () => {
    const stream = await startScreenShare()
    if (!stream) return

    setScreenStream(stream)

    stream.getTracks()[0].onended = () => {
      setScreenStream(null)
    }
  }

  const stopShare = () => {
    screenStream?.getTracks().forEach(t => t.stop())
    setScreenStream(null)
  }

  return {
    screenStream,
    videoRef,
    startShare,
    stopShare
  }
}