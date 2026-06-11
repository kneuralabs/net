// app.jsx — KNEURALABS Intranet root

const _h = new Date().getHours();
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": (_h >= 18 || _h < 6) ? "authority" : "brand",
  "typePair": "editorial",
  "tile": "bordered",
  "density": "comfortable",
  "motion": "subtle",
  "voice": "formal"
}/*EDITMODE-END*/;

const THEME_OPTS = [
  { value: "brand",     label: "Brand",     palette: ["#FFFFFF", "#141414", "#00F0FF", "#204376"] },
  { value: "smoke",     label: "Smoke",     palette: ["#EEF1F5", "#141414", "#00F0FF", "#204376"] },
  { value: "navy",      label: "Navy",      palette: ["#204376", "#FFFFFF", "#00F0FF", "#D6FBFF"] },
  { value: "authority", label: "Authority", palette: ["#0A141F", "#D6FBFF", "#00F0FF", "#204376"] },
];

const TYPE_PAIRS = {
  editorial: {
    display: '"Inter", system-ui, sans-serif',
    ui: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  modern: {
    display: '"Inter", system-ui, sans-serif',
    ui: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  terminal: {
    display: '"JetBrains Mono", ui-monospace, monospace',
    ui: '"JetBrains Mono", ui-monospace, monospace',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
};

function applyTokens(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.theme);
  root.setAttribute("data-tile", t.tile);
  root.setAttribute("data-density", t.density);
  root.setAttribute("data-motion", t.motion);
  const pair = TYPE_PAIRS[t.typePair] || TYPE_PAIRS.editorial;
  root.style.setProperty("--f-display", pair.display);
  root.style.setProperty("--f-ui", pair.ui);
  root.style.setProperty("--f-mono", pair.mono);
}

/* Read the SSO auth token stored after sign-in */
function _getAuth() {
  try { return JSON.parse(sessionStorage.getItem('kn-auth') || 'null'); } catch { return null; }
}

/* Shared per-user app grants (same Supabase table the SSO admin writes).
   Queried directly so the workspace renders the grants of record even when
   the sign-in payload carried a stale or empty local fallback — and so
   admin re-assignments reach every device on the next page load. */
const SB_URL = 'https://brysartqcjylgqwmnjkk.supabase.co';
const SB_KEY = 'sb_publishable_C5e5ViwIlW9dV14ZLi4O0A_ipIXhTB5';

/* Returns the granted app ids, or null when no grant row exists / the
   backend is unreachable — callers keep the sign-in payload's copy then. */
async function _fetchGrantedApps(empId) {
  try {
    const res = await fetch(
      SB_URL + '/rest/v1/kn_app_access?select=apps&employee_id=eq.' + encodeURIComponent(empId),
      { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows.length) return null;
    return Array.isArray(rows[0].apps) ? rows[0].apps : [];
  } catch { return null; }
}

/* Returns true if this user is allowed to open the given tool */
function _canAccess(auth, tool) {
  if (!auth) return false;
  if (auth.role === 'admin') return true;
  // Default-deny: employees only see apps explicitly granted in SSO. A missing
  // apps array (e.g. a stale pre-access-control token) grants nothing.
  if (!Array.isArray(auth.apps)) return false;
  return auth.apps.includes(tool.id);
}

/* Floating "no access" toast shown when a restricted tile is clicked */
function AccessDeniedToast({ visible, appName, onDone }) {
  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      background: '#8B1A12', color: '#fff',
      padding: '.75rem 1.125rem', borderRadius: '8px',
      fontSize: '.8125rem', fontWeight: 500,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity .28s, transform .28s',
      pointerEvents: 'none', zIndex: 9999,
      maxWidth: '280px', lineHeight: 1.45,
      boxShadow: '0 4px 24px rgba(0,0,0,.35)',
    }}>
      🔒 No access to <strong>{appName}</strong>. Contact your administrator.
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const now = useNow(1000);
  const [activeLock, setActiveLock] = React.useState(null);
  const [unlocked, setUnlocked] = React.useState(() => new Set());
  const [denyToast, setDenyToast] = React.useState({ visible: false, appName: '' });

  React.useEffect(() => { applyTokens(t); }, [t.theme, t.tile, t.density, t.motion, t.typePair]);

  const handleActivate = (tool) => {
    const auth = _getAuth();
    if (!_canAccess(auth, tool)) {
      setDenyToast({ visible: true, appName: tool.name });
      return;
    }
    if (tool.href) {
      window.open(tool.href, "_blank", "noopener");
    }
  };

  const handleOpenCommand = () => {
    const comm = window.TOOLS.find(t => t.id === "comm");
    if (!comm) return;
    const auth = _getAuth();
    if (!_canAccess(auth, comm)) {
      setDenyToast({ visible: true, appName: comm.name });
      return;
    }
    window.open(comm.href, "_blank", "noopener");
  };

  const handleSuccess = (tool) => {
    setUnlocked(prev => {
      const next = new Set(prev);
      next.add(tool.id);
      return next;
    });
    setActiveLock(null);
    // Once access is granted, open the tool's link in a new window
    if (tool.href) {
      setTimeout(() => window.open(tool.href, "_blank", "noopener"), 100);
    }
  };

  /* Auth lives in state so the workspace updates the moment sign-in lands,
     instead of depending on an unrelated re-render to re-read storage */
  const [auth, setAuthState] = React.useState(_getAuth);

  /* Pick up the SSO's kn-auth postMessage (the inline boot script stores it
     in sessionStorage before this listener runs) */
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== 'https://sso.kneuralabs.com') return;
      if (!e.data || e.data.type !== 'kn-auth') return;
      setAuthState(_getAuth());
    };
    window.addEventListener('message', onMsg);
    // Re-sync once after subscribing: covers a sign-in that completed between
    // the initial state read and this listener attaching (the inline boot
    // script will already have stored it).
    setAuthState(_getAuth());
    return () => window.removeEventListener('message', onMsg);
  }, []);

  /* Refresh this user's grants from the shared backend so assigned apps show
     on every device, even when the sign-in payload's apps were stale/empty */
  React.useEffect(() => {
    if (!auth || auth.role === 'admin' || !auth.id) return;
    let alive = true;
    _fetchGrantedApps(auth.id).then((apps) => {
      if (!alive || apps === null) return;
      if (JSON.stringify(apps) === JSON.stringify(auth.apps || [])) return;
      const next = { ...auth, apps };
      try { sessionStorage.setItem('kn-auth', JSON.stringify(next)); } catch (e) {}
      setAuthState(next);
    });
    return () => { alive = false; };
  }, [auth?.id, auth?.role]);

  /* Compute which tool IDs this user may access, for visual hint on tiles */
  const allowedIds = React.useMemo(() => {
    if (!auth) return new Set();
    if (auth.role === 'admin') return null; // null = all allowed
    if (!Array.isArray(auth.apps)) return new Set(); // default-deny: nothing granted
    return new Set(auth.apps);
  }, [auth?.role, JSON.stringify(auth?.apps)]);

  return (
    <React.Fragment>
      <ThemeToggle theme={t.theme} onChange={(v) => setTweak("theme", v)} />
      <div className="page">
        <Nameplate now={now} />
        <StatusStrip now={now} />
        <OpenTasks onOpenCommand={handleOpenCommand} />
        <Welcome voice={t.voice} />
        <ToolsSection
          unlockedSet={unlocked}
          allowedIds={allowedIds}
          onActivate={handleActivate}
        />
        <FeedSection />
        <Colophon />
      </div>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor
          label="Palette"
          value={THEME_OPTS.find(o => o.value === t.theme)?.palette}
          options={THEME_OPTS.map(o => o.palette)}
          onChange={(v) => {
            const opt = THEME_OPTS.find(o => o.palette[0] === v[0] && o.palette[1] === v[1]);
            if (opt) setTweak("theme", opt.value);
          }}
        />
        <TweakRadio
          label="Mode"
          value={t.theme}
          options={THEME_OPTS.map(o => o.value)}
          onChange={(v) => setTweak("theme", v)}
        />

        <TweakSection label="Typography" />
        <TweakSelect
          label="Pairing"
          value={t.typePair}
          options={[
            { value: "editorial", label: "Editorial — Instrument + DM Sans" },
            { value: "modern",    label: "Modern — Newsreader + Public Sans" },
            { value: "terminal",  label: "Terminal — JetBrains Mono only" },
          ]}
          onChange={(v) => setTweak("typePair", v)}
        />

        <TweakSection label="Layout" />
        <TweakRadio
          label="Tile style"
          value={t.tile}
          options={["bordered", "filled", "list"]}
          onChange={(v) => setTweak("tile", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "comfortable", "spacious"]}
          onChange={(v) => setTweak("density", v)}
        />

        <TweakSection label="Detail" />
        <TweakRadio
          label="Motion"
          value={t.motion}
          options={["off", "subtle", "playful"]}
          onChange={(v) => setTweak("motion", v)}
        />

        <TweakSection label="Voice" />
        <TweakRadio
          label="Welcome tone"
          value={t.voice}
          options={["formal", "plain", "warm"]}
          onChange={(v) => setTweak("voice", v)}
        />

        <TweakSection label="Demo" />
        <TweakButton
          label="Lock all tools"
          onClick={() => setUnlocked(new Set())}
        />
      </TweaksPanel>
      <AccessDeniedToast
        visible={denyToast.visible}
        appName={denyToast.appName}
        onDone={() => setDenyToast(d => ({ ...d, visible: false }))}
      />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);