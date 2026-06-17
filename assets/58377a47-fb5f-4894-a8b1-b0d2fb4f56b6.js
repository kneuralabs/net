// components.jsx — KNEURALABS Intranet "Archive" components
// Loaded after react + babel + data.jsx; uses globals TOOLS, NEWS, WEATHER.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function fmtTime(date, tz) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
    }).format(date);
  } catch { return "--:--"; }
}
function fmtSec(date, tz) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      second: "2-digit", timeZone: tz,
    }).format(date);
  } catch { return "--"; }
}
function fmtDayOfWeek(date, tz) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short", day: "2-digit", month: "short", timeZone: tz,
    }).format(date).toUpperCase();
  } catch { return ""; }
}

/* ────────────────────────────────────────────────────────────────
   Nameplate header
   ──────────────────────────────────────────────────────────────── */
function Nameplate({ now }) {
  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(now);
  }, [now]);
  const volume = useMemo(() => {
    // Volume = days since 2020-01-01 / 30, Issue = day of year
    const start = new Date(2026, 0, 1);
    const days = Math.floor((now - start) / 86400000);
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    return `VOL. ${String(Math.floor(days / 30)).padStart(3, "0")} · ISS. ${String(dayOfYear).padStart(3, "0")}`;
  }, [now]);
  return (
    <header className="nameplate">
      <div className="nameplate__mark">
        <div className="nameplate__brand">
          <img className="nameplate__logo" src={window.__resources.logo} alt="Kneuralabs" />
          <div className="nameplate__wordmark">
            Kneuralabs<em>.</em>
          </div>
        </div>
        <div className="nameplate__sub">Internal Portal · Established 2026</div>
      </div>
      <div className="nameplate__bar">
        <span className="nameplate__beacon">
          <span className="pulse-dot" />
          <span className="nameplate__beacon-lbl">All systems operational</span>
        </span>
        <span className="nameplate__edition">Trust &amp; Security Edition</span>
        <a className="nameplate__idcard" href="https://db.kneuralabs.com" target="_blank" rel="noopener noreferrer" aria-label="ID Card" title="ID Card">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.2"></rect>
            <circle cx="8" cy="11" r="2.2"></circle>
            <path d="M4.8 16.2c.5-1.6 1.9-2.4 3.2-2.4s2.7.8 3.2 2.4"></path>
            <path d="M14.5 9.5h4.2M14.5 12.5h4.2M14.5 15.5h2.6"></path>
          </svg>
        </a>
      </div>
      <div className="nameplate__meta">
        <div><b>{dateStr}</b></div>
        <div>{volume}</div>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────
   Status strip — dual clocks + weather + holiday
   ──────────────────────────────────────────────────────────────── */
function ClockCell({ city, code, tz, weather, now }) {
  const hhmm = fmtTime(now, tz);
  const ss = fmtSec(now, tz);
  const dow = fmtDayOfWeek(now, tz);
  return (
    <div className="strip__cell">
      <div className="strip__lbl">
        <span><span className="pulse-dot" />{city}</span>
        <span>{code}</span>
      </div>
      <div className="strip__big">
        <span>{hhmm}</span>
        <span className="strip__seconds">:{ss}</span>
      </div>
      <div className="strip__sub">{dow} · {weather.icon} {weather.temp}° · {weather.cond}</div>
    </div>
  );
}
/* ── Holiday helpers ── */
function _nthWeekday(year, month, weekday, n) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) { if (d.getDay() === weekday) { count++; if (count === n) return new Date(d); } d.setDate(d.getDate() + 1); }
}
function _lastWeekday(year, month, weekday) {
  const d = new Date(year, month, 0);
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
  return new Date(d);
}
function _allHolidays(year) {
  const list = [
    { name: "New Year's Day",  date: new Date(year, 0, 1) },
    { name: "MLK Day",         date: _nthWeekday(year, 1, 1, 3) },
    { name: "Presidents' Day", date: _nthWeekday(year, 2, 1, 3) },
    { name: "Memorial Day",    date: _lastWeekday(year, 5, 1) },
    { name: "Independence Day",date: new Date(year, 6, 4) },
    { name: "Labor Day",       date: _nthWeekday(year, 9, 1, 1) },
    { name: "Thanksgiving",    date: _nthWeekday(year, 11, 4, 4) },
    { name: "Christmas Day",   date: new Date(year, 11, 25) },
  ];
  if (year >= 2026) list.push({ name: "Kneuralabs Day ✦", date: new Date(year, 1, 19) });
  return list.sort((a, b) => a.date - b.date);
}
const _MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function _fmtHol(d) { return d.getDate() + " " + _MON_SHORT[d.getMonth()]; }

