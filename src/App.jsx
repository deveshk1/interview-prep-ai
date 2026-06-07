import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

/* ─── tiny icons ─── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SparkleIcon = () => <Icon d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" size={14} />;

/* ─── category colors ─── */
const CAT_COLORS = {
  DSA:           { bg: "#f5f3ff", border: "#ddd6fe", text: "#7c3aed" },
  "System Design":{ bg: "#ecfeff", border: "#a5f3fc", text: "#0891b2" },
  Java:          { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  Spring:        { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  Behavioral:    { bg: "#fdf2f8", border: "#fbcfe8", text: "#be185d" },
  Other:         { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },
};

/* ─── difficulty color ─── */
function diffColor(score) {
  if (score <= 3) return { text: "#16a34a", ring: "#22c55e", bg: "#f0fdf4" };
  if (score <= 5) return { text: "#ca8a04", ring: "#eab308", bg: "#fefce8" };
  if (score <= 7) return { text: "#ea580c", ring: "#f97316", bg: "#fff7ed" };
  return { text: "#dc2626", ring: "#ef4444", bg: "#fef2f2" };
}

/* ─── CircularScore ─── */
function CircularScore({ score }) {
  const col = diffColor(score);
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div className="score-ring-wrap" style={{ background: col.bg }}>
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth={6} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={col.ring} strokeWidth={6}
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
      <div className="results-header">
        <div className="results-title-group">
          <h2 className="results-title">{company} <span>{role}</span></h2>
          <p className="results-subtitle">Personalized Interview Roadmap · {experience} Year{experience !== "1" ? "s" : ""} Experience</p>
        </div>
        <div className="results-badge">
          <span className="tag-dot" />
          Analysis Complete
        </div>
      </div>

      <div className="bento-grid">
        {/* Difficulty - Top Left */}
        <div className="bento-card bento-difficulty">
          <div className="card-label">Difficulty Score</div>
          <div className="difficulty-content">
            <CircularScore score={data.difficultyScore} />
            <div className="difficulty-meta">
              <div className="difficulty-level" style={{ color: col.text }}>{data.difficultyLabel}</div>
              <div className="difficulty-reason">{data.difficultyReason}</div>
            </div>
          </div>
        </div>

        {/* Key Insights - Bottom Left */}
        <div className="bento-card bento-insights">
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

        {/* Interview Rounds - Top Center */}
        <div className="bento-card bento-rounds">
          <div className="card-label">Interview Process</div>
          <div className="rounds-scroll">
            {(data.interviewRounds || []).map((r, i) => (
              <div className="round-item" key={i}>
                <div className="round-num">{i + 1}</div>
                <div className="round-info">
                  <div className="round-name">{r.name}</div>
                  <div className="round-desc">{r.description}</div>
                  {r.duration && <div className="round-dur">Duration: {r.duration}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topics - Top Right */}
        <div className="bento-card bento-topics">
          <div className="card-label">Core Topics</div>
          <div className="topics-wrap">
            {(data.topTopics || []).map((t, i) => (
              <span className="topic-chip" key={i}>{t}</span>
            ))}
          </div>
        </div>

        {/* Questions - Main Bottom Center/Right */}
        <div className="bento-card bento-questions">
          <div className="card-header-row">
            <div className="card-label">Top Interview Questions</div>
            <span className="count-badge">{(data.topQuestions || []).length} Items</span>
          </div>
          <div className="questions-grid">
            {(data.topQuestions || []).map((q, i) => {
              const cat = CAT_COLORS[q.category] || CAT_COLORS.Other;
              return (
                <div className="question-row" key={i}>
                  <span className="q-number">{String(i + 1).padStart(2, '0')}</span>
                  <div className="q-body">
                    <p className="q-text">{q.question}</p>
                    <span className="q-tag" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>{q.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan - Side */}
        <div className="bento-card bento-plan">
          <div className="card-label">14-Day Preparation Plan</div>
          <div className="plan-timeline">
            {(data.preparationPlan || []).map((week, i) => (
              <div className="plan-week-box" key={i}>
                <div className="week-label">Week {week.week}: {week.focus}</div>
                <ul className="week-tasks">
                  {(week.tasks || []).map((task, j) => (
                    <li key={j}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Full Analysis - Bottom span */}
        <div className="bento-card bento-analysis">
          <div className="card-label">Deep Dive Analysis</div>
          <div className="analysis-markdown">
            <ReactMarkdown>{data.fullAnalysis || ""}</ReactMarkdown>
          </div>
        </div>

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
      <style>{`body{margin:0;background:#ffffff;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#64748b;font-size:14px;}`}</style>
      <div>Loading…</div>
    </>
  );

  if (!session) return <Login />;

  return (
    <>
      <style>{CSS}</style>
      <div className="app-container">

        {/* NAVBAR */}
        <nav className="navbar">
          <div className="nav-content">
            <div className="logo">Interview<span>Prep</span></div>
            <div className="nav-actions">
              <span className="user-email">{session.user.email}</span>
              <button className="btn-logout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
            </div>
          </div>
        </nav>

        <main className="main-content">
          {!guide && !loading ? (
            <div className="hero-section">
              <div className="hero-text">
                <div className="ai-badge"><SparkleIcon /> AI-Driven Mastery</div>
                <h1 className="hero-heading">Master your next <span>technical interview</span></h1>
                <p className="hero-subheading">Get a data-backed preparation roadmap tailored to your target company and seniority.</p>
              </div>

              <div className="hero-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Target Company</label>
                    <input type="text" placeholder="e.g. Google, Stripe" value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Target Role</label>
                    <input type="text" placeholder="e.g. Software Engineer" value={role} onChange={e => setRole(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Years of Experience</label>
                    <input type="number" placeholder="e.g. 5" value={experience} onChange={e => setExperience(e.target.value)} />
                  </div>
                </div>
                <button className="btn-generate-main" onClick={generateGuide} disabled={!canGenerate}>
                  Generate My Guide
                </button>
              </div>

              <div className="hero-features">
                {[
                  { icon: "🔍", text: "Real-time web search" },
                  { icon: "🧠", text: "Gemini 2.5 Intelligence" },
                  { icon: "📅", text: "14-day structured plan" }
                ].map((f, i) => (
                  <div className="feature-pill" key={i}>
                    <span>{f.icon}</span> {f.text}
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <h2 className="loading-title">Crafting your roadmap<span>{"·".repeat(dots)}</span></h2>
              <p className="loading-subtitle">Analyzing {company}'s interview patterns for {role} positions...</p>
            </div>
          ) : (
            <ResultsPanel guide={guide} company={company} role={role} experience={experience} />
          )}
        </main>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   CSS - CLEAN MINIMALIST LIGHT MODE
══════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

:root {
  --bg: #ffffff;
  --bg-subtle: #f8fafc;
  --surf: #ffffff;
  --border: #e2e8f0;
  --text: #0f172a;
  --text-muted: #64748b;
  --text-dim: #94a3b8;
  --accent: #2563eb;
  --accent-soft: #eff6ff;
  --sans: 'Plus Jakarta Sans', sans-serif;
  --serif: 'Instrument Serif', serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { 
  background: var(--bg); 
  color: var(--text); 
  font-family: var(--sans); 
  line-height: 1.6; 
  -webkit-font-smoothing: antialiased; 
}

/* ── LAYOUT ── */
.app-container { min-height: 100vh; display: flex; flex-direction: column; }
.navbar { 
  height: 64px; 
  border-bottom: 1px solid var(--border); 
  background: rgba(255,255,255,0.8); 
  backdrop-filter: blur(12px); 
  position: sticky; top: 0; z-index: 100;
}
.nav-content { 
  max-width: 1280px; margin: 0 auto; height: 100%; 
  display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
}
.logo { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
.logo span { color: var(--accent); }
.nav-actions { display: flex; align-items: center; gap: 16px; }
.user-email { font-size: 13px; color: var(--text-muted); }
.btn-logout { 
  font-size: 12px; font-weight: 600; padding: 6px 12px; 
  border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer;
}

.main-content { flex: 1; max-width: 1280px; margin: 0 auto; width: 100%; padding: 40px 24px; }

/* ── HERO SECTION ── */
.hero-section { max-width: 800px; margin: 60px auto 0; text-align: center; }
.ai-badge { 
  display: inline-flex; align-items: center; gap: 8px; 
  background: var(--accent-soft); color: var(--accent); 
  padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; margin-bottom: 24px;
}
.hero-heading { 
  font-size: 56px; line-height: 1.1; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 20px; 
}
.hero-heading span { color: var(--accent); }
.hero-subheading { font-size: 18px; color: var(--text-muted); margin-bottom: 48px; max-width: 600px; margin-inline: auto; }

.hero-form { 
  background: var(--surf); border: 1px solid var(--border); border-radius: 24px; 
  padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); margin-bottom: 40px;
}
.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: left; margin-bottom: 24px; }
.input-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
.input-group input { 
  width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 12px; 
  font-family: var(--sans); font-size: 14px; outline: none; transition: border-color 0.2s;
}
.input-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
.btn-generate-main { 
  width: 100%; padding: 14px; background: var(--accent); color: white; border: none; 
  border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.1s;
}
.btn-generate-main:active { transform: scale(0.99); }
.btn-generate-main:disabled { opacity: 0.5; cursor: not-allowed; }

.hero-features { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.feature-pill { 
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; 
  color: var(--text-muted); padding: 8px 16px; border: 1px solid var(--border); border-radius: 100px;
}

/* ── LOADING ── */
.loading-container { text-align: center; padding-top: 100px; }
.loading-spinner { 
  width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--accent); 
  border-radius: 50%; margin: 0 auto 24px; animation: spin 0.8s linear infinite;
}
.loading-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.loading-subtitle { color: var(--text-muted); }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── RESULTS ── */
.results-root { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.results-header { 
  display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; 
}
.results-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
.results-title span { color: var(--accent); }
.results-subtitle { color: var(--text-muted); font-size: 15px; margin-top: 4px; }
.results-badge { 
  display: flex; align-items: center; gap: 8px; background: #f0fdf4; color: #166534; 
  padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; border: 1px solid #bbf7d0;
}
.tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }

/* ── BENTO GRID ── */
.bento-grid { 
  display: grid; 
  grid-template-columns: repeat(12, 1fr); 
  grid-auto-rows: minmax(100px, auto); 
  gap: 20px; 
}

.bento-card { 
  background: var(--surf); border: 1px solid var(--border); border-radius: 24px; 
  padding: 24px; transition: box-shadow 0.2s;
}
.bento-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

.card-label { 
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; 
  color: var(--text-dim); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;
}

/* Specific Bento Areas */
.bento-difficulty { grid-column: span 4; }
.bento-insights   { grid-column: span 4; }
.bento-rounds     { grid-column: span 5; }
.bento-topics     { grid-column: span 3; }
.bento-questions  { grid-column: span 8; }
.bento-plan       { grid-column: span 4; grid-row: span 2; }
.bento-analysis   { grid-column: span 12; }

/* Difficulty Card */
.difficulty-content { display: flex; align-items: center; gap: 20px; }
.score-ring-wrap { 
  position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;
}
.score-ring-inner { position: absolute; text-align: center; }
.score-number { font-size: 20px; font-weight: 800; display: block; }
.score-of { font-size: 10px; color: var(--text-dim); }
.difficulty-level { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.difficulty-reason { font-size: 13px; color: var(--text-muted); line-height: 1.4; }

/* Insights List */
.insights-list { display: flex; flex-direction: column; gap: 12px; }
.insight-item { display: flex; gap: 12px; font-size: 13px; color: var(--text-muted); line-height: 1.5; }
.insight-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; margin-top: 8px; flex-shrink: 0; }

/* Rounds Scroll */
.rounds-scroll { display: flex; flex-direction: column; gap: 16px; }
.round-item { display: flex; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--bg-subtle); }
.round-item:last-child { border-bottom: none; }
.round-num { 
  width: 24px; height: 24px; background: var(--bg-subtle); border-radius: 6px; 
  display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0;
}
.round-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
.round-desc { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
.round-dur { font-size: 11px; font-weight: 600; color: var(--accent); margin-top: 4px; }

/* Topics Wrap */
.topics-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.topic-chip { 
  font-size: 12px; font-weight: 600; padding: 6px 12px; 
  background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 8px;
}

/* Questions Grid */
.questions-grid { display: flex; flex-direction: column; gap: 12px; }
.question-row { 
  display: flex; gap: 16px; padding: 16px; border: 1px solid var(--bg-subtle); 
  border-radius: 16px; transition: border-color 0.2s;
}
.question-row:hover { border-color: var(--border); background: var(--bg-subtle); }
.q-number { font-size: 14px; font-weight: 800; color: var(--text-dim); }
.q-text { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.q-tag { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }

/* Plan Timeline */
.plan-timeline { display: flex; flex-direction: column; gap: 24px; }
.plan-week-box { position: relative; padding-left: 20px; border-left: 2px solid var(--accent-soft); }
.week-label { font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--accent); }
.week-tasks { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.week-tasks li { font-size: 13px; color: var(--text-muted); position: relative; padding-left: 16px; }
.week-tasks li::before { 
  content: "•"; position: absolute; left: 0; color: var(--text-dim); 
}

/* Analysis Markdown */
.analysis-markdown { font-size: 15px; color: var(--text-muted); }
.analysis-markdown h1, .analysis-markdown h2 { font-size: 18px; color: var(--text); margin: 24px 0 12px; }
.analysis-markdown p { margin-bottom: 16px; }
.analysis-markdown li { margin-bottom: 8px; }

/* Mobile Adaptations */
@media (max-width: 1024px) {
  .bento-difficulty, .bento-insights, .bento-rounds, .bento-topics, .bento-questions, .bento-plan { grid-column: span 12; }
  .form-grid { grid-template-columns: 1fr; }
  .hero-heading { font-size: 40px; }
}
`;