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
   Daily Read — a definitional line on AI governance, IT
   modernization, Governance-as-a-Service & IT standards. Advances
   automatically every day (deterministic, offline, no human in the
   loop) and never repeats within a cycle.
   ──────────────────────────────────────────────────────────────── */
const DAILY_READS = [
  "AI governance: accountability engineered into every model you ship.",
  "IT modernization: trading legacy constraints for future capability.",
  "Governance as a Service: oversight delivered like infrastructure.",
  "An IT standard is a promise anyone can verify.",
  "Governance without evidence is only a guess.",
  "Modernization is migration with intent, not newer hardware.",
  "Responsible AI is proven before deployment, not promised after.",
  "Standards are the grammar that lets systems trust each other.",
  "Governance as a Service: compliance you subscribe to, not restart.",
  "The audit trail is the artefact — if it wasn't recorded, it didn't happen.",
  "Modernization retires debt so you can fund outcomes.",
  "Govern what learns, or it will govern you.",
  "Standards turn opinion into interoperability.",
  "Modern IT is measured by how safely it can change.",
  "Governance scales when controls become code.",
  "An AI you cannot explain is an AI you cannot govern.",
  "Governance as a Service delivers the framework; you keep the judgement.",
  "Modernization without governance is just faster risk.",
  "A control that is never tested is no control at all.",
  "IT standards turn a promise into a guarantee.",
  "AI governance makes principles provable.",
  "Modernize for reversibility: change you can safely undo.",
  "Governance is accountability with a paper trail.",
  "A standard nobody follows is documentation, not a standard.",
  "AI governance is risk management for systems that learn.",
  "Modern platforms assume change; legacy platforms resist it.",
  "Governance as a Service: policy, controls and evidence, delivered together.",
  "Explainability is a constraint you design from, not bolt on.",
  "Modernization is the quiet work behind every innovation.",
  "A standard earns authority by being verifiable, not mandated.",
  "AI governance asks not only can we, but should we.",
  "IT modernization is debt repayment for the future.",
  "Proven controls beat cited policies.",
  "Governance as a Service turns 'we should' into 'we already do'.",
  "Interoperability is a standard kept by everyone at once.",
  "The model is only as governed as its weakest unmonitored path.",
  "Good modernization is invisible to users and obvious in the metrics.",
  "Governance is how an organisation keeps its promises at scale.",
  "A standard is consensus made executable.",
  "Fasten governance before the model accelerates.",
  "Modern IT makes security and compliance defaults, not add-ons.",
  "Governance as a Service: oversight that arrives ready, not assembled.",
  "What you cannot measure, you cannot modernize.",
  "AI governance is how using a model becomes owning its outcome.",
  "Standards are written so the next engineer never has to guess.",
];

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getDailyRead() {
  const now = new Date();
  // Whole-day count since the 2025-01-01 epoch (UTC), so the read advances to a
  // fresh definition every day and never repeats within a cycle. Fully
  // deterministic: no network, no CI, no human intervention.
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const epoch = Date.UTC(2025, 0, 1);
  const dayNum = Math.floor((today - epoch) / 86400000) + 1;
  const idx = ((dayNum - 1) % DAILY_READS.length + DAILY_READS.length) % DAILY_READS.length;
  return {
    quote: DAILY_READS[idx],
    num: String(dayNum).padStart(3, "0"),
  };
}

/* ────────────────────────────────────────────────────────────────
   Governance Brief — live worldwide newsfeed, refreshed in every
   visitor's browser on each load (no CI, branch or human in the
   loop). Covers AI governance & regulation, IT modernization, IT
   standards, and notable AI tool / model releases employees should
   know about.
   ──────────────────────────────────────────────────────────────── */
