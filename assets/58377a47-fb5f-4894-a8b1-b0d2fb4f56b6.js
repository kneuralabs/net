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
    const start = new Date(2020, 0, 1);
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
        <div className="nameplate__sub">Internal Portal · Established 2020</div>
      </div>
      <div className="nameplate__bar">
        <span className="nameplate__beacon">
          <span className="pulse-dot" />
          <span className="nameplate__beacon-lbl">All systems operational</span>
        </span>
        <span className="nameplate__edition">Trust &amp; Security Edition</span>
        <a className="nameplate__idcard" href="https://kneuralabs.github.io/ID/" target="_blank" rel="noopener noreferrer">ID Card</a>
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
function StatusStrip({ now }) {
  return (
    <section className="strip">
      <ClockCell city="Kolkata" code="IST · UTC+5:30" tz="Asia/Kolkata"
                 weather={window.WEATHER.kolkata} now={now} />
      <ClockCell city="Connecticut" code="EDT · America/New_York" tz="America/New_York"
                 weather={window.WEATHER.connecticut} now={now} />
      <div className="strip__cell">
        <div className="strip__lbl">
          <span>Today · Federal</span>
          <span>US</span>
        </div>
        <div className="strip__big" style={{ fontSize: 22, letterSpacing: "-0.02em", fontWeight: 600 }}>
          No&nbsp;holiday
        </div>
        <div className="strip__sub">Next observed · Memorial Day · 25 May</div>
      </div>
      <div className="strip__cell">
        <div className="strip__lbl">
          <span>System</span>
          <span>All Green</span>
        </div>
        <div className="strip__big" style={{ fontSize: 22, letterSpacing: "-0.02em", fontWeight: 600 }}>
          Operational
        </div>
        <div className="strip__sub">12 tools online · 0 incidents · last sync 00:14</div>
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
function Tile({ tool, idx, unlocked, onActivate }) {
  const isOpen = !tool.locked || unlocked;
  const handleClick = (e) => {
    if (tool.locked) {
      e.preventDefault();
      onActivate(tool);
    }
  };
  return (
    <a
      className={"tile" + (tool.locked ? " tile--locked" : "")}
      href={isOpen && tool.href ? tool.href : "#"}
      target={isOpen && tool.href ? "_blank" : undefined}
      rel="noopener"
      onClick={handleClick}
      style={{ animationDelay: `${Math.min(idx, 11) * 40}ms` }}
    >
      <div className="tile__top">
        <span className="tile__idx">№ {String(idx + 1).padStart(2, "0")}</span>
        <span className={"tile__state" + (tool.locked ? " tile__state--locked" : "")}>
          {tool.locked ? "SSO" : "Open"}
        </span>
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

function ToolsSection({ unlockedSet, onActivate }) {
  return (
    <section className="section" id="tools">
      <div className="section__head">
        <span className="section__num">№ I — Tools</span>
        <h2 className="section__title">Workspace</h2>
        <span className="section__meta">{window.TOOLS.length} apps · {window.TOOLS.filter(t => t.locked).length} via SSO</span>
      </div>
      <div className="tools">
        {window.TOOLS.map((t, i) => (
          <Tile
            key={t.id}
            tool={t}
            idx={i}
            unlocked={unlockedSet.has(t.id)}
            onActivate={onActivate}
          />
        ))}
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
   SSO iframe modal
   ──────────────────────────────────────────────────────────────── */
function SsoModal({ tool, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!tool) return null;
  const src = "https://sso.kneuralabs.com/?redirect=" + encodeURIComponent(tool.href || "");
  return (
    <div className="sso-overlay" onClick={(e) => { if (e.target.classList.contains("sso-overlay")) onClose(); }}>
      <div className="sso-modal">
        <div className="sso-modal__head">
          <span className="sso-modal__title">{tool.name}</span>
          <button className="sso-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <iframe
          src={src}
          className="sso-modal__frame"
          title="KneuraLabs SSO"
          allow="forms"
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Weekly Brief — rotates every ISO week
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

function getWeeklyBrief() {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getFullYear();
  // Deterministic index: spread across the quote list, resets each year
  const idx = (week - 1) % WEEKLY_BRIEFS.length;
  // Brief number: weeks elapsed since 2025-W01
  const briefNum = (year - 2025) * 52 + week;
  return {
    quote: WEEKLY_BRIEFS[idx],
    num: String(briefNum).padStart(3, "0"),
  };
}

/* ────────────────────────────────────────────────────────────────
   News feed
   ──────────────────────────────────────────────────────────────── */
function FeedSection() {
  return (
    <section className="section" id="feed">
      <div className="section__head">
        <span className="section__num">№ II — Daily</span>
        <h2 className="section__title">Governance <em>Brief</em></h2>
        <span className="section__meta">Updated hourly · IST</span>
      </div>
      <div className="feed">
        <div className="feed__list">
          {window.NEWS.map((n, i) => (
            <a key={i} className="feed__item" href={n.url} target="_blank" rel="noopener noreferrer">
              <div className="feed__date">{n.date}</div>
              <div>
                <h3 className="feed__title">{n.title}</h3>
                <div className="feed__src">{n.src} · <b>{n.tag}</b></div>
              </div>
              <span className="feed__chip">{n.chip} <span className="feed__arrow" aria-hidden="true">↗</span></span>
            </a>
          ))}
        </div>
        <aside className="aside">
          <div className="aside__poster">
            <span className="smallcaps">Weekly Read</span>
            <h3>{getWeeklyBrief().quote}</h3>
            <div className="poster-stamp">Brief № {getWeeklyBrief().num}</div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Footer colophon
   ──────────────────────────────────────────────────────────────── */
function Colophon() {
  return (
    <footer className="colophon rule-thin">
      <div className="colophon__col">
        <div><b>Kneuralabs Pvt. Ltd.</b></div>
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
   KneuraCOMM live queue — fetch + minimal XLSX reader (no deps)
   Pulls https://kneuralabs.github.io/comm/data.xlsx, parses the
   first worksheet, maps header columns to the task shape. Falls
   back to the bundled snapshot if the network/parse fails.
   ──────────────────────────────────────────────────────────────── */
const COMM_BASE = "https://kneuralabs.github.io/comm/";

async function _kqInflate(bytes, method) {
  if (method === 0) return bytes;
  const ds = new DecompressionStream("deflate-raw");
  const ab = await new Response(
    new Blob([bytes]).stream().pipeThrough(ds)
  ).arrayBuffer();
  return new Uint8Array(ab);
}

function _kqU16(d, o) { return d[o] | (d[o + 1] << 8); }
function _kqU32(d, o) {
  return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;
}

async function _kqUnzip(buf) {
  const d = new Uint8Array(buf);
  let eo = -1;
  for (let i = d.length - 22; i >= 0 && i > d.length - 65558; i--) {
    if (_kqU32(d, i) === 0x06054b50) { eo = i; break; }
  }
  if (eo < 0) throw new Error("not a zip");
  const n = _kqU16(d, eo + 10);
  let p = _kqU32(d, eo + 16);
  const want = {};
  for (let i = 0; i < n; i++) {
    if (_kqU32(d, p) !== 0x02014b50) break;
    const method = _kqU16(d, p + 10);
    const csize = _kqU32(d, p + 20);
    const fnl = _kqU16(d, p + 28);
    const efl = _kqU16(d, p + 30);
    const cml = _kqU16(d, p + 32);
    const lho = _kqU32(d, p + 42);
    const name = new TextDecoder().decode(d.subarray(p + 46, p + 46 + fnl));
    const lfnl = _kqU16(d, lho + 26);
    const lefl = _kqU16(d, lho + 28);
    const start = lho + 30 + lfnl + lefl;
    want[name] = { d: d.subarray(start, start + csize), method };
    p += 46 + fnl + efl + cml;
  }
  const out = {};
  for (const k in want) {
    out[k] = new TextDecoder().decode(
      await _kqInflate(want[k].d, want[k].method)
    );
  }
  return out;
}

function _kqXml(s) {
  return String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, "&");
}

function _kqCol(ref) {
  let c = 0;
  for (const ch of ref) {
    const u = ch.charCodeAt(0);
    if (u >= 65 && u <= 90) c = c * 26 + (u - 64); else break;
  }
  return c - 1;
}

function _kqShared(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m =>
    _kqXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(""))
  );
}

function _kqRows(xml, shared) {
  const rows = [];
  if (!xml) return rows;
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const cells = [];
    const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm;
    while ((cm = cRe.exec(rm[1]))) {
      const attr = cm[1] || "";
      const body = cm[2] || "";
      const rA = /r="([A-Z]+)\d+"/.exec(attr);
      const ci = rA ? _kqCol(rA[1]) : cells.length;
      const tA = /t="([^"]+)"/.exec(attr);
      const ty = tA ? tA[1] : "";
      let v = "";
      if (ty === "s") {
        const vm = /<v>([\s\S]*?)<\/v>/.exec(body);
        v = vm ? (shared[+vm[1]] || "") : "";
      } else if (ty === "inlineStr") {
        v = _kqXml(
          [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")
        );
      } else {
        // str / b / e / number / date — value lives in <v>
        const vm = /<v>([\s\S]*?)<\/v>/.exec(body);
        v = vm ? _kqXml(vm[1]) : "";
      }
      cells[ci] = v;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] == null) cells[i] = "";
    rows.push(cells);
  }
  return rows;
}

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

function _kqClean(rows) {
  return rows.map(r => (r || []).map(c => String(c == null ? "" : c).trim()));
}

// The export is a stacked sheet: a banner row, then sections each
// introduced by an ALL-CAPS single-cell label, a header row, then
// body rows. Returns { LABEL: { header:[], body:[[]] } }.
function _kqSections(rows) {
  const out = {};
  let cur = null, awaitHdr = false;
  for (const r of rows) {
    const nonEmpty = r.filter(c => c !== "");
    const isLabel =
      nonEmpty.length === 1 && r[0] !== "" &&
      /^[A-Z][A-Z0-9 _&\/-]{1,30}$/.test(r[0]) && r[0] === r[0].toUpperCase();
    if (isLabel) {
      cur = r[0].trim().toUpperCase();
      out[cur] = { header: [], body: [] };
      awaitHdr = true;
      continue;
    }
    if (!cur) continue;
    if (!nonEmpty.length) continue;
    if (awaitHdr) { out[cur].header = r; awaitHdr = false; }
    else out[cur].body.push(r);
  }
  return out;
}

function _kqIdx(header, ...keys) {
  const h = header.map(c => c.toLowerCase());
  for (let i = 0; i < h.length; i++)
    if (keys.some(k => h[i] === k || h[i].includes(k))) return i;
  return -1;
}

function _kqMap(rows) {
  rows = _kqClean(rows);
  const sec = _kqSections(rows);
  // Build project id -> name map (best effort).
  const proj = {};
  const P = sec["PROJECTS"];
  if (P && P.header.length) {
    const pi = _kqIdx(P.header, "id");
    const pn = _kqIdx(P.header, "name", "title");
    if (pi >= 0 && pn >= 0)
      for (const r of P.body) if (r[pi]) proj[r[pi]] = r[pn] || "";
  }
  const T = sec["TASKS"];
  if (!T || !T.header.length) {
    throw new Error("no TASKS section in data.xlsx");
  }
  const H = T.header;
  const ti = _kqIdx(H, "title", "task", "name", "summary");
  const ri = _kqIdx(H, "role", "owner", "assignee");
  const pj = _kqIdx(H, "project");
  const pr = _kqIdx(H, "priority", "prio", "severity");
  const st = _kqIdx(H, "status", "state");
  const du = _kqIdx(H, "due", "deadline", "target");
  const g = (r, i) => (i >= 0 && r[i] != null ? String(r[i]).trim() : "");
  const out = [];
  for (const r of T.body) {
    const title = g(r, ti);
    if (!title) continue;
    const status = g(r, st);
    if (status && _KQ_DONE.test(status)) continue; // open queue only
    let pv = g(r, pj);
    if (proj[pv]) pv = proj[pv];
    else if (/^[a-z0-9]{6,12}$/.test(pv)) pv = ""; // opaque id, unresolved
    out.push({
      title,
      role: g(r, ri) || "Team",
      project: pv || "KneuraCOMM",
      priority: _kqPrio(g(r, pr)),
      due: _kqDue(g(r, du)),
    });
  }
  return out;
}

const COMM_SOURCES = [
  COMM_BASE + "data.xlsx",
  "https://raw.githubusercontent.com/kneuralabs/comm/main/data.xlsx",
];

async function fetchCommTasks() {
  let lastErr;
  for (const url of COMM_SOURCES) {
    try {
      const res = await fetch(url, { mode: "cors", cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status + " · " + url);
      const buf = await res.arrayBuffer();
      const files = await _kqUnzip(buf);
      const shared = _kqShared(files["xl/sharedStrings.xml"]);
      const key = Object.keys(files)
        .filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
        .sort()[0] || "xl/worksheets/sheet1.xml";
      return _kqMap(_kqRows(files[key] || "", shared));
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("no source reachable");
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
