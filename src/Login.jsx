import { useState } from 'react'
import ParticlesBackground from './ParticlesBackgroundd'
import { useNavigate } from "react-router-dom";
/* ── password toggle field ───────────────────────────── */
function Field({ label, type = 'text', placeholder, value, onChange }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <div style={s.inputWrap}>
        <input
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={s.input}
          onFocus={e  => (e.target.style.borderBottomColor = '#00ffcc')}
          onBlur={e   => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)')}
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
      </div>
    </div>
  )
}

/* ── main ────────────────────────────────────────────── */
export default function Login({ onGoSignup }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const navigate=useNavigate();
  const handleLogin = async () => {
  try {
    const res = await fetch( "https://vaigabackend.onrender.com/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();
    
    if (res.ok) {

  localStorage.setItem(

    'user',

    JSON.stringify(data.user)

  )

  localStorage.setItem(

    'token',

    data.token

  )

  alert("✅ Login successful");

  console.log(data.user);

  navigate('/Home');

}  else {
      alert("❌ " + (data.error || data.message));
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};
  return (
    <ParticlesBackground>

      {/* top-left logo */}
      <div style={s.logo}>
        <div style={s.logoMark}><MicIcon size={14} /></div>
        <span style={s.logoName}>Vaiga <span style={{ color: '#00ffcc' }}>AI</span></span>
      </div>

      <div style={s.page}>
        <div style={s.layout}>

          {/* ── LEFT: branding ── */}
          <div style={s.leftPanel}>
            <div style={s.bgText}>BACK</div>
            <div style={s.headline}>
              <span style={s.dimWord}>YOUR</span><br />
              <span style={s.accentWord}>VOICE</span><br />
              <span style={s.dimWord}>WAITS.</span>
            </div>
            <div style={s.tagline}>AI Voice Assistant</div>
            <div style={s.accentLine} />
          </div>

          {/* ── vertical separator ── */}
          <div style={s.sep} />

          {/* ── RIGHT: form ── */}
          <div style={s.rightPanel}>
            <div style={s.formBox}>
              <div style={s.stepLabel}>Sign in</div>
              <div style={s.formTitle}>Good to see<br /><strong>you again.</strong></div>

              <Field
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Field
                label="Password"
                type="password"
                placeholder="your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              <div style={s.rememberRow}>
                <label style={s.checkLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={s.check}
                  />
                  Remember me
                </label>
                <span style={s.forgotLink}>Forgot password?</span>
              </div>

              <button style={s.btnGo} onClick={handleLogin}>Sign In</button>

              <div style={s.switchHint}>
                No account yet?{' '}
                <span style={s.switchLink} onClick={()=>navigate("/")}>Sign up free →</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ParticlesBackground>
  )
}

/* ── icon ────────────────────────────────────────────── */
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

/* ── styles ──────────────────────────────────────────── */
const s = {
  logo: {
    position: 'absolute', top: 28, left: 32,
    display: 'flex', alignItems: 'center', gap: 9, zIndex: 20,
  },
  logoMark: {
    width: 28, height: 28, borderRadius: 7,
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600, fontSize: 15, color: '#fff',
  },
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px', position: 'relative',
  },
  layout: {
    width: '100%', maxWidth: 820,
    display: 'flex', alignItems: 'stretch',
    minHeight: 520,
  },
  leftPanel: {
    width: '46%', position: 'relative',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end', padding: '40px 38px',
    overflow: 'hidden',
  },
  bgText: {
    position: 'absolute', bottom: -20, left: -10,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 180, color: 'rgba(255,255,255,0.025)',
    lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  headline: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 68, lineHeight: 0.92,
    letterSpacing: 1, marginBottom: 18,
    position: 'relative', zIndex: 1,
  },
  dimWord:    { color: 'rgba(255,255,255,0.22)' },
  accentWord: { color: '#00ffcc' },
  tagline: {
    fontSize: 11, color: 'rgba(255,255,255,0.28)',
    letterSpacing: '2px', textTransform: 'uppercase',
    marginBottom: 20, position: 'relative', zIndex: 1,
  },
  accentLine: {
    width: 32, height: 2, background: '#00ffcc',
    position: 'relative', zIndex: 1,
  },
  sep: {
    width: 1,
    background: 'linear-gradient(to bottom, transparent, rgba(0,255,204,0.3), rgba(0,255,204,0.15), transparent)',
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 36px',
  },
  formBox: { width: '100%', maxWidth: 300 },
  stepLabel: {
    fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase',
    color: '#00ffcc', marginBottom: 14, fontWeight: 500,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  formTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 26, fontWeight: 300, color: '#fff',
    marginBottom: 32, letterSpacing: '-0.3px', lineHeight: 1.25,
  },
  fieldWrap: { marginBottom: 22 },
  label: {
    display: 'block', fontSize: 10, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
    marginBottom: 8,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: {
    width: '100%', background: 'transparent',
    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '10px 28px 10px 0',
    fontSize: 14, color: '#fff',
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 300,
    outline: 'none', transition: 'border-bottom-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: 0, background: 'none', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
  },
  rememberRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 11, color: 'rgba(255,255,255,0.22)', cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  check: { accentColor: '#00ffcc', width: 12, height: 12 },
  forgotLink: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  btnGo: {
    width: '100%', padding: '13px',
    background: '#00ffcc', border: 'none', borderRadius: 0,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 17, letterSpacing: '2px', color: '#0c0c0e',
    cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s',
  },
  switchHint: {
    marginTop: 20, fontSize: 11,
    color: 'rgba(255,255,255,0.2)', textAlign: 'center',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  switchLink: {
    color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
    textDecoration: 'underline', textUnderlineOffset: 3,
  },
}