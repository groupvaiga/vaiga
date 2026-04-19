import { useEffect, useRef } from 'react'

// Canvas-based fallback orb for browsers without WebGL
export default function ChromeFallbackOrb({ volumeRef }) {
  const canvasRef = useRef()
  const rafRef = useRef()
  const dotsRef = useRef(
    Array.from({ length: 180 }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 50 + Math.random() * 70,
      speed: 0.004 + Math.random() * 0.008,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
      hue: 200 + Math.random() * 40,
      pulseOffset: Math.random() * Math.PI * 2,
    }))
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = 360, H = 360
    canvas.width = W; canvas.height = H
    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const vol = volumeRef.current || 0
      const pulse = 1 + vol * 0.55

      const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 80 * pulse)
      grd.addColorStop(0, `rgba(40,100,255,${0.18 + vol * 0.25})`)
      grd.addColorStop(0.5, `rgba(20,60,200,${0.08 + vol * 0.1})`)
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 80 * pulse, 0, Math.PI * 2)
      ctx.fill()

      dotsRef.current.forEach(d => {
        d.angle += d.speed * (1 + vol * 2.5)
        const pr = d.r * pulse + Math.sin(t * 0.04 + d.pulseOffset) * (4 + vol * 15)
        const x = W / 2 + Math.cos(d.angle) * pr
        const y = H / 2 + Math.sin(d.angle) * pr
        const size = (d.size + vol * 3) * pulse
        ctx.beginPath()
        ctx.arc(x, y, Math.max(size, 0.1), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${d.hue}, 85%, 68%, ${d.alpha + vol * 0.4})`
        ctx.shadowBlur = vol > 0.05 ? 10 : 3
        ctx.shadowColor = `hsla(${d.hue}, 90%, 70%, 0.6)`
        ctx.fill()
        ctx.shadowBlur = 0
      })

      t++
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [volumeRef])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 360, height: 360, borderRadius: '50%' }}
    />
  )
}