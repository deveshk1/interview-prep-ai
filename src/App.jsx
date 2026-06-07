import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

/* ── Section icons keyed to common h2 keywords ── */
const sectionMeta = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("process") || t.includes("round"))
    return { icon: "🗂️", color: "#6ea8fe", bg: "rgba(110,168,254,0.08)", border: "rgba(110,168,254,0.2)" };
  if (t.includes("java") || t.includes("spring") || t.includes("technical"))
    return { icon: "☕", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  if (t.includes("dsa") || t.includes("algorithm") || t.includes("data struct"))
    return { icon: "🧩", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" };
  if (t.includes("system") || t.includes("design"))
    return { icon: "🏗️", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" };
  if (t.includes("behavior") || t.includes("hr") || t.includes("soft"))
    return { icon: "🤝", color: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.2)" };
  if (t.includes("study") || t.includes("plan") || t.includes("day") || t.includes("prep"))
    return { icon: "📅", color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" };
  if (t.includes("topic") || t.includes("subject"))
    return { icon: "📚", color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" };
  if (t.includes("tip") || t.includes("consideration") || t.includes("important") || t.includes("advice"))
    return { icon: "💡", color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" };
  return { icon: "📌", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.18)" };
};

/* ── Custom renderers ── */
function makeComponents(sectionColors) {
  let h2Index = 0;
  return {
    h1({ children }) {
      return (
        <div className="md-h1-wrap">
          <h1 className="md-h1">{children}</h1>
        </div>
      );
    },
    h2({ children }) {
      const text = String(children);
      const meta = sectionMeta(text);
      const idx = h2Index++;
      return (
        <div className="md-section" style={{ "--s-color": meta.color, "--s-bg": meta.bg, "--s-border": meta.border, animationDelay: `${idx * 0.06}s` }}>
          <div className="md-section-header">
            <span className="md-section-icon">{meta.icon}</span>
            <h2 className="md-h2" style={{ color: meta.color }}>{children}</h2>
          </div>
          <div className="md-section-body">
        </div>
        </div>
      );
    },
    h3({ children }) {
      return <h3 className="md-h3">{children}</h3>;
    },
    p({ children }) {
      return <p className="md-p">{children}</p>;
    },
    ul({ children }) {
      return <ul className="md-ul">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="md-ol">{children}</ol>;
    },
    li({ children }) {
      return <li className="md-li">{children}</li>;
    },
    strong({ children }) {
      return <strong className="md-strong">{children}</strong>;
    },
    blockquote({ children }) {
      return <blockquote className="md-blockquote">{children}</blockquote>;
    },
    code({ inline, children }) {
      if (inline) return <code className="md-code-inline">{children}</code>;
      return (
        <pre className="md-pre"><code>{children}</code></pre>
      );
    },
    hr() {
      return <hr className="md-hr" />;
    },
  };
}

export default function App() {
  const [company, setCompany]       = useState("");
  const [role, setRole]             = useState("");
  const [experience, setExperience] = useState("");
  const [result, setResult]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [session, setSession]       = useState(undefined);
  const [copied, setCopied]         = useState(false);
  const [dots, setDots]             = useState(0);

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
  const components = makeComponents();

  if (session === undefined) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        body{margin:0;background:#060910;display:flex;align-items:center;justify-content:center;min-height:100vh;}
        .splash{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:rgba(255,255,255,0.25);}
      `}</style>
      <div className="splash">Loading…</div>
    </>
  );

  if (!session) return <Login />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        :root {
          --bg:       #060910;
          --surf:     #0c1018;
          --surf2:    #111720;
          --border:   rgba(255,255,255,0.07);
          --border2:  rgba(255,255,255,0.12);
          --text:     #dde2ee;
          --text2:    rgba(221,226,238,0.52);
          --text3:    rgba(221,226,238,0.26);
          --accent:   #4f8ef7;
          --accent-g: rgba(79,142,247,0.14);
          --green:    #34d399;
          --sans:     'Plus Jakarta Sans',sans-serif;
          --serif:    'Instrument Serif',serif;
        }

        body { background:var(--bg); font-family:var(--sans); color:var(--text); -webkit-font-smoothing:antialiased; }

        /* ── SHELL ── */
        .shell {
          min-height:100vh; display:flex; flex-direction:column;
          background:
            radial-gradient(ellipse 800px 500px at 65% -80px, rgba(79,142,247,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 500px 400px at -60px 85%, rgba(52,211,153,0.04) 0%, transparent 65%),
            var(--bg);
        }

        /* ── NAV ── */
        .nav {
          height:56px; display:flex; align-items:center; justify-content:space-between;
          padding:0 28px; border-bottom:1px solid var(--border);
          background:rgba(6,9,16,0.8); backdrop-filter:blur(20px);
          position:sticky; top:0; z-index:50; flex-shrink:0;
        }
        .nav-left { display:flex; align-items:center; gap:12px; }
        .nav-wordmark { font-family:var(--serif); font-size:18px; color:var(--text); letter-spacing:-0.01em; }
        .nav-wordmark span { font-style:italic; color:var(--accent); }
        .nav-pill {
          font-size:10px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase;
          color:var(--accent); background:var(--accent-g); border:1px solid rgba(79,142,247,0.28);
          border-radius:100px; padding:2px 9px;
        }
        .nav-right { display:flex; align-items:center; gap:14px; }
        .nav-email { font-size:12px; color:var(--text3); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .btn-ghost {
          font-family:var(--sans); font-size:12px; font-weight:500; color:var(--text2);
          background:transparent; border:1px solid var(--border); border-radius:8px;
          padding:6px 14px; cursor:pointer; transition:all .2s;
        }
        .btn-ghost:hover { color:var(--text); border-color:var(--border2); background:var(--surf2); }

        /* ── MAIN GRID ── */
        .main { flex:1; display:grid; grid-template-columns:360px 1fr; min-height:calc(100vh - 56px); }

        /* ── LEFT PANEL ── */
        .left-panel {
          border-right:1px solid var(--border);
          display:flex; flex-direction:column; padding:32px 24px;
          gap:28px; overflow-y:auto;
        }
        .intro-label {
          display:inline-flex; align-items:center; gap:6px;
          font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;
          color:var(--accent); margin-bottom:12px;
        }
        .intro-heading { font-family:var(--serif); font-size:1.85rem; font-weight:400; line-height:1.2; color:var(--text); margin-bottom:10px; }
        .intro-heading em { font-style:italic; color:var(--accent); }
        .intro-body { font-size:13px; line-height:1.75; color:var(--text2); }
        .form-divider { height:1px; background:var(--border); }
        .form-section { display:flex; flex-direction:column; gap:16px; }
        .field { display:flex; flex-direction:column; gap:6px; }
        .field-label { font-size:11px; font-weight:600; letter-spacing:0.05em; color:var(--text2); }
        .field-input {
          font-family:var(--sans); font-size:14px; color:var(--text);
          background:var(--surf2); border:1px solid var(--border);
          border-radius:10px; padding:11px 14px; outline:none; width:100%;
          transition:border-color .2s, box-shadow .2s;
        }
        .field-input::placeholder { color:var(--text3); }
        .field-input:focus { border-color:rgba(79,142,247,0.5); box-shadow:0 0 0 3px rgba(79,142,247,0.1); }
        .field-input[type=number]::-webkit-inner-spin-button,
        .field-input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
        .field-input[type=number] { -moz-appearance:textfield; }
        .status-hint { font-size:11px; color:var(--text3); text-align:center; }
        .status-hint.ready { color:var(--green); }
        .btn-generate {
          font-family:var(--sans); font-size:14px; font-weight:600; color:#fff;
          background:linear-gradient(135deg,#4f8ef7 0%,#3569d4 100%);
          border:none; border-radius:10px; padding:13px 20px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:opacity .2s, transform .2s, box-shadow .2s;
          box-shadow:0 4px 20px rgba(79,142,247,0.28); width:100%; margin-top:4px;
        }
        .btn-generate:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); box-shadow:0 8px 28px rgba(79,142,247,0.38); }
        .btn-generate:active:not(:disabled) { transform:translateY(0); }
        .btn-generate:disabled { background:var(--surf2); color:var(--text3); box-shadow:none; cursor:not-allowed; }

        /* ── RIGHT PANEL ── */
        .right-panel { display:flex; flex-direction:column; overflow-y:auto; }

        /* ── EMPTY ── */
        .empty-state {
          flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:14px; padding:60px; text-align:center;
        }
        .empty-icon {
          width:52px; height:52px; border-radius:14px; background:var(--surf2);
          border:1px solid var(--border); display:flex; align-items:center; justify-content:center;
          font-size:22px;
        }
        .empty-title { font-family:var(--serif); font-size:1.3rem; color:var(--text2); }
        .empty-sub { font-size:13px; color:var(--text3); max-width:300px; line-height:1.7; }
        .empty-steps { display:flex; flex-direction:column; gap:10px; margin-top:6px; text-align:left; }
        .step { display:flex; align-items:center; gap:10px; font-size:12px; color:var(--text3); }
        .step-num {
          width:20px; height:20px; border-radius:50%; background:var(--surf2); border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0;
        }

        /* ── LOADING ── */
        .loading-state {
          flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:18px; padding:60px; animation:fadeIn .3s ease both;
        }
        .loading-ring {
          width:40px; height:40px; border:2px solid var(--border);
          border-top-color:var(--accent); border-radius:50%; animation:spin .8s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .loading-text { font-size:14px; font-weight:500; color:var(--text2); text-align:center; }
        .loading-sub { font-size:12px; color:var(--text3); text-align:center; margin-top:4px; }
        .loading-bar-track { width:180px; height:2px; background:var(--border); border-radius:2px; overflow:hidden; }
        .loading-bar-fill {
          height:100%; background:linear-gradient(90deg,var(--accent),var(--green));
          border-radius:2px; animation:loadSlide 1.8s ease-in-out infinite; width:45%;
        }
        @keyframes loadSlide { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }

        /* ── RESULT TOPBAR ── */
        .result-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 28px; border-bottom:1px solid var(--border);
          position:sticky; top:0;
          background:rgba(6,9,16,0.88); backdrop-filter:blur(16px); z-index:10; flex-shrink:0;
        }
        .result-topbar-left { display:flex; align-items:center; gap:10px; }
        .result-tag { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--green); }
        .result-tag-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:blink 2s ease infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .result-meta { font-size:12px; color:var(--text3); }
        .btn-copy {
          font-family:var(--sans); font-size:12px; font-weight:500; color:var(--text2);
          background:var(--surf2); border:1px solid var(--border); border-radius:8px;
          padding:6px 12px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s;
        }
        .btn-copy:hover { color:var(--text); border-color:var(--border2); }
        .btn-copy.copied { color:var(--green); border-color:rgba(52,211,153,0.35); }

        /* ── RESULT DOCUMENT ── */
        .result-doc {
          padding:40px 44px 72px;
          animation:fadeIn .5s ease both;
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* H1 — Document title */
        .md-h1-wrap {
          margin-bottom:32px;
          padding-bottom:24px;
          border-bottom:1px solid var(--border);
        }
        .md-h1 {
          font-family:var(--serif);
          font-size:2.1rem;
          font-weight:400;
          line-height:1.18;
          color:var(--text);
          letter-spacing:-0.02em;
          margin-bottom:0;
        }

        /* H2 — Sections as cards */
        .md-section {
          background:var(--s-bg, rgba(255,255,255,0.03));
          border:1px solid var(--s-border, rgba(255,255,255,0.07));
          border-radius:14px;
          margin-bottom:20px;
          overflow:hidden;
          animation:fadeIn .45s ease both;
        }
        .md-section-header {
          display:flex;
          align-items:center;
          gap:12px;
          padding:16px 20px 14px;
          border-bottom:1px solid var(--s-border, rgba(255,255,255,0.07));
          background:rgba(0,0,0,0.15);
        }
        .md-section-icon {
          font-size:18px;
          width:36px; height:36px;
          display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,0.2);
          border-radius:9px;
          flex-shrink:0;
        }
        .md-h2 {
          font-family:var(--sans);
          font-size:14px;
          font-weight:700;
          letter-spacing:0.01em;
          margin:0;
          line-height:1.3;
        }
        .md-section-body {
          padding:18px 20px 20px;
        }
        /* Everything after h2 inside the section */
        .md-section .md-h3 { margin-top:4px; }

        /* H3 */
        .md-h3 {
          font-family:var(--sans);
          font-size:13px;
          font-weight:700;
          color:var(--text);
          margin:18px 0 8px;
          padding-left:10px;
          border-left:2px solid rgba(255,255,255,0.15);
        }

        /* Paragraphs */
        .md-p {
          font-size:13.5px;
          line-height:1.82;
          color:rgba(221,226,238,0.68);
          margin-bottom:12px;
        }
        .md-p:last-child { margin-bottom:0; }

        /* Lists */
        .md-ul, .md-ol {
          margin:0 0 12px;
          padding:0;
          list-style:none;
          display:flex;
          flex-direction:column;
          gap:3px;
        }
        .md-ul:last-child, .md-ol:last-child { margin-bottom:0; }

        .md-li {
          font-size:13.5px;
          line-height:1.75;
          color:rgba(221,226,238,0.7);
          padding:7px 12px 7px 32px;
          position:relative;
          background:rgba(255,255,255,0.02);
          border-radius:7px;
          border:1px solid rgba(255,255,255,0.04);
          transition:background .15s;
        }
        .md-li:hover { background:rgba(255,255,255,0.04); }

        .md-ul .md-li::before {
          content:'';
          position:absolute;
          left:12px; top:50%;
          transform:translateY(-50%);
          width:5px; height:5px;
          border-radius:50%;
          background:var(--s-color, var(--accent));
        }

        .md-ol { counter-reset:li-counter; }
        .md-ol .md-li { counter-increment:li-counter; }
        .md-ol .md-li::before {
          content:counter(li-counter);
          position:absolute;
          left:10px; top:7px;
          font-size:10px;
          font-weight:700;
          color:var(--s-color, var(--accent));
          letter-spacing:0.04em;
        }

        /* Strong */
        .md-strong { color:var(--text); font-weight:600; }

        /* Inline code */
        .md-code-inline {
          font-size:12px;
          background:rgba(79,142,247,0.1);
          border:1px solid rgba(79,142,247,0.2);
          border-radius:5px;
          padding:1px 6px;
          color:#93c5fd;
          font-family:'SF Mono',Consolas,monospace;
        }

        /* Block code */
        .md-pre {
          background:var(--surf);
          border:1px solid var(--border);
          border-radius:10px;
          padding:16px 18px;
          overflow-x:auto;
          margin:10px 0;
        }
        .md-pre code {
          font-size:12.5px;
          color:var(--text2);
          font-family:'SF Mono',Consolas,monospace;
          line-height:1.65;
        }

        /* Blockquote */
        .md-blockquote {
          border-left:3px solid var(--s-color, var(--accent));
          padding:10px 16px;
          background:var(--accent-g);
          border-radius:0 9px 9px 0;
          margin:10px 0;
        }
        .md-blockquote .md-p { color:var(--text2); font-style:italic; margin:0; }

        /* HR */
        .md-hr { border:none; border-top:1px solid var(--border); margin:18px 0; }

        /* ── MOBILE ── */
        @media (max-width:860px) {
          .main { grid-template-columns:1fr; }
          .left-panel { border-right:none; border-bottom:1px solid var(--border); }
          .result-doc { padding:24px 20px 52px; }
          .nav-email { display:none; }
          .empty-state, .loading-state { padding:40px 20px; }
          .result-topbar { padding:12px 16px; }
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
            <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </nav>

        <div className="main">
          {/* ── LEFT ── */}
          <div className="left-panel">
            <div>
              <div className="intro-label"><SparkleIcon /> AI-Powered</div>
              <h1 className="intro-heading">Your personalized<br /><em>interview guide</em></h1>
              <p className="intro-body">Fill in your target company, role, and experience level to get a curated preparation roadmap tailored specifically for you.</p>
            </div>

            <div className="form-divider" />

            <div className="form-section">
              <div className="field">
                <label className="field-label">Company Name</label>
                <input className="field-input" type="text" placeholder="e.g. Google, Stripe, Razorpay"
                  value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Role / Designation</label>
                <input className="field-input" type="text" placeholder="e.g. Senior Software Engineer, PM"
                  value={role} onChange={e => setRole(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Years of Experience</label>
                <input className="field-input" type="number" min="0" placeholder="e.g. 4"
                  value={experience} onChange={e => setExperience(e.target.value)} />
              </div>

              <p className={`status-hint ${canGenerate ? "ready" : ""}`}>
                {canGenerate ? "✓ Ready to generate" : "Fill in all fields to continue"}
              </p>

              <button className="btn-generate" onClick={generateGuide} disabled={loading || !canGenerate}>
                {loading ? (
                  <>
                    <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                    Generating{"·".repeat(dots)}
                  </>
                ) : (
                  <><SparkleIcon /> Generate My Guide <ArrowIcon /></>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="right-panel">
            {!loading && !result && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h2 className="empty-title">Your guide will appear here</h2>
                <p className="empty-sub">Enter your target company and role on the left to generate a personalized guide.</p>
                <div className="empty-steps">
                  {["Enter the company you're targeting","Specify the role and seniority","Add your years of experience","Hit Generate — ready in seconds"].map((s,i) => (
                    <div className="step" key={i}>
                      <div className="step-num">{i+1}</div>
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
                  <p className="loading-sub">Analysing role requirements & interview patterns</p>
                </div>
                <div className="loading-bar-track"><div className="loading-bar-fill" /></div>
              </div>
            )}

            {result && !loading && (
              <>
                <div className="result-topbar">
                  <div className="result-topbar-left">
                    <div className="result-tag"><div className="result-tag-dot" /> Guide Ready</div>
                    <span className="result-meta">{company} · {role} · {experience} yr{experience !== "1" ? "s" : ""}</span>
                  </div>
                  <button className={`btn-copy ${copied ? "copied" : ""}`} onClick={copyResult}>
                    {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                  </button>
                </div>

                <div className="result-doc">
                  <ReactMarkdown components={components}>{result}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}