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
  const [activeTab, setActiveTab] = useState("overview");

  if (!data || !data.difficultyScore) {
    return (
      <div className="result-doc">
        <ReactMarkdown>{typeof guide === "string" ? guide : JSON.stringify(guide, null, 2)}</ReactMarkdown>
      </div>
    );
  }

  const col = diffColor(data.difficultyScore);

  const TABS = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "rounds", label: "Interview Process", icon: "🔄" },
    { id: "questions", label: "Top 20 Questions", icon: "❓" },
    { id: "plan", label: "14-Day Study Plan", icon: "📅" },
    { id: "analysis", label: "Deep Dive Analysis", icon: "📄" },
  ];

  return (
    <div className="results-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="results-sidebar">
        <div className="sidebar-meta">
          <div className="results-badge">
            <span className="tag-dot" />
            AI Roadmap Ready
          </div>
          <h3 className="sidebar-company">{company}</h3>
          <p className="sidebar-role">{role}</p>
        </div>
        
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Targeting {experience} Year{experience !== "1" ? "s" : ""} Experience</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="results-main">
        <div className="view-header">
          <h2 className="view-title">{TABS.find(t => t.id === activeTab).label}</h2>
        </div>

        <div className="view-content">
          {activeTab === "overview" && (
            <div className="view-fade-in">
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="card-label">Interview Difficulty</div>
                  <div className="difficulty-content">
                    <CircularScore score={data.difficultyScore} />
                    <div className="difficulty-meta">
                      <div className="difficulty-level" style={{ color: col.text }}>{data.difficultyLabel}</div>
                      <div className="difficulty-reason">{data.difficultyReason}</div>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-label">Key Strategy Insights</div>
                  <div className="insights-list">
                    {(data.keyInsights || []).map((ins, i) => (
                      <div className="insight-item" key={i}>
                        <span className="insight-dot" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-card full-width">
                  <div className="card-label">Core Technical Topics</div>
                  <div className="topics-wrap">
                    {(data.topTopics || []).map((t, i) => (
                      <span className="topic-chip" key={i}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rounds" && (
            <div className="view-fade-in">
              <div className="rounds-list-vertical">
                {(data.interviewRounds || []).map((r, i) => (
                  <div className="round-card-wide" key={i}>
                    <div className="round-number-pill">Round {i + 1}</div>
                    <div className="round-details">
                      <h4 className="round-title">{r.name}</h4>
                      <p className="round-description">{r.description}</p>
                      {r.duration && <span className="round-time">⏱ Expected Duration: {r.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="view-fade-in">
              <div className="questions-spacious-list">
                {(data.topQuestions || []).map((q, i) => {
                  const cat = CAT_COLORS[q.category] || CAT_COLORS.Other;
                  return (
                    <div className="q-card-wide" key={i}>
                      <span className="q-index">{String(i + 1).padStart(2, '0')}</span>
                      <div className="q-main">
                        <p className="q-text-primary">{q.question}</p>
                        <span className="q-category-tag" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>
                          {q.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "plan" && (
            <div className="view-fade-in">
              <div className="plan-timeline-vertical">
                {(data.preparationPlan || []).map((week, i) => (
                  <div className="plan-week-section" key={i}>
                    <div className="week-header-row">
                      <h3 className="week-number">Week {week.week}</h3>
                      <span className="week-focus-tag">{week.focus}</span>
                    </div>
                    <div className="week-tasks-grid">
                      {(week.tasks || []).map((task, j) => (
                        <div key={j} className="task-item-card">
                          <div className="task-check" />
                          <p>{task}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="view-fade-in">
              <div className="briefing-grid">
                {(data.strategicBriefing || []).map((brief, i) => (
                  <div className={`brief-card ${brief.type}`} key={i}>
                    <div className="brief-header">
                      <span className="brief-type-icon">
                        {brief.type === 'insight' ? '💡' : brief.type === 'warning' ? '⚠️' : '🎯'}
                      </span>
                      <h4 className="brief-title">{brief.title}</h4>
                    </div>
                    <ul className="brief-points">
                      {(brief.points || []).map((p, j) => (
                        <li key={j} className="brief-point">
                          <span className="brief-dot" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {/* Fallback for older guides */}
                {!data.strategicBriefing && data.fullAnalysis && (
                  <div className="analysis-rich-view">
                    <ReactMarkdown>{data.fullAnalysis}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
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
            <div className="logo" onClick={() => setGuide(null)} style={{ cursor: "pointer" }}>
              Interview<span>Prep</span>
            </div>
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
   CSS - DASHBOARD ARCHITECTURE
══════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

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
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { 
  background: var(--bg); color: var(--text); font-family: var(--sans); 
  line-height: 1.6; -webkit-font-smoothing: antialiased; 
}

/* ── LAYOUT ── */
.app-container { min-height: 100vh; display: flex; flex-direction: column; }
.navbar { 
  height: 64px; border-bottom: 1px solid var(--border); 
  background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); 
  position: sticky; top: 0; z-index: 100;
}
.nav-content { 
  max-width: 1440px; margin: 0 auto; height: 100%; 
  display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
}
.logo { font-weight: 800; font-size: 20px; letter-spacing: -0.02em; }
.logo span { color: var(--accent); }
.nav-actions { display: flex; align-items: center; gap: 16px; }
.user-email { font-size: 13px; color: var(--text-muted); }
.btn-logout { 
  font-size: 12px; font-weight: 600; padding: 6px 12px; 
  border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer;
}

/* ── HERO ── */
.main-content { flex: 1; width: 100%; display: flex; flex-direction: column; }
.hero-section { max-width: 800px; margin: 100px auto; text-align: center; padding: 0 24px; }
.ai-badge { 
  display: inline-flex; align-items: center; gap: 8px; 
  background: var(--accent-soft); color: var(--accent); 
  padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; margin-bottom: 24px;
}
.hero-heading { font-size: 56px; line-height: 1.1; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 20px; }
.hero-heading span { color: var(--accent); }
.hero-subheading { font-size: 18px; color: var(--text-muted); margin-bottom: 48px; }
.hero-form { background: #fff; border: 1px solid var(--border); border-radius: 24px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: left; margin-bottom: 24px; }
.input-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
.input-group input { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; outline: none; }
.btn-generate-main { width: 100%; padding: 14px; background: var(--accent); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; }

/* ── RESULTS DASHBOARD ── */
.results-container { display: flex; flex: 1; min-height: 0; }

.results-sidebar { 
  width: 280px; border-right: 1px solid var(--border); background: var(--bg-subtle); 
  display: flex; flex-direction: column; padding: 32px 16px; position: sticky; top: 64px; height: calc(100vh - 64px);
}
.sidebar-meta { padding: 0 12px 32px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
.results-badge { 
  display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; 
  color: #166534; background: #f0fdf4; padding: 4px 10px; border-radius: 100px; margin-bottom: 16px;
}
.tag-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
.sidebar-company { font-size: 20px; font-weight: 800; color: var(--text); }
.sidebar-role { font-size: 13px; color: var(--text-muted); }

.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-btn { 
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; 
  border: none; background: none; border-radius: 12px; cursor: pointer;
  font-family: var(--sans); font-size: 14px; font-weight: 600; color: var(--text-muted);
  transition: all 0.2s; text-align: left;
}
.nav-btn:hover { background: #f1f5f9; color: var(--text); }
.nav-btn.active { background: #ffffff; color: var(--accent); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); }
.nav-icon { font-size: 16px; }

.sidebar-footer { padding: 16px 12px; font-size: 11px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }

.results-main { flex: 1; background: #ffffff; overflow-y: auto; display: flex; flex-direction: column; }
.view-header { padding: 32px 48px; border-bottom: 1px solid var(--bg-subtle); }
.view-title { font-size: 24px; font-weight: 800; color: var(--text); }
.view-content { padding: 48px; max-width: 1000px; width: 100%; }

.view-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── OVERVIEW TAB ── */
.overview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.overview-card { background: #fff; border: 1px solid var(--border); border-radius: 24px; padding: 32px; }
.overview-card.full-width { grid-column: span 2; }
.card-label { font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }

.difficulty-content { display: flex; align-items: center; gap: 24px; }
.score-ring-wrap { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.score-ring-inner { position: absolute; text-align: center; }
.score-number { font-size: 24px; font-weight: 800; display: block; }
.score-of { font-size: 11px; color: var(--text-dim); }
.difficulty-level { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.difficulty-reason { font-size: 14px; color: var(--text-muted); line-height: 1.5; }

.insights-list { display: flex; flex-direction: column; gap: 14px; }
.insight-item { display: flex; gap: 14px; font-size: 14px; color: var(--text-muted); line-height: 1.6; }
.insight-dot { width: 7px; height: 7px; background: var(--accent); border-radius: 50%; margin-top: 9px; flex-shrink: 0; }

.topics-wrap { display: flex; flex-wrap: wrap; gap: 10px; }
.topic-chip { font-size: 13px; font-weight: 600; padding: 8px 16px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 12px; }

/* ── PROCESS TAB ── */
.rounds-list-vertical { display: flex; flex-direction: column; gap: 20px; }
.round-card-wide { display: flex; gap: 32px; padding: 32px; border: 1px solid var(--border); border-radius: 24px; background: #fff; }
.round-number-pill { 
  height: max-content; padding: 6px 16px; background: var(--accent-soft); color: var(--accent); 
  border-radius: 100px; font-size: 12px; font-weight: 800; white-space: nowrap;
}
.round-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
.round-description { font-size: 15px; color: var(--text-muted); margin-bottom: 12px; }
.round-time { font-size: 12px; font-weight: 700; color: var(--text-dim); }

/* ── QUESTIONS TAB ── */
.questions-spacious-list { display: flex; flex-direction: column; gap: 16px; }
.q-card-wide { display: flex; gap: 24px; padding: 24px 32px; border: 1px solid var(--border); border-radius: 20px; transition: all 0.2s; }
.q-card-wide:hover { background: var(--bg-subtle); border-color: var(--accent); }
.q-index { font-size: 18px; font-weight: 800; color: var(--text-dim); padding-top: 4px; }
.q-text-primary { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.q-category-tag { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 8px; text-transform: uppercase; }

/* ── PLAN TAB ── */
.plan-timeline-vertical { display: flex; flex-direction: column; gap: 48px; }
.plan-week-section { position: relative; }
.week-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.week-number { font-size: 24px; font-weight: 800; color: var(--accent); }
.week-focus-tag { font-size: 14px; font-weight: 600; color: var(--text-muted); background: var(--bg-subtle); padding: 4px 14px; border-radius: 100px; }
.week-tasks-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.task-item-card { 
  display: flex; gap: 16px; padding: 20px; background: #fff; border: 1px solid var(--border); 
  border-radius: 16px; font-size: 14px; color: var(--text-muted);
}
.task-check { width: 18px; height: 18px; border: 2px solid var(--border); border-radius: 50%; flex-shrink: 0; margin-top: 2px; }

/* ── ANALYSIS TAB ── */
.analysis-rich-view { font-size: 16px; color: var(--text-muted); line-height: 1.8; }
.analysis-rich-view h1, .analysis-rich-view h2 { font-size: 22px; font-weight: 800; color: var(--text); margin: 32px 0 16px; }
.analysis-rich-view p { margin-bottom: 20px; }
.analysis-rich-view ul { margin-bottom: 24px; padding-left: 24px; }
.analysis-rich-view li { margin-bottom: 12px; }

/* ─── ANALYSIS TAB / BRIEFING ─── */
.briefing-grid { display: grid; gap: 24px; }
.brief-card { padding: 32px; border: 1px solid var(--border); border-radius: 24px; background: #fff; border-left-width: 6px; }
.brief-card.insight { border-left-color: var(--accent); }
.brief-card.warning { border-left-color: #f59e0b; background: #fffbeb; }
.brief-card.strategy { border-left-color: #10b981; }

.brief-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.brief-type-icon { font-size: 20px; }
.brief-title { font-size: 18px; font-weight: 800; color: var(--text); }

.brief-points { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.brief-point { display: flex; gap: 12px; font-size: 15px; color: var(--text-muted); line-height: 1.6; }
.brief-dot { width: 6px; height: 6px; background: var(--text-dim); border-radius: 50%; margin-top: 10px; flex-shrink: 0; }
.brief-card.insight .brief-dot { background: var(--accent); }
.brief-card.warning .brief-dot { background: #f59e0b; }
.brief-card.strategy .brief-dot { background: #10b981; }

/* ── LOADING ── */
.loading-container { text-align: center; padding: 120px 24px; }
.loading-spinner { width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 32px; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .results-container { flex-direction: column; }
  .results-sidebar { width: 100%; height: auto; position: static; padding: 24px; border-right: none; border-bottom: 1px solid var(--border); }
  .sidebar-nav { flex-direction: row; overflow-x: auto; padding-bottom: 8px; }
  .week-tasks-grid { grid-template-columns: 1fr; }
  .overview-grid { grid-template-columns: 1fr; }
  .overview-card.full-width { grid-column: span 1; }
}
`;