const _BRIEF_MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function _briefDate(d) {
  return String(d.getDate()).padStart(2, "0") + " " + _BRIEF_MON[d.getMonth()] + " " + d.getFullYear();
}
function _briefChip(title) {
  const s = String(title).toLowerCase();
  if (/regulat|\bact\b|\blaw\b|\bbill\b|legislat/.test(s)) return "Regulation";
  if (/iso 42001|\bnist\b|\biso\b|standard|framework|guideline|certif/.test(s)) return "Standards";
  if (/moderni[sz]|legacy|migrat|digital transformation|cloud|overhaul|upgrade/.test(s)) return "Modernization";
  if (/launch|releas|unveil|rolls out|introduc|debut|new model|new tool|update/.test(s)) return "Release";
  if (/fine|enforce|penalt|lawsuit|\bban\b/.test(s)) return "Enforcement";
  if (/\beu\b|brussels|white house|federal|government|ministry|meity|oecd|\bun\b/.test(s)) return "Policy";
  return "Industry";
}
// Focused Google-News RSS queries spanning every topic, merged newest-first.
const BRIEF_QUERIES = [
  '("AI governance" OR "AI regulation" OR "AI Act" OR "AI policy" OR "responsible AI") when:14d',
  '("IT modernization" OR "digital transformation" OR "ISO 42001" OR "NIST AI" OR "AI standard" OR "AI compliance") when:21d',
  '("new AI model" OR "AI model release" OR "AI tool launch" OR "launches AI" OR "enterprise AI") when:10d',
];
function _briefFeedUrl(q) {
  return "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=en-US&gl=US&ceid=US:en";
}
// Google News RSS sends no CORS headers, so route through public CORS proxies.
const BRIEF_PROXIES = [
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
  (u) => "https://corsproxy.io/?url=" + encodeURIComponent(u),
  (u) => "https://thingproxy.freeboard.io/fetch/" + u,
];
// Cross-origin fetch with a hard timeout. The free public CORS proxies above
// are flaky and routinely accept a connection then hang. A plain fetch() has no
// timeout, so one stalled proxy would await forever — leaving the Brief stuck on
// its committed seed and the LinkedIn count stuck on an em dash, with no way to
// advance to the next proxy. Aborting on a deadline turns a hang into a normal
// "try the next proxy" failure so the feed always converges.
const PROXY_TIMEOUT_MS = 6000;
async function _proxyFetch(url, timeoutMs = PROXY_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { mode: "cors", cache: "no-store", signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
function _briefParse(xml) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return [];
  const out = [];
  doc.querySelectorAll("item").forEach((it) => {
    const link = (it.querySelector("link")?.textContent || "").trim();
    let title = (it.querySelector("title")?.textContent || "").trim();
    if (!title || !link) return;
    const src = (it.querySelector("source")?.textContent || "").trim();
    // Google News titles read "Headline - Publisher"; trim the publisher.
    if (src && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3)).trim();
    const pub = it.querySelector("pubDate")?.textContent;
    const d = pub ? new Date(pub) : new Date();
    out.push({
      _t: isNaN(d) ? Date.now() : d.getTime(),
      date: _briefDate(isNaN(d) ? new Date() : d),
      chip: _briefChip(title),
      title,
      src: src || "Newswire",
      tag: "Google News",
      url: link,
    });
  });
  return out;
}
async function _briefFetchOne(url) {
  for (const wrap of BRIEF_PROXIES) {
    try {
      const res = await _proxyFetch(wrap(url));
      if (!res.ok) continue;
      const items = _briefParse(await res.text());
      if (items.length) return items;
    } catch (e) { /* try next proxy */ }
  }
  return [];
}
async function fetchGovernanceNews() {
  const batches = await Promise.all(BRIEF_QUERIES.map((q) => _briefFetchOne(_briefFeedUrl(q))));
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
window.fetchGovernanceNews = fetchGovernanceNews;

// ── First-party CI-refreshed feed data ──────────────────────────────────────
// A scheduled GitHub Action regenerates the feeds server-side and publishes
// them to the UNPROTECTED `feeds-data` branch. GitHub's own raw endpoint serves
// that branch with `Access-Control-Allow-Origin: *`, so the browser reads it
// cross-origin with NO third-party proxy in the path. This is the reliable live
// source. The public CORS proxies above are now only a best-effort "even
// fresher" layer, and the committed assets/*.json the final offline fallback.
const FEEDS_DATA_BASE = "https://raw.githubusercontent.com/kneuralabs/net/feeds-data/";
async function _feedsDataJson(path) {
  const r = await fetch(FEEDS_DATA_BASE + path + "?d=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("feeds-data " + path + " HTTP " + r.status);
  return await r.json();
}
async function fetchFeedsDataBrief() {
  try {
    const items = await _feedsDataJson("assets/news.json");
    if (Array.isArray(items) && items.length) return items.slice(0, 6);
  } catch (e) { /* branch not published yet / offline — fall through */ }
  return [];
}

// Committed snapshot shipped with the site — used for instant first paint and
// as a graceful fallback when the live RSS proxies are unreachable.
async function fetchBriefSeed() {
  try {
    const r = await fetch("assets/news.json?d=" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      const items = await r.json();
      if (Array.isArray(items) && items.length) return items.slice(0, 6);
    }
  } catch (e) { /* fall through to empty */ }
  return [];
}
// Source priority, most-reliable first:
//   1. First-party CI feed on the feeds-data branch (refreshed daily, CORS-ok).
//   2. Best-effort live worldwide headlines via public CORS proxies (timeout-
//      bounded) — only when the CI feed is unreachable.
//   3. Committed seed shipped with the site — offline fallback.
async function fetchBriefData() {
  const ci = await fetchFeedsDataBrief();
  if (ci.length) return ci;
  try {
    const live = await fetchGovernanceNews();
    if (live && live.length) return live;
  } catch (e) {
    console.warn("[Brief] live proxy feed unavailable:", e);
  }
  return await fetchBriefSeed();
}
window.fetchBriefData = fetchBriefData;
window.fetchBriefSeed = fetchBriefSeed;

function FeedSection() {
  const read = getDailyRead();
  const week = getISOWeek(new Date());
  const posterPal = KN_POSTER_PALETTE[week % KN_POSTER_PALETTE.length];
  const [feed, setFeed] = useState(() => ({ items: window.NEWS || [], status: "loading" }));
  useEffect(() => {
    let alive = true;
    // Instant paint from the committed seed, then replace with live worldwide news.
    fetchBriefSeed().then((seed) => {
      if (alive && seed.length) setFeed((f) => (f.status === "loading" ? { items: seed, status: "cached" } : f));
    });
    fetchBriefData()
      .then((items) => {
        if (!alive) return;
        if (items && items.length) setFeed({ items, status: "live" });
        else setFeed((f) => ({ items: f.items, status: "cached" }));
      })
      .catch((e) => {
        console.error("[Brief] feed unavailable:", e);
        if (alive) setFeed((f) => ({ items: f.items, status: "cached" }));
      });
    return () => { alive = false; };
  }, []);
  const meta =
    feed.status === "live"      ? "Live · worldwide · refreshed daily"
    : feed.status === "loading" ? "Syncing latest headlines…"
    :                             "Latest cached · worldwide";
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
                    ? "Loading the latest governance, modernization & AI headlines…"
                    : "Live brief syncing — fresh headlines will appear shortly."}
                </h3>
              </div>
            </div>
          )}
          {feed.items.map((n, i) => {
            const fp = KN_TILE_PALETTE[i % KN_TILE_PALETTE.length];
            return (
              <a key={i} className="feed__item" href={n.url} target="_blank" rel="noopener noreferrer"
                 style={{ background: fp.bg, borderLeft: "3px solid " + fp.border }}>
                <div className="feed__date">
                  {n.date}
                  {i === 0 && <span style={{display:"block",width:"100%",boxSizing:"border-box",fontSize:"9px",fontWeight:700,letterSpacing:"0.14em",padding:"2px 6px",marginTop:5,background:"rgba(220,38,38,0.14)",color:"#dc2626",border:"1px solid rgba(220,38,38,0.45)",animation:"just-in-pulse 2s ease-in-out infinite",textAlign:"center",textTransform:"uppercase",fontFamily:"var(--f-mono)"}}>Just In</span>}
                </div>
                <div>
                  <h3 className="feed__title">{n.title}</h3>
                  <div className="feed__src" style={{ color: "var(--accent-ink)" }}>{n.src} · <b style={{ color: "var(--accent-ink)" }}>{n.tag}</b></div>
                </div>
                <span className="feed__chip" style={{ color: "var(--accent-ink)" }}>
                  {n.chip} <span className="feed__arrow" aria-hidden="true">↗</span>
                </span>
              </a>
            );
          })}
        </div>
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

