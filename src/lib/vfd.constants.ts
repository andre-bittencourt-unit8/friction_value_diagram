// Design constants for VFD visualization
// Colors, labels, dimensions, layer configs, etc.

// ── STATE COLORS ──────────────────────────────────────────────────────────
export const STATE_COLORS: Record<string, string> = {
  homeostasis: "#22c55e",      // Green — balanced
  stress: "#eab308",            // Amber — strained
  fragmentation: "#f97316",     // Orange — fragmenting
  implosion: "#ef4444",         // Red — overwhelmed
  explosion: "#ec4899",         // Pink — unconstrained
  void: "#7b8798",              // Muted liquid metal — agentic potential
};

export const STATE_LABELS: Record<string, string> = {
  homeostasis: "Healthy",
  stress: "Strained",
  fragmentation: "Fragmenting",
  implosion: "Overwhelmed",
  explosion: "Unconstrained",
  void: "Missing",
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  homeostasis: "Forces balance, output flows reliably.",
  stress: "Net constraining force, produces under strain.",
  fragmentation: "Coherence lost, splits into informal parts.",
  implosion: "Absorbs complexity without transforming.",
  explosion: "Outputs proliferate without governance.",
  void: "Capability doesn't exist yet.",
};

// ── WASTE TYPE COLORS ─────────────────────────────────────────────────────
export const WASTE_ICON_COLORS: Record<string, string> = {
  queue: "#dc2626",               // Red — waiting
  rework: "#ea580c",              // Orange-red — redoing
  translation: "#d97706",         // Amber — format conversion
  overprocessing: "#7c3aed",      // Purple — excess work
};

export const WASTE_LABELS: Record<string, string> = {
  queue: "Queue",
  rework: "Rework",
  translation: "Translation",
  overprocessing: "Overprocessing",
};

export const WASTE_DESCRIPTIONS: Record<string, string> = {
  queue: "Work waiting for a resource. Metric: cycleTime > effort.",
  rework: "Redoing completed work due to defects or changes.",
  translation: "Format/medium conversion adding no information.",
  overprocessing: "Work beyond what the output requires.",
};

// ── FLOW QUALITY COLORS ───────────────────────────────────────────────────
export const QUALITY_COLORS: Record<string, string> = {
  good: "#22c55e",                // Green
  degraded: "#eab308",            // Amber
  broken: "#ef4444",              // Red
};

// ── FORCE CATEGORY COLORS ────────────────────────────────────────────────
export const FORCE_CATEGORY_COLORS: Record<string, string> = {
  org: "#6366f1",               // Indigo — organisational
  system: "#06b6d4",            // Cyan — systems
  info: "#8b5cf6",              // Violet — information
  gov: "#f43f5e",               // Rose — governance
  process: "#f97316",           // Orange — process
  cultural: "#84cc16",          // Lime — cultural
};

export const FORCE_CATEGORY_LABELS: Record<string, string> = {
  org: "Organisational",
  system: "Systems",
  info: "Information",
  gov: "Governance",
  process: "Process",
  cultural: "Cultural",
};

export const FORCE_SUBTYPES: Record<string, string[]> = {
  org: ["staffing", "expertise", "ownership", "team_boundary", "key_person", "availability", "motivation"],
  system: ["capability", "integration", "accessibility", "performance", "data_quality", "vendor_lock", "technical_debt"],
  info: ["format", "completeness", "currency", "consistency", "discoverability", "provenance", "interpretability"],
  gov: ["regulatory", "internal_policy", "approval_gate", "audit_trail", "scope_definition", "escalation_rules", "delegation_rules"],
  process: ["sequence", "batch_size", "handoff_protocol", "feedback_speed", "parallelism", "trigger_model", "cadence"],
  cultural: ["habit", "risk_appetite", "perfectionism", "blame_avoidance", "silo_mentality", "deference", "urgency_culture"],
};

