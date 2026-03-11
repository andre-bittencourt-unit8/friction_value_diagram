// VFD JSON Validation — checks schema compliance and data integrity

export interface ValidationIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean; // true if no blocking errors
  issues: ValidationIssue[];
  stats: {
    nodes: number;
    valueNodes: number;
    enablingNodes: number;
    wasteNodes: number;
    capabilityNodes: number;
    flows: number;
    forces: number;
    frictionPoints: number;
    feedbackLoops: number;
    capabilityProfiles: number;
    droppedFlows: number;
    droppedForces: number;
  };
  cleaned: any;
}

const VALID_CATEGORIES = ["value", "enabling", "waste", "capability"];
const VALID_STATES = ["homeostasis", "stress", "fragmentation", "implosion", "explosion", "void"];
const VALID_WASTE_TYPES = ["queue", "rework", "translation", "overprocessing"];
const VALID_MEDIUMS = ["data", "document", "decision", "signal"];
const VALID_QUALITIES = ["good", "degraded", "broken"];
const VALID_LAYERS = ["spine", "enabling", "waste", "void"];
const VALID_ORG_RELATIONS = ["embedded", "aligned", "matrixed", "service", "contracted", "regulatory"];
const VALID_FORCE_CATS = ["org", "system", "info", "gov", "process", "cultural"];
const VALID_VALUE_NATURES = [
  "knowledge_generation", "artifact_production", "risk_reduction",
  "alignment", "commitment", "capability_enablement",
];
const VALID_CAPABILITY_KINDS = ["integration", "automation", "copilot"];

function err(path: string, message: string): ValidationIssue {
  return { severity: "error", path, message };
}
function warn(path: string, message: string): ValidationIssue {
  return { severity: "warning", path, message };
}

