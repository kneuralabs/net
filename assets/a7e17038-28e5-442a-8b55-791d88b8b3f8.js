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

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const now = useNow(1000);
  const [activeLock, setActiveLock] = React.useState(null);
  const [unlocked, setUnlocked] = React.useState(() => new Set());

  React.useEffect(() => { applyTokens(t); }, [t.theme, t.tile, t.density, t.motion, t.typePair]);

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
      <ThemeToggle theme={t.theme} onChange={(v) => setTweak("theme", v)} />
      <div className="page">
        <Nameplate now={now} />
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
