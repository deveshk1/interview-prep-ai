import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

function App() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(undefined);
  const [signOutHover, setSignOutHover] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const generateGuide = async () => {
    setLoading(true);
    setResult("");
    try {
      const guide = await generateInterviewGuide(company, role, experience);
      setResult(guide);
    } catch (err) {
      console.error(err);
      setResult("Error generating guide. Please try again.");
    }
    setLoading(false);
  };

  const canGenerate = company.trim() && role.trim() && experience !== "";

  if (session === undefined) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@300;400&display=swap');
          body { margin: 0; background: #0b0d14; }
          .splash {
            min-height: 100vh; display: flex; align-items: center;
            justify-content: center; background: #0b0d14;
            font-family: 'DM Mono', monospace; color: rgba(240,236,226,0.35);
            font-size: 12px; letter-spacing: 0.12em;
          }
        `}</style>
        <div className="splash">Initialising session…</div>
      </>
    );
  }

  if (!session) return <Login />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0b0d14;
          min-height: 100vh;
          font-family: 'DM Mono', monospace;
        }

        :root {
          --gold: #c4a05a;
          --gold-dim: rgba(196,160,90,0.18);
          --gold-border: rgba(196,160,90,0.28);
          --bg: #0b0d14;
          --surface: rgba(255,255,255,0.03);
          --surface-hover: rgba(255,255,255,0.06);
          --text: #f0ece2;
          --text-muted: rgba(240,236,226,0.38);
          --text-dim: rgba(240,236,226,0.18);
        }

        .app-shell {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 70% 50% at 80% 10%, rgba(196,160,90,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 10% 90%, rgba(100,120,200,0.04) 0%, transparent 60%),
            #0b0d14;
        }

        /* ── NAV ── */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 40px;
          border-bottom: 1px solid var(--gold-border);
          position: sticky;
          top: 0;
          background: rgba(11,13,20,0.82);
          backdrop-filter: blur(16px);
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 20px;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .nav-logo em {
          font-style: italic;
          color: var(--gold);
        }

        .nav-badge {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          background: var(--gold-dim);
          border: 1px solid var(--gold-border);
          padding: 2px 8px;
          border-radius: 2px;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-user {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-signout {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid rgba(240,236,226,0.12);
          border-radius: 2px;
          padding: 6px 14px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .btn-signout:hover {
          color: var(--text);
          border-color: rgba(240,236,226,0.35);
          background: var(--surface-hover);
        }

        /* ── HERO ── */
        .hero {
          padding: 72px 40px 48px;
          max-width: 720px;
          margin: 0 auto;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-eyebrow {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hero-eyebrow::after {
          content: '';
          display: block;
          height: 1px;
          width: 40px;
          background: var(--gold-border);
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(2.6rem, 6vw, 4rem);
          color: var(--text);
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .hero-title em {
          font-style: italic;
          color: var(--gold);
        }

        .hero-sub {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.8;
          letter-spacing: 0.04em;
          max-width: 500px;
        }

        /* ── FORM CARD ── */
        .form-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 40px 60px;
          animation: fadeUp 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }

        .form-card {
          background: var(--surface);
          border: 1px solid var(--gold-border);
          border-radius: 4px;
          padding: 40px;
          position: relative;
        }

        .form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 40px; right: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.4;
        }

        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .field-input {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: var(--text);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(240,236,226,0.1);
          border-radius: 3px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          letter-spacing: 0.03em;
        }

        .field-input::placeholder {
          color: var(--text-dim);
        }

        .field-input:focus {
          border-color: rgba(196,160,90,0.5);
          background: rgba(196,160,90,0.03);
        }

        /* Remove number input spinner */
        .field-input[type=number]::-webkit-inner-spin-button,
        .field-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .field-input[type=number] { -moz-appearance: textfield; }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .form-hint {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.06em;
        }

        .btn-generate {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px 36px;
          border-radius: 3px;
          border: 1px solid var(--gold);
          background: transparent;
          color: var(--text);
          cursor: pointer;
          transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
          position: relative;
          overflow: hidden;
        }

        .btn-generate::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gold);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .btn-generate:hover::before { opacity: 0.12; }
        .btn-generate:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(196,160,90,0.15); }
        .btn-generate:active { transform: translateY(0); }

        .btn-generate:disabled {
          border-color: rgba(240,236,226,0.1);
          color: var(--text-dim);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .btn-generate:disabled::before { display: none; }

        .btn-inner { position: relative; display: flex; align-items: center; gap: 10px; }

        /* ── LOADING ── */
        .loading-bar {
          margin-top: 32px;
          height: 1px;
          background: rgba(196,160,90,0.1);
          border-radius: 1px;
          overflow: hidden;
        }

        .loading-bar-inner {
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          animation: shimmer 1.6s ease-in-out infinite;
          width: 60%;
        }

        @keyframes shimmer {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(280%); }
        }

        .loading-label {
          margin-top: 12px;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: var(--text-dim);
          text-align: center;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }

        /* ── RESULT ── */
        .result-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 40px 80px;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .result-header-line {
          flex: 1;
          height: 1px;
          background: var(--gold-border);
        }

        .result-header-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .result-card {
          background: var(--surface);
          border: 1px solid var(--gold-border);
          border-radius: 4px;
          padding: 40px;
        }

        .result-card h1,
        .result-card h2,
        .result-card h3 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          color: var(--text);
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .result-card h1 { font-size: 2rem; margin-bottom: 20px; }
        .result-card h2 { font-size: 1.4rem; margin: 28px 0 12px; color: var(--gold); }
        .result-card h3 { font-size: 1.1rem; margin: 20px 0 8px; }

        .result-card p {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: rgba(240,236,226,0.7);
          line-height: 1.9;
          letter-spacing: 0.02em;
          margin-bottom: 14px;
        }

        .result-card ul,
        .result-card ol {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: rgba(240,236,226,0.7);
          line-height: 1.9;
          padding-left: 20px;
          margin-bottom: 14px;
        }

        .result-card li { margin-bottom: 4px; }

        .result-card li::marker { color: var(--gold); }

        .result-card strong {
          color: var(--text);
          font-weight: 400;
        }

        .result-card code {
          background: rgba(196,160,90,0.08);
          border: 1px solid var(--gold-border);
          border-radius: 2px;
          padding: 1px 6px;
          font-size: 11px;
          color: var(--gold);
        }

        .result-card pre {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(240,236,226,0.08);
          border-radius: 3px;
          padding: 16px;
          overflow-x: auto;
          margin-bottom: 14px;
        }

        .result-card pre code {
          background: none;
          border: none;
          padding: 0;
          color: rgba(240,236,226,0.7);
        }

        .result-card hr {
          border: none;
          border-top: 1px solid var(--gold-border);
          margin: 24px 0;
        }

        /* ── MOBILE ── */
        @media (max-width: 600px) {
          .nav { padding: 16px 20px; }
          .nav-user { display: none; }
          .hero { padding: 48px 20px 32px; }
          .form-wrap, .result-wrap { padding: 0 20px 48px; }
          .form-card, .result-card { padding: 24px 20px; }
          .field-grid { grid-template-columns: 1fr; }
          .form-footer { flex-direction: column; align-items: stretch; }
          .btn-generate { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="app-shell">
        {/* NAV */}
        <nav className="nav">
          <div className="nav-brand">
            <span className="nav-logo">Interview <em>Prep AI</em></span>
            <span className="nav-badge">Beta</span>
          </div>
          <div className="nav-right">
            <span className="nav-user">{session.user.email}</span>
            <button className="btn-signout" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <p className="hero-eyebrow">AI-Powered Preparation</p>
          <h1 className="hero-title">
            Your personalized<br /><em>interview roadmap</em>
          </h1>
          <p className="hero-sub">
            Enter the company, role, and your experience level — and receive a curated guide covering key topics, likely questions, and preparation strategies.
          </p>
        </div>

        {/* FORM */}
        <div className="form-wrap">
          <div className="form-card">
            <div className="field-grid">
              <div className="field">
                <label className="field-label">Company</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Google, Stripe…"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Role / Designation</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Senior SWE, PM…"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              <div className="field field-full">
                <label className="field-label">Years of Experience</label>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 4"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
            </div>

            <div className="form-footer">
              <span className="form-hint">
                {canGenerate
                  ? "Ready to generate your guide"
                  : "Fill in all fields to continue"}
              </span>
              <button
                className="btn-generate"
                onClick={generateGuide}
                disabled={loading || !canGenerate}
              >
                <span className="btn-inner">
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                          <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                        </path>
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      Generate Guide
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>

            {loading && (
              <div>
                <div className="loading-bar">
                  <div className="loading-bar-inner" />
                </div>
                <p className="loading-label">Crafting your personalized guide…</p>
              </div>
            )}
          </div>
        </div>

        {/* RESULT */}
        {result && (
          <div className="result-wrap">
            <div className="result-header">
              <div className="result-header-line" />
              <span className="result-header-label">Your Interview Guide</span>
              <div className="result-header-line" />
            </div>
            <div className="result-card">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;