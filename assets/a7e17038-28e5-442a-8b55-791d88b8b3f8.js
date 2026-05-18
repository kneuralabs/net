// app.jsx — KNEURALABS Intranet root

/* ── Sunrise / sunset (NOAA algorithm, no external deps) ───────────────────
   Returns { sunrise: Date, sunset: Date } in local time, or
   { sunrise: null, sunset: null, polar: "day"|"night" } at extreme latitudes. */
function getSunTimes(lat, lng, date) {
  const R = Math.PI / 180;
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.round((date - start) / 86400000);
  const g = (2 * Math.PI / 365) * (doy - 1);
  const eqT = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
               - 0.014615 * Math.cos(2*g) - 0.04089 * Math.sin(2*g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
               - 0.006758 * Math.cos(2*g) + 0.000907 * Math.sin(2*g)
               - 0.002697 * Math.cos(3*g) + 0.00148  * Math.sin(3*g);
  const cosHA = (Math.cos(90.833 * R) - Math.sin(lat * R) * Math.sin(decl))
                / (Math.cos(lat * R) * Math.cos(decl));
  if (cosHA < -1) return { sunrise: null, sunset: null, polar: "day" };
  if (cosHA >  1) return { sunrise: null, sunset: null, polar: "night" };
  const ha = Math.acos(cosHA) / R;
  const noon = 720 - 4 * lng - eqT;
  const toDate = (m) => { const d = new Date(date); d.setUTCHours(0,0,0,0); d.setTime(d.getTime() + m * 60000); return d; };
  return { sunrise: toDate(noon - 4 * ha), sunset: toDate(noon + 4 * ha), polar: null };
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "brand",
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

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const now = useNow(1000);
  const [activeLock, setActiveLock] = React.useState(null);
  const [unlocked, setUnlocked] = React.useState(() => new Set());

  React.useEffect(() => { applyTokens(t); }, [t.theme, t.tile, t.density, t.motion, t.typePair]);

  // Auto dark/light based on local sunrise & sunset
  React.useEffect(() => {
    let timer = null;
    let cancelled = false;

    const applyAuto = (lat, lng) => {
      if (cancelled) return;
      const now = new Date();
      const { sunrise, sunset, polar } = getSunTimes(lat, lng, now);
      const isDark = polar === "night" || (!polar && (now < sunrise || now >= sunset));
      setTweak("theme", isDark ? "authority" : "brand");

      // Schedule the next flip exactly at the upcoming transition
      let msUntilNext;
      if (polar) {
        msUntilNext = 6 * 3600000; // polar — recheck every 6 h in case of travel
      } else if (now < sunrise) {
        msUntilNext = sunrise - now + 1000;
      } else if (now < sunset) {
        msUntilNext = sunset - now + 1000;
      } else {
        // After sunset: next transition is tomorrow's sunrise
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const { sunrise: sr2 } = getSunTimes(lat, lng, tomorrow);
        msUntilNext = sr2 ? sr2 - now + 1000 : 6 * 3600000;
      }
      timer = setTimeout(() => applyAuto(lat, lng), msUntilNext);
    };

    const fallback = () => {
      const lng = -(new Date().getTimezoneOffset() / 60) * 15;
      applyAuto(35, lng); // 35° lat covers most populated latitudes reasonably
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => applyAuto(coords.latitude, coords.longitude),
        fallback,
        { timeout: 5000 }
      );
    } else {
      fallback();
    }

    return () => { cancelled = true; clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivate = (tool) => {
    if (tool.locked && !unlocked.has(tool.id)) {
      setActiveLock(tool);
    } else if (tool.href) {
      window.open(tool.href, "_blank", "noopener");
    }
  };

  const handleOpenCommand = () => {
    const comm = window.TOOLS.find(t => t.id === "comm");
    if (!comm) return;
    if (comm.locked && !unlocked.has(comm.id)) {
      setActiveLock(comm);
    } else {
      window.open(comm.href, "_blank", "noopener");
    }
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

  return (
    <React.Fragment>
      <div className="page">
        <Nameplate now={now} theme={t.theme} onThemeChange={(v) => setTweak("theme", v)} />
        <StatusStrip now={now} />
        <OpenTasks onOpenCommand={handleOpenCommand} />
        <Welcome voice={t.voice} />
        <ToolsSection
          unlockedSet={unlocked}
          onActivate={handleActivate}
        />
        <FeedSection />
        <Colophon />
      </div>
      {activeLock && (
        <LockModal
          tool={activeLock}
          onClose={() => setActiveLock(null)}
          onSuccess={handleSuccess}
        />
      )}

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
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
