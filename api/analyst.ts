type AnalystChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type AnalystRequestPayload = {
  fileName: string;
  model?: string;
  mode?: "normal" | "walkthrough";
  selectedElementSummary: string;
  messages: AnalystChatMessage[];
  vfdData: any;
};

type AnalystAnnotationStyle =
  | "focus"
  | "bottleneck"
  | "risk"
  | "opportunity"
  | "change-impact";

type AnalystAnnotationTargetType = "node" | "flow" | "friction" | "loop";

type AnalystAnnotation = {
  targetType: AnalystAnnotationTargetType;
  ids: string[];
  style: AnalystAnnotationStyle;
  label?: string;
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

function buildAnalystInstructions(mode: "normal" | "walkthrough"): string {
  const baseInstructions = [
    "You are Analyst AI for a Value Friction Diagram (VFD).",
    "Your job is to help a process analyst understand the modeled process, identify the main issues, explain why they persist, and suggest useful next analytical steps or intervention ideas.",
    "Use plain process language first. Avoid jargon where possible. Prefer words like step, handoff, delay, rework, approval burden, support work, missing capability, issue, bottleneck, and next step.",
    "You may use VFD terms when useful, but immediately translate them into plain language tied to the actual process.",
    "Do not refer to internal component IDs, raw node IDs, JSON keys, or implementation labels in the user-facing answer unless the user explicitly asks for technical details.",
    "Prefer recognizable step names, document names, team names, and plain descriptions over internal identifiers.",
    "Ground every answer in the current diagram data. Distinguish clearly between what the model directly shows, what you infer, and what you recommend doing next.",
    "Do not invent metrics, facts, or process details not present in the model.",
    "If the model is ambiguous or incomplete, say so explicitly and point out the missing information.",
    "When relevant, explain the VFD concepts in plain language:",
    "Value nodes are core process steps that directly create the intended output.",
    "Enabling nodes are support, coordination, governance, or assurance steps required by the system.",
    "Waste nodes are activities that consume effort without adding value.",
    "Capability nodes represent missing capabilities that could improve the process if introduced.",
    "Flows show how work, documents, decisions, data, or signals move between steps.",
    "Forces are pressures acting on steps; they can help or constrain progress.",
    "Friction points mark hotspots where several constraints converge and value is being lost disproportionately.",
    "Loops show reinforcing or balancing feedback structures that explain persistence over time.",
    "State labels describe the condition of a step under current pressure.",
    "Transformation tags and value labels are semantic descriptors shown in the node band.",
    "Structure your response, when useful, as: what the model shows, what it likely means, and what to do next.",
    "Return only valid JSON with this exact shape: {\"text\":\"string\",\"annotations\":[{\"targetType\":\"node|flow|friction|loop\",\"ids\":[\"existing-id\"],\"style\":\"focus|bottleneck|risk|opportunity|change-impact\",\"label\":\"optional short label\"}]}",
    "Use the text field for the user-facing answer in plain language. Never mention internal IDs in the text field.",
    "Use annotations only when they materially help the explanation. If no highlight is useful, return an empty annotations array.",
    "Only use IDs from the highlightable elements list provided below. Never invent IDs.",
  ];

  const modeInstructions =
    mode === "walkthrough"
      ? [
          "You are in walkthrough mode.",
          "Answer by picking one single focal aspect of the question that is most important to show on the graph.",
          "Do not try to answer the whole question exhaustively.",
          "Keep the response tight and visual. Explain one focal issue, chain, or intervention area only.",
          "In walkthrough mode, structure the text as: Focus, Why it matters, What to look at next.",
          "In walkthrough mode, include 1 or 2 annotation objects when possible, and keep them tightly aligned to the single focal aspect.",
          "Always use explicit numbering for walkthrough annotations and reuse the same numbering in the text, for example 1. Intake issue, 2. Rework hotspot, 3. Downstream effect.",
          "When you provide annotation labels, refer to those exact same labels in the text so the reader can match the explanation to the highlighted elements.",
          "Use short sections with blank lines between them so the walkthrough is easy to scan.",
        ]
      : [
          "You are in normal analysis mode.",
          "You may answer more broadly, but stay grounded in the model.",
          "Use annotations selectively to support the explanation when useful.",
        ];

  return [...baseInstructions, ...modeInstructions].join("\n");
}

function extractAnthropicText(responseJson: any): string {
  const content = Array.isArray(responseJson?.content) ? responseJson.content : [];
  return content
    .filter((item: any) => item?.type === "text" && typeof item.text === "string")
    .map((item: any) => item.text)
    .join("\n\n")
    .trim();
}

function describeMetric(metric: any): string | null {
  if (!metric) return null;
  if (typeof metric === "number" || typeof metric === "string") return String(metric);
  if (metric.value !== undefined && metric.value !== null) {
    return metric.unit ? `${metric.value} ${metric.unit}` : String(metric.value);
  }
  return null;
}

function getNodeLabel(node: any): string {
  return node?.label || node?.sublabel || "Unnamed step";
}

function getFlowLabel(flow: any, labelFor: (id: string | undefined | null) => string): string {
  return flow?.label || `${labelFor(flow?.from)} -> ${labelFor(flow?.to)}`;
}

function normalizeJsonText(rawText: string): string {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return trimmed;
}

function sanitizeAnnotations(rawAnnotations: any, vfdData: any): AnalystAnnotation[] {
  if (!Array.isArray(rawAnnotations)) return [];

  const validStyles = new Set<AnalystAnnotationStyle>([
    "focus",
    "bottleneck",
    "risk",
    "opportunity",
    "change-impact",
  ]);
  const validTargetTypes = new Set<AnalystAnnotationTargetType>(["node", "flow", "friction", "loop"]);
  const allowedIds = {
    node: new Set((Array.isArray(vfdData?.nodes) ? vfdData.nodes : []).map((entry: any) => entry.id)),
    flow: new Set((Array.isArray(vfdData?.flows) ? vfdData.flows : []).map((entry: any) => entry.id)),
    friction: new Set((Array.isArray(vfdData?.frictionPoints) ? vfdData.frictionPoints : []).map((entry: any) => entry.id)),
    loop: new Set((Array.isArray(vfdData?.feedbackLoops) ? vfdData.feedbackLoops : []).map((entry: any) => entry.id)),
  };

  return rawAnnotations
    .slice(0, 4)
    .map((annotation: any) => {
      const targetType = annotation?.targetType;
      const style = annotation?.style;
      if (!validTargetTypes.has(targetType) || !validStyles.has(style)) {
        return null;
      }

      const ids = Array.from(
        new Set(
          (Array.isArray(annotation?.ids) ? annotation.ids : []).filter(
            (id: any) =>
              typeof id === "string" &&
              allowedIds[targetType as AnalystAnnotationTargetType].has(id)
          )
        )
      ).slice(0, 5);

      if (ids.length === 0) {
        return null;
      }

      return {
        targetType,
        ids,
        style,
        label: typeof annotation?.label === "string" ? annotation.label.trim().slice(0, 80) : undefined,
      } satisfies AnalystAnnotation;
    })
    .filter(Boolean) as AnalystAnnotation[];
}

function parseAnalystResponse(rawText: string, vfdData: any): { text: string; annotations: AnalystAnnotation[] } {
  const normalized = normalizeJsonText(rawText);

  try {
    const parsed = JSON.parse(normalized);
    if (typeof parsed?.text === "string") {
      return {
        text: parsed.text.trim(),
        annotations: sanitizeAnnotations(parsed.annotations, vfdData),
      };
    }
  } catch {
    // Fall back to text-only responses.
  }

  return {
    text: rawText.trim(),
    annotations: [],
  };
}

function buildAnalystContext(vfdData: any): string {
  const definition = vfdData?.definition || {};
  const nodes = Array.isArray(vfdData?.nodes) ? vfdData.nodes : [];
  const flows = Array.isArray(vfdData?.flows) ? vfdData.flows : [];
  const forces = Array.isArray(vfdData?.forces) ? vfdData.forces : [];
  const frictions = Array.isArray(vfdData?.frictionPoints) ? vfdData.frictionPoints : [];
  const loops = Array.isArray(vfdData?.feedbackLoops) ? vfdData.feedbackLoops : [];

  const nodeMap = new Map(nodes.map((node: any) => [node.id, node]));
  const labelFor = (id: string | undefined | null) => getNodeLabel(nodeMap.get(id || ""));

  const stepSummaries = nodes.map((node: any) => {
    const parts = [
      getNodeLabel(node),
      node.category ? `category: ${node.category}` : null,
      node.state ? `state: ${node.state}` : null,
      node.transformCharacter ? `transformation: ${node.transformCharacter}` : null,
      node.valueNatures?.length
        ? `value labels: ${node.valueNatures.map((entry: any) => entry?.nature).filter(Boolean).join(", ")}`
        : null,
      node.wasteSpec?.wasteType ? `waste type: ${node.wasteSpec.wasteType}` : null,
      node.capabilitySpec?.kind ? `capability type: ${node.capabilitySpec.kind}` : null,
      node.performer?.role ? `role: ${node.performer.role}` : null,
      node.performer?.team ? `team: ${node.performer.team}` : null,
      describeMetric(node.metrics?.cycleTime) ? `cycle time: ${describeMetric(node.metrics?.cycleTime)}` : null,
      describeMetric(node.metrics?.effort) ? `effort: ${describeMetric(node.metrics?.effort)}` : null,
      describeMetric(node.metrics?.errorRate) ? `error rate: ${describeMetric(node.metrics?.errorRate)}` : null,
    ].filter(Boolean);

    return `- ${parts.join(" | ")}`;
  });

  const flowSummaries = flows.map((flow: any) => {
    const parts = [
      `${labelFor(flow.from)} -> ${labelFor(flow.to)}`,
      flow.label ? `label: ${flow.label}` : null,
      flow.medium ? `medium: ${flow.medium}` : null,
      flow.quality ? `quality: ${flow.quality}` : null,
      flow.trigger ? `trigger: ${flow.trigger}` : null,
    ].filter(Boolean);
    return `- ${parts.join(" | ")}`;
  });

  const forceSummaries = forces.map((force: any) => {
    const parts = [
      `${force.polarity || "constraining"} force on ${labelFor(force.actingOn)}`,
      force.category ? `category: ${force.category}` : null,
      force.subtype ? `subtype: ${force.subtype}` : null,
      force.intensity ? `intensity: ${force.intensity}` : null,
      force.description ? `description: ${force.description}` : null,
    ].filter(Boolean);
    return `- ${parts.join(" | ")}`;
  });

  const frictionSummaries = frictions.map((friction: any) => {
    const affected = Array.isArray(friction.affectedNodes)
      ? friction.affectedNodes.map((id: string) => labelFor(id)).join(", ")
      : null;
    const parts = [
      friction.title || "Unnamed friction point",
      friction.severity ? `severity: ${friction.severity}` : null,
      friction.primaryNode ? `primary step: ${labelFor(friction.primaryNode)}` : null,
      affected ? `affected steps: ${affected}` : null,
      friction.convergence ? `convergence: ${friction.convergence}` : null,
    ].filter(Boolean);
    return `- ${parts.join(" | ")}`;
  });

  const loopSummaries = loops.map((loop: any) => {
    const parts = [
      loop.label || "Unnamed feedback loop",
      loop.polarity ? `polarity: ${loop.polarity}` : null,
      loop.fromNode ? `from: ${labelFor(loop.fromNode)}` : null,
      loop.toNode ? `to: ${labelFor(loop.toNode)}` : null,
      loop.description ? `description: ${loop.description}` : null,
    ].filter(Boolean);
    return `- ${parts.join(" | ")}`;
  });

  const highlightableNodes = nodes.map((node: any) => `- ${node.id}: ${getNodeLabel(node)}`);
  const highlightableFlows = flows.map((flow: any) => `- ${flow.id}: ${getFlowLabel(flow, labelFor)}`);
  const highlightableFrictions = frictions.map(
    (friction: any) => `- ${friction.id}: ${friction.title || "Unnamed friction point"}`
  );
  const highlightableLoops = loops.map((loop: any) => `- ${loop.id}: ${loop.label || "Unnamed feedback loop"}`);

  return [
    "Process framing:",
    `- process name: ${definition.processName || "Unnamed process"}`,
    definition.output ? `- output: ${definition.output}` : null,
    definition.customer ? `- customer: ${definition.customer}` : null,
    definition.valueAtom ? `- value atom: ${definition.valueAtom}` : null,
    definition.valueConfiguration ? `- configuration: ${definition.valueConfiguration}` : null,
    describeMetric(definition.leadTime) ? `- lead time: ${describeMetric(definition.leadTime)}` : null,
    describeMetric(definition.processTime) ? `- process time: ${describeMetric(definition.processTime)}` : null,
    typeof definition.flowEfficiency === "number" ? `- flow efficiency: ${Math.round(definition.flowEfficiency * 100)}%` : null,
    "",
    "Steps:",
    ...stepSummaries,
    "",
    "Flows:",
    ...flowSummaries,
    "",
    "Forces:",
    ...forceSummaries,
    "",
    "Friction points:",
    ...frictionSummaries,
    "",
    "Feedback loops:",
    ...loopSummaries,
    "",
    "Highlightable element IDs for annotations only:",
    "Nodes:",
    ...highlightableNodes,
    "",
    "Flows:",
    ...highlightableFlows,
    "",
    "Friction points:",
    ...highlightableFrictions,
    "",
    "Feedback loops:",
    ...highlightableLoops,
  ]
    .filter(Boolean)
    .join("\n");
}

async function runAnalystRequest(
  payload: AnalystRequestPayload,
  apiKey: string
): Promise<{ text: string; annotations: AnalystAnnotation[] }> {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }

  const mode = payload.mode === "walkthrough" ? "walkthrough" : "normal";

  const systemPrompt = [
    buildAnalystInstructions(mode),
    `Current file: ${payload.fileName}`,
    `Current response mode: ${mode}`,
    payload.selectedElementSummary,
    "Current process model context:",
    buildAnalystContext(payload.vfdData),
  ].join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: payload.model || DEFAULT_MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: payload.messages.map((message) => ({
        role: message.role,
        content: message.text,
      })),
    }),
  });

  const responseJson = await response.json();
  if (!response.ok) {
    throw new Error(responseJson?.error?.message || "Anthropic request failed.");
  }

  const text = extractAnthropicText(responseJson);
  if (!text) {
    throw new Error("No assistant text was returned.");
  }

  return parseAnalystResponse(text, payload.vfdData);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const result = await runAnalystRequest(req.body, process.env.ANTHROPIC_API_KEY || "");
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || "The analyst request failed.",
    });
  }
}