export function validate(raw: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ── Top-level structure ────────────────────────────────────────────────────
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      valid: false,
      issues: [err("root", "File is not a JSON object.")],
      stats: { nodes: 0, valueNodes: 0, enablingNodes: 0, wasteNodes: 0, capabilityNodes: 0, flows: 0, forces: 0, frictionPoints: 0, feedbackLoops: 0, capabilityProfiles: 0, droppedFlows: 0, droppedForces: 0 },
      cleaned: null,
    };
  }

  const d = raw as any;

  // ── Arrays required ────────────────────────────────────────────────────────
  if (!Array.isArray(d.nodes)) {
    issues.push(err("nodes", 'Missing required "nodes" array.'));
  }
  if (!Array.isArray(d.flows)) {
    issues.push(err("flows", 'Missing required "flows" array.'));
  }

  // Abort early if critical errors
  if (issues.some(i => i.severity === "error")) {
    return { valid: false, issues, stats: { nodes: 0, valueNodes: 0, enablingNodes: 0, wasteNodes: 0, capabilityNodes: 0, flows: 0, forces: 0, frictionPoints: 0, feedbackLoops: 0, capabilityProfiles: 0, droppedFlows: 0, droppedForces: 0 }, cleaned: null };
  }

  // ── Definition ─────────────────────────────────────────────────────────────
  if (!d.definition || typeof d.definition !== "object") {
    issues.push(warn("definition", "No process definition found. Process name and metadata will be empty."));
  } else {
    const def = d.definition;
    if (!def.processName) issues.push(warn("definition.processName", "Process name is not set."));
    if (!def.customer) issues.push(warn("definition.customer", "Customer is not defined — the value atom will lack context."));
    if (!def.valueAtom) issues.push(warn("definition.valueAtom", "Value atom is not defined — the fundamental unit of value is unknown."));
  }

  // ── Nodes ──────────────────────────────────────────────────────────────────
  const nodeIds = new Set<string>();
  const goodNodes: any[] = [];

  for (let i = 0; i < d.nodes.length; i++) {
    const n = d.nodes[i];
    const p = `nodes[${i}]`;

    if (!n || typeof n !== "object") { issues.push(err(p, "Node is not an object.")); continue; }
    if (!n.id || typeof n.id !== "string") { issues.push(err(p, "Node is missing a string 'id'.")); continue; }

    const np = `nodes.${n.id}`;
    if (nodeIds.has(n.id)) { issues.push(err(np, `Duplicate node id "${n.id}".`)); continue; }
    nodeIds.add(n.id);

    if (!n.label) issues.push(warn(np, `Node "${n.id}" has no label.`));
    if (!n.category) {
      issues.push(warn(np, `Node "${n.id}" has no category — will be inferred as "value".`));
    } else if (!VALID_CATEGORIES.includes(n.category)) {
      issues.push(warn(np, `Node "${n.id}" has unknown category "${n.category}".`));
    }

    if (n.category !== "waste" && n.category !== "capability" && n.state && !VALID_STATES.includes(n.state)) {
      issues.push(warn(np, `Node "${n.id}" has unknown state "${n.state}".`));
    }

    const normalizedCategory = n.category || (n.state === "void" ? "capability" : n.id?.startsWith("en") ? "enabling" : n.id?.startsWith("wn") ? "waste" : "value");
    if (normalizedCategory === "capability" && n.capabilitySpec?.kind && !VALID_CAPABILITY_KINDS.includes(n.capabilitySpec.kind)) {
      issues.push(warn(np, `Capability node "${n.id}" has unknown capability kind "${n.capabilitySpec.kind}".`));
    }

    if (n.category === "waste" && n.wasteSpec?.wasteType && !VALID_WASTE_TYPES.includes(n.wasteSpec.wasteType)) {
      issues.push(warn(np, `Waste node "${n.id}" has unknown wasteType "${n.wasteSpec.wasteType}".`));
    }

    if (n.performer?.orgRelation && !VALID_ORG_RELATIONS.includes(n.performer.orgRelation)) {
      issues.push(warn(np, `Node "${n.id}" has unknown orgRelation "${n.performer.orgRelation}".`));
    }

    if (n.valueNatures && Array.isArray(n.valueNatures)) {
      n.valueNatures.forEach((vn: any, j: number) => {
        if (vn.nature && !VALID_VALUE_NATURES.includes(vn.nature)) {
          issues.push(warn(`${np}.valueNatures[${j}]`, `Unknown value nature "${vn.nature}".`));
        }
      });
    }

    goodNodes.push(n);
  }

  if (goodNodes.filter(n => (n.category === "value" || !n.category) && n.state !== "void").length === 0) {
    issues.push(warn("nodes", "No value-category spine nodes found. The diagram will show no value spine."));
  }

  // ── Flows ──────────────────────────────────────────────────────────────────
  const goodFlows: any[] = [];
  let droppedFlows = 0;

  for (let i = 0; i < d.flows.length; i++) {
    const f = d.flows[i];
    const p = `flows[${i}]`;

    if (!f || !f.id || !f.from || !f.to) { issues.push(warn(p, "Flow missing id, from, or to — skipped.")); droppedFlows++; continue; }

    if (!nodeIds.has(f.from)) { issues.push(warn(`flows.${f.id}`, `Flow "${f.id}" references unknown source node "${f.from}" — skipped.`)); droppedFlows++; continue; }
    if (!nodeIds.has(f.to)) { issues.push(warn(`flows.${f.id}`, `Flow "${f.id}" references unknown target node "${f.to}" — skipped.`)); droppedFlows++; continue; }

    if (f.medium && !VALID_MEDIUMS.includes(f.medium)) issues.push(warn(`flows.${f.id}`, `Unknown medium "${f.medium}".`));
    if (f.quality && !VALID_QUALITIES.includes(f.quality)) issues.push(warn(`flows.${f.id}`, `Unknown quality "${f.quality}".`));
    if (f.layer && !VALID_LAYERS.includes(f.layer)) issues.push(warn(`flows.${f.id}`, `Unknown layer "${f.layer}".`));

    goodFlows.push(f);
  }

  // ── Forces ─────────────────────────────────────────────────────────────────
  const rawForces = Array.isArray(d.forces) ? d.forces : [];
  const goodForces: any[] = [];
  let droppedForces = 0;

  for (let i = 0; i < rawForces.length; i++) {
    const f = rawForces[i];
    if (!f?.id || !f.actingOn) { droppedForces++; continue; }
    if (!nodeIds.has(f.actingOn)) { issues.push(warn(`forces.${f.id}`, `Force "${f.id}" references unknown node "${f.actingOn}" — skipped.`)); droppedForces++; continue; }
    if (f.category && !VALID_FORCE_CATS.includes(f.category)) issues.push(warn(`forces.${f.id}`, `Unknown force category "${f.category}".`));
    goodForces.push(f);
  }

  // ── Friction points ────────────────────────────────────────────────────────
  const rawFPs = Array.isArray(d.frictionPoints) ? d.frictionPoints : [];
  const goodFPs = rawFPs.filter((fp: any) => fp?.id && fp.primaryNode && nodeIds.has(fp.primaryNode));

  // ── Feedback loops ─────────────────────────────────────────────────────────
  const rawLoops = Array.isArray(d.feedbackLoops) ? d.feedbackLoops : [];
  const goodLoops = rawLoops.filter((lp: any) => lp?.id && lp.fromNode && lp.toNode && nodeIds.has(lp.fromNode) && nodeIds.has(lp.toNode));

  // ── Capability profiles ────────────────────────────────────────────────────
  const capabilityProfiles = Array.isArray(d.capabilityProfiles)
    ? d.capabilityProfiles.filter((a: any) => a?.id)
    : Array.isArray(d.agentProfiles)
      ? d.agentProfiles.filter((a: any) => a?.id)
      : [];

  // ── Friction themes ────────────────────────────────────────────────────────
  const frictionThemes = Array.isArray(d.frictionThemes) ? d.frictionThemes : [];

  // ── Build cleaned data ─────────────────────────────────────────────────────
  const cleaned = {
    schema: d.schema || "vfd-v5.2",
    definition: d.definition || { processName: "", version: "1.0", output: "", customer: "", valueAtom: "", valueConfiguration: "chain", configurationNotes: "", trigger: "", endpoint: "", dimensions: [], leadTime: { value: 0, unit: "days" }, processTime: { value: 0, unit: "days" }, flowEfficiency: 0, segments: [], phases: [] },
    nodes: goodNodes.map(n => ({
      ...n,
      x: Number(n.x) || 0,
      y: Number(n.y) || 0,
      category: n.category || (n.state === "void" ? "capability" : n.id?.startsWith("en") ? "enabling" : n.id?.startsWith("wn") ? "waste" : "value"),
      state:
        (n.category || (n.state === "void" ? "capability" : null)) === "capability"
          ? null
          : n.state || (n.category !== "waste" ? "stress" : null),
      capabilitySpec:
        (n.category === "capability" || n.state === "void")
          ? {
              kind: n.capabilitySpec?.kind || "automation",
              maturity: n.capabilitySpec?.maturity || "conceptual",
              profileId: n.capabilitySpec?.profileId || null,
            }
          : n.capabilitySpec,
      metrics: n.metrics || {},
    })),
    flows: goodFlows.map(f => ({
      ...f,
      layer: f.layer || "spine",
      quality: f.quality || "good",
      medium: f.medium || "data",
      trigger: f.trigger || "push",
    })),
    forces: goodForces,
    frictionPoints: goodFPs,
    frictionThemes,
    feedbackLoops: goodLoops,
    capabilityProfiles,
    activeLayers: d.activeLayers || [],
    selectedElement: null,
  };

  const valueNodes = goodNodes.filter(n => n.category === "value" && n.state !== "void").length;
  const enablingNodes = goodNodes.filter(n => n.category === "enabling").length;
  const wasteNodes = goodNodes.filter(n => n.category === "waste").length;
  const capabilityNodes = goodNodes.filter(n => n.category === "capability" || n.state === "void").length;

  return {
    valid: !issues.some(i => i.severity === "error"),
    issues,
    stats: {
      nodes: goodNodes.length,
      valueNodes,
      enablingNodes,
      wasteNodes,
      capabilityNodes,
      flows: goodFlows.length,
      forces: goodForces.length,
      frictionPoints: goodFPs.length,
      feedbackLoops: goodLoops.length,
      capabilityProfiles: capabilityProfiles.length,
      droppedFlows,
      droppedForces,
    },
    cleaned,
  };
}
