import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

export default function App() {
  const [company, setCompany]     = useState("");
  const [role, setRole]           = useState("");
  const [experience, setExperience] = useState("");
  const [result, setResult]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [session, setSession]     = useState(undefined);
  const [copied, setCopied]       = useState(false);
  const [dots, setDots]           = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, [loading]);

  const generateGuide = async () => {
    setLoading(true);
    setResult("");
    try {
      const guide = await generateInterviewGuide(company, role, experience);
      setResult(guide);
    } catch (err) {
      setResult("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = company.trim() && role.trim() && experience !== "";

  if (session === undefined) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        body { margin:0; background:#060910; display:flex; align-items:center; justify-content:center; min-height:100vh; }
        .splash { font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; color:rgba(255,255,255,0.25); letter-spacing:0.06em; }
      `}</style>
      <div className="splash">Loading…</div>
    </>
  );

  if (!session) return <Login />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #060910;
          --surface:   #0d1117;
          --surface2:  #131920;
          --border:    rgba(255,255,255,0.07);
          --border-hi: rgba(255,255,255,0.13);
          --text:      #e8eaf0;
          --text-2:    rgba(232,234,240,0.55);
          --text-3:    rgba(232,234,240,0.28);
          --accent:    #4f8ef7;
          --accent-2:  #3b72d4;
          --accent-glow: rgba(79,142,247,0.18);
          --green:     #34d399;
          --sans:      'Plus Jakarta Sans', sans-serif;
          --serif:     'Instrument Serif', serif;
        }

        body {
          background: var(--bg);
          font-family: var(--sans);
          color: var(--text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── LAYOUT ─── */
        .shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(ellipse 900px 600px at 70% -100px, rgba(79,142,247,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 600px 400px at -100px 80%, rgba(52,211,153,0.04) 0%, transparent 70%),
            var(--bg);
        }

        /* ─── NAV ─── */
        .nav {
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          border-bottom: 1px solid var(--border);
          background: rgba(6,9,16,0.75);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }

        .nav-left { display: flex; align-items: center; gap: 12px; }

        .nav-wordmark {
          font-family: var(--serif);
          font-size: 18px;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .nav-wordmark span { font-style: italic; color: var(--accent); }

        .nav-pill {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-glow);
          border: 1px solid rgba(79,142,247,0.3);
          border-radius: 100px;
          padding: 2px 9px;
        }

        .nav-right { display: flex; align-items: center; gap: 16px; }

        .nav-email {
          font-size: 12px;
          color: var(--text-3);
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-ghost {
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-2);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px 14px;
          cursor: pointer;
          transition: color .2s, border-color .2s, background .2s;
        }
        .btn-ghost:hover { color: var(--text); border-color: var(--border-hi); background: var(--surface2); }

        /* ─── MAIN GRID ─── */
        .main {
          flex: 1;
          display: grid;
          grid-template-columns: 380px 1fr;
          min-height: calc(100vh - 58px);
        }

        /* ─── LEFT PANEL ─── */
        .left-panel {
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 36px 28px;
          gap: 32px;
          overflow-y: auto;
        }

        .panel-intro {}

        .intro-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 14px;
        }

        .intro-heading {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 400;
          line-height: 1.15;
          color: var(--text);
          margin-bottom: 12px;
        }
        .intro-heading em { font-style: italic; color: var(--accent); }

        .intro-body {
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-2);
        }

        /* ─── FORM ─── */
        .form-section { display: flex; flex-direction: column; gap: 18px; }

        .form-divider {
          height: 1px;
          background: var(--border);
        }

        .field { display: flex; flex-direction: column; gap: 7px; }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-2);
        }

        .field-input {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 400;
          color: var(--text);
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 14px;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          width: 100%;
        }
        .field-input::placeholder { color: var(--text-3); }
        .field-input:focus {
          border-color: rgba(79,142,247,0.5);
          box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
        }
        .field-input[type=number]::-webkit-inner-spin-button,
        .field-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .field-input[type=number] { -moz-appearance: textfield; }

        /* ─── GENERATE BUTTON ─── */
        .btn-generate {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity .2s, transform .2s, box-shadow .2s;
          box-shadow: 0 4px 16px rgba(79,142,247,0.25);
          width: 100%;
          margin-top: 4px;
        }
        .btn-generate:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(79,142,247,0.35);
        }
        .btn-generate:active:not(:disabled) { transform: translateY(0); }
        .btn-generate:disabled {
          background: var(--surface2);
          color: var(--text-3);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* ─── STATUS HINT ─── */
        .status-hint {
          font-size: 11px;
          color: var(--text-3);
          text-align: center;
          letter-spacing: 0.02em;
        }
        .status-hint.ready { color: var(--green); }

        /* ─── RIGHT PANEL ─── */
        .right-panel {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
        }

        /* ─── EMPTY STATE ─── */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px;
          text-align: center;
          animation: fadeIn .4s ease both;
        }

        .empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-3);
        }

        .empty-title {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 400;
          color: var(--text-2);
        }

        .empty-sub {
          font-size: 13px;
          color: var(--text-3);
          max-width: 320px;
          line-height: 1.7;
        }

        .empty-steps {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
          text-align: left;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-3);
        }

        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--surface2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-3);
          flex-shrink: 0;
        }

        /* ─── LOADING STATE ─── */
        .loading-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 60px;
          animation: fadeIn .3s ease both;
        }

        .loading-ring {
          width: 44px;
          height: 44px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-2);
        }

        .loading-sub {
          font-size: 12px;
          color: var(--text-3);
        }

        .loading-bar-track {
          width: 200px;
          height: 2px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }

        .loading-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--green));
          border-radius: 2px;
          animation: loadSlide 2s ease-in-out infinite;
          width: 50%;
        }

        @keyframes loadSlide {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }

        /* ─── RESULT ─── */
        .result-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          animation: fadeIn .5s ease both;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .result-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: rgba(6,9,16,0.85);
          backdrop-filter: blur(16px);
          z-index: 10;
          flex-shrink: 0;
        }

        .result-topbar-left { display: flex; align-items: center; gap: 10px; }

        .result-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--green);
        }

        .result-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green);
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .result-meta {
          font-size: 12px;
          color: var(--text-3);
        }

        .btn-copy {
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-2);
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all .2s;
        }
        .btn-copy:hover { color: var(--text); border-color: var(--border-hi); }
        .btn-copy.copied { color: var(--green); border-color: rgba(52,211,153,0.4); }

        .result-body {
          padding: 36px 48px 60px;
          flex: 1;
          max-width: 760px;
        }

        /* ─── MARKDOWN STYLES ─── */
        .result-body h1 {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 400;
          color: var(--text);
          line-height: 1.2;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .result-body h2 {
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin: 36px 0 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-body h2::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .result-body h3 {
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin: 24px 0 10px;
        }

        .result-body p {
          font-size: 14px;
          line-height: 1.85;
          color: rgba(232,234,240,0.72);
          margin-bottom: 14px;
        }

        .result-body ul, .result-body ol {
          margin-bottom: 16px;
          padding-left: 4px;
          list-style: none;
        }

        .result-body ul li, .result-body ol li {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(232,234,240,0.72);
          padding: 5px 0 5px 20px;
          position: relative;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .result-body ul li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--accent);
          font-size: 12px;
          top: 7px;
        }

        .result-body ol { counter-reset: ol-counter; }
        .result-body ol li { counter-increment: ol-counter; }
        .result-body ol li::before {
          content: counter(ol-counter, decimal-leading-zero);
          position: absolute;
          left: 0;
          font-size: 10px;
          font-weight: 700;
          color: var(--accent);
          top: 8px;
          letter-spacing: 0.05em;
        }

        .result-body strong {
          color: var(--text);
          font-weight: 600;
        }

        .result-body em { color: rgba(232,234,240,0.9); }

        .result-body code {
          font-size: 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 2px 7px;
          color: var(--green);
          font-family: 'SF Mono', Consolas, monospace;
        }

        .result-body pre {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
          margin-bottom: 18px;
        }

        .result-body pre code {
          background: none;
          border: none;
          padding: 0;
          color: var(--text-2);
          font-size: 13px;
        }

        .result-body hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 28px 0;
        }

        .result-body blockquote {
          border-left: 3px solid var(--accent);
          padding: 10px 18px;
          background: var(--accent-glow);
          border-radius: 0 8px 8px 0;
          margin-bottom: 16px;
        }

        .result-body blockquote p {
          color: var(--text-2);
          margin: 0;
          font-style: italic;
        }

        /* ─── MOBILE ─── */
        @media (max-width: 900px) {
          .main { grid-template-columns: 1fr; }
          .left-panel { border-right: none; border-bottom: 1px solid var(--border); padding: 24px 20px; }
          .right-panel { min-height: 60vh; }
          .result-body { padding: 24px 20px 48px; }
          .nav-email { display: none; }
          .empty-state, .loading-state { padding: 40px 20px; }
        }
      `}</style>

      <div className="shell">
        {/* NAV */}
        <nav className="nav">
          <div className="nav-left">
            <div className="nav-wordmark">Interview <span>Prep</span> AI</div>
            <div className="nav-pill">Beta</div>
          </div>
          <div className="nav-right">
            <span className="nav-email">{session.user.email}</span>
            <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </nav>

        {/* MAIN */}
        <div className="main">

          {/* LEFT — FORM */}
          <div className="left-panel">
            <div className="panel-intro">
              <div className="intro-label">
                <SparkleIcon /> AI-Powered
              </div>
              <h1 className="intro-heading">
                Your personalized<br /><em>interview guide</em>
              </h1>
              <p className="intro-body">
                Fill in the details below and get a curated preparation roadmap — covering key topics, likely questions, and proven strategies tailored to your target role.
              </p>
            </div>

            <div className="form-divider" />

            <div className="form-section">
              <div className="field">
                <label className="field-label">Company Name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Google, Stripe, Razorpay"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Role / Designation</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Senior Software Engineer, PM"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Years of Experience</label>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 4"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                />
              </div>

              <p className={`status-hint ${canGenerate ? "ready" : ""}`}>
                {canGenerate ? "✓ Ready to generate" : "Fill in all fields to continue"}
              </p>

              <button
                className="btn-generate"
                onClick={generateGuide}
                disabled={loading || !canGenerate}
              >
                {loading ? (
                  <>
                    <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}} />
                    Generating{"·".repeat(dots)}
                  </>
                ) : (
                  <>
                    <SparkleIcon />
                    Generate My Guide
                    <ArrowIcon />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT — RESULT */}
          <div className="right-panel">
            {!loading && !result && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                </div>
                <h2 className="empty-title">Your guide will appear here</h2>
                <p className="empty-sub">
                  Enter your target company, role, and experience level on the left to generate a personalized interview preparation guide.
                </p>
                <div className="empty-steps">
                  {["Enter the company you're targeting","Specify the role and seniority level","Add your years of experience","Hit Generate — your guide is ready in seconds"].map((s, i) => (
                    <div className="step" key={i}>
                      <div className="step-num">{i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="loading-ring" />
                <div>
                  <p className="loading-text">Crafting your guide{"·".repeat(dots)}</p>
                  <p className="loading-sub" style={{textAlign:"center",marginTop:4}}>Analysing role requirements & interview patterns</p>
                </div>
                <div className="loading-bar-track">
                  <div className="loading-bar-fill" />
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="result-container">
                <div className="result-topbar">
                  <div className="result-topbar-left">
                    <div className="result-tag">
                      <div className="result-tag-dot" />
                      Guide Ready
                    </div>
                    <span className="result-meta">
                      {company} · {role} · {experience} yr{experience !== "1" ? "s" : ""}
                    </span>
                  </div>
                  <button className={`btn-copy ${copied ? "copied" : ""}`} onClick={copyResult}>
                    {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                  </button>
                </div>

                <div className="result-body">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}