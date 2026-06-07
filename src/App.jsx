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
function ResultsPanel({ guide, company, role, experience, onReset }) {
  const data = parseGuide(guide);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

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
          <button className="new-btn" onClick={onReset}>New Guide</button>
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
              <div className="topic-grid">
                {(data.topTopics || []).map((t, i) => (
                  <div key={i} className="topic-cell">
                    <span className="cell-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="cell-name">{t}</span>
                    <span className="cell-status"><span className="status-indicator" /> High Signal</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "plan" && (
            <section className="doc-section">
              <span className="section-eyebrow">Tactical Timeline</span>
              <h2 className="doc-title">14-Day Preparation</h2>
              
              <div className="roadmap-stream">
                {(data.preparationPlan || []).map((week, i) => (
                  <div key={i} className="week-block">
                    <div className="week-marker">
                      <div className="marker-line" />
                      <div className="marker-circle">W{week.week}</div>
                    </div>
                    <div className="week-content">
                      <h3 className="week-title">{week.focus}</h3>
                      <div className="task-stack">
                        {(week.tasks || []).map((task, j) => (
                          <div key={j} className="task-card">
                            <div className="task-dot" />
                            <div className="task-text">{task}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "questions" && (
            <section className="doc-section">
              <span className="section-eyebrow">Technical Inventory</span>
              <h2 className="doc-title">Premium Question Bank</h2>
              <p className="doc-lead">Mined from real-world patterns for {role}. Grouped by core evaluation pillars.</p>
              
              <div className="topic-wise-questions">
                {Object.entries(
                  (data.topQuestions || []).reduce((acc, q) => {
                    const cat = q.category || "General";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(q);
                    return acc;
                  }, {})
                ).map(([category, questions], groupIdx) => (
                  <div key={groupIdx} className="q-topic-group">
                    <h3 className="q-topic-header">
                      <span className="q-topic-dot" />
                      {category}
                      <span className="q-topic-count">{questions.length} Questions</span>
                    </h3>
                    
                    <div className="questions-list">
                      {questions.map((q, i) => {
                        const globalIdx = (data.topQuestions || []).indexOf(q);
                        return (
                          <div 
                            key={globalIdx} 
                            className={`q-row ${expandedQuestion === globalIdx ? "is-expanded" : ""}`}
                            onClick={() => setExpandedQuestion(expandedQuestion === globalIdx ? null : globalIdx)}
                          >
                            <div className="q-row-main">
                              <div className="q-row-id">Q{globalIdx + 1}</div>
                              <div className="q-row-text">{q.question}</div>
                              <div className="q-toggle-icon">{expandedQuestion === globalIdx ? "−" : "+"}</div>
                            </div>
                            
                            {expandedQuestion === globalIdx && (
                              <div className="q-row-expanded fade-in">
                                <div className="q-coach-insight">
                                  <div className="insight-row">
                                    <span className="insight-label">SIGNAL:</span>
                                    <span className="insight-value">{q.whyAsk}</span>
                                  </div>
                                  <div className="insight-row">
                                    <span className="insight-label">KEY CONCEPTS:</span>
                                    <div className="key-concepts">
                                      {(q.keyPoints || []).map((kp, j) => (
                                        <span key={j} className="concept-pill">{kp}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
                    <div className="node-meta">
                      <h4 className="node-name">{r.name}</h4>
                      {r.duration && <span className="node-time">{r.duration}</span>}
                    </div>
                    <p className="node-desc">{r.description}</p>
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
                  <div key={i} className={`brief-mod ${brief.type}`}>
                    <h4 className="mod-title">{brief.title}</h4>
                    <ul className="mod-points">
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

  const reset = () => {
    setGuide(null);
    setCompany("");
    setRole("");
    setExperience("");
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
          <ResultsPanel guide={guide} company={company} role={role} experience={experience} onReset={reset} />
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

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #ffffff; color: #000000; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.5; -webkit-font-smoothing: antialiased; }

.app { min-height: 100vh; display: flex; flex-direction: column; width: 100%; align-items: stretch; }

/* ── LANDING ── */
.landing { max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; display: flex; flex-direction: column; align-items: center; }
.navbar { height: 80px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 120px; width: 100%; }
.brand { font-weight: 800; font-size: 20px; letter-spacing: -0.04em; }
.brand span { color: #2563eb; }
.user-area { font-size: 13px; font-weight: 600; color: #9ca3af; }
.user-area button { background: none; border: none; font-family: inherit; font-weight: 700; cursor: pointer; color: #6b7280; }

.hero { max-width: 800px; margin: 0 auto; text-align: center; }
.hero-title { font-size: 64px; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 24px; line-height: 1.1; color: #000000 !important; }
.hero-title span { color: #2563eb; }
.hero-sub { font-size: 18px; color: #374151 !important; margin-bottom: 64px; }

.glass-form { background: #fff; border: 1px solid #000; border-radius: 12px; padding: 40px; box-shadow: 12px 12px 0 #f3f4f6; }
.row { display: grid; grid-template-columns: 1.2fr 1.2fr 100px; gap: 24px; margin-bottom: 32px; text-align: left; }
.input-group label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #4b5563 !important; margin-bottom: 8px; }
.input-group input { 
  width: 100%; 
  background: #f9fafb; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  padding: 14px 16px; 
  font-family: inherit; 
  font-size: 16px; 
  font-weight: 600; 
  color: #000000 !important; 
  outline: none; 
  transition: all 0.2s ease;
}
.input-group input:hover { border-color: #9ca3af; background: #f3f4f6; }
.input-group input:focus { 
  border-color: #2563eb; 
  background: #ffffff; 
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); 
}
.input-group input::placeholder { color: #9ca3af; font-weight: 400; }
.cta-btn { width: 100%; padding: 18px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.1s; }
.cta-btn:active { transform: scale(0.99); }
.cta-btn:disabled { opacity: 0.2; cursor: not-allowed; }

/* ── DASHBOARD ARCH ── */
.dashboard-root { display: flex; flex: 1; width: 100%; background: #fff; }

.sidebar { 
  width: 260px; background: #fafafa; border-right: 1px solid #eeeeee; 
  padding: 40px 24px; display: flex; flex-direction: column; 
  position: sticky; top: 0; height: 100vh; flex-shrink: 0;
}
.sidebar-meta { padding-bottom: 32px; border-bottom: 1px solid #eeeeee; margin-bottom: 32px; }
.badge-ready { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 800; border-radius: 4px; margin-bottom: 16px; text-transform: uppercase; }
.sb-company { font-size: 20px; font-weight: 800; letter-spacing: -0.04em; color: #000; }
.sb-role { font-size: 12px; color: #6b7280; font-weight: 600; }

.sb-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.sb-btn { 
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; 
  border: none; background: none; border-radius: 6px; cursor: pointer;
  font-family: inherit; font-size: 13px; font-weight: 700; color: #4b5563; 
  text-align: left; transition: all 0.1s;
}
.sb-btn:hover { background: #f3f4f6; color: #000; }
.sb-btn.active { background: #000; color: #fff; }
.sb-icon { font-size: 14px; width: 18px; opacity: 0.7; }

.sidebar-footer { border-top: 1px solid #eeeeee; padding-top: 32px; }
.sidebar-footer p { font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 12px; }
.new-btn { width: 100%; padding: 10px; border: none; background: #000; color: #fff; font-family: inherit; font-weight: 800; border-radius: 6px; cursor: pointer; font-size: 11px; transition: background 0.2s; }
.new-btn:hover { background: #333; }

/* ── CONTENT AREA ── */
.content-area { flex: 1; overflow-y: auto; background: #fff; }
.view-wrapper { max-width: 1100px; padding: 60px 80px; margin: 0; }

.doc-section { display: flex; flex-direction: column; align-items: flex-start; text-align: left; }
.section-eyebrow { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-bottom: 8px; }
.doc-title { font-size: 40px; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 20px; line-height: 1; color: #000; }
.doc-lead { font-size: 17px; color: #4b5563; font-weight: 500; line-height: 1.6; max-width: 750px; text-align: left; margin-bottom: 48px; }

/* OVERVIEW */
.score-hero { display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px; }
.score-big { font-size: 64px; font-weight: 800; letter-spacing: -0.05em; color: #000; }
.score-tag { font-size: 20px; font-weight: 700; color: #2563eb; }

.sub-title { font-size: 22px; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.02em; color: #000; }
.dot-list { list-style: none; display: flex; flex-direction: column; gap: 14px; width: 100%; }
.dot-item { display: flex; gap: 14px; font-size: 16px; font-weight: 600; line-height: 1.5; color: #1f2937; }
.dot-item::before { content: "→"; color: #2563eb; font-weight: 800; }

.topic-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #eeeeee; border-radius: 8px; width: 100%; max-width: 800px; }
.topic-cell { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #eeeeee; border-right: 1px solid #eeeeee; }
.topic-cell:nth-child(2n) { border-right: none; }
.cell-name { font-size: 14px; font-weight: 700; color: #000; }
.cell-status { font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; }

/* STUDY PLAN - STREAM ARCHITECTURE */
.roadmap-stream { display: flex; flex-direction: column; gap: 48px; width: 100%; max-width: 900px; }
.week-block { display: grid; grid-template-columns: 80px 1fr; gap: 24px; }

.week-marker { display: flex; flex-direction: column; align-items: center; position: relative; }
.marker-line { width: 2px; flex: 1; background: #eeeeee; position: absolute; top: 40px; bottom: -48px; }
.week-block:last-child .marker-line { display: none; }
.marker-circle { 
  width: 44px; height: 44px; background: #000; color: #fff; 
  border-radius: 50%; display: flex; align-items: center; justify-content: center; 
  font-size: 11px; font-weight: 800; z-index: 2; 
}

.week-content { display: flex; flex-direction: column; gap: 20px; }
.week-title { font-size: 18px; font-weight: 800; color: #000; letter-spacing: -0.02em; }

.task-stack { display: flex; flex-direction: column; gap: 12px; }
.task-card { 
  display: flex; align-items: flex-start; gap: 16px; padding: 20px; 
  background: #ffffff; border: 1px solid #eeeeee; border-radius: 12px; 
  transition: all 0.2s ease; 
}
.task-card:hover { border-color: #000; box-shadow: 8px 8px 0 #f3f4f6; transform: translateY(-2px); }
.task-dot { width: 8px; height: 8px; background: #2563eb; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.task-text { font-size: 14px; font-weight: 600; color: #374151; line-height: 1.5; }

/* QUESTIONS */
.topic-wise-questions { width: 100%; display: flex; flex-direction: column; gap: 48px; }
.q-topic-group { width: 100%; }
.q-topic-header { 
  display: flex; align-items: center; gap: 12px; 
  font-size: 16px; font-weight: 800; color: #000; 
  margin-bottom: 16px; padding-bottom: 12px; 
  border-bottom: 2px solid #000; 
}
.q-topic-dot { width: 6px; height: 6px; background: #2563eb; border-radius: 50%; }
.q-topic-count { margin-left: auto; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; }

.questions-list { display: flex; flex-direction: column; width: 100%; }
.q-row { border-bottom: 1px solid #eeeeee; transition: background 0.1s; }
.q-row:hover { background: #f9fafb; }
.q-row.is-expanded { background: #fff; border-left: 4px solid #000; }

.q-row-main { 
  display: grid; 
  grid-template-columns: 60px 1fr 180px 40px; 
  padding: 24px 0; 
  align-items: center; 
  gap: 20px; 
}
.q-row-id { font-size: 11px; font-weight: 800; color: #9ca3af; font-family: monospace; }
.q-row-text { font-size: 16px; font-weight: 700; color: #000; line-height: 1.4; padding-right: 20px; }
.q-row-meta { display: flex; justify-content: flex-end; }
.q-category-pill { font-size: 10px; font-weight: 800; text-transform: uppercase; background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 4px; white-space: nowrap; }
.q-toggle-icon { font-size: 20px; color: #9ca3af; text-align: center; cursor: pointer; }

.q-row-expanded { padding: 0 0 32px 60px; }
.q-coach-insight { background: #fafafa; padding: 24px; border-radius: 8px; border: 1px solid #eeeeee; }
.insight-row { display: grid; grid-template-columns: 100px 1fr; gap: 20px; margin-bottom: 16px; }
.insight-row:last-child { margin-bottom: 0; }
.insight-label { font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 4px; }
.insight-value { font-size: 14px; font-weight: 600; color: #374151; line-height: 1.6; }

/* PROCESS */
.process-list { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 800px; }
.process-node { padding: 24px; border: 1px solid #eeeeee; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
.node-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.node-name { font-size: 16px; font-weight: 800; color: #000; }
.node-time { font-size: 11px; font-weight: 800; color: #2563eb; }
.node-desc { font-size: 14px; color: #4b5563; font-weight: 600; line-height: 1.5; }

/* BRIEFING */
.brief-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; }
.brief-mod { padding: 32px; border: 1px solid #eeeeee; border-radius: 12px; }
.brief-mod.warning { background: #fffbeb; border-color: #fef3c7; }
.mod-title { font-size: 18px; font-weight: 800; margin-bottom: 20px; color: #000; }
.mod-points li { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; padding-left: 20px; position: relative; }
.mod-points li::before { content: "→"; position: absolute; left: 0; color: #9ca3af; }

/* GLOBAL UTILS */
.spacer-lg { height: 48px; }
.fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.loader { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; font-weight: 800; }
.orbit { width: 32px; height: 32px; border: 3px solid #eeeeee; border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1200px) {
  .brief-grid { grid-template-columns: 1fr; }
}

@media (max-width: 1024px) {
  .dashboard-root { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: static; padding: 24px; border-right: none; border-bottom: 1px solid #eeeeee; }
  .sb-nav { flex-direction: row; overflow-x: auto; padding-bottom: 8px; gap: 16px; }
  .view-wrapper { padding: 40px 24px; }
  .doc-title { font-size: 28px; }
  .hero-title { font-size: 40px; }
  .row { grid-template-columns: 1fr; }
  .q-row-main { grid-template-columns: 40px 1fr 40px; }
  .q-row-meta .q-category-pill { display: none; }
  .q-row-expanded { padding-left: 24px; }
  .week-block { grid-template-columns: 1fr; gap: 12px; }
  .marker-line { display: none; }
}
`;