// ── VALUE NATURES ────────────────────────────────────────────────────────
export const VALUE_NATURE_LABELS: Record<string, string> = {
  knowledge_generation: "Knowledge Generation",
  artifact_production: "Artifact Production",
  risk_reduction: "Risk Reduction",
  alignment: "Alignment",
  commitment: "Commitment",
  capability_enablement: "Capability Enablement",
};

export const VALUE_NATURE_DESCRIPTIONS: Record<string, string> = {
  knowledge_generation: "Closing the gap from 'don't know' to 'know'. Expected waste: rework.",
  artifact_production: "Closing the gap from 'doesn't exist' to 'exists'. Expected waste: translation.",
  risk_reduction: "Closing the gap from 'uncertain' to 'certain'. Expected waste: overprocessing.",
  alignment: "Closing the gap from 'disconnected' to 'coherent'. Expected waste: queue.",
  commitment: "Closing the gap from 'provisional' to 'binding'. Expected waste: queue.",
  capability_enablement: "Closing the gap from 'possible' to 'operational'. Expected waste: rework.",
};

export const TRANSFORM_CHARACTER_COLORS: Record<string, string> = {
  analytical: "#475569",
  interpretive: "#7c3aed",
  integrative: "#0f766e",
  generative: "#16a34a",
  evaluative: "#b45309",
  procedural: "#2563eb",
};

// ── ORG RELATIONS ─────────────────────────────────────────────────────────
export const ORG_RELATIONS: Record<string, string> = {
  embedded: "Embedded",
  aligned: "Aligned",
  matrixed: "Matrixed",
  service: "Service",
  contracted: "Contracted",
  regulatory: "Regulatory",
};

export const ORG_RELATION_DESCRIPTIONS: Record<string, string> = {
  embedded: "Direct — same team/manager. Minimal queue waste.",
  aligned: "Influence — different team, same function. Low-moderate queue.",
  matrixed: "Request only — different function, same project. HIGH queue.",
  service: "None — shared service, queue-based. HIGH queue.",
  contracted: "Contractual — external vendor/CRO. VERY HIGH queue.",
  regulatory: "Zero — external authority. Fixed constraints.",
};

// ── LEVERAGE TYPES ───────────────────────────────────────────────────────
export const LEVERAGE_TYPES = ["automate", "restructure", "eliminate", "instrument", "decouple"];

// ── NODE DIMENSIONS ──────────────────────────────────────────────────────
export const NODE_WIDTH = 188;            // NW
export const NODE_HEIGHT = 62;            // NH
export const WASTE_WIDTH = 176;           // WW
export const WASTE_HEIGHT = 62;           // WH
export const FRICTION_BADGE_RADIUS = 12;

// ── BORDERS & FILLS ──────────────────────────────────────────────────────
export const WASTE_BORDER = "#a8a29e";
export const WASTE_STRIPE = "#78716c";
export const VALUE_TINT = "#f0fdf4";      // Light green background for value nodes
export const ENABLING_TINT = "#f0f9ff";   // Light blue background for enabling nodes
export const WASTE_TINT = "#fff1f2";      // Light rose background for waste nodes
export const AGENTIC_TINT = "#eef2f7";    // Muted liquid-metal background
export const AGENTIC_BORDER = "#aeb8c7";  // Steel border
export const AGENTIC_BAND = "#f8fafc";    // Brushed-metal inset band
export const AGENTIC_TEXT = "#5b6778";    // Steel text
export const AGENTIC_ACCENT = "#7b8798";  // Muted metal accent
export const CAPABILITY_KIND_LABELS: Record<string, string> = {
  integration: "Integration",
  automation: "Automation",
  copilot: "Copilot",
};
export const CAPABILITY_KIND_DESCRIPTIONS: Record<string, string> = {
  integration: "Connects systems or artifacts so value can propagate without manual translation.",
  automation: "Executes a repetitive control or workflow step without human chasing or handwork.",
  copilot: "Assists human work with generated drafts, summaries, or interpretation support.",
};

