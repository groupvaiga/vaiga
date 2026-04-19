// ── Global Styles ─────────────────────────────────────────────
// Inject once at the app root (inside Home)

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Noto+Sans+Telugu:wght@400;500&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { overflow: hidden; }

      @keyframes micFloat {
        0%,100% { transform: translateY(0) scale(1); }
        50%      { transform: translateY(-8px) scale(1.02); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fboFadeIn {
        from { opacity: 0; transform: scale(0.85); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes labelPulse {
        0%   { opacity: 0.45; }
        100% { opacity: 1; }
      }
      @keyframes redPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7), 0 0 18px rgba(239,68,68,0.5); }
        50%     { box-shadow: 0 0 0 7px rgba(239,68,68,0), 0 0 28px rgba(239,68,68,0.8); }
      }
      @keyframes redRing {
        0%   { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.2); opacity: 0; }
      }

      .vd-input {
        flex: 1; background: transparent; border: none; outline: none;
        color: #94a3b8; font-family: 'Syne', sans-serif;
        font-size: 13px; caret-color: #38bdf8;
      }
      .vd-input::placeholder { color: #2a3245; }
      .vd-input:disabled { opacity: 0.5; cursor: not-allowed; }

      .mic-bar {
        position: relative; width: 36px; height: 36px;
        border-radius: 50%; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: all 0.25s cubic-bezier(.4,2,.5,1);
      }
      .mic-bar.idle {
        background: rgba(25,35,55,0.9);
        box-shadow: 0 0 10px rgba(59,130,246,0.15);
      }
      .mic-bar.idle:hover {
        background: rgba(14,165,233,0.18);
        box-shadow: 0 0 18px rgba(14,165,233,0.4);
        transform: scale(1.1);
      }
      .mic-bar.recording {
        background: #ef4444;
        animation: redPulse 1.3s ease-in-out infinite;
        transform: scale(1.06);
      }
      .mic-bar.loading {
        background: rgba(25,35,55,0.9);
        cursor: default; opacity: 0.7;
      }

      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
    `}</style>
  )
}