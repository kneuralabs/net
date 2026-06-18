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
      <ClockCell city="Connecticut" code="EDT · New York" tz="America/New_York"
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

/* ════════════════════════════════════════════════════════════════
   DAILY READ — a single definition of AI governance, IT modernization,
   Governance-as-a-Service or an IT standard, refreshed every day.

   Deterministic by UTC date: it needs no network and has no failure
   mode, so the line is always present and always current. It advances
   on its own at midnight UTC and never repeats within a cycle.
   ════════════════════════════════════════════════════════════════ */
const KN_DEFINITIONS = [
  "AI governance: the practice of keeping every model accountable for the decisions it shapes.",
  "AI governance turns ethical intent into controls you can test and evidence you can show.",
  "AI governance is risk management for systems whose behaviour changes as they learn.",
  "AI governance means no automated decision is ever beyond human explanation or recall.",
  "AI governance is the line between deploying a model and owning its outcomes.",
  "AI governance makes 'trustworthy AI' a measurable claim, not a slogan.",
  "Govern the model before it scales, or inherit every risk it learns.",
  "An AI you cannot explain is an AI you cannot defend — or deploy.",
  "IT modernization: trading legacy constraints for the freedom to change quickly and safely.",
  "IT modernization turns systems that resist change into systems that expect it.",
  "IT modernization repays technical debt so tomorrow's budget funds outcomes, not upkeep.",
  "Modernization is migration with intent — measured in capability gained, not hardware replaced.",
  "Modern IT treats security, compliance and observability as defaults, never as add-ons.",
  "A modern platform assumes change; a legacy platform postpones it until it breaks.",
  "Modernization is reversibility: any change you ship, you can safely roll back.",
  "Good modernization is invisible to users and unmistakable in the metrics.",
  "Governance as a Service: policy, controls and audit evidence delivered together, ready to use.",
  "Governance as a Service turns 'we should comply' into 'we already do, continuously'.",
  "Governance as a Service is oversight you subscribe to — provisioned, maintained and always current.",
  "Governance as a Service gives you the framework and the proof; you keep the judgement.",
  "Governance as a Service makes compliance a capability you consume, not a project you restart.",
  "Governance as a Service is the assurance layer that scales with your systems, not your headcount.",
  "An IT standard is consensus made executable — a rule precise enough to verify.",
  "A standard earns its authority by being checkable, not by being mandated.",
  "IT standards turn a private promise into a guarantee everyone can audit.",
  "Interoperability is simply a standard that everyone keeps at the same time.",
  "A standard you cannot verify is documentation; a standard you can test is infrastructure.",
  "Standards are the shared grammar that lets independent systems trust one another.",
  "ISO 42001 and the NIST AI RMF exist to make 'responsible' something you can audit.",
  "A standard is written so the next engineer never has to guess what 'done' means.",
  "Governance without evidence is only a confident guess.",
  "A control that is never tested is not a control — it is a hope.",
  "What you cannot measure, you can neither govern nor modernize.",
  "Explainability is a property you design in from the start, not bolt on at the end.",
  "The audit trail is the artefact: if it was not recorded, it did not happen.",
  "Governance scales only when your controls become code.",
  "Compliance is the floor; governance is the discipline that keeps you above it.",
  "Trust is the real deliverable; governance is how you produce it on purpose.",
  "Modernize for change, govern for trust, standardize for scale.",
];

// ISO week number — drives the weekly poster-palette rotation in FeedSection.
function knISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Today's definition, taken from the whole-day count since the Unix epoch (UTC).
// No network, no storage, no failure path — it always returns a current line.
function knDailyDefinition() {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayNo = Math.floor(today / 86400000);
  const len = KN_DEFINITIONS.length;
  const idx = ((dayNo % len) + len) % len;
  return { quote: KN_DEFINITIONS[idx], num: String((dayNo % 999) + 1).padStart(3, "0") };
}

/* ════════════════════════════════════════════════════════════════
   GOVERNANCE BRIEF — a live, worldwide newsfeed rebuilt in every
   visitor's browser on each load. Covers AI governance & regulation,
   IT modernization, IT standards and notable AI tool / model releases.

   "Always live": several independent CORS relays are raced in parallel
   (first usable response wins, each hard-timeout-bounded so none can
   hang), and every successful result is persisted to localStorage — so
   the widget always shows real fetched data, refreshed whenever the
   network allows and otherwise restored from the last live result.
   ════════════════════════════════════════════════════════════════ */