function HolidayCell({ now }) {
  const today = useMemo(() => { const d = new Date(now); d.setHours(0,0,0,0); return d; }, [now]);
  const { todayHol, next } = useMemo(() => {
    const yr = today.getFullYear();
    const all = [..._allHolidays(yr), ..._allHolidays(yr + 1)];
    const todayHol = all.find(h => h.date.getTime() === today.getTime()) || null;
    const next = all.filter(h => h.date > today)[0] || null;
    return { todayHol, next };
  }, [today]);

  const daysUntil = next ? Math.round((next.date - today) / 86400000) : null;

  return (
    <div className="strip__cell">
      <div className="strip__lbl">
        <span>Today · Federal</span>
        <span>US</span>
      </div>
      <div className="strip__big" style={{ fontSize: 22, letterSpacing: "-0.02em", fontWeight: 600 }}>
        {todayHol ? todayHol.name : "No holiday"}
      </div>
      <div className="strip__sub">
        {next
          ? `Next observed · ${next.name} · ${_fmtHol(next.date)} · in ${daysUntil}d`
          : "No upcoming holidays found"}
      </div>
    </div>
  );
}

function StatusStrip({ now }) {
  return (
    <section className="strip">
      <ClockCell city="Kolkata" code="IST · UTC+5:30" tz="Asia/Kolkata"
                 weather={window.WEATHER.kolkata} now={now} />
      <ClockCell city="Connecticut" code="EDT · America/New_York" tz="America/New_York"
                 weather={window.WEATHER.connecticut} now={now} />
      <HolidayCell now={now} />
      <div className="strip__cell">
        <div className="strip__lbl">
          <span>System</span>
          <span className="all-green-lbl">All Green</span>
        </div>
        <div className="strip__big" style={{ fontSize: 22, letterSpacing: "-0.02em", fontWeight: 600 }}>
          Operational
        </div>
        <div className="strip__sub">{window.TOOLS.length} tools online · 0 incidents · last sync 00:14</div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Welcome card
   ──────────────────────────────────────────────────────────────── */
const VOICE_COPY = {
  formal: {
    eyebrow: "A note from management",
    quote: <>A shared space — <em>use it well.</em></>,
    body: [
      "Every post here leaves a mark. Keep it accurate, relevant, and respectful.",
      "Share with intention; this space only works when each of us takes care of it.",
      "Used well, it stays reliable and genuinely helpful for the whole team.",
    ],
    sigRole: "Trust, responsibility & care",
  },
  plain: {
    eyebrow: "Welcome",
    quote: <>One workspace, <em>well kept.</em></>,
    body: [
      "Be clear, be kind, be on the record.",
      "Post things you'd be glad to find later. Skip the rest.",
      "If you'd send it in a meeting, send it here.",
    ],
    sigRole: "Internal communications",
  },
  warm: {
    eyebrow: "Hello, team",
    quote: <>A small place, <em>shared with care.</em></>,
    body: [
      "What you put in is what we all get back — write things you'd want to read.",
      "When in doubt, ask. There's a real person on the other end of every channel.",
      "Welcome back. Glad you're here.",
    ],
    sigRole: "From the team",
  },
};

function Welcome({ voice }) {
  const c = VOICE_COPY[voice] || VOICE_COPY.formal;
  return (
    <section className="welcome">
      <div>
        <div className="welcome__eyebrow">{c.eyebrow}</div>
        <h1 className="welcome__quote">
          <span className="drop">“</span>{c.quote}<span className="drop">”</span>
        </h1>
      </div>
      <div className="welcome__body">
        {c.body.map((p, i) => <p key={i}>{p}</p>)}
        <div className="welcome__sig">
          <img className="welcome__sig-mark" src={window.__resources.logo} alt="Kneuralabs" />
          <div className="welcome__sig-text">
            <span className="welcome__sig-name">Kneuralabs Management</span>
            <small>{c.sigRole}</small>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Tool tile + grid
   ──────────────────────────────────────────────────────────────── */
/* ── KN brand palette for per-tile/feed colouring ──────────── */
const KN_TILE_PALETTE = [
  { bg: 'rgba(28,92,170,0.10)',   border: 'rgba(28,92,170,0.28)',   shadow: '0 2px 18px rgba(13,46,90,0.10)',  accent: '#1C5CAA' },  // Royal Blue
  { bg: 'rgba(13,46,90,0.12)',    border: 'rgba(13,46,90,0.30)',    shadow: '0 2px 18px rgba(13,46,90,0.12)',  accent: '#0D2E5A' },  // Deep Navy
  { bg: 'rgba(200,40,30,0.07)',   border: 'rgba(200,40,30,0.25)',   shadow: '0 2px 18px rgba(200,40,30,0.08)', accent: '#C8281E' },  // Precision Red
  { bg: 'rgba(74,139,200,0.10)',  border: 'rgba(74,139,200,0.28)',  shadow: '0 2px 18px rgba(74,139,200,0.10)',accent: '#4A8BC8' },  // Sky Blue
  { bg: 'rgba(139,26,18,0.07)',   border: 'rgba(139,26,18,0.24)',   shadow: '0 2px 18px rgba(139,26,18,0.08)', accent: '#8B1A12' },  // Crimson Depth
  { bg: 'rgba(208,210,214,0.22)', border: 'rgba(107,114,128,0.28)', shadow: '0 2px 18px rgba(107,114,128,0.08)',accent:'#6B7280' }, // Structural Silver
  { bg: 'rgba(28,92,170,0.07)',   border: 'rgba(74,139,200,0.26)',  shadow: '0 2px 18px rgba(28,92,170,0.08)', accent: '#4A8BC8' },  // Sky tint
];

/* Weekly poster palette — cycles each ISO week */
const KN_POSTER_PALETTE = [
  { bg: 'rgba(13,46,90,0.78)',   border: 'rgba(74,139,200,0.32)',  orb1: 'rgba(28,92,170,0.80)',  orb2: 'rgba(200,40,30,0.32)'  },
  { bg: 'rgba(28,92,170,0.78)',  border: 'rgba(208,210,214,0.32)', orb1: 'rgba(74,139,200,0.80)', orb2: 'rgba(13,46,90,0.42)'   },
  { bg: 'rgba(139,26,18,0.78)',  border: 'rgba(200,40,30,0.38)',   orb1: 'rgba(200,40,30,0.80)',  orb2: 'rgba(13,46,90,0.42)'   },
  { bg: 'rgba(13,46,90,0.85)',   border: 'rgba(28,92,170,0.38)',   orb1: 'rgba(28,92,170,0.85)',  orb2: 'rgba(139,26,18,0.30)'  },
  { bg: 'rgba(74,139,200,0.72)', border: 'rgba(13,46,90,0.30)',    orb1: 'rgba(13,46,90,0.80)',   orb2: 'rgba(200,40,30,0.28)'  },
];

function Tile({ tool, idx, unlocked, onActivate }) {
  const pal = KN_TILE_PALETTE[idx % KN_TILE_PALETTE.length];
  return (
    <a
      className="tile"
      href={tool.href || "#"}
      target={tool.href ? "_blank" : undefined}
      rel="noopener"
      style={{
        animationDelay: `${Math.min(idx, 11) * 40}ms`,
        background: pal.bg,
        borderColor: pal.border,
        boxShadow: pal.shadow + ', inset 0 1px 0 rgba(255,255,255,0.65)',
      }}
    >
      <div className="tile__top">
        <span className="tile__idx">№ {String(idx + 1).padStart(2, "0")}</span>
        <span className="tile__icon" style={{
          background: (tool.accent || pal.accent) + "1F",
          borderColor: (tool.accent || pal.accent) + "59",
          boxShadow: "0 4px 14px " + (tool.accent || pal.accent) + "33, inset 0 1px 0 rgba(255,255,255,0.45)",
        }}>{tool.seal}</span>
      </div>
      <div className="tile__body">
        <div className="tile__cat">{tool.cat}</div>
        <div className="tile__name">
          {tool.name}{tool.tm && <sup>{tool.tm}</sup>}
        </div>
        <div className="tile__desc">{tool.desc}</div>
      </div>
    </a>
  );
}

function ToolsSection({ unlockedSet, allowedIds, onActivate }) {
  // allowedIds === null  -> all apps allowed (admin / legacy)
  // allowedIds === Set    -> only show apps explicitly granted to this user
  const tools = allowedIds ? window.TOOLS.filter(t => allowedIds.has(t.id)) : window.TOOLS;
  return (
    <section className="section" id="tools">
      <div className="section__head">
        <span className="section__num">№ I — Tools</span>
        <h2 className="section__title">Workspace</h2>
        <span className="section__meta">{tools.length + 1} apps</span>
      </div>
      {tools.length === 0 && (
        <div style={{
          border: "1px dashed var(--rule)", borderRadius: 12, padding: "26px 22px",
          fontFamily: "var(--f-mono)", fontSize: 12, letterSpacing: "0.04em",
          color: "var(--muted)", lineHeight: 1.7,
        }}>
          <b style={{ color: "var(--ink)" }}>No apps are assigned to this account yet.</b><br />
          Sign-in succeeded, but no applications have been granted to your employee ID.
          Ask your administrator to assign apps in the SSO admin console — they will
          appear here automatically on your next page load, on any device.
        </div>
      )}
      <div className="tools">
        {tools.map((t, i) => (
          <Tile
            key={t.id}
            tool={t}
            idx={i}
            unlocked={unlockedSet.has(t.id)}
            onActivate={onActivate}
          />
        ))}
        <SentinelCard idx={tools.length} />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Lock modal
   ──────────────────────────────────────────────────────────────── */
function LockModal({ tool, onClose, onSuccess }) {
  const [val, setVal] = useState("");
  const [state, setState] = useState("idle"); // idle | checking | error | ok
  const [tries, setTries] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (tool && inputRef.current) {
      // small delay so animation reads
      setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
    }
  }, [tool]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!tool) return null;

  const submit = () => {
    if (!val.trim()) return;
    setState("checking");
    setTimeout(() => {
      if (val.trim().toLowerCase() === tool.word) {
        setState("ok");
        setTimeout(() => onSuccess(tool), 480);
      } else {
        setState("error");
        setTries(t => t + 1);
        setTimeout(() => setState("idle"), 600);
      }
    }, 520);
  };

  return (
    <div className="lock-overlay" onClick={(e) => { if (e.target.classList.contains("lock-overlay")) onClose(); }}>
      <div className={"lock-modal" + (state === "error" ? " shake" : "")}>
        <div className="lock-modal__head">
          <div>
            <div className="lock-modal__num">№ {String(window.TOOLS.findIndex(t => t.id === tool.id) + 1).padStart(2, "0")} · Access required</div>
            <h3 className="lock-modal__title">{tool.name}<sup>{tool.tm}</sup></h3>
            <div className="lock-modal__cat">{tool.cat}</div>
          </div>
          <div className="lock-modal__num">🔒</div>
        </div>
        <div className="lock-modal__prompt">
          This tool is gated. Enter the access word distributed by Operations to continue.
        </div>
        <input
          ref={inputRef}
          className="lock-input"
          type="password"
          placeholder="access word"
          value={val}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          disabled={state === "checking" || state === "ok"}
        />
        <div className={
          "lock-status" +
          (state === "error" ? " lock-status--err" : "") +
          (state === "ok" ? " lock-status--ok" : "")
        }>
          {state === "idle" && <span>Press enter to unlock</span>}
          {state === "checking" && <><span className="spinner" /><span>Verifying credential…</span></>}
          {state === "error" && <span>✗ Incorrect — try again</span>}
          {state === "ok" && <span>✓ Access granted — opening</span>}
        </div>
        <div className="lock-actions">
          <span className="lock-hint">
            {tries >= 2 ? <>Hint: <b>{tool.word}</b></> : <>&nbsp;</>}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={submit} disabled={state === "checking"}>Open</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Daily Brief — rotates every day
   ──────────────────────────────────────────────────────────────── */
const WEEKLY_BRIEFS = [
  "The audit is the artefact.",
  "Governance without teeth is theatre.",
  "Explainability is not optional.",
  "Trust is infrastructure.",
  "Alignment begins before deployment.",
  "The model is only as honest as its training.",
  "Accountability demands a paper trail.",
  "Safety and capability are not opposites.",
  "Who owns the output owns the risk.",
  "Red-teaming is a form of respect.",
  "Transparency is a feature, not a bug.",
  "Every dataset encodes a worldview.",
  "The edge case is where ethics live.",
  "Humans in the loop, not just on the form.",
  "Regulation lags, but it arrives.",
  "Consent is the foundation of trust.",
  "A model that cannot say no is dangerous.",
  "The benchmark is not the goal.",
  "Bias audits are not a one-time event.",
  "Power without oversight is liability.",
  "The question before the answer.",
  "Interpretability is an act of humility.",
  "Incident response is a governance muscle.",
  "Ethics cannot be bolted on afterwards.",
  "The supply chain includes the model card.",
  "Fairness is context-dependent.",
  "Autonomy requires reversibility.",
  "Documentation is the first line of defence.",
  "High stakes demand higher scrutiny.",
  "The future of AI is a policy decision.",
  "Uncertainty should be communicated, not hidden.",
  "Harm reduction is not risk elimination.",
  "Provenance matters as much as performance.",
  "The users are the stakeholders.",
  "An unmonitored system drifts.",
  "Consent forms are not consent.",
  "Robustness is tested at the margins.",
  "Feedback loops require feedback channels.",
  "Governance is a living document.",
  "The model learns what you reward.",
  "Privacy by design, not by disclaimer.",
  "Impact assessments prevent impact.",
  "The right to explanation is a right.",
  "Oversight scales with stakes.",
  "Deployment is not the finish line.",
  "Every heuristic has a blind spot.",
  "Shared vocabulary precedes shared standards.",
  "The algorithm reflects its authors.",
  "Accountability without authority is hollow.",
  "Iteration without evaluation is drift.",
  "Efficiency must not outrun accountability.",
  "The hardest safety problem is overconfidence.",
];

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getDailyBrief() {
  const now = new Date();
  // Whole-day count since the 2025-01-01 epoch (UTC), so the read advances
  // to a fresh quote every day and never repeats within a cycle.
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const epoch = Date.UTC(2025, 0, 1);
  const dayNum = Math.floor((today - epoch) / 86400000) + 1;
  const idx = ((dayNum - 1) % WEEKLY_BRIEFS.length + WEEKLY_BRIEFS.length) % WEEKLY_BRIEFS.length;
  return {
    quote: WEEKLY_BRIEFS[idx],
    num: String(dayNum).padStart(3, "0"),
  };
}

/* ────────────────────────────────────────────────────────────────
   News feed — live governance brief (daily, client-side RSS)
   ──────────────────────────────────────────────────────────────── */
const _BRIEF_MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function _briefDate(d) {
  return String(d.getDate()).padStart(2, "0") + " " + _BRIEF_MON[d.getMonth()] + " " + d.getFullYear();
}
function _briefChip(title) {
  const s = String(title).toLowerCase();
  if (/regulat|\bact\b|\blaw\b|\bbill\b|legislat/.test(s)) return "Regulation";
  if (/framework|standard|\bnist\b|\biso\b|guideline/.test(s)) return "Framework";
  if (/fine|enforce|penalt|lawsuit|\bban\b/.test(s)) return "Enforcement";
  if (/\beu\b|brussels|white house|federal|government|ministry|meity|oecd/.test(s)) return "Policy";
  return "Industry";
}
// AI-governance / policy headlines, freshest first.
const BRIEF_FEED = "https://news.google.com/rss/search?q=%22AI%20governance%22%20OR%20%22AI%20regulation%22%20OR%20%22AI%20policy%22&hl=en-US&gl=US&ceid=US:en";
// CORS proxies tried in order (Google News RSS sends no CORS headers).
const BRIEF_SOURCES = [
  "https://api.allorigins.win/raw?url=" + encodeURIComponent(BRIEF_FEED),
  "https://corsproxy.io/?url=" + encodeURIComponent(BRIEF_FEED),
];
async function fetchGovernanceNews() {
  let lastErr;
  for (const url of BRIEF_SOURCES) {
    try {
      const res = await fetch(url, { mode: "cors", cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status + " · " + url);
      const xml = await res.text();
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      if (doc.querySelector("parsererror")) throw new Error("bad XML · " + url);
      const out = [];
      doc.querySelectorAll("item").forEach((it) => {
        if (out.length >= 6) return;
        const link = (it.querySelector("link")?.textContent || "").trim();
        let title = (it.querySelector("title")?.textContent || "").trim();
        if (!title || !link) return;
        const src = (it.querySelector("source")?.textContent || "").trim();
        // Google News titles read "Headline - Publisher"; trim the publisher.
        if (src && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3)).trim();
        const pub = it.querySelector("pubDate")?.textContent;
        const d = pub ? new Date(pub) : new Date();
        out.push({
          date: _briefDate(isNaN(d) ? new Date() : d),
          chip: _briefChip(title),
          title,
          src: src || "Newswire",
          tag: "Google News",
          url: link,
        });
      });
      if (!out.length) throw new Error("no items · " + url);
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("no source reachable");
}
window.fetchGovernanceNews = fetchGovernanceNews;

// Loads the Brief: committed authentic feed (refreshed daily by CI) first,
// then live client-side RSS as a fallback. Both sources are real news.
async function fetchBriefData() {
  try {
    const cb = new Date().toISOString().slice(0, 10);
    const r = await fetch("assets/news.json?d=" + cb, { cache: "no-store" });
    if (r.ok) {
      const items = await r.json();
      if (Array.isArray(items) && items.length) return items.slice(0, 6);
    }
  } catch (e) {
    console.warn("[Brief] news.json unavailable, trying live RSS:", e);
  }
  return await fetchGovernanceNews();
}
window.fetchBriefData = fetchBriefData;

function FeedSection() {
  const brief = getDailyBrief();
  const week = getISOWeek(new Date());
  const posterPal = KN_POSTER_PALETTE[week % KN_POSTER_PALETTE.length];
  const [feed, setFeed] = useState(() => ({ items: window.NEWS || [], status: "loading" }));
  useEffect(() => {
    let alive = true;
    fetchBriefData()
      .then((items) => {
        if (!alive) return;
        if (items && items.length) setFeed({ items, status: "live" });
        else setFeed((f) => ({ items: f.items, status: "cached" }));
      })
      .catch((e) => {
        console.error("[Brief] live feed unavailable:", e);
        if (alive) setFeed((f) => ({ items: f.items, status: "cached" }));
      });
    return () => { alive = false; };
  }, []);
  const meta =
    feed.status === "live"    ? "Live · refreshed daily · IST"
    : feed.status === "loading" ? "Syncing · IST"
    :                             "Cached · IST";
  return (
    <section className="section" id="feed">
      <div className="section__head">
        <span className="section__num">№ II — Daily</span>
        <h2 className="section__title">Governance <em>Brief</em></h2>
        <span className="section__meta">{meta}</span>
      </div>
      <div className="feed">
        <div className="feed__list">
          {feed.items.length === 0 && (
            <div className="feed__item" style={{ opacity: 0.75 }}>
              <div className="feed__date">—</div>
              <div>
                <h3 className="feed__title">
                  {feed.status === "loading"
                    ? "Loading the latest governance headlines…"
                    : "Live brief syncing — authentic headlines will appear shortly."}
                </h3>
              </div>
            </div>
          )}
          {feed.items.map((n, i) => {
            const fp = KN_TILE_PALETTE[i % KN_TILE_PALETTE.length];
            return (
              <a key={i} className="feed__item" href={n.url} target="_blank" rel="noopener noreferrer"
                 style={{ background: fp.bg, borderTopColor: fp.border }}>
                <div className="feed__date">
                  {n.date}
                  {i === 0 && <span style={{display:"block",width:"100%",boxSizing:"border-box",fontSize:"9px",fontWeight:700,letterSpacing:"0.14em",padding:"2px 6px",marginTop:5,background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.30)",animation:"just-in-pulse 2s ease-in-out infinite",textAlign:"center",textTransform:"uppercase",fontFamily:"var(--f-mono)"}}>Just In</span>}
                </div>
                <div>
                  <h3 className="feed__title">{n.title}</h3>
                  <div className="feed__src" style={{ color: fp.accent }}>{n.src} · <b style={{ color: fp.accent }}>{n.tag}</b></div>
                </div>
                <span className="feed__chip" style={{ borderColor: fp.border, color: fp.accent, background: fp.bg }}>
                  {n.chip} <span className="feed__arrow" aria-hidden="true">↗</span>
                </span>
              </a>
            );
          })}
        </div>
        <aside className="aside">
          <div className="aside__poster" style={{
            background: posterPal.bg,
            borderColor: posterPal.border,
          }}>
            {/* orb 1 — top right */}
            <div style={{
              position:'absolute', inset:'-20% -10% auto auto',
              width:'60%', aspectRatio:'1',
              background: `radial-gradient(circle, ${posterPal.orb1} 0%, rgba(74,139,200,0.3) 60%, transparent 100%)`,
              borderRadius:'50%', opacity:0.75, filter:'blur(2px)', pointerEvents:'none',
            }} />
            {/* orb 2 — bottom left */}
            <div style={{
              position:'absolute', bottom:'-15%', left:'-10%',
              width:'50%', aspectRatio:'1',
              background: `radial-gradient(circle, ${posterPal.orb2} 0%, transparent 70%)`,
              borderRadius:'50%', filter:'blur(3px)', pointerEvents:'none',
            }} />
            <span className="smallcaps" style={{ position:'relative' }}>Daily Read</span>
            <h3 style={{ position:'relative' }}>{brief.quote}</h3>
            <div className="poster-stamp" style={{ position:'relative' }}>Brief № {brief.num}</div>
          </div>
          <LinkedInCard />
        </aside>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   LinkedIn widget — company page follower count
   Reads the committed snapshot (assets/linkedin.json, refreshed
   daily by CI) first, then falls back to fetching the public page
   through the same CORS proxies the Brief uses.
   ──────────────────────────────────────────────────────────────── */
const LINKEDIN_PAGE_URL = "https://www.linkedin.com/company/kneuralabs/";
const LINKEDIN_COMPANY_ID = "112376100";
// Built for anonymous embedding — far less likely to be authwalled than the page.
const LINKEDIN_FOLLOW_BTN_URL =
  "https://www.linkedin.com/pages-extensions/FollowCompany?id=" + LINKEDIN_COMPANY_ID + "&counter=bottom";

async function fetchLinkedInFollowers() {
  // 1 · Committed snapshot, refreshed daily by CI (same pattern as news.json)
  try {
    const cb = new Date().toISOString().slice(0, 10);
    const r = await fetch("assets/linkedin.json?d=" + cb, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      if (data && typeof data.followers === "number") return data.followers;
    }
  } catch (e) {
    console.warn("[LinkedIn] linkedin.json unavailable, trying live page:", e);
  }
  // 2 · Live sources via CORS proxies (follow-button endpoint first — it is
  //     meant for anonymous embedding, unlike the authwalled company page)
  const targets = [LINKEDIN_FOLLOW_BTN_URL, LINKEDIN_PAGE_URL];
  const proxies = [];
  for (const t of targets) {
    proxies.push("https://api.allorigins.win/raw?url=" + encodeURIComponent(t));
    proxies.push("https://corsproxy.io/?url=" + encodeURIComponent(t));
  }
  for (const url of proxies) {
    try {
      const res = await fetch(url, { mode: "cors", cache: "no-store" });
      if (!res.ok) continue;
      const html = await res.text();
      const m = /([\d][\d,.]*)\s+followers/i.exec(html) ||
                /follower[^>]*>\s*([\d][\d,.]*)\s*</i.exec(html);
      if (m) return parseInt(m[1].replace(/\D/g, ""), 10);
    } catch (e) { /* try next proxy */ }
  }
  return null;
}
window.fetchLinkedInFollowers = fetchLinkedInFollowers;

function LinkedInCard() {
  const [followers, setFollowers] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchLinkedInFollowers().then(n => { if (alive) setFollowers(n); });
    return () => { alive = false; };
  }, []);
  return (
    <div className="li-card">
      <div className="li-card__lbl">
        <span>Company Page</span>
        <span>LinkedIn</span>
      </div>
      <div className="li-card__row">
        <a className="li-card__logo" href={LINKEDIN_PAGE_URL} target="_blank" rel="noopener noreferrer"
           aria-label="Open the Kneuralabs LinkedIn page" title="Open Kneuralabs on LinkedIn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452H17.05v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.667V9h3.238v1.561h.046c.45-.855 1.549-1.756 3.188-1.756 3.41 0 4.039 2.244 4.039 5.162v6.485zM5.337 7.433a1.875 1.875 0 1 1 0-3.75 1.875 1.875 0 0 1 0 3.75zM6.957 20.452H3.717V9h3.24v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <div>
          <div className="li-card__count">{followers == null ? "—" : followers.toLocaleString("en-US")}</div>
          <div className="li-card__sub">Total followers</div>
        </div>
      </div>
    </div>
  );
}

function SentinelCard({ idx = 0 }) {
  const accent = '#D97706';
  return (
    <a
      className="tile"
      href="https://sentinel.kneuralabs.com"
      target="_blank"
      rel="noopener"
      aria-label="Open Sentinel"
      title="Open Sentinel"
      style={{
        animationDelay: `${Math.min(idx, 11) * 40}ms`,
        background: 'rgba(217,119,6,0.07)',
        borderColor: 'rgba(217,119,6,0.25)',
        boxShadow: '0 2px 18px rgba(217,119,6,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
      }}
    >
      <div className="tile__top">
        <span className="tile__idx">№ {String(idx + 1).padStart(2, "0")}</span>
        <span className="tile__icon" style={{
          background: accent + "1F",
          borderColor: accent + "59",
          boxShadow: "0 4px 14px " + accent + "33, inset 0 1px 0 rgba(255,255,255,0.45)",
          color: accent,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
      </div>
      <div className="tile__body">
        <div className="tile__cat">Security Platform</div>
        <div className="tile__name">Sentinel</div>
        <div className="tile__desc">Monitor &amp; protect</div>
      </div>
    </a>
  );
}

/* ────────────────────────────────────────────────────────────────
   Footer colophon
   ──────────────────────────────────────────────────────────────── */
function Colophon() {
  return (
    <footer className="colophon rule-thin">
      <div className="colophon__col">
        <div><b>Kneuralabs LLC</b></div>
        <div>Kolkata · Connecticut</div>
        <div>Trust & Security Practice</div>
      </div>
      <div className="colophon__mark">
        <img src={window.__resources.logo} alt="Kneuralabs" />
      </div>
      <div className="colophon__col colophon__right">
        <div><b>Internal use only</b></div>
        <div>Unlocked tiles open externally</div>
        <div>Locked tiles require an access word</div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────────────────────
   Open Tasks block — high-contrast attention magnet
   ──────────────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────────
   KneuraCOMM live queue — reads live state from Supabase.
   KneuraCOMM now persists its working state to the `comm_state`
   table (row id='main', jsonb `data`). We read it with the public
   anon key and map open tasks to the queue shape. Falls back to the
   bundled snapshot if the network/read fails.
   ──────────────────────────────────────────────────────────────── */
const COMM_BASE = "https://comm.kneuralabs.com/";

// Public anon (publishable) key — same project the dashboard already
// uses for app access. RLS exposes comm_state for SELECT to anon.
const COMM_SB_URL = "https://brysartqcjylgqwmnjkk.supabase.co";
const COMM_SB_KEY = "sb_publishable_C5e5ViwIlW9dV14ZLi4O0A_ipIXhTB5";

function _kqPrio(p) {
  const s = String(p == null ? "" : p).toLowerCase().trim();
  if (/\b(high|urgent|critical|p1)\b/.test(s) || s === "1" || s === "h") return "high";
  if (/\b(low|minor|p3)\b/.test(s) || s === "3" || s === "l") return "low";
  return "med";
}

const _KQ_DONE = /^(done|complete|completed|closed|resolved|cancel+ed|archived|won't ?do|wontdo)$/i;
const _KQ_MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function _kqDue(s) {
  s = String(s == null ? "" : s).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return parseInt(m[3], 10) + " " + _KQ_MON[parseInt(m[2], 10) - 1];
  return s;
}

// Map the KneuraCOMM state blob -> open-queue task shape.
function _kqMapState(state) {
  const tasks = Array.isArray(state && state.tasks) ? state.tasks : [];
  const projList = Array.isArray(state && state.projects) ? state.projects : [];
  const proj = {};
  for (const p of projList) if (p && p.id) proj[p.id] = p.name || "";
  const out = [];
  for (const t of tasks) {
    if (!t) continue;
    const title = String(t.title == null ? "" : t.title).trim();
    if (!title) continue;
    const status = String(t.status == null ? "" : t.status).trim();
    if (status && _KQ_DONE.test(status)) continue; // open queue only
    let pv = String(t.project == null ? "" : t.project).trim();
    if (proj[pv]) pv = proj[pv];
    else if (/^[a-z0-9]{6,12}$/.test(pv)) pv = ""; // opaque id, unresolved
    out.push({
      title,
      role: String(t.role == null ? "" : t.role).trim() || "Team",
      project: pv || "KneuraCOMM",
      priority: _kqPrio(t.priority),
      due: _kqDue(t.due),
    });
  }
  return out;
}

async function fetchCommTasks() {
  const res = await fetch(
    COMM_SB_URL + "/rest/v1/comm_state?id=eq.main&select=data",
    {
      headers: { apikey: COMM_SB_KEY, Authorization: "Bearer " + COMM_SB_KEY },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("HTTP " + res.status);
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows.length || !rows[0].data) {
    throw new Error("no comm_state main row");
  }
  return _kqMapState(rows[0].data);
}
window.fetchCommTasks = fetchCommTasks;

function OpenTasks({ onOpenCommand }) {
  const prioOrder = { high: 0, med: 1, low: 2 };
  const [data, setData] = React.useState(() => ({
    tasks: window.OPEN_TASKS || [],
    status: "loading",
    err: "",
  }));
  React.useEffect(() => {
    let alive = true;
    fetchCommTasks()
      .then(rows => {
        if (!alive) return;
        setData({ tasks: rows || [], status: "live", err: "" });
      })
      .catch(e => {
        const msg = String((e && e.message) || e || "fetch failed");
        console.error("[KneuraCOMM] live queue unavailable:", e);
        if (alive) setData(d => ({ tasks: d.tasks, status: "cached", err: msg }));
      });
    return () => { alive = false; };
  }, []);
  const tasks = [...data.tasks].sort(
    (a, b) =>
      (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1) ||
      String(a.due).localeCompare(String(b.due))
  );
  const high = tasks.filter(t => t.priority === "high").length;
  const med  = tasks.filter(t => t.priority === "med").length;
  const low  = tasks.filter(t => t.priority === "low").length;
  const eyebrow =
    data.status === "live"    ? "Live · KneuraCOMM™ · Open queue"
    : data.status === "loading" ? "Syncing · KneuraCOMM™ · Open queue"
    :                             "Cached · KneuraCOMM™ · Open queue";
  return (
    <section className="opentasks">
      <div className="opentasks__head">
        <div className="opentasks__eyebrow"
             title={data.status === "cached" && data.err
               ? "Live source unreachable: " + data.err : undefined}>
          <span className="pulse-dot" />
          {eyebrow}
        </div>
        <a className="opentasks__open" href={COMM_BASE} target="_blank" rel="noopener"
           onClick={(e) => { e.preventDefault(); onOpenCommand && onOpenCommand(); }}>
          Open Command Center →
        </a>
      </div>
      <div className="opentasks__title-row">
        <h2 className="opentasks__title">
          You have <em>{tasks.length}</em> open task{tasks.length === 1 ? "" : "s"}
        </h2>
        <div className="opentasks__counts">
          <span><i className="prio prio--high" /> {high} High</span>
          <span><i className="prio prio--med" /> {med} Medium</span>
          <span><i className="prio prio--low" /> {low} Low</span>
        </div>
      </div>
      <ol className="opentasks__list">
        {tasks.map((t, i) => (
          <li className="opentasks__row" key={i}>
            <span className="opentasks__idx">{String(i + 1).padStart(2, "0")}</span>
            <i className={"prio prio--" + t.priority} title={t.priority} />
            <span className="opentasks__name">{t.title}</span>
            <span className="opentasks__meta">
              <span className="chip">@{t.role}</span>
              <span className="chip">#{t.project}</span>
            </span>
            <span className="opentasks__due">{t.due}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}


/* ────────────────────────────────────────────────────────────────
   Theme toggle — light / dark switch
   ──────────────────────────────────────────────────────────────── */
function ThemeToggle({ theme, onChange }) {
  const isDark = theme === "authority" || theme === "navy";
  const next = isDark ? "brand" : "authority";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onChange(next)}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <svg className="theme-toggle__icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.2"></circle>
          <path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"></path>
        </svg>
      ) : (
        <svg className="theme-toggle__icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z"></path>
        </svg>
      )}
      <span className="theme-toggle__lbl">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

/* expose */
window.ThemeToggle = ThemeToggle;
