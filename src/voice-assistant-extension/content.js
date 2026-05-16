/* global chrome */

const SCREEN_KEYWORDS = [
  'screen','page','website','site','open','show','see','watching','doing',
  'browser','window','next','what is this','what am i seeing',
  'what page','what website','explain','describe','tell me','guide me','help me'
]

if (!window.__VAIGA_LOADED__) {

  window.__VAIGA_LOADED__ = true;
console.log("VAIGA content script loaded");

  // ── Inject styles ───────────────────────────────────────
  const style = document.createElement('style')

  style.textContent = `

  #va-mic-btn{
    position:fixed !important;
    width:68px !important;
    height:68px !important;
    border-radius:50% !important;
    border:none !important;
    background:linear-gradient(135deg,#7c3aed,#4f46e5) !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    cursor:pointer !important;
    z-index:2147483647 !important;
    box-shadow:0 10px 30px rgba(0,0,0,.35) !important;
    transition:all .2s ease !important;
    padding:0 !important;
  }

  #va-mic-btn:hover{
    transform:scale(1.05) !important;
  }

  #va-panel{
    position:fixed !important;
    width:320px !important;
    height:420px !important;
    background:#0f172a !important;
    border-radius:24px !important;
    overflow:hidden !important;
    box-shadow:0 20px 60px rgba(0,0,0,.45) !important;
    z-index:2147483647 !important;
    border:1px solid rgba(255,255,255,.08) !important;
    display:flex !important;
    flex-direction:column !important;
    backdrop-filter:blur(20px) !important;
  }

  #va-panel.hidden{
    display:none !important;
  }

  #va-panel.minimized{
    width:74px !important;
    height:74px !important;
    border-radius:50% !important;
  }

  #va-min-btn{
    position:absolute !important;
    top:10px !important;
    right:10px !important;
    width:28px !important;
    height:28px !important;
    border-radius:50% !important;
    border:none !important;
    background:rgba(255,255,255,.12) !important;
    color:#fff !important;
    cursor:pointer !important;
    z-index:10 !important;
    font-size:18px !important;
  }

  #va-min-btn:hover{
    background:rgba(255,255,255,.22) !important;
  }

  #va-mic-icon{
    position:absolute !important;
    top:50% !important;
    left:50% !important;
    transform:translate(-50%,-50%) !important;
    display:none !important;
  }

  #va-panel.minimized #va-mic-icon{
    display:flex !important;
  }

  #va-panel.minimized iframe{
    display:none !important;
  }

  #va-iframe{
    width:100% !important;
    height:100% !important;
    border:none !important;
    background:#0f172a !important;
  }

  `

  document.head.appendChild(style)

  // ── Send page info ──────────────────────────────────────
  function sendPageInfo() {

    console.log('VAIGA PAGE:', window.location.href)

    const data = {
      url: window.location.href,
      title: document.title,
      ts: Date.now()
    }

    try {

      chrome.runtime.sendMessage({
        type:'vaiga-page-info',
        url:data.url,
        title:data.title
      })

      chrome.storage.local.set({
        __VAIGA_PAGE_INFO__: data
      })

    } catch(e) {}

  }

  sendPageInfo()

  // ── SPA tracking ────────────────────────────────────────
  const originalPush = history.pushState.bind(history)

  history.pushState = function () {
    originalPush(...arguments)
    setTimeout(sendPageInfo, 300)
  }

  const originalReplace = history.replaceState.bind(history)

  history.replaceState = function () {
    originalReplace(...arguments)
    setTimeout(sendPageInfo, 300)
  }

  window.addEventListener('popstate', () => {
    setTimeout(sendPageInfo, 300)
  })

  // ── Click tracking ──────────────────────────────────────
  // ── Smart semantic click tracking ───────────────────────
function getClickable(el) {

  let cur = el

  for (let i = 0; i < 6 && cur; i++) {

    const tag = cur.tagName?.toLowerCase()

    if (
      tag === 'button' ||
      tag === 'a' ||
      tag === 'input' ||
      tag === 'select' ||
      tag === 'textarea' ||
      cur.onclick ||
      cur.role === 'button'
    ) {
      return cur
    }

    cur = cur.parentElement
  }

  return el
}

function getSemanticLabel(el) {

  if (!el) return 'Unknown'

  const candidates = [

   el.textContent ,

    el.value,

    el.placeholder,

    el.getAttribute?.('aria-label'),

    el.getAttribute?.('title'),

    el.getAttribute?.('name'),

    el.getAttribute?.('alt'),

    el.id,

    el.className,

    el.tagName

  ]

  for (const c of candidates) {

    if (
      typeof c === 'string' &&
      c.trim().length > 1
    ) {

      return c
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)
    }
  }

  return 'Unknown'
}

let lastClickText = ''
let lastClickTs   = 0

