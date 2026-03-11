import React, { useEffect, useMemo, useState } from "react";
import {
  AGENTIC_ACCENT,
  AGENTIC_TINT,
  CAPABILITY_KIND_DESCRIPTIONS,
  CAPABILITY_KIND_LABELS,
  FLOW_MEDIUM_LABELS,
  FORCE_CATEGORY_COLORS,
  FORCE_CATEGORY_LABELS,
  FRICTION_SEVERITY_COLORS,
  ORG_RELATION_DESCRIPTIONS,
  ORG_RELATIONS,
  QUALITY_COLORS,
  STATE_COLORS,
  STATE_DESCRIPTIONS,
  STATE_LABELS,
  TRANSFORM_CHARACTER_COLORS,
  TRANSFORM_CHARACTER_LABELS,
  VALUE_NATURE_DESCRIPTIONS,
  VALUE_NATURE_LABELS,
  WASTE_DESCRIPTIONS,
  WASTE_ICON_COLORS,
  WASTE_LABELS,
} from "../lib/vfd.constants";
import {
  OrgRelationBadge,
  SeverityBadge,
  StateColorSwatch,
  WasteIcon,
} from "./VFDIcons";

interface InspectPanelProps {
  element: any;
  elementType: string | null;
  vfdData: any;
  onElementChange: (elementType: string, elementId: string, changes: Record<string, any>) => void;
  readOnly?: boolean;
}

const STATE_OPTIONS = ["homeostasis", "stress", "fragmentation", "implosion", "explosion", "void"];
const WASTE_OPTIONS = ["queue", "rework", "translation", "overprocessing"];
const FLOW_QUALITY_OPTIONS = ["good", "degraded", "broken"];
const FLOW_TRIGGER_OPTIONS = ["push", "event", "automated"];
const VALUE_NATURE_OPTIONS = Object.keys(VALUE_NATURE_LABELS);
const FORCE_POLARITY_OPTIONS = ["enabling", "constraining"];
const FORCE_CHANGEABILITY_OPTIONS = ["local", "near-term", "structural"];
const TRANSFORM_CHARACTER_DESCRIPTIONS: Record<string, string> = {
  analytical: "Works by rule-based analysis, decomposition, and evidence inspection.",
  interpretive: "Works by expert judgement, reading signals, and making sense of ambiguity.",
  integrative: "Works by combining multiple inputs into a coherent whole.",
  generative: "Works by creating new content, language, or form from prior inputs.",
  evaluative: "Works by assessing quality, fit, or adequacy against a standard.",
  procedural: "Works by executing a defined sequence of steps reliably.",
};
const toSystemProperty = (value: string | null | undefined): string => (value || "").toUpperCase();
const FLOW_QUALITY_DESCRIPTIONS: Record<string, string> = {
  good: "Value is propagating cleanly to the next step.",
  degraded: "Value propagates, but with loss, delay, or interpretation burden.",
  broken: "Value is not reaching the next step in a usable way.",
};
const FLOW_MEDIUM_DESCRIPTIONS: Record<string, string> = {
  data: "Structured information passed in a machine- or table-like form.",
  document: "A document or artifact being handed forward for use.",
  decision: "A judgement, approval, or checkpoint that gates progress.",
  signal: "A lightweight cue, notification, or coordination signal.",
};
const FLOW_TRIGGER_DESCRIPTIONS: Record<string, string> = {
  push: "The source step pushes this forward when ready.",
  event: "This flow happens when a triggering event occurs.",
  automated: "This propagation is triggered automatically by the system.",
};

const panelStyles = {
  section: {
    padding: "0 0 14px 0",
    marginBottom: 14,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #dbe3ef",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 10,
  } as React.CSSProperties,
  editor: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #94a3b8",
    fontSize: 12,
    color: "#0f172a",
    background: "#fff",
  } as React.CSSProperties,
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={panelStyles.section}>
      <div style={panelStyles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function MetaChip({
  label,
  value,
  tone = "#e2e8f0",
  text = "#0f172a",
}: {
  label: string;
  value: string;
  tone?: string;
  text?: string;
}): React.ReactElement {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: tone,
        color: text,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PropertyCard({
  label,
  value,
  accent = "#e2e8f0",
  valueColor = "#0f172a",
  hint,
  children,
  onActivate,
  isEditing = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  valueColor?: string;
  hint?: string;
  children?: React.ReactNode;
  onActivate?: () => void;
  isEditing?: boolean;
}): React.ReactElement {
  return (
    <div
      onClick={onActivate}
      style={{
        padding: 12,
        borderRadius: 12,
        borderLeft: `4px solid ${accent}`,
        borderTop: "1px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        background: isEditing ? "#ffffff" : "#f8fafc",
        marginBottom: 10,
        cursor: onActivate ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: valueColor, lineHeight: 1.4 }}>{value}</div>
      {hint && <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  );
}

function formatMetric(metric: any): string | null {
  if (!metric || metric.value === undefined || metric.value === null) return null;
  const value = typeof metric.value === "number" ? String(metric.value) : metric.value;
  return metric.unit ? `${value} ${metric.unit}` : String(value);
}

function InlineEditField({
  label,
  display,
  value,
  onCommit,
  accent,
  valueColor,
  hint,
}: {
  label: string;
  display: React.ReactNode;
  value: string;
  onCommit: (value: string) => void;
  accent?: string;
  valueColor?: string;
  hint?: string;
}): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  };

  return (
    <PropertyCard
      label={label}
      value={display}
      accent={accent}
      valueColor={valueColor}
      hint={hint}
      onActivate={editing ? undefined : () => setEditing(true)}
      isEditing={editing}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ ...panelStyles.editor, marginTop: 10 }}
        />
      ) : null}
    </PropertyCard>
  );
}

