import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ── 3D Perlin Noise ───────────────────────────────────────────
const _pa = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
const _pp = new Array(512);
for (let i = 0; i < 256; i++) _pp[i] = _pp[i + 256] = _pa[i];
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t, a, b) => a + t * (b - a);
const grad = (h, x, y, z) => {
  h &= 15;
  const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
};
function N(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = _pp[X]+Y, AA = _pp[A]+Z, AB = _pp[A+1]+Z, B = _pp[X+1]+Y, BA = _pp[B]+Z, BB = _pp[B+1]+Z;
  return lerp(w,
    lerp(v, lerp(u, grad(_pp[AA],x,y,z),   grad(_pp[BA],x-1,y,z)),
             lerp(u, grad(_pp[AB],x,y-1,z), grad(_pp[BB],x-1,y-1,z))),
    lerp(v, lerp(u, grad(_pp[AA+1],x,y,z-1),   grad(_pp[BA+1],x-1,y,z-1)),
             lerp(u, grad(_pp[AB+1],x,y-1,z-1), grad(_pp[BB+1],x-1,y-1,z-1))));
}

// ── Shaders ───────────────────────────────────────────────────
const vertexShader = `
  attribute float sz;
  attribute vec3  col;
  attribute float alf;
  varying   vec3  vC;
  varying   float vA;
  void main() {
    vC = col; vA = alf;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = sz * (400.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const fragmentShader = `
  varying vec3  vC;
  varying float vA;
  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0,  0.12, d);
    float rim  = 1.0 - smoothstep(0.12, 0.50, d);
    gl_FragColor = vec4(vC, vA * (core * 0.92 + rim * 0.42));
  }
