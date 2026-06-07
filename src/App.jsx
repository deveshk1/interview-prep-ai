import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

/* ─── tiny icons ─── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SparkleIcon = () => <Icon d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" size={14} />;
const ChevronIcon = ({ open }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s" }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ─── category colors ─── */
const CAT_COLORS = {
  DSA:           { bg: "#1a1040", border: "#7c3aed", text: "#a78bfa" },
  "System Design":{ bg: "#0d2218", border: "#059669", text: "#34d399" },
  Java:          { bg: "#1a1200", border: "#b45309", text: "#fbbf24" },
  Spring:        { bg: "#0e1a12", border: "#15803d", text: "#4ade80" },
  Behavioral:    { bg: "#1a0d1a", border: "#9d174d", text: "#f472b6" },
  Other:         { bg: "#101825", border: "#374151", text: "#94a3b8" },
};

/* ─── difficulty color ─── */
function diffColor(score) {
  if (score <= 3) return { text: "#4ade80", ring: "#16a34a", bg: "rgba(74,222,128,0.08)" };
  if (score <= 5) return { text: "#facc15", ring: "#ca8a04", bg: "rgba(250,204,21,0.08)" };
  if (score <= 7) return { text: "#fb923c", ring: "#ea580c", bg: "rgba(251,146,60,0.08)" };
  return { text: "#f87171", ring: "#dc2626", bg: "rgba(248,113,113,0.08)" };
}