// ── LAYERS CONFIGURATION ─────────────────────────────────────────────────
export const LAYERS = [
  {
    id: "value",
    label: "Value",
    icon: "🎯",
    key: "value",
    question: "What creates value?",
    action: "Do this better",
    description: "Essential transformations that directly create customer value.",
  },
  {
    id: "enabling",
    label: "Enabling",
    icon: "⚙️",
    key: "enabling",
    question: "What does the system require?",
    action: "Same assurance, less effort",
    description: "Governance, coordination, infrastructure — necessary but not directly valued by customer.",
  },
  {
    id: "waste",
    label: "Waste",
    icon: "⚠️",
    key: "waste",
    question: "Where does capacity leak?",
    action: "Eliminate this",
    description: "Queue, rework, translation, overprocessing. Consumes capacity without creating value.",
  },
  {
    id: "friction",
    label: "Friction",
    icon: "🔥",
    key: "friction",
    question: "Where should we act?",
    action: "Intervene here",
    description: "Where forces converge to destroy value. Highest-leverage intervention points.",
  },
  {
    id: "loops",
    label: "Loops",
    icon: "🔄",
    key: "loops",
    question: "Why does it persist?",
    action: "Break this cycle",
    description: "Feedback loops that lock in dysfunction (reinforcing or balancing).",
  },
  {
    id: "voids",
    label: "Capability",
    icon: "◯",
    key: "voids",
    question: "What capability is missing?",
    action: "Build or integrate this",
    description: "Missing future capabilities such as integrations, automations, and AI copilots.",
  },
];

// ── FRICTION SEVERITY COLORS ─────────────────────────────────────────────
export const FRICTION_SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",      // Red
  high: "#f97316",          // Orange
  moderate: "#eab308",      // Amber
  low: "#6b7280",           // Gray
};

// ── AGENT TYPE ICONS ────────────────────────────────────────────────────
export const AGENT_MATURITY_COLORS: Record<string, string> = {
  conceptual: "#c4ccd8",      // Brushed steel — idea stage
  prototype: "#aeb8c7",       // Alloy — proof of concept
  pilot: "#8da0b6",           // Blue steel — limited deployment
  production: "#73839a",      // Gunmetal — live
  scaled: "#5b6778",          // Dark chrome — widespread
};

// ── TRANSFORM CHARACTERS ────────────────────────────────────────────────
export const TRANSFORM_CHARACTER_LABELS: Record<string, string> = {
  analytical: "Analytical",
  interpretive: "Interpretive",
  integrative: "Integrative",
  evaluative: "Evaluative",
  procedural: "Procedural",
  generative: "Generative",
};

// ── FLOW MEDIUMS ────────────────────────────────────────────────────────
export const FLOW_MEDIUM_LABELS: Record<string, string> = {
  data: "Data",
  document: "Document",
  decision: "Decision",
  signal: "Signal",
};

// ── CONNECTION AUTHORITY ──────────────────────────────────────────────────
export const CONNECTION_AUTHORITY_LEVELS = ["direct", "influence", "request", "negotiate", "none"];

// ── LAYOUT CONSTANTS ──────────────────────────────────────────────────────
export const LAYOUT = {
  COL_SPACING: 195,           // Horizontal gap between value spine columns
  VALUE_Y: 280,               // Y position for value spine nodes
  ENABLING_Y: 100,            // Y position for enabling nodes (above)
  WASTE_Y: 455,               // Y position for waste nodes (below)
  START_X: 60,                // Left margin
  MIN_GAP: 15,                // Minimum gap between nodes in same row
};

// ── SVG CONSTANTS ──────────────────────────────────────────────────────
export const SVG = {
  WIDTH: 1200,
  HEIGHT: 600,
  PADDING: 20,
  GRID_CELL: 20,
};

// ── INTERACTION CONSTANTS ──────────────────────────────────────────────
export const INTERACTION = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3,
  ZOOM_STEP: 1.2,
  DOUBLE_CLICK_DELAY: 300,
  HOVER_DEBOUNCE: 50,
};
