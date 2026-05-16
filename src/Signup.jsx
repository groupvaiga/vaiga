import { useState } from 'react'
import ParticlesBackground from './ParticlesBackgroundd'
import { useNavigate } from 'react-router-dom'

/* ── password strength ───────────────────────────────── */
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)           score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#00ffcc']

function StrengthBar({ password }) {
  const score = getStrength(password)
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 1, borderRadius: 1,
            background: i <= score ? STRENGTH_COLOR[score] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {password && (
        <span style={{
          fontSize: 10, color: STRENGTH_COLOR[score],
          letterSpacing: '0.08em',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {STRENGTH_LABEL[score]}
        </span>
      )}
    </div>
  )
}

/* ── field ───────────────────────────────────────────── */
function Field({ label, type = 'text', placeholder, value, onChange, strengthBar, borderOverride }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  const handleFocus = e => {
    if (!borderOverride) e.target.style.borderBottomColor = '#00ffcc'
  }
  const handleBlur = e => {
    if (!borderOverride) e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'
  }

  return (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <div style={s.inputWrap}>
        <input
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            ...s.input,
            ...(borderOverride ? { borderBottomColor: borderOverride } : {}),
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {isPassword && (
          <button style={s.eyeBtn} onClick={() => setShow(v => !v)} type="button">
            {show ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
        {borderOverride === 'rgba(0,255,204,0.6)' && (
          <span style={{ position: 'absolute', right: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        )}
      </div>
      {strengthBar && <StrengthBar password={value} />}
    </div>
  )
}

/* ── main ────────────────────────────────────────────── */
export default function Signup({ onGoLogin }) {
  const [form, setForm]       = useState({ first: '', last: '', email: '', password: '', confirm: '' })
  const [agreed, setAgreed]   = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const passwordMatch    = form.confirm && form.password === form.confirm
  const passwordMismatch = form.confirm && form.password !== form.confirm
  const confirmBorder    = passwordMismatch
    ? 'rgba(239,68,68,0.6)'
    : passwordMatch
    ? 'rgba(0,255,204,0.6)'
    : undefined

  const handleSignup = async () => {
    if (!agreed)                          return alert('Please agree to the terms first.')
    if (!form.first || !form.last || !form.email || !form.password)
                                          return alert('Please fill in all fields.')
    if (passwordMismatch || !passwordMatch) return alert('Passwords do not match.')

    setLoading(true)
    try {
      const res  = await fetch('https://vaigabackend.onrender.com/api/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({

  name: `${form.first} ${form.last}`,

  email: form.email,

  password: form.password

}),
      })
      const data = await res.json()

      if (res.ok) {
        alert('✅ ' + data.message)
        navigate('/login')
      } else {
        alert('❌ ' + (data.error || data.message))
      }
    } catch (err) {
      console.error(err)
      alert('Server error — make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ParticlesBackground>

      <div style={s.logo}>
        <div style={s.logoMark}><MicIcon size={14} /></div>
        <span style={s.logoName}>Vaiga <span style={{ color: '#00ffcc' }}>AI</span></span>
      </div>

      <div style={s.page}>
        <div style={s.layout}>

          <div style={s.leftPanel}>
            <div style={s.bgText}>VOICE</div>
            <div style={s.headline}>
              <span style={s.dimWord}>SPEAK</span><br />
              <span style={s.accentWord}>IT.</span><br />
              <span style={s.dimWord}>DONE.</span>
            </div>
            <div style={s.tagline}>AI Voice Assistant</div>
            <div style={s.accentLine} />
          </div>

          <div style={s.sep} />

          <div style={s.rightPanel}>
            <div style={s.formBox}>
              <div style={s.stepLabel}>New account</div>
              <div style={s.formTitle}>Start for <strong>free.</strong><br />No card needed.</div>

              <div style={s.nameRow}>
                <Field label="First" placeholder="Prashanth" value={form.first} onChange={set('first')} />
                <Field label="Last"  placeholder="Mudunuri"  value={form.last}  onChange={set('last')} />
              </div>

              <Field
                label="Email" type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')}
              />
              <Field
                label="Password" type="password" placeholder="min 8 characters"
                value={form.password} onChange={set('password')} strengthBar
              />
              <Field
                label="Confirm password" type="password" placeholder="repeat password"
                value={form.confirm} onChange={set('confirm')} borderOverride={confirmBorder}
              />

              {passwordMismatch && (
                <div style={s.mismatchMsg}>Passwords do not match</div>
              )}

              <label style={s.checkLabel}>
                <input
                  type="checkbox" checked={agreed}
                  onChange={e => setAgreed(e.target.checked)} style={s.check}
                />
                <span style={s.termsText}>
                  I agree to Vaiga's <span style={s.termsLink}>Terms of Service</span> and <span style={s.termsLink}>Privacy Policy</span>
                </span>
              </label>

              <button
                onClick={handleSignup}
                disabled={loading}
                style={{
                  ...s.btnGo,
                  opacity: agreed && !loading ? 1 : 0.35,
                  cursor:  agreed && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

              <div style={s.switchHint}>
                Already have one?{' '}
                <span style={s.switchLink} onClick={() => navigate("/login")} >Sign in →</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ParticlesBackground>
  )
}

function MicIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0c0c0e" strokeWidth="2.5" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  )
}

const s = {
  logo: { position: 'absolute', top: 28, left: 32, display: 'flex', alignItems: 'center', gap: 9, zIndex: 20 },
  logoMark: { width: 28, height: 28, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff' },
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' },
  layout: { width: '100%', maxWidth: 1100, display: 'flex', alignItems: 'stretch', minHeight: 620 },
  leftPanel: { width: '44%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '52px 52px', overflow: 'hidden' },
  bgText: { position: 'absolute', bottom: -20, left: -10, fontFamily: "'Bebas Neue', sans-serif", fontSize: 220, color: 'rgba(255,255,255,0.025)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' },
  headline: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 90, lineHeight: 0.92, letterSpacing: 1, marginBottom: 22, position: 'relative', zIndex: 1 },
  dimWord:    { color: 'rgba(255,255,255,0.22)' },
  accentWord: { color: '#00ffcc' },
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20, position: 'relative', zIndex: 1, fontFamily: "'Space Grotesk', sans-serif" },
  accentLine: { width: 32, height: 2, background: '#00ffcc', position: 'relative', zIndex: 1 },
  sep: { width: 1, flexShrink: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,255,204,0.3), rgba(0,255,204,0.15), transparent)' },
  rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 52px' },
  formBox: { width: '100%', maxWidth: 420 },
  stepLabel: { fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', color: '#00ffcc', marginBottom: 16, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif" },
  formTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 300, color: '#fff', marginBottom: 36, letterSpacing: '-0.3px', lineHeight: 1.3 },
  nameRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  fieldWrap: { marginBottom: 26 },
  label: { display: 'block', fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: { width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 32px 12px 0', fontSize: 15, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 300, outline: 'none', transition: 'border-bottom-color 0.2s' },
  eyeBtn: { position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
  mismatchMsg: { fontSize: 10, color: '#ef4444', marginTop: -14, marginBottom: 14, fontFamily: "'Space Grotesk', sans-serif" },
  checkLabel: { display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 24, cursor: 'pointer' },
  check: { accentColor: '#00ffcc', width: 12, height: 12, marginTop: 2, flexShrink: 0 },
  termsText: { fontSize: 11, color: 'rgba(255,255,255,0.22)', lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif" },
  termsLink: { color: 'rgba(255,255,255,0.45)', textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' },
  btnGo: { width: '100%', padding: '16px', background: '#00ffcc', border: 'none', borderRadius: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: '3px', color: '#0c0c0e', cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s', marginBottom: 0 },
  switchHint: { marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" },
  switchLink: { color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 },
}