// Persist the last successful live payload so the UI always reflects real
// fetched data, self-healing across reloads even if one load's fetch fails.
function knCacheGet(key) {
  try { const o = JSON.parse(localStorage.getItem(key) || "null"); return o && "v" in o ? o.v : null; }
  catch (e) { return null; }
}
function knCacheSet(key, v) {
  try { localStorage.setItem(key, JSON.stringify({ v, t: Date.now() })); } catch (e) { /* private mode / quota */ }
}

// Independent CORS relays on distinct hosts, raced together so the feed
// converges on whichever is healthy right now.
const KN_RELAY_TIMEOUT = 7000;
const KN_RELAYS = [
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
  (u) => "https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent(u),
];
// Cross-origin GET with a hard deadline — a stalled relay aborts instead of
// hanging the page, so a failed attempt simply loses the race.
async function knGet(url, timeoutMs = KN_RELAY_TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const body = await res.text();
    if (!body || body.length < 16) throw new Error("empty body");
    return body;
  } finally { clearTimeout(timer); }
}

const KN_MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function knFmtDate(d) {
  return String(d.getUTCDate()).padStart(2, "0") + " " + KN_MON[d.getUTCMonth()] + " " + d.getUTCFullYear();
}
function knChip(title) {
  const s = String(title).toLowerCase();
  if (/regulat|\bact\b|\blaw\b|\bbill\b|legislat/.test(s)) return "Regulation";
  if (/iso 42001|\bnist\b|\biso\b|standard|framework|guideline|certif/.test(s)) return "Standards";
  if (/moderni[sz]|legacy|migrat|digital transformation|cloud|overhaul|upgrade/.test(s)) return "Modernization";
  if (/launch|releas|unveil|rolls out|introduc|debut|new model|new tool|update/.test(s)) return "Release";
  if (/fine|enforce|penalt|lawsuit|\bban\b/.test(s)) return "Enforcement";
  if (/\beu\b|brussels|white house|federal|government|ministry|meity|oecd|\bun\b/.test(s)) return "Policy";
  return "Industry";
}
// Worldwide topic queries → Google News RSS (real, dated publisher articles).
const KN_NEWS_QUERIES = [
  '("AI governance" OR "AI regulation" OR "AI Act" OR "AI policy" OR "responsible AI") when:14d',
  '("IT modernization" OR "digital transformation" OR "ISO 42001" OR "NIST AI" OR "AI standard" OR "AI compliance") when:21d',
  '("new AI model" OR "AI model release" OR "AI tool launch" OR "launches AI" OR "enterprise AI") when:10d',
];
function knNewsRssUrl(q) {
  return "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=en-US&gl=US&ceid=US:en";
}
// Google News titles read "Headline - Publisher"; split off the publisher.
function knSplit(title, src) {
  let t = String(title || "").trim();
  let s = String(src || "").trim();
  if (s && t.endsWith(" - " + s)) { t = t.slice(0, -(s.length + 3)).trim(); }
  else if (!s) {
    const i = t.lastIndexOf(" - ");
    if (i > 0 && t.length - i - 3 <= 42) { s = t.slice(i + 3).trim(); t = t.slice(0, i).trim(); }
  }
  return { title: t, src: s || "Newswire" };
}
function knItem(title, src, link, pub) {
  const d = pub ? new Date(pub) : new Date();
  const ok = !isNaN(d);
  return { _t: ok ? d.getTime() : Date.now(), date: knFmtDate(ok ? d : new Date()),
           chip: knChip(title), title, src, tag: "Google News", url: link };
}
function knParseRssXml(xml) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return [];
  const out = [];
  doc.querySelectorAll("item").forEach((it) => {
    const link = (it.querySelector("link")?.textContent || "").trim();
    const rawTitle = (it.querySelector("title")?.textContent || "").trim();
    if (!rawTitle || !link) return;
    const { title, src } = knSplit(rawTitle, it.querySelector("source")?.textContent || "");
    out.push(knItem(title, src, link, it.querySelector("pubDate")?.textContent));
  });
  return out;
}
function knParseRssJson(text) {
  let data; try { data = JSON.parse(text); } catch (e) { return []; }
  if (!data || data.status !== "ok" || !Array.isArray(data.items)) return [];
  const out = [];
  data.items.forEach((it) => {
    const link = (it.link || "").trim();
    if (!it.title || !link) return;
    const { title, src } = knSplit(it.title, "");
    out.push(knItem(title, src, link, it.pubDate));
  });
  return out;
}
// One query, every relay raced at once (rss2json's parsed JSON + the raw-XML
// relays); the first to return usable items wins, the rest are discarded.
async function knFetchQuery(q) {
  const rss = knNewsRssUrl(q);
  const attempts = [
    (async () => {
      const items = knParseRssJson(await knGet("https://api.rss2json.com/v1/api.json?count=20&rss_url=" + encodeURIComponent(rss)));
      if (!items.length) throw new Error("no items");
      return items;
    })(),
    ...KN_RELAYS.map((wrap) => (async () => {
      const items = knParseRssXml(await knGet(wrap(rss)));
      if (!items.length) throw new Error("no items");
      return items;
    })()),
  ];
  return await Promise.any(attempts).catch(() => []);
}
// Live worldwide brief: all topics in parallel, merged newest-first, deduped.
async function knFetchNews() {
  const batches = await Promise.all(KN_NEWS_QUERIES.map(knFetchQuery));
  const seen = new Set();
  const merged = [];
  for (const it of batches.flat()) {
    const key = it.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(it);
  }
  merged.sort((a, b) => b._t - a._t);
  return merged.slice(0, 6).map(({ _t, ...rest }) => rest);
}
// Committed snapshot shipped with the site — used only for the very first paint
// and as the final offline fallback.
async function knLoadNewsSeed() {
  try {
    const r = await fetch("assets/news.json?d=" + Date.now(), { cache: "no-store" });
    if (r.ok) { const items = await r.json(); if (Array.isArray(items) && items.length) return items.slice(0, 6); }
  } catch (e) { /* none */ }
  return [];
}