document.addEventListener('click', (e) => {

  try {
     if (window.location.hostname === 'localhost') return
if (window.location.hostname === '127.0.0.1') return
if (window.location.hostname.includes('vercel.app')) return
    const el = getClickable(e.target)

    if (!el?.getBoundingClientRect)
      return

    const rect = el.getBoundingClientRect()

    const x_pct =
      ((rect.left + rect.width / 2) / window.innerWidth) * 100

    const y_pct =
      ((rect.top + rect.height / 2) / window.innerHeight) * 100

    const label = getSemanticLabel(el)

    const text = `Click "${label}"`

    // ── Deduplicate spam clicks ──────────────────────────
    if (
      text === lastClickText &&
      Date.now() - lastClickTs < 1500
    ) {
      return
    }

    lastClickText = text
    lastClickTs   = Date.now()

    const cleanX = Math.round(x_pct * 10) / 10
    const cleanY = Math.round(y_pct * 10) / 10

    try {

      chrome.runtime.sendMessage({
        type:'vaiga-click-info',
        url:window.location.href,
        title:document.title,
        tag:el.tagName,
        text,
        x_pct:cleanX,
        y_pct:cleanY
      })

    } catch(e) {}

    window.postMessage({
      type:'vaiga-click-info',
      url:window.location.href,
      text,
      x_pct:cleanX,
      y_pct:cleanY
    }, '*')

    console.log('📡 Smart click:', text)

    setTimeout(sendPageInfo, 500)

  } catch (err) {

    console.log('click extraction failed:', err)
  }

}, true)

  // ── Periodic sync ───────────────────────────────────────
  setInterval(sendPageInfo, 3000)

  // ── Floating mic button ─────────────────────────────────
  const micBtn = document.createElement('button')

  micBtn.id = 'va-mic-btn'

  micBtn.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <rect x="17" y="6" width="14" height="22"
        rx="7" fill="white" fill-opacity="0.95"/>
      <path d="M10 22c0 7.732 6.268 14 14 14s14-6.268 14-14"
        stroke="white"
        stroke-width="2.5"
        stroke-linecap="round"/>
      <line x1="24" y1="36" x2="24" y2="42"
        stroke="white"
        stroke-width="2.5"
        stroke-linecap="round"/>
      <line x1="17" y1="42" x2="31" y2="42"
        stroke="white"
        stroke-width="2.5"
        stroke-linecap="round"/>
    </svg>
  `

  document.body.appendChild(micBtn)

  // ── Panel ───────────────────────────────────────────────
  const panel = document.createElement('div')

  panel.id = 'va-panel'
  panel.className = 'hidden'

const APP_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://vaiga-three.vercel.app'

panel.innerHTML = `
  <button id="va-min-btn" title="Minimize">−</button>

  <div id="va-mic-icon">
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <rect x="17" y="6" width="14" height="22"
        rx="7" fill="white" fill-opacity="0.95"/>
    </svg>
  </div>

  <iframe
    id="va-iframe"
    src="${APP_URL}/Home?mini=true"
    allow="microphone *; autoplay *"
    style="border:none;"
  ></iframe>
