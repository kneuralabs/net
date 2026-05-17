// data.jsx — content for the KNEURALABS Intranet redesign

const TOOLS = [
  { id: "portal",   cat: "Public Platform",       name: "Official Website",     tm: "",    desc: "Public-facing marketing site.",
    locked: false, href: "https://kneuralabs.github.io/portal/", seal: "✦" },
  { id: "policy",   cat: "Policy & Governance",   name: "Handbook",             tm: "",    desc: "Policies, conduct & governance.",
    locked: false, href: "https://kneuralabs.github.io/policy/", seal: "§" },
  { id: "days",     cat: "Time Tracking",         name: "KneuraDAYS",           tm: "™",   desc: "Time, tasks & weekly logs.",
    locked: false, href: "https://kneuralabs.github.io/kneuradays/", seal: "◷" },
  { id: "sea",      cat: "Supplier Evaluation",   name: "SEA",                  tm: "™",   desc: "Vendor risk & supplier scoring.",
    locked: true, word: "sea", href: "https://kneuralabs.github.io/sea/", seal: "◇" },
  { id: "scope",    cat: "AI Readiness",          name: "KneuraSCOPE",          tm: "™",   desc: "AI maturity & readiness audit.",
    locked: true, word: "kneurascope", href: "https://kneuralabs.github.io/scope/", seal: "◉" },
  { id: "lens",     cat: "Governance Deployment", name: "KneuraLENS",           tm: "™",   desc: "Frameworks, controls & rollout.",
    locked: true, word: "s1ogger$", href: "https://kneuralabs.github.io/lens/", seal: "◬" },
  { id: "audit",    cat: "Audit & Records",       name: "KneurAUDIT",           tm: "™",   desc: "Audit trail & retention ledger.",
    locked: true, word: "s1ogger$", href: "https://kneuralabs.github.io/audit/", seal: "✚" },
  { id: "trax",     cat: "Finance Tracking",      name: "KneuraTRAX",           tm: "™",   desc: "Income, expenses & runway.",
    locked: true, word: "trax", href: "https://kneuralabs.github.io/trax/", seal: "₹" },
  { id: "comm",     cat: "Command Center",        name: "KneuraCOMM",           tm: "™",   desc: "Internal comms & broadcast.",
    locked: true, word: "s1ogger$", href: "https://kneuralabs.github.io/comm/", seal: "◐" },
  { id: "brand",    cat: "Branding",              name: "Brand",                tm: "™",   desc: "Identity, logos & type.",
    locked: false, href: "https://kneuralabs.github.io/brand/", seal: "✱" },
  { id: "price",    cat: "Pricing Tool",          name: "KneuraPRICE",          tm: "™",   desc: "Quotations & proposal pricing.",
    locked: true, word: "price", href: "https://kneuralabs.github.io/price/", seal: "◊" },
  { id: "meet",     cat: "Internal Comms",        name: "KneuraMEET",           tm: "™",   desc: "Meetings & call notes.",
    locked: false, href: "https://kneuralabs.github.io/meet/", seal: "◎" },
];

const NEWS = [
  {
    date: "17 MAY 2026", chip: "Regulation",
    title: "EU AI Act — Tier-3 enforcement window opens, first GPAI fines expected within the quarter.",
    src: "European Commission · Brussels", tag: "Reuters",
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
  },
  {
    date: "16 MAY 2026", chip: "Framework",
    title: "NIST releases AI RMF 1.2 draft; comment period closes 28 June. Focus on agentic system risk.",
    src: "NIST · Gaithersburg", tag: "Federal Register",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    date: "15 MAY 2026", chip: "Industry",
    title: "Anthropic, Google DeepMind and OpenAI submit joint pre-deployment evaluation report to UK AISI.",
    src: "AI Safety Institute · London", tag: "Press Briefing",
    url: "https://www.aisi.gov.uk/",
  },
  {
    date: "14 MAY 2026", chip: "Policy",
    title: "OECD AI Principles refresh — second consultation phase invites private-sector position papers.",
    src: "OECD.AI · Paris", tag: "Consultation",
    url: "https://oecd.ai/en/ai-principles",
  },
  {
    date: "13 MAY 2026", chip: "Domestic",
    title: "MeitY publishes draft framework for high-risk AI systems; industry response window 60 days.",
    src: "MeitY · New Delhi", tag: "Gazette",
    url: "https://www.meity.gov.in/",
  },
  {
    date: "12 MAY 2026", chip: "Audit",
    title: "ISO/IEC 42001 — first cohort of certified AI management systems published; 14 firms certified.",
    src: "ISO · Geneva", tag: "Registry",
    url: "https://www.iso.org/standard/81230.html",
  },
];

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
