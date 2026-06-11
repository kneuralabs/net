// data.jsx — content for the KNEURALABS Intranet redesign

// Each tool carries a recognisable emoji `seal` and a unique `accent`
// colour (no two tiles share an icon hue) — see Tile in components.jsx.
const TOOLS = [
  { id: "portal",   cat: "Public Platform",       name: "Official Website",     tm: "",    desc: "Public-facing marketing site.",
    locked: false, href: "https://www.kneuralabs.com", seal: "🌐", accent: "#2563EB" },
  { id: "beacon",   cat: "Newsletter",            name: "Beacon",               tm: "",    desc: "Company newsletter & updates.",
    locked: false, href: "https://beacon.kneuralabs.com", seal: "📣", accent: "#DB2777" },
  { id: "policy",   cat: "Policy & Governance",   name: "Handbook",             tm: "",    desc: "Policies, conduct & governance.",
    locked: false, href: "https://policy.kneuralabs.com", seal: "📖", accent: "#7C3AED" },
  { id: "days",     cat: "Time Tracking",         name: "KneuraDAYS",           tm: "™",   desc: "Time, tasks & weekly logs.",
    locked: true, word: "s1ogger$", href: "https://days.kneuralabs.com", seal: "⏱️", accent: "#0891B2" },
  { id: "sea",      cat: "Supplier Evaluation",   name: "SEA",                  tm: "™",   desc: "Vendor risk & supplier scoring.",
    locked: true, word: "sea", href: "https://sea.kneuralabs.com", seal: "🛡️", accent: "#DC2626" },
  { id: "scope",    cat: "AI Readiness",          name: "KneuraSCOPE",          tm: "™",   desc: "AI maturity & readiness audit.",
    locked: true, word: "kneurascope", href: "https://scope.kneuralabs.com", seal: "🎯", accent: "#EA580C" },
  { id: "lens",     cat: "Governance Deployment", name: "KneuraLENS",           tm: "™",   desc: "Frameworks, controls & rollout.",
    locked: true, word: "s1ogger$", href: "https://lens.kneuralabs.com", seal: "🔍", accent: "#059669" },
  { id: "audit",    cat: "Audit & Records",       name: "KneurAUDIT",           tm: "™",   desc: "Audit trail & retention ledger.",
    locked: true, word: "s1ogger$", href: "https://audit.kneuralabs.com", seal: "🧾", accent: "#CA8A04" },
  { id: "trax",     cat: "Finance Tracking",      name: "KneuraTRAX",           tm: "™",   desc: "Income, expenses & runway.",
    locked: true, word: "trax", href: "https://trax.kneuralabs.com", seal: "💰", accent: "#16A34A" },
  { id: "comm",     cat: "Command Center",        name: "KneuraCOMM",           tm: "™",   desc: "Internal comms & broadcast.",
    locked: true, word: "s1ogger$", href: "https://comm.kneuralabs.com", seal: "📡", accent: "#4F46E5" },
  { id: "brand",    cat: "Branding",              name: "Brand",                tm: "™",   desc: "Identity, logos & type.",
    locked: false, href: "https://brand.kneuralabs.com", seal: "🎨", accent: "#E11D48" },
  { id: "price",    cat: "Pricing Tool",          name: "KneuraPRICE",          tm: "™",   desc: "Quotations & proposal pricing.",
    locked: true, word: "price", href: "https://price.kneuralabs.com", seal: "🏷️", accent: "#D97706" },
  { id: "meet",     cat: "Internal Comms",        name: "KneuraMEET",           tm: "™",   desc: "Meetings & call notes.",
    locked: true, word: "s1ogger$", href: "https://meet.kneuralabs.com", seal: "🎥", accent: "#0D9488" },
  { id: "vigil",    cat: "System Monitoring",     name: "Vigil",                tm: "",    desc: "System health & uptime.",
    locked: true, word: "s1ogger$", href: "https://vigil.kneuralabs.com", seal: "📊", accent: "#9333EA" },
  { id: "stratos",  cat: "Company Strategy Creator", name: "Stratos",           tm: "",    desc: "Strategy planning & roadmaps.",
    locked: true, word: "s1ogger$", href: "https://stratos.kneuralabs.com", seal: "🧭", accent: "#0EA5E9" },
  { id: "nimbus",   cat: "Cloud Storage",         name: "Nimbus",               tm: "",    desc: "Files, assets & storage.",
    locked: true, word: "s1ogger$", href: "https://nimbus.kneuralabs.com", seal: "☁️", accent: "#64748B" },
  { id: "pmo",      cat: "Project Management",    name: "PMO",                  tm: "",    desc: "Project Management Office of Kneuralabs.",
    locked: false, href: "https://pmo.kneuralabs.com", seal: "📋", accent: "#BE185D" },
  { id: "hire",     cat: "Human Resources",       name: "Hire",                 tm: "",    desc: "HR Hiring Portal for Kneuralabs.",
    locked: false, href: "https://hire.kneuralabs.com", seal: "🤝", accent: "#65A30D" },
  { id: "db",       cat: "People & Vendors",      name: "PeopleBase",           tm: "",    desc: "Employee & Vendor Registry.",
    locked: false, href: "https://db.kneuralabs.com", seal: "👥", accent: "#C026D3" },
  { id: "design",   cat: "Design Studio",         name: "Design",               tm: "",    desc: "Creative assets & design workspace.",
    locked: false, href: "https://design.kneuralabs.com", seal: "✏️", accent: "#F59E0B" },
  { id: "synapse",  cat: "AI Workspace",          name: "Synapse",              tm: "",    desc: "Internal AI assistant & knowledge hub.",
    locked: false, href: "https://synapse.kneuralabs.com", seal: "🧠", accent: "#6366F1" },
];

const NEWS = [];  // Populated at runtime from assets/news.json (authentic, refreshed daily by CI).

const WEATHER = {
  kolkata: { temp: 34, cond: "Hot · clear", icon: "☀" },
  connecticut: { temp: 18, cond: "Cloudy · mild", icon: "◐" },
};

const OPEN_TASKS = [
  { title: "Finalise Q2 NIST RMF gap report",       role: "CEO",     project: "KneuraLENS", priority: "high", due: "19 MAY" },
  { title: "Send revised SEA scorecard to Vendor Ops", role: "COO",  project: "SEA",        priority: "high", due: "18 MAY" },
  { title: "Review Trust Charter v3 (draft)",        role: "CTO",     project: "Brand",      priority: "med",  due: "21 MAY" },
  { title: "Reconcile April payments ledger",        role: "Finance", project: "KneuraTRAX", priority: "med",  due: "20 MAY" },
  { title: "Schedule town-hall: AI Act tier-3 brief",role: "CEO",     project: "KneuraCOMM", priority: "low",  due: "23 MAY" },
];

window.TOOLS = TOOLS;
window.NEWS = NEWS;
window.WEATHER = WEATHER;
window.OPEN_TASKS = OPEN_TASKS;