// ── First-party CI-refreshed feed data ──────────────────────────────────────
// A scheduled GitHub Action regenerates the feeds server-side and publishes
// them to the UNPROTECTED `feeds-data` branch. GitHub's raw endpoint serves it
// with Access-Control-Allow-Origin: *, so the browser reads it cross-origin with
// NO third-party proxy — the reliable live source. The public relays above are
// only a best-effort "even fresher" layer; assets/*.json the offline fallback.
const FEEDS_DATA_BASE = "https://raw.githubusercontent.com/kneuralabs/net/feeds-data/";
async function _feedsDataJson(path) {
  const r = await fetch(FEEDS_DATA_BASE + path + "?d=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("feeds-data " + path + " HTTP " + r.status);
  return await r.json();
}
// Source priority, most-reliable first: CI feeds-data → best-effort live relays
// → last-known-good (localStorage) → committed seed. Every successful real
// fetch is persisted, so once real news has loaded it survives later refreshes
// even if that load's network fails — it never falls back to the stale seed.
async function fetchBriefData() {
  try {
    const ci = await _feedsDataJson("assets/news.json");
    if (Array.isArray(ci) && ci.length) { const v = ci.slice(0, 6); knCacheSet("kn.news.v1", v); return v; }
  } catch (e) { /* branch not published yet / offline — fall through */ }
  try {
    const live = await knFetchNews();
    if (live && live.length) { knCacheSet("kn.news.v1", live); return live; }
  } catch (e) { /* relays down — fall through */ }
  const cached = knCacheGet("kn.news.v1");
  if (Array.isArray(cached) && cached.length) return cached;
  return await knLoadNewsSeed();
}

// Live Governance Brief list: instant paint from last-known-good (or seed),
// then re-fetched on every open via fetchBriefData() (feeds-data → relays →
// cache → seed).
function GovernanceBrief() {
  const cached = knCacheGet("kn.news.v1");
  const [items, setItems] = useState(() => (Array.isArray(cached) && cached.length ? cached : []));
  useEffect(() => {
    let alive = true;
    if (!(Array.isArray(cached) && cached.length)) {
      knLoadNewsSeed().then((seed) => {
        if (alive && Array.isArray(seed) && seed.length) setItems((cur) => (cur.length ? cur : seed));
      });
    }
    fetchBriefData().then((live) => {
      if (alive && Array.isArray(live) && live.length) setItems(live);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!items.length) {
    return (
      <div className="feed__list">
        <div className="feed__item" style={{ gridTemplateColumns: "1fr" }}>
          <div className="feed__title" style={{ color: "var(--muted)" }}>Gathering the latest worldwide brief…</div>
        </div>
      </div>
    );
  }
  return (
    <div className="feed__list">
      {items.map((it, i) => (
        <a className="feed__item" key={(it.url || it.title) + i}
           href={it.url || "#"} target="_blank" rel="noopener noreferrer">
          <span className="feed__date">{it.date}</span>
          <span>
            <span className="feed__title">{it.title}<span className="feed__arrow">↗</span></span>
            <span className="feed__src"><b>{it.src}</b> · {it.tag || "Newswire"}</span>
          </span>
          <span className="feed__chip">{it.chip}</span>
        </a>
      ))}
    </div>
  );
}

function FeedSection() {
  const read = knDailyDefinition();
  const week = knISOWeek(new Date());
  const posterPal = KN_POSTER_PALETTE[week % KN_POSTER_PALETTE.length];
  return (
    <section className="section" id="feed">
      <div className="section__head">
        <span className="section__num">№ II — Brief</span>
        <h2 className="section__title">Governance <em>Brief</em></h2>
        <span className="section__meta">Live · worldwide</span>
      </div>
      <div className="feed">
        <GovernanceBrief />
        <aside className="aside">
        <div className="aside__poster" style={{
          background: `linear-gradient(150deg, rgba(8,20,42,0.60), rgba(8,20,42,0.82)), ${posterPal.bg}`,
          borderColor: posterPal.border,
        }}>
          {/* orb 1 — top right */}
          <div style={{
            position:'absolute', inset:'-20% -10% auto auto',
            width:'60%', aspectRatio:'1',
            background: `radial-gradient(circle, ${posterPal.orb1} 0%, rgba(74,139,200,0.3) 60%, transparent 100%)`,
            borderRadius:'50%', opacity:0.55, filter:'blur(2px)', pointerEvents:'none',
          }} />
          {/* orb 2 — bottom left */}
          <div style={{
            position:'absolute', bottom:'-15%', left:'-10%',
            width:'50%', aspectRatio:'1',
            background: `radial-gradient(circle, ${posterPal.orb2} 0%, transparent 70%)`,
            borderRadius:'50%', opacity:0.55, filter:'blur(3px)', pointerEvents:'none',
          }} />
          <span className="smallcaps" style={{ position:'relative' }}>Daily Read</span>
          <h3 style={{ position:'relative', fontSize:'clamp(22px, 2.3vw, 31px)', lineHeight:1.18, textShadow:'0 1px 12px rgba(0,0,0,0.50)' }}>{read.quote}</h3>
          <div className="poster-stamp" style={{ position:'relative' }}>Read № {read.num}</div>
        </div>
        <LinkedInCard />
        </aside>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   LINKEDIN FOLLOWERS — the Kneuralabs company-page follower count,
   read live from the public page in the visitor's browser each load.

   Same "always live" approach as the Brief: independent CORS relays are
   raced over the anonymous follow-button embed (then the page), and any
   count obtained is persisted to localStorage — so the widget keeps
   showing the real last-known count even when a fetch is blocked.
   ════════════════════════════════════════════════════════════════ */
const KN_LI_PAGE = "https://www.linkedin.com/company/kneuralabs/";
const KN_LI_ID = "112376100";
// The follow-button embed is built for anonymous use — least likely to authwall.
const KN_LI_EMBED = "https://www.linkedin.com/pages-extensions/FollowCompany?id=" + KN_LI_ID + "&counter=bottom";
function knParseFollowers(html) {
  const m = /([\d][\d,.]*)\s+followers/i.exec(html) || /follower[^>]*>\s*([\d][\d,.]*)\s*</i.exec(html);
  if (!m) return null;
  const n = parseInt(m[1].replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
// CI feeds-data first (reliable, CORS-ok), then race every relay over each
// target; the first valid count wins. Every real count is persisted as
// last-known-good so a later refresh never reverts to the stale committed seed.
async function knFetchFollowers() {
  try {
    const d = await _feedsDataJson("assets/linkedin.json");
    if (d && typeof d.followers === "number") { knCacheSet("kn.followers.v1", d.followers); return d.followers; }
  } catch (e) { /* branch not published yet / offline — fall through */ }
  for (const target of [KN_LI_EMBED, KN_LI_PAGE]) {
    const attempts = KN_RELAYS.map((wrap) => (async () => {
      const n = knParseFollowers(await knGet(wrap(target)));
      if (n == null) throw new Error("no count");
      return n;
    })());
    try { const n = await Promise.any(attempts); knCacheSet("kn.followers.v1", n); return n; } catch (e) { /* try next target */ }
  }
  return null;
}
async function knLoadFollowerSeed() {
  try {
    const r = await fetch("assets/linkedin.json?d=" + Date.now(), { cache: "no-store" });
    if (r.ok) { const d = await r.json(); if (d && typeof d.followers === "number") return d.followers; }
  } catch (e) { /* none */ }
  return null;
}

function LinkedInCard() {
  // Instant paint from last-known-good so a refresh never flashes the stale
  // seed; then refresh via knFetchFollowers (feeds-data → relays, both cached).
  // The committed snapshot is used only when no real count has ever loaded.
  const cached = knCacheGet("kn.followers.v1");
  const [followers, setFollowers] = useState(() => (typeof cached === "number" ? cached : null));
  useEffect(() => {
    let alive = true;
    knFetchFollowers().then((n) => {
      if (!alive) return;
      if (typeof n === "number") setFollowers(n);
      else if (typeof cached !== "number") knLoadFollowerSeed().then((s) => { if (alive && typeof s === "number") setFollowers(s); });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <div className="li-card">
      <div className="li-card__lbl">
        <span>Company Page</span>
        <span>LinkedIn</span>
      </div>
      <div className="li-card__row">
        <a className="li-card__logo" href={KN_LI_PAGE} target="_blank" rel="noopener noreferrer"
           aria-label="Open the Kneuralabs LinkedIn page" title="Open Kneuralabs on LinkedIn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452H17.05v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.667V9h3.238v1.561h.046c.45-.855 1.549-1.756 3.188-1.756 3.41 0 4.039 2.244 4.039 5.162v6.485zM5.337 7.433a1.875 1.875 0 1 1 0-3.75 1.875 1.875 0 0 1 0 3.75zM6.957 20.452H3.717V9h3.24v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <div>
          <div className="li-card__count" style={{ color: "var(--ink)" }}>{followers == null ? "—" : followers.toLocaleString("en-US")}</div>
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
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(
      COMM_SB_URL + "/rest/v1/comm_state?id=eq.main&select=data",
      {
        headers: { apikey: COMM_SB_KEY, Authorization: "Bearer " + COMM_SB_KEY },
        cache: "no-store",
        signal: ctrl.signal,
      }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length || !rows[0].data) {
      throw new Error("no comm_state main row");
    }
    return _kqMapState(rows[0].data);
  } finally {
    clearTimeout(timer);
  }
}
window.fetchCommTasks = fetchCommTasks;

function OpenTasks({ onOpenCommand }) {
  const prioOrder = { high: 0, med: 1, low: 2 };
  // Start empty while syncing so the bundled snapshot never flashes a stale
  // count; the snapshot is only used as a fallback if the live read fails.
  const [data, setData] = React.useState(() => ({
    tasks: [],
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
        if (alive) setData({ tasks: window.OPEN_TASKS || [], status: "cached", err: msg });
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
          {data.status === "loading"
            ? <>Syncing the <em>live</em> queue…</>
            : <>You have <em>{tasks.length}</em> open task{tasks.length === 1 ? "" : "s"}</>}
        </h2>
        <div className="opentasks__counts">
          <span><i className="prio prio--high" /> {high} High</span>
          <span><i className="prio prio--med" /> {med} Medium</span>
          <span><i className="prio prio--low" /> {low} Low</span>
        </div>
      </div>
      {data.status === "loading" ? (
        <ol className="opentasks__list" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <li className="opentasks__row" key={i}>
              <span className="opentasks__idx kq-skel" style={{ width: 18, height: 12 }} />
              <span className="kq-skel" style={{ width: 10, height: 10, borderRadius: "50%" }} />
              <span className="kq-skel" style={{ height: 13, width: `${66 - i * 8}%` }} />
              <span className="opentasks__meta">
                <span className="kq-skel" style={{ width: 50, height: 18, borderRadius: 999 }} />
                <span className="kq-skel" style={{ width: 62, height: 18, borderRadius: 999 }} />
              </span>
              <span className="opentasks__due kq-skel" style={{ width: 40, height: 12 }} />
            </li>
          ))}
        </ol>
      ) : (
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
      )}
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