function InlineEditArea({
  label,
  display,
  value,
  onCommit,
  accent,
}: {
  label: string;
  display: React.ReactNode;
  value: string;
  onCommit: (value: string) => void;
  accent?: string;
}): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  return (
    <PropertyCard
      label={label}
      value={display}
      accent={accent}
      onActivate={editing ? undefined : () => setEditing(true)}
      isEditing={editing}
    >
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          rows={4}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== value) onCommit(draft);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ ...panelStyles.editor, marginTop: 10, resize: "vertical" }}
        />
      ) : null}
    </PropertyCard>
  );
}

function InlineEditSelect({
  label,
  display,
  value,
  options,
  onCommit,
  accent,
  valueColor,
  hint,
}: {
  label: string;
  display: React.ReactNode;
  value: string;
  options: Array<{ value: string; label: string }>;
  onCommit: (value: string) => void;
  accent?: string;
  valueColor?: string;
  hint?: string;
}): React.ReactElement {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [value]);

  return (
    <PropertyCard
      label={label}
      value={display}
      accent={accent}
      valueColor={valueColor}
      hint={hint}
      onActivate={editing ? undefined : () => setEditing(true)}
      isEditing={editing}
    >
      {editing ? (
        <select
          autoFocus
          value={value}
          onChange={(e) => {
            onCommit(e.target.value);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          onClick={(e) => e.stopPropagation()}
          style={{ ...panelStyles.editor, marginTop: 10 }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </PropertyCard>
  );
}

export default function InspectPanel({
  element,
  elementType,
  vfdData,
  onElementChange,
  readOnly = false,
}: InspectPanelProps): React.ReactElement {
  const [editMode, setEditMode] = useState(false);

  const nodeMap = useMemo(() => {
    const map: Record<string, any> = {};
    vfdData.nodes?.forEach((node: any) => {
      map[node.id] = node;
    });
    return map;
  }, [vfdData.nodes]);

  const nodeOptions = useMemo(
    () => (vfdData.nodes || []).map((node: any) => ({ value: node.id, label: node.label || node.id })),
    [vfdData.nodes]
  );

  const allForces = vfdData.forces || [];
  const allFrictions = vfdData.frictionPoints || [];
  const allLoops = vfdData.feedbackLoops || [];

  useEffect(() => {
    setEditMode(false);
  }, [element?.id, elementType]);

  useEffect(() => {
    if (readOnly) {
      setEditMode(false);
    }
  }, [readOnly]);

  if (!element || !elementType) {
    return (
      <div style={{ paddingTop: 28, color: "#64748b" }}>
        <Section title="Inspect">
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Nothing selected</div>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            Select any node, flow, friction point, or loop to inspect it and edit its properties.
          </div>
        </Section>
      </div>
    );
  }

  if (elementType === "node") {
    const node = element;
    const isWaste = node.category === "waste";
    const isVoid = node.category === "capability" || node.state === "void";
    const wasteType = node.wasteSpec?.wasteType || "queue";
    const state = node.state || "stress";
    const capabilityKind = node.capabilitySpec?.kind || "automation";
    const stateColor = isVoid ? AGENTIC_ACCENT : STATE_COLORS[state] || "#94a3b8";
    const performerRelation = node.performer?.orgRelation || "embedded";
    const primaryNature =
      (node.valueNatures || []).find((entry: any) => entry?.isPrimary)?.nature || node.valueNatures?.[0]?.nature || "";
    const nodeForces = allForces.filter((force: any) => force.actingOn === node.id);
    const helpingForces = nodeForces.filter((force: any) => force.polarity === "enabling");
    const hinderingForces = nodeForces.filter((force: any) => force.polarity !== "enabling");
    const helpingIntensity = helpingForces.reduce((sum: number, force: any) => sum + (force.intensity || 1), 0);
    const hinderingIntensity = hinderingForces.reduce((sum: number, force: any) => sum + (force.intensity || 1), 0);
    const totalForceIntensity = Math.max(1, helpingIntensity + hinderingIntensity);
    const cycleTime = formatMetric(node.metrics?.cycleTime);
    const effort = formatMetric(node.metrics?.effort);
    const errorRate = formatMetric(node.metrics?.errorRate);
    const valueRatio = node.metrics?.valueRatio;
    const relatedFrictions = allFrictions.filter((fp: any) => fp.primaryNode === node.id || fp.affectedNodes?.includes?.(node.id));
    const relatedLoops = allLoops.filter((loop: any) => loop.fromNode === node.id || loop.toNode === node.id);
    const parasitisedLabel = node.wasteSpec?.parasitises ? (nodeMap[node.wasteSpec.parasitises]?.label || node.wasteSpec.parasitises) : null;
    const ontologyLabel = isWaste
      ? toSystemProperty(WASTE_LABELS[wasteType] || wasteType)
      : isVoid
        ? toSystemProperty(`${CAPABILITY_KIND_LABELS[capabilityKind] || capabilityKind} Capability`)
      : toSystemProperty(
          `${TRANSFORM_CHARACTER_LABELS[node.transformCharacter || "analytical"] || node.transformCharacter || "Analytical"} ${
            primaryNature ? VALUE_NATURE_LABELS[primaryNature] || primaryNature : ""
          }`.trim()
        );

    return (
      <div style={{ paddingBottom: 24 }}>
        <div
          style={{
            padding: "2px 0 0 0",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: isWaste ? "#fff7f7" : isVoid ? AGENTIC_TINT : "#f8fafc",
              border: `1px solid ${isWaste ? "#fecaca" : isVoid ? "#d6dde7" : "#e2e8f0"}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: isWaste ? (WASTE_ICON_COLORS[wasteType] || "#dc2626") : stateColor,
                border: "1px solid #ffffff",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: isWaste ? "#b45309" : isVoid ? "#5b6778" : (TRANSFORM_CHARACTER_COLORS[node.transformCharacter || "analytical"] || "#475569"),
                lineHeight: 1.3,
              }}
            >
              {ontologyLabel}
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.15 }}>{node.label || "Untitled Node"}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{node.sublabel || node.id}</div>
          </div>

          <div style={{ ...panelStyles.chipRow, marginTop: 14 }}>
            <MetaChip label="" value={(node.category || "value").toUpperCase()} tone={node.category === "value" ? "#dcfce7" : node.category === "waste" ? "#fef3c7" : isVoid ? AGENTIC_TINT : "#dbeafe"} text={node.category === "value" ? "#16a34a" : node.category === "waste" ? "#b45309" : isVoid ? "#5b6778" : "#2563eb"} />
            {!isWaste && !isVoid && (
              <MetaChip label="" value={STATE_LABELS[state] || state} tone={`${stateColor}22`} text={stateColor} />
            )}
            {isVoid && <MetaChip label="" value={(CAPABILITY_KIND_LABELS[capabilityKind] || capabilityKind).toUpperCase()} tone={AGENTIC_TINT} text="#5b6778" />}
            {isWaste && <MetaChip label="" value={WASTE_LABELS[wasteType] || wasteType} tone="#fef3c7" text="#b45309" />}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 14,
              background: "#f1f5f9",
              borderLeft: `4px solid ${stateColor}`,
              fontSize: 12,
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            {isWaste
              ? WASTE_DESCRIPTIONS[wasteType] || "Waste consumes capacity without creating value."
              : isVoid
                ? CAPABILITY_KIND_DESCRIPTIONS[capabilityKind] || "This missing capability would augment how value propagates through the system."
                : STATE_DESCRIPTIONS[state] || "This node participates in the value transformation."}
          </div>

          {!readOnly ? (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditMode((current) => !current)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: editMode ? "#0f172a" : "#ffffff",
                  color: editMode ? "#ffffff" : "#475569",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {editMode ? "Done Editing" : "Edit Details"}
              </button>
            </div>
          ) : null}
        </div>

        {isVoid ? (
          <>
            <Section title="Missing Capability">
              {node.capabilitySpec?.kind && (
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                  <strong>Kind:</strong> {CAPABILITY_KIND_LABELS[node.capabilitySpec.kind] || node.capabilitySpec.kind}
                </div>
              )}
              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#475569" }}>
                {node.voidSpec?.instantiationSketch || node.stateRationale || "This capability does not currently exist in the system."}
              </div>
              {node.capabilitySpec?.kind && (
                <div style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>
                  <strong>Why this kind:</strong> {CAPABILITY_KIND_DESCRIPTIONS[node.capabilitySpec.kind] || "This capability augments how value propagates through the system."}
                </div>
              )}
            </Section>
            {(node.voidSpec?.absenceImpact?.length > 0 || node.voidSpec?.feasibility || node.voidSpec?.effort) && (
              <Section title="Capability Potential">
                {node.voidSpec?.absenceImpact?.map((impact: string, index: number) => (
                  <div key={`${impact}-${index}`} style={{ fontSize: 12, lineHeight: 1.5, color: "#475569", marginBottom: 6 }}>
                    • {impact}
                  </div>
                ))}
                {node.voidSpec?.feasibility && <div style={{ fontSize: 12, color: "#475569", marginTop: 8 }}><strong>Feasibility:</strong> {node.voidSpec.feasibility}</div>}
                {node.voidSpec?.effort && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}><strong>Effort:</strong> {node.voidSpec.effort}</div>}
              </Section>
            )}
          </>
        ) : isWaste ? (
          <>
            <Section title="What Is Being Lost">
              <div style={{ fontSize: 14, lineHeight: 1.45, color: "#b45309", marginBottom: 12 }}>
                {node.wasteSpec?.driver || node.label || "Capacity is being lost here."}
              </div>
              {parasitisedLabel && (
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
                  <strong>Parasitises:</strong> {parasitisedLabel}
                </div>
              )}
              {node.wasteSpec?.eliminationCondition && (
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                  <strong>Elimination condition:</strong> {node.wasteSpec.eliminationCondition}
                </div>
              )}
            </Section>
          </>
        ) : node.category === "enabling" ? (
          <>
            <Section title="What This Enables">
              <div style={{ fontSize: 14, lineHeight: 1.45, color: "#2563eb", marginBottom: 12 }}>
                {node.enablingSpec?.requiredBy || node.stateRationale || "This function supports value propagation and coordination."}
              </div>
              {node.enablingSpec?.enablingType && (
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
                  <strong>Type:</strong> {node.enablingSpec.enablingType}
                </div>
              )}
              {node.enablingSpec?.eliminable !== undefined && (
                <div style={{ fontSize: 12, color: "#475569" }}>
                  <strong>Eliminable:</strong> {node.enablingSpec.eliminable ? "Yes" : "No"}
                </div>
              )}
            </Section>
          </>
        ) : (
          <>
            {node.valueSpec && (
              <Section title="What This Step Does">
                <div style={{ fontSize: 14, lineHeight: 1.45, color: "#16a34a", marginBottom: 12 }}>
                  {node.valueSpec.valueAdded || "No value-added summary provided."}
                </div>
                {node.valueSpec.inputSummary && (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: "#475569", marginBottom: 4 }}>
                    <strong>In:</strong> {node.valueSpec.inputSummary}
                  </div>
                )}
                {node.valueSpec.outputSummary && (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: "#475569" }}>
                    <strong>Out:</strong> {node.valueSpec.outputSummary}
                  </div>
                )}
              </Section>
            )}

            <Section title="Semantic Tag">
              <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: "#f8fafc", borderLeft: `4px solid ${TRANSFORM_CHARACTER_COLORS[node.transformCharacter || "analytical"] || "#64748b"}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  {ontologyLabel}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: "#475569" }}>
                  {primaryNature
                    ? `The node band combines the ${String(TRANSFORM_CHARACTER_LABELS[node.transformCharacter || "analytical"] || node.transformCharacter || "analytical").toLowerCase()} transformation tag with the ${String(VALUE_NATURE_LABELS[primaryNature] || primaryNature).toLowerCase()} value label.`
                    : "The node band currently carries only the transformation tag for this step."}
                </div>
              </div>

              <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: "#f8fafc", borderLeft: "4px solid #64748b" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  TRANSFORMATION TAG: {toSystemProperty(TRANSFORM_CHARACTER_LABELS[node.transformCharacter || "analytical"] || node.transformCharacter || "Analytical")}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: "#475569" }}>
                  {TRANSFORM_CHARACTER_DESCRIPTIONS[node.transformCharacter || "analytical"] || "This step has a specific transformation character."}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {(node.valueNatures || []).length > 0 ? (
                  (node.valueNatures || []).map((natureEntry: any, index: number) => {
                    const nature = natureEntry.nature;
                    const isPrimary = Boolean(natureEntry.isPrimary) || nature === primaryNature;
                    return (
                      <div key={`${nature}-${index}`} style={{ fontSize: 12, lineHeight: 1.55, color: "#475569", padding: "10px 12px", borderRadius: 12, background: "#f8fafc", borderLeft: "4px solid #94a3b8" }}>
                        <div style={{ color: "#0f172a", fontWeight: 800, marginBottom: 4 }}>
                          VALUE LABEL: {isPrimary ? "PRIMARY " : "SECONDARY "}{toSystemProperty(VALUE_NATURE_LABELS[nature] || nature)}
                        </div>
                        <div>
                          {natureEntry.description ? natureEntry.description : VALUE_NATURE_DESCRIPTIONS[nature] ? VALUE_NATURE_DESCRIPTIONS[nature] : "This step creates this form of value."}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: 12, color: "#64748b" }}>No value natures defined.</div>
                )}
              </div>
            </Section>
          </>
        )}

        {node.performer && (
          <Section title="Performer">
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#0f172a", fontWeight: 700 }}>
              {node.performer.role || "Unknown Role"} <span style={{ fontWeight: 400, color: "#475569" }}>· {node.performer.team || "Unknown Team"}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <OrgRelationBadge relation={performerRelation} />
            </div>
          </Section>
        )}

        {(cycleTime || effort || errorRate || valueRatio !== undefined) && (
          <Section title="Performance">
            {cycleTime && <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}><strong>Cycle:</strong> {cycleTime}</div>}
            {effort && <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}><strong>Effort:</strong> {effort}</div>}
            {errorRate && <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}><strong>Error:</strong> {errorRate}</div>}
            {valueRatio !== undefined && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}><strong>Value ratio:</strong> {Math.round(Number(valueRatio) * 100)}%</div>
                <div style={{ height: 12, borderRadius: 999, background: "#e2e8f0", overflow: "hidden", maxWidth: 180 }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, Number(valueRatio) * 100))}%`, height: "100%", background: "#ef4444", borderRadius: 999 }} />
                </div>
              </div>
            )}
          </Section>
        )}

        {relatedFrictions.length > 0 && (
          <Section title="Related Friction">
            {relatedFrictions.map((fp: any) => (
              <div key={fp.id} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 12, background: "#f8fafc", borderLeft: `4px solid ${FRICTION_SEVERITY_COLORS[fp.severity] || "#94a3b8"}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{fp.title || fp.id}</div>
                {fp.convergence && <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginTop: 4 }}>{fp.convergence}</div>}
              </div>
            ))}
          </Section>
        )}

        {relatedLoops.length > 0 && (
          <Section title="Related Loops">
            {relatedLoops.map((loop: any) => (
              <div key={loop.id} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 12, background: "#f8fafc", borderLeft: `4px solid ${loop.polarity === "balancing" ? "#2563eb" : "#dc2626"}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{loop.label || loop.id}</div>
                {loop.description && <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginTop: 4 }}>{loop.description}</div>}
              </div>
            ))}
          </Section>
        )}

        {editMode && (
          <>
            <Section title="Identity">
              <InlineEditField
                label="Label"
                display={node.label || "Untitled Node"}
                value={node.label || ""}
                onCommit={(value) => onElementChange("node", node.id, { label: value })}
                accent={stateColor}
                valueColor="#0f172a"
              />
              <InlineEditField
                label="Sublabel"
                display={node.sublabel || "No sublabel"}
                value={node.sublabel || ""}
                onCommit={(value) => onElementChange("node", node.id, { sublabel: value })}
                accent="#cbd5e1"
              />
              <InlineEditSelect
                label="Category"
                display={node.category || "value"}
                value={node.category || "value"}
                options={[
                  { value: "value", label: "Value" },
                  { value: "enabling", label: "Enabling" },
                  { value: "waste", label: "Waste" },
                ]}
                onCommit={(value) => onElementChange("node", node.id, { category: value })}
                accent="#cbd5e1"
              />
            </Section>

            <Section title="Semantics">
              {!isWaste && (
                <InlineEditSelect
                  label="State"
                  display={STATE_LABELS[state] || state}
                  value={state}
                  options={STATE_OPTIONS.map((item) => ({ value: item, label: STATE_LABELS[item] || item }))}
                  onCommit={(value) => onElementChange("node", node.id, { state: value })}
                  accent={stateColor}
                  valueColor={stateColor}
                />
              )}

              {!isWaste && (
                <InlineEditSelect
                  label="Transform Character"
                  display={toSystemProperty(TRANSFORM_CHARACTER_LABELS[node.transformCharacter || "analytical"] || node.transformCharacter || "analytical")}
                  value={node.transformCharacter || "analytical"}
                  options={Object.entries(TRANSFORM_CHARACTER_LABELS).map(([value, label]) => ({ value, label }))}
                  onCommit={(value) => onElementChange("node", node.id, { transformCharacter: value })}
                  accent="#cbd5e1"
                />
              )}

              {isWaste && (
                <InlineEditSelect
                  label="Waste Type"
                  display={WASTE_LABELS[wasteType] || wasteType}
                  value={wasteType}
                  options={WASTE_OPTIONS.map((value) => ({ value, label: WASTE_LABELS[value] || value }))}
                  onCommit={(value) => onElementChange("node", node.id, { wasteSpec: { ...(node.wasteSpec || {}), wasteType: value } })}
                  accent="#f59e0b"
                  valueColor="#b45309"
                  hint={WASTE_DESCRIPTIONS[wasteType]}
                />
              )}

              {!isWaste && (
                <InlineEditSelect
                  label="Primary Value Nature"
                  display={primaryNature ? toSystemProperty(VALUE_NATURE_LABELS[primaryNature] || primaryNature) : "NONE"}
                  value={primaryNature}
                  options={[{ value: "", label: "None" }].concat(VALUE_NATURE_OPTIONS.map((value) => ({ value, label: VALUE_NATURE_LABELS[value] || value })))}
                  onCommit={(value) =>
                    onElementChange("node", node.id, {
                      valueNatures: value ? [{ ...(node.valueNatures?.[0] || {}), nature: value }] : [],
                    })
                  }
                  accent="#8b5cf6"
                  valueColor="#6d28d9"
                  hint={primaryNature ? VALUE_NATURE_DESCRIPTIONS[primaryNature] : "Click to assign the primary transformation nature."}
                />
              )}
            </Section>

            <Section title="Performer">
              <InlineEditField
                label="Role"
                display={node.performer?.role || "No role"}
                value={node.performer?.role || ""}
                onCommit={(value) => onElementChange("node", node.id, { performer: { ...(node.performer || {}), role: value } })}
                accent="#0ea5e9"
              />
              <InlineEditField
                label="Team"
                display={node.performer?.team || "No team"}
                value={node.performer?.team || ""}
                onCommit={(value) => onElementChange("node", node.id, { performer: { ...(node.performer || {}), team: value } })}
                accent="#0ea5e9"
              />
              <InlineEditSelect
                label="Org Relation"
                display={ORG_RELATIONS[performerRelation] || performerRelation}
                value={performerRelation}
                options={Object.entries(ORG_RELATIONS).map(([value, label]) => ({ value, label }))}
                onCommit={(value) => onElementChange("node", node.id, { performer: { ...(node.performer || {}), orgRelation: value } })}
                accent="#22c55e"
                valueColor="#166534"
                hint={ORG_RELATION_DESCRIPTIONS[performerRelation]}
              />
            </Section>
          </>
        )}

        <Section title="Forces Acting on This Step">
          {nodeForces.length === 0 ? (
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
              No forces are attached to this node.
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #dbe3ef",
                borderRadius: 18,
                padding: 14,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 12 }}>
                Green = helping, Red = hindering.
              </div>
              <div style={{ height: 20, borderRadius: 999, overflow: "hidden", display: "flex", background: "#e2e8f0", marginBottom: 10 }}>
                <div style={{ width: `${(helpingIntensity / totalForceIntensity) * 100}%`, background: "#22c55e" }} />
                <div style={{ width: `${(hinderingIntensity / totalForceIntensity) * 100}%`, background: "#ef4444" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                <span>Helping: {helpingIntensity}</span>
                <span>Hindering: {hinderingIntensity}</span>
              </div>

              {[
                { title: "Helping", color: "#16a34a", items: helpingForces },
                { title: "Hindering", color: "#dc2626", items: hinderingForces },
              ].map((group) => (
                <div key={group.title} style={{ marginBottom: group.items.length ? 14 : 0 }}>
                  {group.items.length > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: group.color, marginBottom: 10 }}>{group.title}</div>
                  )}
                  {group.items.map((force: any) => {
                    const categoryColor = FORCE_CATEGORY_COLORS[force.category] || "#64748b";
                    const categoryLabel = FORCE_CATEGORY_LABELS[force.category] || force.category || "Unclassified";
                    return (
                      <div key={force.id} style={{ display: "grid", gridTemplateColumns: "6px 1fr", gap: 12, marginBottom: 14 }}>
                        <div style={{ background: categoryColor, borderRadius: 999 }} />
                        <div>
                          <div style={{ fontSize: 13, lineHeight: 1.45, color: "#0f172a" }}>
                            <strong>{categoryLabel}</strong>
                            {force.subtype ? <span style={{ color: "#94a3b8" }}> · {force.subtype}</span> : null}
                            <span style={{ marginLeft: 6, color: group.color }}>
                              {"●".repeat(Math.max(1, Math.min(3, force.intensity || 1)))}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, lineHeight: 1.55, color: "#475569", marginTop: 2 }}>{force.description || "No description"}</div>
                          <div style={{ fontSize: 11, lineHeight: 1.5, color: "#94a3b8", marginTop: 4 }}>
                            {force.evidence ? `${force.evidence} · ` : ""}{force.changeability || "near-term"}
                          </div>
                          {editMode && <div style={{ marginTop: 8 }}>
                            <InlineEditSelect
                              label="Category"
                              display={categoryLabel}
                              value={force.category || ""}
                              options={Object.entries(FORCE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
                              onCommit={(value) => onElementChange("force", force.id, { category: value })}
                              accent={categoryColor}
                              valueColor={categoryColor}
                            />
                            <InlineEditField
                              label="Subtype"
                              display={force.subtype || "No subtype"}
                              value={force.subtype || ""}
                              onCommit={(value) => onElementChange("force", force.id, { subtype: value })}
                              accent={categoryColor}
                            />
                            <InlineEditSelect
                              label="Polarity"
                              display={force.polarity || "constraining"}
                              value={force.polarity || "constraining"}
                              options={FORCE_POLARITY_OPTIONS.map((value) => ({ value, label: value }))}
                              onCommit={(value) => onElementChange("force", force.id, { polarity: value })}
                              accent={group.color}
                              valueColor={group.color}
                            />
                            <InlineEditSelect
                              label="Intensity"
                              display={String(force.intensity || 1)}
                              value={String(force.intensity || 1)}
                              options={["1", "2", "3"].map((value) => ({ value, label: value }))}
                              onCommit={(value) => onElementChange("force", force.id, { intensity: Number(value) })}
                              accent={categoryColor}
                              valueColor={categoryColor}
                            />
                            <InlineEditSelect
                              label="Changeability"
                              display={force.changeability || "near-term"}
                              value={force.changeability || "near-term"}
                              options={FORCE_CHANGEABILITY_OPTIONS.map((value) => ({ value, label: value }))}
                              onCommit={(value) => onElementChange("force", force.id, { changeability: value })}
                              accent="#8b5cf6"
                              valueColor="#6d28d9"
                            />
                          </div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </Section>

        {editMode && (
          <>
            <Section title="Context">
              <InlineEditArea
                label="State Rationale"
                display={node.stateRationale || "No rationale provided"}
                value={node.stateRationale || ""}
                onCommit={(value) => onElementChange("node", node.id, { stateRationale: value })}
                accent="#cbd5e1"
              />
            </Section>

            <Section title="Placement">
              <InlineEditField
                label="X Position"
                display={String(Math.round(node.x || 0))}
                value={String(Math.round(node.x || 0))}
                onCommit={(value) => onElementChange("node", node.id, { x: Number(value) || 0 })}
                accent="#94a3b8"
              />
              <InlineEditField
                label="Y Position"
                display={String(Math.round(node.y || 0))}
                value={String(Math.round(node.y || 0))}
                onCommit={(value) => onElementChange("node", node.id, { y: Number(value) || 0 })}
                accent="#94a3b8"
                hint={isVoid ? "Void nodes can also be positioned manually." : "Manual positions are saved with the visualization snapshot."}
              />
            </Section>
          </>
        )}
      </div>
    );
  }

  if (elementType === "flow") {
    const flow = element;
    const quality = flow.quality || "good";
    const qualityColor = QUALITY_COLORS[quality] || "#64748b";
    const medium = flow.medium || "data";
    const trigger = flow.trigger || "push";
    const fromLabel = nodeMap[flow.from]?.label || flow.from;
    const toLabel = nodeMap[flow.to]?.label || flow.to;
    const flowSummary = flow.label || "Value propagation";

    return (
      <div style={{ paddingBottom: 24 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${qualityColor}1f, #ffffff 62%)`,
            border: `1px solid ${qualityColor}44`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 8, borderRadius: 999, background: qualityColor, minHeight: 36, marginTop: 4 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.15 }}>{flowSummary}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{flow.id}</div>
            </div>
          </div>
          <div style={panelStyles.chipRow}>
            <MetaChip label="Medium" value={FLOW_MEDIUM_LABELS[medium] || medium} tone="#dbeafe" text="#1d4ed8" />
            <MetaChip label="Quality" value={quality} tone={`${qualityColor}22`} text={qualityColor} />
            <MetaChip label="Trigger" value={trigger} tone="#ede9fe" text="#6d28d9" />
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 14,
              background: "#f8fafc",
              borderLeft: `4px solid ${qualityColor}`,
              fontSize: 12,
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            {FLOW_QUALITY_DESCRIPTIONS[quality] || "This flow carries value between two steps."}
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditMode((current) => !current)}
              style={{
                border: "1px solid #cbd5e1",
                background: editMode ? "#0f172a" : "#ffffff",
                color: editMode ? "#ffffff" : "#475569",
                borderRadius: 999,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {editMode ? "Done Editing" : "Edit Details"}
            </button>
          </div>
        </div>

        <Section title="Value Propagation">
          <PropertyCard
            label="Route"
            value={`${fromLabel} -> ${toLabel}`}
            accent="#cbd5e1"
            hint="Read flows as how value propagates forward between transformations."
          />
          <PropertyCard
            label="What Is Moving"
            value={flowSummary}
            accent="#dbeafe"
            valueColor="#1d4ed8"
            hint="The flow label describes what is being passed or made available downstream."
          />
        </Section>

        <Section title="Propagation Condition">
          <PropertyCard
            label="Quality"
            value={quality}
            accent={qualityColor}
            valueColor={qualityColor}
            hint={FLOW_QUALITY_DESCRIPTIONS[quality] || "This describes how reliably value propagates."}
          />
          <PropertyCard
            label="Medium"
            value={FLOW_MEDIUM_LABELS[medium] || medium}
            accent="#3b82f6"
            valueColor="#1d4ed8"
            hint={FLOW_MEDIUM_DESCRIPTIONS[medium] || "This is the medium through which value propagates."}
          />
          <PropertyCard
            label="Trigger"
            value={trigger}
            accent="#8b5cf6"
            valueColor="#6d28d9"
            hint={FLOW_TRIGGER_DESCRIPTIONS[trigger] || "This is what initiates the propagation."}
          />
        </Section>

        {editMode && <Section title="Flow">
          <InlineEditField
            label="Label"
            display={flowSummary}
            value={flow.label || ""}
            onCommit={(value) => onElementChange("flow", flow.id, { label: value })}
            accent={qualityColor}
          />
          <InlineEditSelect
            label="From"
            display={nodeMap[flow.from]?.label || flow.from}
            value={flow.from}
            options={nodeOptions}
            onCommit={(value) => onElementChange("flow", flow.id, { from: value })}
            accent="#cbd5e1"
          />
          <InlineEditSelect
            label="To"
            display={nodeMap[flow.to]?.label || flow.to}
            value={flow.to}
            options={nodeOptions}
            onCommit={(value) => onElementChange("flow", flow.id, { to: value })}
            accent="#cbd5e1"
          />
          <InlineEditSelect
            label="Medium"
            display={FLOW_MEDIUM_LABELS[flow.medium || "data"] || flow.medium || "data"}
            value={flow.medium || "data"}
            options={Object.entries(FLOW_MEDIUM_LABELS).map(([value, label]) => ({ value, label }))}
            onCommit={(value) => onElementChange("flow", flow.id, { medium: value })}
            accent="#3b82f6"
            valueColor="#1d4ed8"
          />
          <InlineEditSelect
            label="Quality"
            display={quality}
            value={quality}
            options={FLOW_QUALITY_OPTIONS.map((value) => ({ value, label: value }))}
            onCommit={(value) => onElementChange("flow", flow.id, { quality: value })}
            accent={qualityColor}
            valueColor={qualityColor}
          />
          <InlineEditSelect
            label="Trigger"
            display={flow.trigger || "push"}
            value={flow.trigger || "push"}
            options={FLOW_TRIGGER_OPTIONS.map((value) => ({ value, label: value }))}
            onCommit={(value) => onElementChange("flow", flow.id, { trigger: value })}
            accent="#8b5cf6"
            valueColor="#6d28d9"
          />
        </Section>}
      </div>
    );
  }

  if (elementType === "friction") {
    const friction = element;
    const severity = friction.severity || "moderate";
    const severityColor = FRICTION_SEVERITY_COLORS[severity] || "#6b7280";

    return (
      <div style={{ paddingBottom: 24 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${severityColor}20, #ffffff 60%)`,
            border: `1px solid ${severityColor}44`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{friction.title || "Friction Point"}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{friction.id}</div>
            </div>
            <SeverityBadge severity={severity} />
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.55, marginTop: 12 }}>
            Primary node: {nodeMap[friction.primaryNode]?.label || friction.primaryNode || "Unassigned"}
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditMode((current) => !current)}
              style={{
                border: "1px solid #cbd5e1",
                background: editMode ? "#0f172a" : "#ffffff",
                color: editMode ? "#ffffff" : "#475569",
                borderRadius: 999,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {editMode ? "Done Editing" : "Edit Details"}
            </button>
          </div>
        </div>

        {editMode && <Section title="Friction Point">
          <InlineEditField
            label="Title"
            display={friction.title || "Friction Point"}
            value={friction.title || ""}
            onCommit={(value) => onElementChange("friction", friction.id, { title: value })}
            accent={severityColor}
          />
          <InlineEditSelect
            label="Severity"
            display={severity}
            value={severity}
            options={Object.keys(FRICTION_SEVERITY_COLORS).map((value) => ({ value, label: value }))}
            onCommit={(value) => onElementChange("friction", friction.id, { severity: value })}
            accent={severityColor}
            valueColor={severityColor}
          />
          <InlineEditSelect
            label="Primary Node"
            display={nodeMap[friction.primaryNode]?.label || friction.primaryNode || "Unassigned"}
            value={friction.primaryNode || ""}
            options={nodeOptions}
            onCommit={(value) => onElementChange("friction", friction.id, { primaryNode: value })}
            accent="#cbd5e1"
          />
          <InlineEditArea
            label="Convergence"
            display={friction.convergence || "No convergence note"}
            value={friction.convergence || ""}
            onCommit={(value) => onElementChange("friction", friction.id, { convergence: value })}
            accent="#cbd5e1"
          />
          <InlineEditArea
            label="Leverage Point"
            display={friction.leveragePoint || "No leverage note"}
            value={friction.leveragePoint || ""}
            onCommit={(value) => onElementChange("friction", friction.id, { leveragePoint: value })}
            accent="#cbd5e1"
          />
        </Section>}
      </div>
    );
  }

  if (elementType === "loop") {
    const loop = element;
    const loopColor = loop.polarity === "balancing" ? "#2563eb" : "#dc2626";

    return (
      <div style={{ paddingBottom: 24 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${loopColor}18, #ffffff 60%)`,
            border: `1px solid ${loopColor}44`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{loop.label || "Feedback Loop"}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{loop.id}</div>
          <div style={panelStyles.chipRow}>
            <MetaChip label="Polarity" value={loop.polarity || "reinforcing"} tone={`${loopColor}22`} text={loopColor} />
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.55, marginTop: 12 }}>
            {[nodeMap[loop.fromNode]?.label || loop.fromNode, nodeMap[loop.toNode]?.label || loop.toNode].join(" -> ")}
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditMode((current) => !current)}
              style={{
                border: "1px solid #cbd5e1",
                background: editMode ? "#0f172a" : "#ffffff",
                color: editMode ? "#ffffff" : "#475569",
                borderRadius: 999,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {editMode ? "Done Editing" : "Edit Details"}
            </button>
          </div>
        </div>

        {editMode && <Section title="Feedback Loop">
          <InlineEditField
            label="Label"
            display={loop.label || "Feedback Loop"}
            value={loop.label || ""}
            onCommit={(value) => onElementChange("loop", loop.id, { label: value })}
            accent={loopColor}
          />
          <InlineEditSelect
            label="Polarity"
            display={loop.polarity || "reinforcing"}
            value={loop.polarity || "reinforcing"}
            options={[
              { value: "reinforcing", label: "Reinforcing" },
              { value: "balancing", label: "Balancing" },
            ]}
            onCommit={(value) => onElementChange("loop", loop.id, { polarity: value })}
            accent={loopColor}
            valueColor={loopColor}
          />
          <InlineEditSelect
            label="From Node"
            display={nodeMap[loop.fromNode]?.label || loop.fromNode}
            value={loop.fromNode}
            options={nodeOptions}
            onCommit={(value) => onElementChange("loop", loop.id, { fromNode: value })}
            accent="#cbd5e1"
          />
          <InlineEditSelect
            label="To Node"
            display={nodeMap[loop.toNode]?.label || loop.toNode}
            value={loop.toNode}
            options={nodeOptions}
            onCommit={(value) => onElementChange("loop", loop.id, { toNode: value })}
            accent="#cbd5e1"
          />
          <InlineEditArea
            label="Description"
            display={loop.description || "No description"}
            value={loop.description || ""}
            onCommit={(value) => onElementChange("loop", loop.id, { description: value })}
            accent="#cbd5e1"
          />
        </Section>}
      </div>
    );
  }

  return (
    <Section title="Inspect">
      <div style={{ fontSize: 12, color: "#64748b" }}>Unknown element type.</div>
    </Section>
  );
}
