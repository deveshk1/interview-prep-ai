import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

function parseGuide(raw) {
  if (typeof raw === "object" && raw !== null) return raw;
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

const DIFF = {
  Easy:        { color: "#16a34a", light: "#f0fdf4", border: "#bbf7d0", label: "Easy" },
  Medium:      { color: "#d97706", light: "#fffbeb", border: "#fde68a", label: "Medium" },
  Hard:        { color: "#ea580c", light: "#fff7ed", border: "#fed7aa", label: "Hard" },
  "Very Hard": { color: "#dc2626", light: "#fef2f2", border: "#fecaca", label: "Very Hard" },
};

const CAT = {
  DSA:             { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "System Design": { bg: "#ecfeff", color: "#0891b2", border: "#a5f3fc" },
  Java:            { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  Spring:          { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Behavioral:      { bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8" },
  Other:           { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

function Chevron({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.22s ease", color: "#94a3b8" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Accordion({ title, subtitle, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 22px", background: open ? "#fafafa" : "#fff", border: "none",
        cursor: "pointer", textAlign: "left", gap: 16, transition: "background .15s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>{subtitle}</div>}
          </div>
          {count && (
            <span style={{ fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 20, padding: "2px 10px" }}>
              {count}
            </span>
          )}
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{ padding: "0 22px 22px", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ResultsView({ guide, company, role, experience }) {
  const data = parseGuide(guide);
  if (!data || !data.difficultyScore) {
    return <div style={{ padding: "32px 0", fontSize: 14, color: "#64748b" }}>
      <ReactMarkdown>{typeof guide === "string" ? guide : JSON.stringify(guide, null, 2)}</ReactMarkdown>
    </div>;
  }

  const diff = DIFF[data.difficultyLabel] || DIFF["Hard"];

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 20, padding: "3px 11px", display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            Guide ready
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em", margin: 0 }}>
          {company} <span style={{ color: "#64748b", fontWeight: 500 }}>— {role}</span>
        </h1>
        <p style={{ fontSize: 13.5, color: "#94a3b8", marginTop: 6 }}>
          {experience} year{experience !== "1" ? "s" : ""} experience · Generated now
        </p>
      </div>

      {/* Row 1: Difficulty + Rounds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Difficulty card */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={secLabel}>Difficulty rating</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%", background: diff.light,
              border: `2px solid ${diff.border}`, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: diff.color, lineHeight: 1 }}>{data.difficultyScore}</span>
              <span style={{ fontSize: 10, color: diff.color, opacity: 0.65, marginTop: 1 }}>/10</span>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: diff.color, letterSpacing: "-0.02em" }}>{diff.label}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Interview difficulty</div>
            </div>
          </div>
          {data.difficultyReason && (
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              {data.difficultyReason}
            </p>
          )}
        </div>

        {/* Interview Rounds */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={secLabel}>Interview rounds</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(data.interviewRounds || []).map((r, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: "#eef2ff",
                    border: "1.5px solid #c7d2fe", color: "#4f46e5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>{i + 1}</div>
                  {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: "#e2e8f0", minHeight: 16 }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 16 : 0, paddingTop: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginTop: 2 }}>{r.description}</div>
                  {r.duration && <div style={{ fontSize: 11, color: "#4f46e5", marginTop: 3, fontWeight: 500 }}>{r.duration}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 26px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={secLabel}>Key topics to master</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(data.topTopics || []).map((t, i) => (
            <span key={i} style={{
              fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 20,
              background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155"
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 26px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={secLabel}>💡 Key insights from candidates</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {(data.keyInsights || []).map((ins, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: "11px 14px", borderRadius: 9, background: "#f8fafc", border: "1px solid #f1f5f9"
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f46e5", marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.65 }}>{ins}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accordions */}
      <Accordion title="Top 20 interview questions" subtitle={`Most commonly asked for ${role} at ${company}`} count="20 questions" defaultOpen>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 16 }}>
          {(data.topQuestions || []).map((q, i) => {
            const cat = CAT[q.category] || CAT.Other;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9"
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", minWidth: 22, paddingTop: 2, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, fontSize: 13.5, color: "#1e293b", lineHeight: 1.6 }}>{q.question}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, flexShrink: 0, marginTop: 2,
                  background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color
                }}>{q.category}</span>
              </div>
            );
          })}
        </div>
      </Accordion>

      <Accordion title="2-week preparation plan" subtitle="Day-by-day study roadmap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 16 }}>
          {(data.preparationPlan || []).map((wk, i) => (
            <div key={i} style={{ borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#4f46e5", marginBottom: 4 }}>
                Week {wk.week}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>{wk.focus}</div>
              {(wk.tasks || []).map((task, j) => (
                <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4f46e5", marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
                  <span style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>{task}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Full detailed analysis" subtitle="Complete breakdown — expand for depth">
        <div style={{ paddingTop: 16, fontSize: 13.5, color: "#475569", lineHeight: 1.8 }} className="md-body">
          <ReactMarkdown>{data.fullAnalysis || ""}</ReactMarkdown>
        </div>
      </Accordion>

    </div>
  );
}

const secLabel = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em",
  textTransform: "uppercase", color: "#94a3b8", marginBottom: 18,
};

/* ════════════════════════════════ */

export default function App() {
  const [company, setCompany]       = useState("");
  const [role, setRole]             = useState("");
  const [experience, setExperience] = useState("");
  const [guide, setGuide]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [session, setSession]       = useState(undefined);
  const [msgIdx, setMsgIdx]         = useState(0);

  const MSGS = [
    "Searching real interview experiences…",
    "Analysing patterns from candidates…",
    "Generating your personalised guide…",
    "Almost there, putting it together…",
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx(m => (m + 1) % MSGS.length), 2800);
    return () => clearInterval(t);
  }, [loading]);

  const generate = async () => {
    setLoading(true); setGuide(null);
    try { const raw = await generateInterviewGuide(company, role, experience); setGuide(raw); }
    catch { setGuide("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const canGenerate = company.trim() && role.trim() && experience !== "";

  if (session === undefined) return (
    <>
      <style>{`body{margin:0;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#94a3b8;font-size:13px;}`}</style>
      <div>Loading…</div>
    </>
  );
  if (!session) return <Login />;

  return (
    <>
      <style>{CSS}</style>
      <div className="root">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="logo">
              <span className="logo-mark">P</span>
              PrepAI
              <span className="badge">Beta</span>
            </div>

            <div className="divider" />

            <p className="sidebar-eyebrow">Your target role</p>

            <div className="field">
              <label className="field-label">Company</label>
              <input className="inp" type="text" placeholder="Google, Razorpay, Stripe…"
                value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Role</label>
              <input className="inp" type="text" placeholder="Senior Software Engineer…"
                value={role} onChange={e => setRole(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Years of experience</label>
              <input className="inp" type="number" min="0" placeholder="e.g. 4"
                value={experience} onChange={e => setExperience(e.target.value)} />
            </div>

            <button className="btn-gen" onClick={generate} disabled={loading || !canGenerate}>
              {loading
                ? <><span className="spinner" /> Generating…</>
                : "Generate my guide →"
              }
            </button>

            {!canGenerate && !loading && (
              <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Fill all fields to continue</p>
            )}
          </div>

          <div className="sidebar-bottom">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="avatar">{(session.user.email || "U")[0].toUpperCase()}</div>
              <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                {session.user.email}
              </div>
            </div>
            <button className="btn-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="content">

          {!loading && !guide && (
            <div className="empty">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                AI-powered interview prep
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em", marginBottom: 10 }}>
                Your personalized guide<br />starts here
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 400, marginBottom: 36 }}>
                Enter a company and role to get a complete interview guide — difficulty score, top questions, prep plan, and real candidate insights.
              </p>
              <div className="preview-grid">
                {[
                  { icon: "📊", t: "Difficulty score", d: "Calibrated from real data" },
                  { icon: "❓", t: "Top 20 questions", d: "By category & topic" },
                  { icon: "📅", t: "2-week plan", d: "Structured daily roadmap" },
                  { icon: "💡", t: "Candidate insights", d: "Tips that got people hired" },
                ].map((c, i) => (
                  <div className="preview-card" key={i}>
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>{c.t}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-wrap">
              <div className="loading-ring" />
              <div style={{ fontSize: 15, fontWeight: 500, color: "#334155" }}>{MSGS[msgIdx]}</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>This usually takes 10–15 seconds</div>
              <div className="loading-bar"><div className="loading-fill" /></div>
            </div>
          )}

          {guide && !loading && (
            <ResultsView guide={guide} company={company} role={role} experience={experience} />
          )}
        </main>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  --sans: 'Inter', system-ui, sans-serif;
}

body { background: #f1f5f9; font-family: var(--sans); color: #1e293b; -webkit-font-smoothing: antialiased; }

.root { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }

/* ── SIDEBAR ── */
.sidebar {
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex; flex-direction: column; justify-content: space-between;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
  padding: 28px 22px;
  box-shadow: 1px 0 0 #f1f5f9;
}
.sidebar-top { display: flex; flex-direction: column; gap: 14px; }

.logo {
  display: flex; align-items: center; gap: 9px;
  font-size: 16px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.02em; margin-bottom: 4px;
}
.logo-mark {
  width: 28px; height: 28px; border-radius: 7px;
  background: #4f46e5; color: #fff; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.badge {
  font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
  background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe;
  border-radius: 20px; padding: 2px 8px;
}
.divider { height: 1px; background: #f1f5f9; }
.sidebar-eyebrow { font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: #64748b; }
.inp {
  width: 100%; padding: 9px 12px; background: #f8fafc;
  border: 1px solid #e2e8f0; border-radius: 8px;
  color: #0f172a; font-size: 13px; font-family: var(--sans);
  outline: none; transition: border-color .15s, box-shadow .15s;
}
.inp::placeholder { color: #cbd5e1; }
.inp:focus { background: #fff; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }

.btn-gen {
  width: 100%; padding: 11px 16px; background: #4f46e5; color: #fff;
  border: none; border-radius: 9px; font-size: 13.5px; font-weight: 600;
  font-family: var(--sans); cursor: pointer; display: flex;
  align-items: center; justify-content: center; gap: 8px;
  transition: background .15s; margin-top: 4px;
  box-shadow: 0 1px 3px rgba(79,70,229,0.3);
}
.btn-gen:hover:not(:disabled) { background: #4338ca; }
.btn-gen:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.sidebar-bottom { display: flex; flex-direction: column; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #eef2ff; border: 1px solid #c7d2fe; color: #4f46e5; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.btn-signout { font-size: 12px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; cursor: pointer; font-family: var(--sans); width: 100%; transition: background .15s; }
.btn-signout:hover { background: #f1f5f9; }

/* ── CONTENT ── */
.content { padding: 52px 64px; max-width: 920px; width: 100%; }

/* ── EMPTY ── */
.empty { padding-top: 24px; }
.preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 460px; }
.preview-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }

/* ── LOADING ── */
.loading-wrap { padding-top: 80px; display: flex; flex-direction: column; gap: 16px; }
.loading-ring { width: 34px; height: 34px; border: 2.5px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin .9s linear infinite; }
.loading-bar { width: 200px; height: 3px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.loading-fill { height: 100%; width: 40%; background: #4f46e5; border-radius: 4px; animation: slide 1.6s ease-in-out infinite; }
@keyframes slide { 0% { transform: translateX(-200%); } 100% { transform: translateX(450%); } }

/* ── MARKDOWN ── */
.md-body p { margin-bottom: 12px; }
.md-body h2, .md-body h3 { font-size: 14px; font-weight: 600; color: #0f172a; margin: 16px 0 8px; }
.md-body ul, .md-body ol { padding-left: 18px; margin-bottom: 12px; }
.md-body li { font-size: 13px; color: #475569; line-height: 1.65; margin-bottom: 4px; }
.md-body strong { color: #0f172a; font-weight: 600; }

/* ── RESPONSIVE ── */
@media (max-width: 860px) {
  .root { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid #e2e8f0; }
  .content { padding: 28px 18px; }
  .preview-grid { grid-template-columns: 1fr; }
}
`;