`;

// ── Build particle arrays ─────────────────────────────────────
const COUNT = 25000;
function buildParticles() {
  const POS = new Float32Array(COUNT * 3);
  const COL = new Float32Array(COUNT * 3);
  const SZ  = new Float32Array(COUNT);
  const ALF = new Float32Array(COUNT);
  const bX  = new Float32Array(COUNT);
  const bY  = new Float32Array(COUNT);
  const bZ  = new Float32Array(COUNT);
  const oR  = new Float32Array(COUNT);
  const oT  = new Float32Array(COUNT);
  const oP  = new Float32Array(COUNT);
  const oS  = new Float32Array(COUNT);
  const PH  = new Float32Array(COUNT);
  const LYR = new Uint8Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const rng = Math.random();
    const L = rng < 0.52 ? 0 : rng < 0.72 ? 1 : rng < 0.88 ? 2 : 3;
    LYR[i] = L;

    let r, theta, phi;
    if (L === 0) {
      r     = Math.random() < 0.65 ? 0.68 + Math.random()*0.40 : 0.05 + Math.random()*0.62;
      theta = Math.random() * Math.PI * 2;
      phi   = Math.acos(2*Math.random()-1);
    } else if (L === 1) {
      r     = 1.05 + Math.random()*0.26;
      theta = Math.random() * Math.PI * 2;
      phi   = Math.PI*0.5 + (Math.random()-0.5)*0.20;
    } else if (L === 2) {
      r     = 0.88 + Math.random()*0.92;
      theta = Math.random() * Math.PI * 2;
      phi   = Math.random()<0.5 ? 0.15+Math.random()*0.55 : Math.PI-0.15-Math.random()*0.55;
    } else {
      r     = 1.12 + Math.random()*0.90;
      theta = Math.random() * Math.PI * 2;
      phi   = Math.acos(2*Math.random()-1);
    }

    const sp = Math.sin(phi), cp = Math.cos(phi), st = Math.sin(theta), ct = Math.cos(theta);
    bX[i] = r*sp*ct; bY[i] = r*cp*1.30; bZ[i] = r*sp*st*0.56;
    oR[i] = r; oT[i] = theta; oP[i] = phi;
    oS[i] = (0.004 + Math.random()*0.016) * (Math.random()>0.5?1:-1);
    PH[i] = Math.random() * Math.PI * 2;

    POS[i*3]=bX[i]; POS[i*3+1]=bY[i]; POS[i*3+2]=bZ[i];

    SZ[i]  = L===3?2.8+Math.random()*2.5 : L===1?1.1+Math.random()*1.6 : L===2?0.9+Math.random()*1.4 : 0.6+Math.random()*1.3;
    ALF[i] = L===3?0.80+Math.random()*0.20 : L===2?0.18+Math.random()*0.35 : 0.14+Math.random()*0.40;

    if (L===3) { COL[i*3]=0.88; COL[i*3+1]=0.94; COL[i*3+2]=1.0; }
    else if (L===1) { COL[i*3]=0.50+Math.random()*0.32; COL[i*3+1]=0.74+Math.random()*0.22; COL[i*3+2]=1.0; }
    else if (L===2) { COL[i*3]=0.28+Math.random()*0.28; COL[i*3+1]=0.36+Math.random()*0.30; COL[i*3+2]=0.88+Math.random()*0.12; }
    else {
      const ne = oR[i]>0.62;
      COL[i*3]=ne?0.36+Math.random()*0.30:0.10+Math.random()*0.14;
      COL[i*3+1]=ne?0.56+Math.random()*0.26:0.18+Math.random()*0.20;
      COL[i*3+2]=1.0;
    }
  }
  return { POS, COL, SZ, ALF, bX, bY, bZ, oR, oT, oP, oS, PH, LYR };
}

// ── Main Component ────────────────────────────────────────────
export default function App() {
  const mountRef  = useRef(null);
  const [micOn, setMicOn]   = useState(false);
  const [label, setLabel]   = useState("click mic to speak");
  const analyserRef = useRef(null);
  const micDataRef  = useRef(null);
  const micOnRef    = useRef(false);

  // sync ref with state
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);

  // ── Three.js setup ────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.offsetWidth, el.offsetHeight);
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, el.offsetWidth / el.offsetHeight, 0.01, 200);
    camera.position.set(0, 0, 4.8);

    const { POS, COL, SZ, ALF, bX, bY, bZ, oR, oT, oP, oS, PH, LYR } = buildParticles();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(POS, 3));
    geo.setAttribute("col",      new THREE.BufferAttribute(COL, 3));
    geo.setAttribute("sz",       new THREE.BufferAttribute(SZ,  1));
    geo.setAttribute("alf",      new THREE.BufferAttribute(ALF, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let t   = 0;
    let vol = 0;
    let raf;

    function tick() {
      raf = requestAnimationFrame(tick);
      t  += 0.013;

      // mic volume
      let raw = 0;
      if (analyserRef.current && micOnRef.current) {
        analyserRef.current.getByteFrequencyData(micDataRef.current);
        const avg = micDataRef.current.reduce((a, b) => a + b, 0) / micDataRef.current.length;
        raw = Math.min(1, avg / 80);
      }
      vol += (raw - vol) * 0.08;

      // whole-blob motion
      pts.rotation.y = t * 0.21;
      pts.rotation.x = Math.sin(t*0.09)*0.28 + Math.sin(t*0.13)*0.09;
      pts.rotation.z = Math.sin(t*0.07)*0.13;
      pts.scale.setScalar(1 + Math.sin(t*0.95)*0.022 + vol*0.24);

      const PA   = geo.attributes.position.array;
      const nSpd = 0.27;

      for (let i = 0; i < COUNT; i++) {
        const L  = LYR[i], p = PH[i];
        const BX = bX[i], BY = bY[i], BZ = bZ[i];

        const nm = L===2?0.30:L===3?0.40:0.18;
        const nx = N(BX*2+t*nSpd, BY*2,        BZ*2       ) * (nm + vol*0.38);
        const ny = N(BX*2,        BY*2+t*nSpd, BZ*2       ) * (nm + vol*0.38);
        const nz = N(BX*2,        BY*2,        BZ*2+t*nSpd) * (nm + vol*0.38);

        oT[i] += oS[i] * (1 + vol*2.4) * 0.016;
        const pulse = Math.sin(t*1.7+p) * (0.040 + vol*0.18);
        const burst = vol * (L===3?0.68:L===2?0.58:0.44);
        const r2    = oR[i] + pulse + burst;
        const sp2   = Math.sin(oP[i]), cp2 = Math.cos(oP[i]);

        let px = r2*sp2*Math.cos(oT[i]) + nx;
        let py  = r2*cp2*1.30            + ny;
        let pz  = r2*sp2*Math.sin(oT[i])*0.56 + nz;

        // apex vortex twist
        if (BY > 0.15) {
          const twist = (BY+1.3)*0.13*Math.sin(t*0.22+p*0.4)*(1+vol*2.0);
          const cosT = Math.cos(twist), sinT = Math.sin(twist);
          const tx = px*cosT - pz*sinT;
          pz = px*sinT + pz*cosT; px = tx;
        }
        // ring flutter
        if (L===1) py += Math.sin(oT[i]*6+t*2.4)*vol*0.20;
        // streamer snake
        if (L===2) {
          px += Math.sin(t*2.8+p+py*2)*vol*0.14;
          pz += Math.cos(t*2.2+p+py*2)*vol*0.14;
        }

        PA[i*3]=px; PA[i*3+1]=py; PA[i*3+2]=pz;
      }

      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    tick();

    const onResize = () => {
      renderer.setSize(el.offsetWidth, el.offsetHeight);
      camera.aspect = el.offsetWidth / el.offsetHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // ── Mic toggle ────────────────────────────────────────────
  const toggleMic = async () => {
    if (micOn) {
      setMicOn(false);
      analyserRef.current = null;
      setLabel("click mic to speak");
      return;
    }
    try {
      const stream  = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx2    = new (window.AudioContext || window.webkitAudioContext)();
      const src     = ctx2.createMediaStreamSource(stream);
      const anlsr   = ctx2.createAnalyser();
      anlsr.fftSize = 512;
      anlsr.smoothingTimeConstant = 0.80;
      src.connect(anlsr);
      analyserRef.current = anlsr;
      micDataRef.current  = new Uint8Array(anlsr.frequencyBinCount);
      setMicOn(true);
      setLabel("listening — speak now!");
    } catch {
      setLabel("mic access denied");
    }
  };

  return (
    <div style={{ width:"100vw", height:"100vh", background:"#000", position:"relative", overflow:"hidden" }}>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ width:"100%", height:"100%" }} />

      {/* UI overlay */}
      <div style={{
        position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:10,
      }}>
        <div style={{
          color:"rgba(120,180,255,0.55)", fontFamily:"sans-serif",
          fontSize:11, letterSpacing:".18em", textTransform:"uppercase",
        }}>
          {label}
        </div>
        <button
          onClick={toggleMic}
          style={{
            width:52, height:52, borderRadius:"50%", cursor:"pointer",
            border: micOn ? "1.5px solid rgba(80,255,160,0.7)" : "1.5px solid rgba(100,160,255,0.4)",
            background:"rgba(8,18,55,0.6)",
            boxShadow: micOn ? "0 0 22px rgba(80,255,160,0.3)" : "0 0 14px rgba(80,140,255,0.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .3s",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="13" rx="3" fill="rgba(140,200,255,0.9)"/>
            <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="rgba(140,200,255,0.9)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="rgba(140,200,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="8"  y1="23" x2="16" y2="23" stroke="rgba(140,200,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}