`

  document.body.appendChild(panel)

  const minBtn = document.getElementById('va-min-btn')
  const iframe = document.getElementById('va-iframe')

  let posLeft = window.innerWidth - 98
  let posTop  = window.innerHeight - 98

  function applyPanelPos() {
    panel.style.left = posLeft + 'px'
    panel.style.top  = posTop  + 'px'
  }

  function applyMicPos() {
    micBtn.style.left = posLeft + 'px'
    micBtn.style.top  = posTop  + 'px'
  }

  applyMicPos()

  // ── Open panel ──────────────────────────────────────────
  function openPanel() {

    panel.classList.remove('hidden')
    panel.classList.remove('minimized')

    iframe.style.display = 'block'

    applyPanelPos()

    micBtn.style.display = 'none'
  }

  // ── Close panel ─────────────────────────────────────────
  function closePanel() {

    const rect = panel.getBoundingClientRect()

    posLeft = rect.left
    posTop  = rect.top

    panel.classList.add('hidden')

    applyMicPos()

    micBtn.style.display = 'flex'
  }

  // ── Minimize ────────────────────────────────────────────
 minBtn.onclick = (e) => {

  e.stopPropagation()

  const rect = panel.getBoundingClientRect()

  posLeft = rect.left
  posTop  = rect.top

  // Hide assistant panel
  panel.classList.add('hidden')

  // Restore floating mic
  micBtn.style.display = 'flex'

  applyMicPos()
}
  // ── Drag logic ──────────────────────────────────────────
  let dragTarget = null
  let dragStartX = 0
  let dragStartY = 0
  let dragInitL  = 0
  let dragInitT  = 0
  let didDrag    = false
  let wasMinimized = false

  micBtn.addEventListener('mousedown', (e) => {

    dragTarget = 'mic'

    dragStartX = e.clientX
    dragStartY = e.clientY

    dragInitL = posLeft
    dragInitT = posTop

    didDrag = false

    e.preventDefault()
  })

  panel.addEventListener('mousedown', (e) => {

    if (e.target.id === 'va-min-btn') return

    dragTarget = 'panel'

    dragStartX = e.clientX
    dragStartY = e.clientY

    const rect = panel.getBoundingClientRect()

    dragInitL = rect.left
    dragInitT = rect.top

    didDrag = false

    wasMinimized = panel.classList.contains('minimized')

    e.preventDefault()
  })

  document.addEventListener('mousemove', (e) => {

    if (!dragTarget) return

    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY

    if (!didDrag && Math.abs(dx) < 5 && Math.abs(dy) < 5) return

    didDrag = true

    if (dragTarget === 'mic') {

      posLeft = Math.max(
        0,
        Math.min(dragInitL + dx, window.innerWidth - micBtn.offsetWidth)
      )

      posTop = Math.max(
        0,
        Math.min(dragInitT + dy, window.innerHeight - micBtn.offsetHeight)
      )

      applyMicPos()
    }

    else if (dragTarget === 'panel') {

      posLeft = Math.max(
        0,
        Math.min(dragInitL + dx, window.innerWidth - panel.offsetWidth)
      )

      posTop = Math.max(
        0,
        Math.min(dragInitT + dy, window.innerHeight - panel.offsetHeight)
      )

      applyPanelPos()
    }

  })

  document.addEventListener('mouseup', () => {

    if (!dragTarget) return

    if (!didDrag) {

      if (dragTarget === 'mic') {
        openPanel()
      }

      if (dragTarget === 'panel' && wasMinimized) {

        const r = panel.getBoundingClientRect()

        posLeft = r.left
        posTop  = r.top

        panel.classList.remove('minimized')

        iframe.style.display = 'block'

        applyPanelPos()
      }
    }

    dragTarget = null
    didDrag    = false
  })

  // ── Mini broadcast ──────────────────────────────────────
  setInterval(() => {

   let val = null

try {
  val = localStorage.getItem('vaiga-mini-open')
} catch (e) {
  console.log('localStorage blocked')
}

    if (!val) return

    const age = Date.now() - parseInt(val)

    if (age < 3000) {

      localStorage.removeItem('vaiga-mini-open')

      openPanel()

      try {

        chrome.runtime.sendMessage({
          type:'vaiga-mini-broadcast'
        })

      } catch(e) {}

    }

  }, 500)

  // ── Window messages ─────────────────────────────────────
  window.addEventListener('message', (e) => {

    // window.addEventListener('message') lo add cheyyi
if (e.data?.type === 'vaiga-check-extension') {
  window.postMessage({ type:'vaiga-extension-loaded' }, '*')
}



    if (e.data?.type === 'vaiga-get-url') {

      try {

        chrome.runtime.sendMessage({
          type:'get-page-info'
        }, (res) => {

          window.postMessage({
            type:'vaiga-url-response',
            url:res?.url || '',
            title:res?.title || ''
          }, '*')

        })

      } catch(err) {}

    }

  })

  // ── Extension messages ──────────────────────────────────
  let lastRelay = ''

chrome.runtime.onMessage.addListener((msg) => {

  if (msg.type === 'vaiga-mini-open') {
    openPanel()
  }

  if (msg.type === 'vaiga-click-relay') {

    const relayKey =
      `${msg.text}_${msg.x_pct}_${msg.y_pct}`

    // Prevent duplicate relays
    if (relayKey === lastRelay) return

    lastRelay = relayKey

    setTimeout(() => {
      lastRelay = ''
    }, 1500)

    window.postMessage({
      type: 'vaiga-click-relay',
      x_pct: msg.x_pct,
      y_pct: msg.y_pct,
      text: msg.text,
      url: msg.url,
      image: msg.image,
    }, '*')
  }
})


// ── Input/typing tracking ──────────────────────
let activeInput = null
let inputTimer  = null

document.addEventListener('focusin', (e) => {

  const tag = e.target.tagName?.toLowerCase()

  if (['input','textarea'].includes(tag)) {
    activeInput = e.target
  }

}, true)

document.addEventListener('input', () => {

  if (!activeInput) return

  clearTimeout(inputTimer)

  inputTimer = setTimeout(() => {

    const val = activeInput.value || ''

    if (!val.trim()) return

    // Skip passwords
    if (activeInput.type === 'password') return

    const rect = activeInput.getBoundingClientRect()

    const x_pct =
      Math.round(
        ((rect.left + rect.width / 2) / window.innerWidth) * 1000
      ) / 10

    const y_pct =
      Math.round(
        ((rect.top + rect.height / 2) / window.innerHeight) * 1000
      ) / 10

    const label =
      activeInput.placeholder ||
      activeInput.getAttribute('aria-label') ||
      activeInput.name ||
      'input'

   window.postMessage({
  type:   'vaiga-typed-info',
  text:   `Typed "${val}" in ${label}`,
  typed:  val,
  target: label,
  x_pct,
  y_pct,
  url:    window.location.href,
}, '*')

console.log(
  `⌨️ SENT TYPE: "${val}" in ${label}`
)

  }, 1500)

}, true)

}