// data.jsx — content for the KNEURALABS Intranet redesign

const TOOLS = [
  { id: "portal",   cat: "Public Platform",       name: "Official Website",     tm: "",    desc: "Public-facing marketing site.",
    locked: false, href: "https://www.kneuralabs.com", seal: "✦" },
  { id: "beacon",   cat: "Newsletter",            name: "Beacon",               tm: "",    desc: "Company newsletter & updates.",
    locked: false, href: "https://beacon.kneuralabs.com", seal: "✉" },
  { id: "policy",   cat: "Policy & Governance",   name: "Handbook",             tm: "",    desc: "Policies, conduct & governance.",
    locked: false, href: "https://policy.kneuralabs.com", seal: "§" },
  { id: "days",     cat: "Time Tracking",         name: "KneuraDAYS",           tm: "™",   desc: "Time, tasks & weekly logs.",
    locked: true, word: "s1ogger$", href: "https://days.kneuralabs.com", seal: "◷" },
  { id: "sea",      cat: "Supplier Evaluation",   name: "SEA",                  tm: "™",   desc: "Vendor risk & supplier scoring.",
    locked: true, word: "sea", href: "https://sea.kneuralabs.com", seal: "◇" },
  { id: "scope",    cat: "AI Readiness",          name: "KneuraSCOPE",          tm: "™",   desc: "AI maturity & readiness audit.",
    locked: true, word: "kneurascope", href: "https://scope.kneuralabs.com", seal: "◉" },
  { id: "lens",     cat: "Governance Deployment", name: "KneuraLENS",           tm: "™",   desc: "Frameworks, controls & rollout.",
    locked: true, word: "s1ogger$", href: "https://lens.kneuralabs.com", seal: "◬" },
  { id: "audit",    cat: "Audit & Records",       name: "KneurAUDIT",           tm: "™",   desc: "Audit trail & retention ledger.",
    locked: true, word: "s1ogger$", href: "https://audit.kneuralabs.com", seal: "✚" },
  { id: "trax",     cat: "Finance Tracking",      name: "KneuraTRAX",           tm: "™",   desc: "Income, expenses & runway.",
    locked: true, word: "trax", href: "https://trax.kneuralabs.com", seal: "₹" },
  { id: "comm",     cat: "Command Center",        name: "KneuraCOMM",           tm: "™",   desc: "Internal comms & broadcast.",
    locked: true, word: "s1ogger$", href: "https://comm.kneuralabs.com", seal: "◐" },
  { id: "brand",    cat: "Branding",              name: "Brand",                tm: "™",   desc: "Identity, logos & type.",
    locked: false, href: "https://brand.kneuralabs.com", seal: "✱" },
  { id: "price",    cat: "Pricing Tool",          name: "KneuraPRICE",          tm: "™",   desc: "Quotations & proposal pricing.",
    locked: true, word: "price", href: "https://price.kneuralabs.com", seal: "◊" },
  { id: "meet",     cat: "Internal Comms",        name: "KneuraMEET",           tm: "™",   desc: "Meetings & call notes.",
    locked: true, word: "s1ogger$", href: "https://meet.kneuralabs.com", seal: "◎" },
  { id: "vigil",    cat: "System Monitoring",     name: "Vigil",                tm: "",    desc: "System health & uptime.",
    locked: true, word: "s1ogger$", href: "https://vigil.kneuralabs.com", seal: "◭" },
  { id: "stratos",  cat: "Company Strategy Creator", name: "Stratos",           tm: "",    desc: "Strategy planning & roadmaps.",
    locked: true, word: "s1ogger$", href: "https://stratos.kneuralabs.com", seal: "△" },
  { id: "nimbus",   cat: "Cloud Storage",         name: "Nimbus",               tm: "",    desc: "Files, assets & storage.",
    locked: true, word: "s1ogger$", href: "https://nimbus.kneuralabs.com", seal: "☁" },
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
