import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

/* ─── parse guide ─── */
function parseGuide(raw) {
  if (typeof raw === "object" && raw !== null) return raw;
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

/* ─── Results Panel (Sidebar + Minimalist Briefing) ─── */
function ResultsPanel({ guide, company, role, experience }) {
  const data = parseGuide(guide);
  const [activeTab, setActiveTab] = useState("overview");

  if (!data || !data.difficultyScore) {
    return (
      <div className="error-view">
        <ReactMarkdown>{typeof guide === "string" ? guide : JSON.stringify(guide, null, 2)}</ReactMarkdown>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: "⦿" },
    { id: "plan", label: "Study Plan", icon: "⌬" },
    { id: "questions", label: "Questions", icon: "⌗" },
    { id: "rounds", label: "Process", icon: "⌱" },
    { id: "analysis", label: "Briefing", icon: "⎋" },
  ];

  return (
    <div className="dashboard-root">
      
      {/* LEFT NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-meta">
          <div className="badge-ready">Model Ready</div>
          <h3 className="sb-company">{company}</h3>
          <p className="sb-role">{role}</p>
        </div>
        
        <nav className="sb-nav">
          {TABS.map(t => (
            <button 
              key={t.id}
              className={`sb-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="sb-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Verified for {experience}YR Exp.</p>
          <button className="new-btn" onClick={() => window.location.reload()}>New Guide</button>
        </div>
      </aside>

      {/* MAIN CONTENT (Minimalist Flow) */}
      <main className="content-area">
        <div className="view-wrapper fade-in">
          
          {activeTab === "overview" && (
            <section className="doc-section">
              <span className="section-eyebrow">Intelligence Summary</span>
              <h2 className="doc-title">Interview Intensity</h2>
              <div className="score-hero">
                <span className="score-big">{data.difficultyScore}/10</span>
                <span className="score-tag">{data.difficultyLabel}</span>
              </div>
              <p className="doc-lead">{data.difficultyReason}</p>

              <div className="spacer-lg" />

              <h3 className="sub-title">Strategic Insights</h3>
              <ul className="dot-list">
                {(data.keyInsights || []).map((ins, i) => (
                  <li key={i} className="dot-item">{ins}</li>
                ))}
              </ul>

              <div className="spacer-lg" />

              <h3 className="sub-title">Target Topics</h3>
              <div className="topic-flow">
                {(data.topTopics || []).map((t, i) => (
                  <span key={i} className="topic-label">{t}</span>
                ))}
              </div>
            </section>
          )}

          {activeTab === "plan" && (
            <section className="doc-section">
              <span className="section-eyebrow">Tactical Timeline</span>
              <h2 className="doc-title">14-Day Preparation</h2>
              <div className="roadmap-flow">
                {(data.preparationPlan || []).map((week, i) => (
                  <div key={i} className="roadmap-week">
                    <h3 className="week-heading">Week {week.week} · <span>{week.focus}</span></h3>
                    <ul className="check-list">
                      {(week.tasks || []).map((task, j) => (
                        <li key={j} className="check-item">
                          <span className="box" /> {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "questions" && (
            <section className="doc-section">
              <span className="section-eyebrow">Technical Inventory</span>
              <h2 className="doc-title">Top 20 Questions</h2>
              <div className="questions-spacious">
                {(data.topQuestions || []).map((q, i) => (
                  <div key={i} className="q-row">
                    <div className="q-meta">
                      <span className="q-idx">{i + 1}</span>
                      <span className="q-tag">{q.category}</span>
                    </div>
                    <p className="q-text">{q.question}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "rounds" && (
            <section className="doc-section">
              <span className="section-eyebrow">Evaluative Flow</span>
              <h2 className="doc-title">Interview Process</h2>
              <div className="process-list">
                {(data.interviewRounds || []).map((r, i) => (
                  <div key={i} className="process-node">
                    <h4 className="node-name">{r.name}</h4>
                    <p className="node-desc">{r.description}</p>
                    {r.duration && <span className="node-time">{r.duration}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "analysis" && (
            <section className="doc-section">
              <span className="section-eyebrow">Coach's Perspective</span>
              <h2 className="doc-title">Executive Briefing</h2>
              <div className="brief-grid">
                {(data.strategicBriefing || []).map((brief, i) => (
                  <div key={i} className={`brief-chunk ${brief.type}`}>
                    <h4 className="chunk-title">{brief.title}</h4>
                    <ul className="chunk-points">
                      {(brief.points || []).map((p, j) => (
                        <li key={j}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
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

  if (session === undefined) return <div className="loader">Checking Credentials...</div>;
  if (!session) return <Login />;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {!guide && !loading ? (
          <div className="landing">
            <header className="navbar">
              <div className="brand">Interview<span>Prep</span></div>
              <div className="user-area">{session.user.email} · <button onClick={() => supabase.auth.signOut()}>Sign Out</button></div>
            </header>

            <section className="hero">
              <h1 className="hero-title">Prepare for your next <span>career move</span> with precision.</h1>
              <p className="hero-sub">Generate a structured preparation model for any enterprise and seniority level.</p>
              
              <div className="glass-form">
                <div className="row">
                  <div className="input-group">
                    <label>Enterprise</label>
                    <input type="text" placeholder="e.g. Google" value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Designation</label>
                    <input type="text" placeholder="e.g. Staff Engineer" value={role} onChange={e => setRole(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Exp. Level</label>
                    <input type="number" placeholder="5" value={experience} onChange={e => setExperience(e.target.value)} />
                  </div>
                </div>
                <button className="cta-btn" onClick={generateGuide} disabled={!company || !role || !experience}>
                  Build My Roadmap
                </button>
              </div>
            </section>
          </div>
        ) : loading ? (
          <div className="loader">
            <div className="orbit" />
            <p>Processing data models{".".repeat(dots)}</p>
          </div>
        ) : (
          <ResultsPanel guide={guide} company={company} role={role} experience={experience} />
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   CSS - MODERN MINIMALIST DASHBOARD
══════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #ffffff;
  --text: #000000;
  --text-muted: #6b7280;
  --text-dim: #9ca3af;
  --accent: #2563eb;
  --border: #f3f4f6;
  --surf: #fafafa;
  --sans: 'Plus Jakarta Sans', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; -webkit-font-smoothing: antialiased; }

.app { min-height: 100vh; display: flex; flex-direction: column; }

/* ── LANDING ── */
.landing { max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; }
.navbar { height: 80px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 120px; }
.brand { font-weight: 800; font-size: 20px; letter-spacing: -0.04em; }
.brand span { color: var(--accent); }
.user-area { font-size: 13px; font-weight: 600; color: var(--text-dim); }
.user-area button { background: none; border: none; font-family: inherit; font-weight: 700; cursor: pointer; color: var(--text-muted); }

.hero { max-width: 800px; margin: 0 auto; text-align: center; }
.hero-title { font-size: 64px; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 24px; line-height: 1; }
.hero-title span { color: var(--accent); }
.hero-sub { font-size: 18px; color: var(--text-muted); margin-bottom: 64px; }

.glass-form { background: #fff; border: 1px solid var(--text); border-radius: 12px; padding: 40px; box-shadow: 12px 12px 0 var(--border); }
.row { display: grid; grid-template-columns: 1.2fr 1.2fr 100px; gap: 24px; margin-bottom: 32px; text-align: left; }
.input-group label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
.input-group input { width: 100%; border: none; border-bottom: 1px solid var(--border); padding: 12px 0; font-family: inherit; font-size: 16px; font-weight: 600; outline: none; }
.input-group input:focus { border-color: var(--text); }
.cta-btn { width: 100%; padding: 18px; background: var(--text); color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.1s; }
.cta-btn:active { transform: scale(0.99); }
.cta-btn:disabled { opacity: 0.2; cursor: not-allowed; }

/* ── DASHBOARD ARCH ── */
.dashboard-root { display: flex; min-height: 100vh; }

.sidebar { 
  width: 280px; background: var(--surf); border-right: 1px solid var(--border); 
  padding: 48px 24px; display: flex; flex-direction: column; 
  position: sticky; top: 0; height: 100vh;
}
.sidebar-meta { padding-bottom: 32px; border-bottom: 1px solid var(--border); margin-bottom: 32px; }
.badge-ready { display: inline-block; padding: 4px 10px; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 800; border-radius: 100px; margin-bottom: 16px; }
.sb-company { font-size: 22px; font-weight: 800; letter-spacing: -0.04em; }
.sb-role { font-size: 13px; color: var(--text-muted); }

.sb-nav { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.sb-btn { 
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; 
  border: none; background: none; border-radius: 8px; cursor: pointer;
  font-family: inherit; font-size: 14px; font-weight: 600; color: var(--text-muted); 
  text-align: left; transition: all 0.2s;
}
.sb-btn:hover { background: #f3f4f6; color: var(--text); }
.sb-btn.active { background: var(--text); color: #fff; }
.sb-icon { font-size: 16px; width: 20px; }

.sidebar-footer { border-top: 1px solid var(--border); padding-top: 32px; }
.sidebar-footer p { font-size: 11px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-bottom: 16px; }
.new-btn { width: 100%; padding: 10px; border: 1px solid var(--text); background: none; font-family: inherit; font-weight: 700; border-radius: 6px; cursor: pointer; font-size: 12px; }

/* ── CONTENT AREA ── */
.content-area { flex: 1; overflow-y: auto; background: #fff; }
.view-wrapper { max-width: 800px; margin: 0 auto; padding: 80px 48px; }

.doc-section { display: flex; flex-direction: column; }
.section-eyebrow { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 16px; }
.doc-title { font-size: 48px; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 24px; line-height: 1; }
.doc-lead { font-size: 20px; color: var(--text-muted); font-weight: 500; line-height: 1.5; }

/* OVERVIEW SPECIFIC */
.score-hero { display: flex; align-items: baseline; gap: 16px; margin-bottom: 16px; }
.score-big { font-size: 64px; font-weight: 800; letter-spacing: -0.05em; }
.score-tag { font-size: 20px; font-weight: 700; color: var(--accent); }

.sub-title { font-size: 24px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; }
.dot-list { list-style: none; display: flex; flex-direction: column; gap: 20px; }
.dot-item { display: flex; gap: 16px; font-size: 17px; font-weight: 600; }
.dot-item::before { content: "⦿"; color: var(--accent); }

.topic-flow { display: flex; flex-wrap: wrap; gap: 10px; }
.topic-label { padding: 8px 16px; border: 1px solid var(--border); border-radius: 100px; font-size: 13px; font-weight: 700; background: var(--surf); }

/* PLAN SPECIFIC */
.roadmap-flow { display: flex; flex-direction: column; gap: 64px; }
.week-heading { font-size: 22px; font-weight: 800; margin-bottom: 24px; }
.week-heading span { color: var(--accent); font-weight: 500; }
.check-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.check-item { display: flex; align-items: flex-start; gap: 16px; font-size: 16px; font-weight: 600; color: var(--text-muted); }
.box { width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 6px; flex-shrink: 0; margin-top: 2px; }

/* QUESTIONS SPECIFIC */
.questions-spacious { display: flex; flex-direction: column; gap: 40px; }
.q-row { border-bottom: 1px solid var(--border); padding-bottom: 32px; }
.q-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.q-idx { font-size: 13px; font-weight: 800; color: var(--text-dim); }
.q-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; background: var(--surf); padding: 4px 10px; border-radius: 6px; color: var(--text-muted); }
.q-text { font-size: 20px; font-weight: 700; line-height: 1.4; }

/* BRIEFING SPECIFIC */
.brief-grid { display: flex; flex-direction: column; gap: 40px; }
.brief-chunk { padding: 40px; border-radius: 20px; border: 1px solid var(--border); }
.brief-chunk.warning { background: #fffbeb; border-color: #fef3c7; }
.chunk-title { font-size: 22px; font-weight: 800; margin-bottom: 24px; }
.chunk-points { list-style: none; display: flex; flex-direction: column; gap: 16px; }
.chunk-points li { font-size: 16px; font-weight: 600; position: relative; padding-left: 28px; }
.chunk-points li::before { content: "→"; position: absolute; left: 0; color: var(--text-dim); }

/* UTILS */
.spacer-lg { height: 64px; }
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.loader { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; font-weight: 800; }
.orbit { width: 40px; height: 40px; border: 4px solid var(--border); border-top-color: var(--text); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .dashboard-root { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: static; padding: 24px; border-right: none; border-bottom: 1px solid var(--border); }
  .sb-nav { flex-direction: row; overflow-x: auto; padding-bottom: 8px; }
  .view-wrapper { padding: 48px 24px; }
  .doc-title { font-size: 36px; }
  .hero-title { font-size: 40px; }
  .row { grid-template-columns: 1fr; }
}
`;