/* ─── Accordion ─── */
function Accordion({ title, badge, children, defaultOpen = false, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="accordion">
      <button className="accordion-header" onClick={() => setOpen(o => !o)}>
        <div className="accordion-title-row">
          {icon && <span className="accordion-icon">{icon}</span>}
          <span className="accordion-title">{title}</span>
          {badge && <span className="accordion-badge">{badge}</span>}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

/* ─── CircularScore ─── */
function CircularScore({ score }) {
  const col = diffColor(score);
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div className="score-ring-wrap" style={{ background: col.bg }}>
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={col.ring} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="score-ring-inner">
        <span className="score-number" style={{ color: col.text }}>{score}</span>
        <span className="score-of">/10</span>
      </div>
    </div>
  );
}

/* ─── parse guide (string or object) ─── */
function parseGuide(raw) {
  if (typeof raw === "object" && raw !== null) return raw;
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

/* ─── Results Panel ─── */
function ResultsPanel({ guide, company, role, experience }) {
  const data = parseGuide(guide);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  // Fallback: render markdown if JSON parsing failed
  if (!data || !data.difficultyScore) {
    return (
      <div className="result-doc">
        <ReactMarkdown>{typeof guide === "string" ? guide : JSON.stringify(guide, null, 2)}</ReactMarkdown>
      </div>
    );
  }

  const col = diffColor(data.difficultyScore);

  return (
    <div className="results-root">
      {/* ── Meta header ── */}
      <div className="results-meta">
        <div className="results-meta-pill">
          <span className="tag-dot" />
          Guide Ready
        </div>
        <span className="results-meta-sub">{company} · {role} · {experience} yr{experience !== "1" ? "s" : ""}</span>
      </div>

      <div className="results-content">

        {/* ── Row 1: Difficulty + Rounds ── */}
        <div className="row-2col">

          {/* Difficulty card */}
          <div className="card card-difficulty">
            <div className="card-label">Interview Difficulty</div>
            <div className="difficulty-body">
              <CircularScore score={data.difficultyScore} />
              <div className="difficulty-info">
                <div className="difficulty-label" style={{ color: col.text }}>{data.difficultyLabel}</div>
                <div className="difficulty-reason">{data.difficultyReason}</div>
              </div>
            </div>
          </div>

          {/* Interview Rounds */}
          <div className="card">
            <div className="card-label">Interview Rounds</div>
            <div className="rounds-list">
              {(data.interviewRounds || []).map((r, i) => (
                <div className="round-item" key={i}>
                  <div className="round-num">{i + 1}</div>
                  <div className="round-info">
                    <div className="round-name">{r.name}</div>
                    <div className="round-desc">{r.description}</div>
                    {r.duration && <div className="round-dur">⏱ {r.duration}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Key Topics chips ── */}
        <div className="card">
          <div className="card-label">Most Important Topics</div>
          <div className="topics-wrap">
            {(data.topTopics || []).map((t, i) => (
              <span className="topic-chip" key={i}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Key Insights ── */}
        <div className="card">
          <div className="card-label">💡 Key Insights</div>
          <div className="insights-list">
            {(data.keyInsights || []).map((ins, i) => (
              <div className="insight-item" key={i}>
                <span className="insight-dot" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Questions accordion ── */}
        <Accordion title="Top Interview Questions" badge={`${(data.topQuestions || []).length} questions`} icon="❓">
          <div className="questions-list">
            {(data.topQuestions || []).map((q, i) => {
              const cat = CAT_COLORS[q.category] || CAT_COLORS.Other;
              return (
                <div className="question-item" key={i}>
                  <span className="q-num">{i + 1}</span>
                  <span className="q-text">{q.question}</span>
                  <span className="q-cat" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>{q.category}</span>
                </div>
              );
            })}
          </div>
        </Accordion>

        {/* ── 14-Day Plan accordion ── */}
        <Accordion title="Preparation Plan" badge="2 weeks" icon="📅">
          <div className="plan-list">
            {(data.preparationPlan || []).map((week, i) => (
              <div className="plan-week" key={i}>
                <div className="plan-week-header">Week {week.week} — <span>{week.focus}</span></div>
                <ul className="plan-tasks">
                  {(week.tasks || []).map((task, j) => (
                    <li key={j} className="plan-task">{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Accordion>

        {/* ── Full Analysis collapsed ── */}
        <Accordion title="Full Detailed Analysis" icon="📄" defaultOpen={false}>
          <div className="analysis-body">
            <ReactMarkdown>{data.fullAnalysis || ""}</ReactMarkdown>
          </div>
        </Accordion>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════ */
export default function App() {
  const [company, setCompany]       = useState("");
  const [role, setRole]             = useState("");
  const [experience, setExperience] = useState("");
  const [guide, setGuide]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [session, setSession]       = useState(undefined);
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
    setGuide(null);
    try {
      const raw = await generateInterviewGuide(company, role, experience);
      setGuide(raw);
    } catch {
      setGuide("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const canGenerate = company.trim() && role.trim() && experience !== "";

  if (session === undefined) return (
    <>
      <style>{`body{margin:0;background:#060910;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:rgba(255,255,255,0.3);font-size:13px;}`}</style>
      <div>Loading…</div>
    </>
  );

  if (!session) return <Login />;

  return (
    <>
      <style>{CSS}</style>
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
          {/* LEFT */}
          <div className="left-panel">
            <div>
              <div className="intro-label"><SparkleIcon /> AI-Powered</div>
              <h1 className="intro-heading">Your personalized<br /><em>interview guide</em></h1>
              <p className="intro-body">Enter your target company, role, and experience to get a curated preparation roadmap.</p>
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
                <input className="field-input" type="text" placeholder="e.g. Senior Software Engineer"
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
                    <div className="spinner" />
                    Generating{"·".repeat(dots)}
                  </>
                ) : (
                  <><SparkleIcon /> Generate My Guide</>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="right-panel">
            {!loading && !guide && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h2 className="empty-title">Your guide will appear here</h2>
                <p className="empty-sub">Enter your target company and role to generate a personalized, structured guide.</p>
                <div className="empty-steps">
                  {["Enter the company you're targeting","Specify the role and seniority","Add your years of experience","Hit Generate — ready in seconds"].map((s, i) => (
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
                  <p className="loading-sub">Searching the web · Analysing interview patterns</p>
                </div>
                <div className="loading-bar-track"><div className="loading-bar-fill" /></div>
              </div>
            )}

            {guide && !loading && (
              <ResultsPanel guide={guide} company={company} role={role} experience={experience} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  --bg:      #060910;
  --surf:    #0c1018;
  --surf2:   #111720;
  --surf3:   #161e2b;
  --border:  rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.12);
  --text:    #dde2ee;
  --text2:   rgba(221,226,238,0.52);
  --text3:   rgba(221,226,238,0.26);
  --accent:  #4f8ef7;
  --sans:    'Plus Jakarta Sans',sans-serif;
  --serif:   'Instrument Serif',serif;
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
  padding:0 24px; border-bottom:1px solid var(--border);
  background:rgba(6,9,16,0.85); backdrop-filter:blur(12px);
  position:sticky; top:0; z-index:50;
}
.nav-left { display:flex; align-items:center; gap:10px; }
.nav-wordmark { font-size:14px; font-weight:700; letter-spacing:-.02em; color:var(--text); }
.nav-wordmark span { color:var(--accent); }
.nav-pill { font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
  background:rgba(79,142,247,0.12); color:var(--accent); border:1px solid rgba(79,142,247,0.25);
  border-radius:20px; padding:2px 8px; }
.nav-right { display:flex; align-items:center; gap:12px; }
.nav-email { font-size:12px; color:var(--text2); }
.btn-ghost { font-size:12px; font-family:var(--sans); color:var(--text2); background:none; border:1px solid var(--border2);
  border-radius:7px; padding:5px 12px; cursor:pointer; transition:all .15s; }
.btn-ghost:hover { color:var(--text); border-color:rgba(255,255,255,0.25); }

/* ── MAIN LAYOUT ── */
.main {
  flex:1; display:grid; grid-template-columns:340px 1fr;
  min-height:0;
}

/* ── LEFT PANEL ── */
.left-panel {
  padding:36px 28px; display:flex; flex-direction:column; gap:28px;
  border-right:1px solid var(--border);
  background:rgba(12,16,24,0.6);
  position:sticky; top:56px; height:calc(100vh - 56px); overflow-y:auto;
}
.intro-label {
  display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:600;
  letter-spacing:.07em; text-transform:uppercase; color:var(--accent); margin-bottom:14px;
}
.intro-heading {
  font-family:var(--serif); font-size:28px; line-height:1.28; color:var(--text);
  letter-spacing:-.01em; margin-bottom:12px;
}
.intro-heading em { font-style:italic; color:var(--accent); }
.intro-body { font-size:13px; line-height:1.7; color:var(--text2); }

.form-divider { height:1px; background:var(--border); }

.form-section { display:flex; flex-direction:column; gap:16px; }
.field { display:flex; flex-direction:column; gap:6px; }
.field-label { font-size:11.5px; font-weight:600; color:var(--text2); letter-spacing:.04em; }
.field-input {
  width:100%; padding:10px 14px; background:var(--surf2); border:1px solid var(--border2);
  border-radius:9px; color:var(--text); font-size:13.5px; font-family:var(--sans);
  outline:none; transition:border-color .15s, box-shadow .15s;
}
.field-input::placeholder { color:var(--text3); }
.field-input:focus { border-color:rgba(79,142,247,0.5); box-shadow:0 0 0 3px rgba(79,142,247,0.08); }

.status-hint { font-size:12px; color:var(--text3); transition:color .2s; }
.status-hint.ready { color:#34d399; }

.btn-generate {
  width:100%; padding:12px 20px; background:var(--accent); color:#fff;
  border:none; border-radius:10px; font-size:13.5px; font-weight:600;
  font-family:var(--sans); cursor:pointer; display:flex; align-items:center;
  justify-content:center; gap:8px; transition:all .18s;
  box-shadow:0 0 20px rgba(79,142,247,0.3);
}
.btn-generate:hover:not(:disabled) { background:#3b7ef3; box-shadow:0 0 28px rgba(79,142,247,0.45); transform:translateY(-1px); }
.btn-generate:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }

.spinner {
  width:14px; height:14px; border:2px solid rgba(255,255,255,0.3);
  border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }

/* ── RIGHT PANEL ── */
.right-panel { overflow-y:auto; }

/* ── EMPTY / LOADING ── */
.empty-state, .loading-state {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:20px; padding:80px 40px; text-align:center; height:100%;
}
.empty-icon { font-size:42px; opacity:.5; }
.empty-title { font-size:18px; font-weight:600; color:var(--text); }
.empty-sub { font-size:13px; color:var(--text2); max-width:320px; line-height:1.65; }
.empty-steps { display:flex; flex-direction:column; gap:10px; width:100%; max-width:340px; text-align:left; }
.step { display:flex; align-items:flex-start; gap:12px; font-size:13px; color:var(--text2); }
.step-num {
  min-width:22px; height:22px; border-radius:50%; background:var(--accent);
  color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center;
}
.loading-ring {
  width:42px; height:42px; border:3px solid var(--border2); border-top-color:var(--accent);
  border-radius:50%; animation:spin .9s linear infinite;
}
.loading-text { font-size:15px; font-weight:600; color:var(--text); }
.loading-sub  { font-size:12.5px; color:var(--text2); margin-top:4px; }
.loading-bar-track { width:220px; height:3px; background:var(--border2); border-radius:4px; overflow:hidden; }
.loading-bar-fill  { height:100%; width:60%; background:var(--accent); border-radius:4px;
  animation:slide 1.5s ease-in-out infinite; }
@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(280%)} }

/* ── RESULTS ROOT ── */
.results-root { display:flex; flex-direction:column; }
.results-meta {
  display:flex; align-items:center; gap:12px; padding:14px 28px;
  border-bottom:1px solid var(--border); background:rgba(12,16,24,0.7);
  backdrop-filter:blur(8px); position:sticky; top:0; z-index:10;
}
.results-meta-pill {
  display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600;
  color:#34d399; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25);
  border-radius:20px; padding:3px 10px;
}
.tag-dot { width:6px; height:6px; border-radius:50%; background:#34d399; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.results-meta-sub { font-size:12.5px; color:var(--text2); }

.results-content {
  padding:24px 28px 48px;
  display:flex; flex-direction:column; gap:16px;
}

/* ── CARDS ── */
.card {
  background:var(--surf2); border:1px solid var(--border);
  border-radius:14px; padding:20px 22px;
}
.card-label {
  font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  color:var(--text3); margin-bottom:16px;
}

/* ── 2-col row ── */
.row-2col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

/* ── Difficulty ── */
.card-difficulty {}
.difficulty-body { display:flex; align-items:center; gap:18px; }
.score-ring-wrap {
  position:relative; width:100px; height:100px; display:flex;
  align-items:center; justify-content:center; border-radius:50%; flex-shrink:0;
}
.score-ring-inner {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  display:flex; flex-direction:column; align-items:center; line-height:1;
}
.score-number { font-size:26px; font-weight:700; letter-spacing:-.02em; }
.score-of     { font-size:11px; color:var(--text3); margin-top:2px; }
.difficulty-info { flex:1; }
.difficulty-label  { font-size:20px; font-weight:700; letter-spacing:-.02em; margin-bottom:6px; }
.difficulty-reason { font-size:12.5px; color:var(--text2); line-height:1.55; }

/* ── Rounds ── */
.rounds-list { display:flex; flex-direction:column; gap:10px; }
.round-item  { display:flex; align-items:flex-start; gap:12px; }
.round-num {
  min-width:24px; height:24px; border-radius:50%; background:rgba(79,142,247,0.15);
  border:1px solid rgba(79,142,247,0.3); color:var(--accent); font-size:11px; font-weight:700;
  display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;
}
.round-name  { font-size:13px; font-weight:600; color:var(--text); margin-bottom:2px; }
.round-desc  { font-size:12px; color:var(--text2); line-height:1.5; }
.round-dur   { font-size:11px; color:var(--text3); margin-top:3px; }

/* ── Topics ── */
.topics-wrap { display:flex; flex-wrap:wrap; gap:8px; }
.topic-chip {
  font-size:12.5px; font-weight:500;
  background:rgba(79,142,247,0.1); border:1px solid rgba(79,142,247,0.22); color:#93c5fd;
  border-radius:20px; padding:5px 14px; transition:all .15s;
}
.topic-chip:hover { background:rgba(79,142,247,0.18); transform:translateY(-1px); }

/* ── Insights ── */
.insights-list { display:flex; flex-direction:column; gap:10px; }
.insight-item {
  display:flex; align-items:flex-start; gap:12px; font-size:13px;
  color:var(--text2); line-height:1.6;
  background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
  border-radius:9px; padding:10px 14px;
}
.insight-dot {
  min-width:7px; height:7px; border-radius:50%;
  background:var(--accent); margin-top:5px; flex-shrink:0;
}

/* ── Accordion ── */
.accordion { background:var(--surf2); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
.accordion-header {
  width:100%; display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; background:none; border:none; color:var(--text); font-family:var(--sans);
  cursor:pointer; transition:background .15s;
}
.accordion-header:hover { background:rgba(255,255,255,0.03); }
.accordion-title-row { display:flex; align-items:center; gap:10px; }
.accordion-icon  { font-size:16px; }
.accordion-title { font-size:14px; font-weight:600; }
.accordion-badge {
  font-size:10.5px; font-weight:600; background:rgba(79,142,247,0.12);
  border:1px solid rgba(79,142,247,0.22); color:var(--accent);
  border-radius:20px; padding:2px 9px;
}
.accordion-body { padding:4px 20px 20px; border-top:1px solid var(--border); }

/* ── Questions ── */
.questions-list { display:flex; flex-direction:column; gap:8px; padding-top:12px; }
.question-item {
  display:flex; align-items:flex-start; gap:12px; padding:11px 14px;
  background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
  border-radius:9px; transition:background .15s;
}
.question-item:hover { background:rgba(255,255,255,0.04); }
.q-num  { min-width:22px; font-size:11px; font-weight:700; color:var(--text3); padding-top:1px; flex-shrink:0; }
.q-text { flex:1; font-size:13px; color:var(--text2); line-height:1.55; }
.q-cat  { font-size:10.5px; font-weight:600; border-radius:6px; padding:2px 8px; flex-shrink:0; margin-top:1px; }

/* ── Plan ── */
.plan-list { display:flex; flex-direction:column; gap:20px; padding-top:14px; }
.plan-week-header {
  font-size:13px; font-weight:700; color:var(--text); margin-bottom:10px;
}
.plan-week-header span { color:var(--accent); font-weight:500; }
.plan-tasks { display:flex; flex-direction:column; gap:7px; list-style:none; }
.plan-task {
  font-size:13px; color:var(--text2); line-height:1.55;
  padding:9px 14px 9px 36px; position:relative;
  background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04);
  border-radius:8px;
}
.plan-task::before {
  content:'';position:absolute;left:14px;top:50%;transform:translateY(-50%);
  width:6px;height:6px;border-radius:50%;background:var(--accent);opacity:.7;
}

/* ── Full Analysis markdown ── */
.analysis-body { padding-top:14px; }
.analysis-body p  { font-size:13.5px; color:var(--text2); line-height:1.75; margin-bottom:12px; }
.analysis-body h2,.analysis-body h3 { color:var(--text); font-size:14px; margin:16px 0 8px; }
.analysis-body ul { padding-left:20px; margin-bottom:12px; }
.analysis-body li { font-size:13px; color:var(--text2); line-height:1.65; margin-bottom:4px; }
.analysis-body strong { color:var(--text); }

/* ── Fallback markdown ── */
.result-doc { padding:32px 28px; }
.result-doc p { font-size:13.5px; color:var(--text2); line-height:1.75; margin-bottom:12px; }

/* ── MOBILE ── */
@media (max-width:900px) {
  .main { grid-template-columns:1fr; }
  .left-panel { position:static; height:auto; border-right:none; border-bottom:1px solid var(--border); }
  .row-2col { grid-template-columns:1fr; }
  .results-content { padding:20px 16px 48px; }
  .results-meta { padding:12px 16px; }
  .nav-email { display:none; }
}
`;