// ── Particle Classes ─────────────────────────────────────────

export class VoiceParticle {
  constructor(cx, cy, index, total) {
    this.cx = cx; this.cy = cy
    this.index = index; this.total = total
    this.baseAngle = (index / total) * Math.PI * 2
    this.angleOffset = 0
    this.baseRadius = 55
    this.radius = this.baseRadius
    this.size = Math.random() * 3 + 1.2
    this.baseSize = this.size
    this.hue = 185 + (index / total) * 80
    this.speed = 0.008 + Math.random() * 0.006
    this.orbitVariance = Math.random() * 18 - 9
    this.alpha = 0.6 + Math.random() * 0.35
    this.pulseOffset = Math.random() * Math.PI * 2
  }

  update(volume, time) {
    const targetRadius = this.baseRadius + volume * 120 + Math.sin(time * 2 + this.pulseOffset) * (6 + volume * 18)
    this.radius += (targetRadius - this.radius) * 0.12
    const targetSize = this.baseSize + volume * 4.5
    this.size += (targetSize - this.size) * 0.12
    this.angleOffset += this.speed * (1 + volume * 2.5)
    const angle = this.baseAngle + this.angleOffset
    this.x = this.cx + Math.cos(angle) * (this.radius + this.orbitVariance)
    this.y = this.cy + Math.sin(angle) * (this.radius + this.orbitVariance * 0.6)
  }

  draw(ctx, volume) {
    const glow = volume > 0.05
    ctx.shadowBlur = glow ? 14 : 5
    ctx.shadowColor = glow
      ? `hsla(${this.hue},90%,70%,0.8)`
      : `hsla(${this.hue},80%,65%,0.4)`
    const alpha = this.alpha * (0.55 + volume * 0.45)
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${this.hue},85%,68%,${alpha})`
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

export class InnerParticle {
  constructor(cx, cy, i, total) {
    this.cx = cx; this.cy = cy
    this.angle = (i / total) * Math.PI * 2
    this.speed = 0.012 + Math.random() * 0.008
    this.r = 28 + Math.random() * 14
    this.size = Math.random() * 1.8 + 0.6
    this.hue = 210 + Math.random() * 60
    this.alpha = 0.3 + Math.random() * 0.3
    this.pulseOffset = Math.random() * Math.PI * 2
  }

  update(volume, time) {
    this.angle += this.speed * (1 + volume * 1.5)
    const r = this.r + Math.sin(time * 3 + this.pulseOffset) * (3 + volume * 10)
    this.x = this.cx + Math.cos(this.angle) * r
    this.y = this.cy + Math.sin(this.angle) * r
  }

  draw(ctx, volume) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size + volume * 2, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${this.hue},75%,72%,${this.alpha + volume * 0.3})`
    ctx.fill()
  }
}