/* ────────────────────────────────────────────────────────────────
   LinkedIn widget — Kneuralabs company-page follower count.
   Fetches the public page live (via CORS proxies) on every load,
   falling back to the committed snapshot only when the page is
   authwalled. No CI, branch or human intervention.
   ──────────────────────────────────────────────────────────────── */
const LINKEDIN_PAGE_URL = "https://www.linkedin.com/company/kneuralabs/";
const LINKEDIN_COMPANY_ID = "112376100";
// Built for anonymous embedding — far less likely to be authwalled than the page.
const LINKEDIN_FOLLOW_BTN_URL =
  "https://www.linkedin.com/pages-extensions/FollowCompany?id=" + LINKEDIN_COMPANY_ID + "&counter=bottom";
const LINKEDIN_PROXIES = [
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
  (u) => "https://corsproxy.io/?url=" + encodeURIComponent(u),
  (u) => "https://thingproxy.freeboard.io/fetch/" + u,
];
function _liParse(html) {
  const m = /([\d][\d,.]*)\s+followers/i.exec(html) ||
            /follower[^>]*>\s*([\d][\d,.]*)\s*</i.exec(html);
  if (!m) return null;
  const n = parseInt(m[1].replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
async function fetchLinkedInFollowers() {
  // 1 · First-party CI count from the feeds-data branch (refreshed every 6h,
  //     served CORS-enabled by raw.githubusercontent — the reliable source).
  try {
    const data = await _feedsDataJson("assets/linkedin.json");
    if (data && typeof data.followers === "number") return data.followers;
  } catch (e) { /* branch not published yet / offline — fall through */ }
  // 2 · Best-effort live scrape via public CORS proxies (timeout-bounded;
  //     follow-button endpoint first — it is meant for anonymous embedding,
  //     unlike the authwalled company page).
  for (const target of [LINKEDIN_FOLLOW_BTN_URL, LINKEDIN_PAGE_URL]) {
    for (const wrap of LINKEDIN_PROXIES) {
      try {
        const res = await _proxyFetch(wrap(target));
        if (!res.ok) continue;
        const n = _liParse(await res.text());
        if (n != null) return n;
      } catch (e) { /* try next proxy */ }
    }
  }
  // 3 · Committed snapshot fallback (last known good count, offline).
  try {
    const r = await fetch("assets/linkedin.json?d=" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      if (data && typeof data.followers === "number") return data.followers;
    }
  } catch (e) { /* give up — render an em dash */ }
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
