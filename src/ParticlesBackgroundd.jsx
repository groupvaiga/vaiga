import { useEffect, useRef } from 'react'
 
function rand(min, max) { return Math.random() * (max - min) + min }
 
class Particle {
  constructor(canvas) {
    this.canvas = canvas
    this.reset(true)
  }
 
  reset(init) {
    const { width, height } = this.canvas
    this.x            = rand(0, width)
    this.y            = init ? rand(0, height) : height + rand(10, 40)
    this.baseSize     = rand(1.0, 3.2)
    this.size         = this.baseSize
    this.speedX       = rand(-0.5, 0.5)
    this.speedY       = -rand(0.4, 1.3)
    this.alpha        = rand(0.25, 0.75)
    this.alphaDir     = Math.random() > 0.5 ? 1 : -1
    this.alphaSpd     = rand(0.003, 0.008)
    this.wobble       = rand(0, Math.PI * 2)
    this.wobbleSpd    = rand(0.01, 0.03)
    this.wobbleAmp    = rand(0.3, 1.0)
    this.trail        = []
    this.trailLen     = Math.floor(rand(4, 14))
    this.twinkle      = Math.random() > 0.55
    this.twinklePhase = rand(0, Math.PI * 2)
  }
 
  update() {
    const { width, height } = this.canvas
    this.trail.unshift({ x: this.x, y: this.y })
    if (this.trail.length > this.trailLen) this.trail.pop()
    this.wobble += this.wobbleSpd
    this.x += this.speedX + Math.sin(this.wobble) * this.wobbleAmp
    this.y += this.speedY
    this.alpha += this.alphaDir * this.alphaSpd
    if (this.alpha > 0.75) { this.alpha = 0.75; this.alphaDir = -1 }
    if (this.alpha < 0.12) { this.alpha = 0.12; this.alphaDir =  1 }
    if (this.twinkle) {
      this.twinklePhase += 0.07
      this.size = this.baseSize + Math.sin(this.twinklePhase) * 1.0
    }
    if (this.y < -20 || this.x < -40 || this.x > width + 40) this.reset(false)
  }
 
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t     = this.trail[i]
      const ratio = 1 - i / this.trail.length
      ctx.beginPath()
      ctx.arc(t.x, t.y, Math.max(0.3, this.size * ratio * 0.65), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${this.alpha * ratio * 0.4})`
      ctx.fill()
    }
    ctx.shadowBlur  = this.size > 2.2 ? 12 : 6
    ctx.shadowColor = 'rgba(255,255,255,0.75)'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${this.alpha})`
    ctx.fill()
    ctx.shadowBlur = 0
  }
}
 
function ParticlesCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    let raf
    const NUM = 200
 
    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      particles = Array.from({ length: NUM }, () => new Particle(canvas))
    }
 
    function loop() {
      ctx.fillStyle = '#07070f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw(ctx) })
      raf = requestAnimationFrame(loop)
    }
 
    resize()
    loop()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
 
  return (
    <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }} />
  )
}
 
export default function ParticlesBackgroundd({ children, style }) {
  return (
    <div style={{ position:'relative', width:'100%', minHeight:'100vh', overflow:'hidden', background:'#07070f', ...style }}>
      <ParticlesCanvas />
      <div style={{ position:'relative', zIndex:10 }}>{children}</div>
    </div>
  )
}