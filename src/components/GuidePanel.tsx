import React from "react";
import {
  AGENTIC_ACCENT,
  AGENTIC_BAND,
  AGENTIC_BORDER,
  AGENTIC_TEXT,
  AGENTIC_TINT,
  ENABLING_TINT,
  FLOW_MEDIUM_LABELS,
  QUALITY_COLORS,
  STATE_COLORS,
  STATE_DESCRIPTIONS,
  STATE_LABELS,
  TRANSFORM_CHARACTER_COLORS,
  TRANSFORM_CHARACTER_LABELS,
  VALUE_NATURE_DESCRIPTIONS,
  VALUE_NATURE_LABELS,
  WASTE_TINT,
  WASTE_ICON_COLORS,
  WASTE_LABELS,
} from "../lib/vfd.constants";
import { WasteIcon } from "./VFDIcons";

const TRANSFORM_CHARACTER_DESCRIPTIONS: Record<string, string> = {
  analytical: "Rule-based analysis and evidence inspection.",
  interpretive: "Expert judgement in ambiguous situations.",
  integrative: "Combines multiple inputs into a coherent whole.",
  generative: "Creates new content, language, or form.",
  evaluative: "Assesses quality or adequacy against a standard.",
  procedural: "Executes a defined sequence reliably.",
};

function Section({
  number,
  title,
  intro,
  children,
}: {
  number: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
        {number}. {title}
      </div>
      <div style={{ height: 1, background: "#dbe3ef", marginBottom: 12 }} />
      {intro ? (
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
          {intro}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function LayerCard({
  title,
  question,
  description,
  action,
  accent,
  background,
}: {
  title: string;
  question: string;
  description: string;
  action: string;
  accent: string;
  background: string;
}): React.ReactElement {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background,
        borderLeft: `5px solid ${accent}`,
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
        {title}: <em>{question}</em>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 4 }}>{description}</div>
      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>→ {action}</div>
    </div>
  );
}

function NodeGlyph({
  kind,
  bandLabel,
  bandColor,
}: {
  kind: "value" | "enabling" | "waste" | "capability";
  bandLabel: string;
  bandColor: string;
}): React.ReactElement {
  if (kind === "waste") {
    return (
      <div
        style={{
          width: 72,
          height: 46,
          borderRadius: 10,
          background: WASTE_TINT,
          border: "2px solid #fca5a5",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 5,
            top: 5,
            width: 60,
            height: 16,
            borderRadius: 8,
            background: "#fff7f7",
            border: "1px solid #fecaca",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 11,
            top: 9,
            fontSize: 8,
            fontWeight: 800,
            color: bandColor,
            letterSpacing: "0.35px",
          }}
        >
          {bandLabel}
        </div>
      </div>
    );
  }

  if (kind === "capability") {
    return (
      <div
        style={{
          width: 72,
          height: 46,
          borderRadius: 10,
          background: AGENTIC_TINT,
          border: `2px solid ${AGENTIC_BORDER}`,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 5,
            top: 5,
            width: 60,
            height: 16,
            borderRadius: 8,
            background: AGENTIC_BAND,
            border: "1px solid #d6dde7",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 11,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: AGENTIC_ACCENT,
            border: "1px solid #ffffff",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 9,
            fontSize: 7,
            fontWeight: 800,
            color: AGENTIC_TEXT,
            letterSpacing: "0.35px",
          }}
        >
          {bandLabel}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 72,
        height: 46,
        borderRadius: 10,
        background: kind === "enabling" ? ENABLING_TINT : "#ffffff",
        border: kind === "enabling" ? "2px solid #bfdbfe" : "2px solid #cbd5e1",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 5,
          top: 5,
          width: 60,
          height: 16,
          borderRadius: 8,
          background: kind === "enabling" ? "#ffffff" : "#f8fafc",
          border: kind === "enabling" ? "1px solid #dbeafe" : "1px solid #e2e8f0",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 11,
          top: 11,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: kind === "value" ? STATE_COLORS.homeostasis : STATE_COLORS.stress,
          border: "1px solid #ffffff",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 23,
          top: 9,
          fontSize: 7,
          fontWeight: 800,
          color: bandColor,
          letterSpacing: "0.35px",
        }}
      >
        {bandLabel}
      </div>
    </div>
  );
}

function NodeTypeRow({
  glyph,
  title,
  description,
}: {
  glyph: React.ReactNode;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
      {glyph}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>{description}</div>
      </div>
    </div>
  );
}

function FlowRow({
  color,
  label,
  meaning,
  dashArray,
}: {
  color: string;
  label: string;
  meaning: string;
  dashArray?: string;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
      <svg width="64" height="14" viewBox="0 0 64 14" aria-hidden="true">
        <line x1="4" y1="7" x2="54" y2="7" stroke={color} strokeWidth="3" strokeDasharray={dashArray || "none"} />
        <polygon points="54,3 62,7 54,11" fill={color} />
      </svg>
      <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.45 }}>
        <strong>{label}</strong>
        <span style={{ color: "#475569" }}> — {meaning}</span>
      </div>
    </div>
  );
}

function FlowStyleRow({
  medium,
  dashArray,
  description,
  lineCap = "round",
}: {
  medium: string;
  dashArray?: string;
  description: string;
  lineCap?: "round" | "butt" | "square";
}): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
      <div
        style={{
          width: 76,
          height: 26,
          borderRadius: 10,
          border: "1px solid #dbe3ef",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="64" height="14" viewBox="0 0 64 14" aria-hidden="true">
          <line
            x1="4"
            y1="7"
            x2="56"
            y2="7"
            stroke="#64748b"
            strokeWidth="3"
            strokeDasharray={dashArray || "none"}
            strokeLinecap={lineCap}
          />
          <polygon points="56,3 62,7 56,11" fill="#64748b" />
        </svg>
      </div>
      <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.45 }}>
        <strong>{FLOW_MEDIUM_LABELS[medium]}</strong>
        <span style={{ color: "#64748b" }}> — {description}</span>
      </div>
    </div>
  );
}

function StateRow({ state }: { state: string }): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
      <div
        style={{
          width: 42,
          height: 28,
          borderRadius: 10,
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          flexShrink: 0,
          marginTop: 2,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 9,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: STATE_COLORS[state],
            border: "1px solid #ffffff",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: "#0f172a" }}>
        <strong>{STATE_LABELS[state]}</strong>
        <span style={{ color: "#475569" }}> — {STATE_DESCRIPTIONS[state]}</span>
      </div>
    </div>
  );
}

function WasteRow({ type }: { type: string }): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          border: "1px solid #a8a29e",
          background: "#fafaf9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <WasteIcon type={type} size={20} color={WASTE_ICON_COLORS[type]} />
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#0f172a" }}>
        <strong>{WASTE_LABELS[type]}</strong>
        <span style={{ color: "#475569" }}> — {
          type === "queue" ? "Waiting with little or no transformation effort." :
          type === "rework" ? "Redoing or correcting work already done." :
          type === "translation" ? "Converting between formats, systems, or vocabularies." :
          "Doing more work than the output actually requires."
        }</span>
      </div>
    </div>
  );
}

export default function GuidePanel(): React.ReactElement {
  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginBottom: 10 }}>
          How to Read This Diagram
        </div>
        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>
          This diagram shows where value is transformed, how it propagates, where capacity leaks,
          and what pressures keep the system in its current shape.
        </div>
      </div>

      <Section
        number="1"
        title="Reading Order"
        intro="Read the map progressively. Each layer answers a different diagnostic question."
      >
        <LayerCard
          title="L1 Value"
          question="What directly creates value?"
          description="Core transformation steps that contribute to the output."
          action="Protect and improve this"
          accent="#22c55e"
          background="#f8fafc"
        />
        <LayerCard
          title="L2 Enabling"
          question="What support work is required?"
          description="Governance, coordination, approvals, infrastructure, and assurance work."
          action="Keep the outcome, reduce the burden"
          accent="#3b82f6"
          background={ENABLING_TINT}
        />
        <LayerCard
          title="L3 Waste"
          question="Where is capacity leaking?"
          description="Activities that consume effort without adding value."
          action="Eliminate or shrink this"
          accent="#ef4444"
          background={WASTE_TINT}
        />
        <LayerCard
          title="L4 Friction"
          question="Where should we intervene first?"
          description="Hotspots where multiple constraints converge and degradation compounds."
          action="Target this pressure point"
          accent="#a78bfa"
          background="#f8fafc"
        />
        <LayerCard
          title="L5 Loops"
          question="Why does the problem persist?"
          description="Feedback structures that keep the same pattern repeating."
          action="Break or redirect the cycle"
          accent="#94a3b8"
          background="#f8fafc"
        />
        <LayerCard
          title="L6 Capability"
          question="What is missing from the system?"
          description="Potential integrations, automations, or copilots that are not present today."
          action="Add selectively where leverage is high"
          accent={AGENTIC_ACCENT}
          background={AGENTIC_TINT}
        />
      </Section>

      <Section
        number="2"
        title="Node Cards"
        intro="Each card uses the same structure: a top band for semantic labeling, a small dot for state or capability maturity, and a centered label for the step itself."
      >
        <NodeTypeRow
          glyph={<NodeGlyph kind="value" bandLabel="GENERATIVE CLARITY" bandColor={TRANSFORM_CHARACTER_COLORS.generative} />}
          title="Value Node"
          description="White card. Represents a core step that directly transforms value."
        />
        <NodeTypeRow
          glyph={<NodeGlyph kind="enabling" bandLabel="PROCEDURAL ASSURANCE" bandColor={TRANSFORM_CHARACTER_COLORS.procedural} />}
          title="Enabling Node"
          description="Blue-tinted card. Represents support, control, or coordination work required by the system."
        />
        <NodeTypeRow
          glyph={<NodeGlyph kind="waste" bandLabel="REWORK" bandColor={WASTE_ICON_COLORS.rework} />}
          title="Waste Node"
          description="Rose-tinted card. Represents effort consumed without creating value."
        />
        <NodeTypeRow
          glyph={<NodeGlyph kind="capability" bandLabel="AUTOMATION CAPABILITY" bandColor={AGENTIC_TEXT} />}
          title="Capability Node"
          description="Metal-tinted card. Represents a missing capability that could be introduced."
        />
      </Section>

      <Section
        number="3"
        title="Semantic Bands"
        intro="The top band on value and enabling cards is text-only. It combines how the step works with the value label it primarily carries."
      >
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 12 }}>
          Value-nature icons are not part of the current diagram language. The semantic band uses words only.
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Transformation Tags</div>
        <div style={{ marginBottom: 16 }}>
          {Object.entries(TRANSFORM_CHARACTER_LABELS).map(([transform, label]) => (
            <div key={transform} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  minWidth: 112,
                  padding: "6px 8px",
                  borderRadius: 999,
                  background: `${(TRANSFORM_CHARACTER_COLORS[transform] || "#475569")}18`,
                  color: TRANSFORM_CHARACTER_COLORS[transform] || "#475569",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textAlign: "center",
                }}
              >
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "#0f172a" }}>
                <strong>{label}</strong>
                <span style={{ color: "#475569" }}> — {TRANSFORM_CHARACTER_DESCRIPTIONS[transform] || "Describes how the step works."}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Value Labels</div>
        <div>
          {Object.entries(VALUE_NATURE_LABELS).map(([nature, label]) => (
            <div key={nature} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <div
                style={{
                  minWidth: 112,
                  padding: "6px 8px",
                  borderRadius: 999,
                  background: "#f1f5f9",
                  color: "#334155",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textAlign: "center",
                }}
              >
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "#0f172a" }}>
                <strong>{label}</strong>
                <span style={{ color: "#475569" }}> — {VALUE_NATURE_DESCRIPTIONS[nature] || "Describes the kind of value this step contributes."}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        number="4"
        title="Flows"
        intro="Arrow color shows flow health. Arrow line style shows medium."
      >
        <FlowRow color={QUALITY_COLORS.good} label="Green" meaning="Healthy propagation." />
        <FlowRow color={QUALITY_COLORS.degraded} label="Amber" meaning="Value still moves, but with loss, delay, or interpretation burden." />
        <FlowRow color={QUALITY_COLORS.broken} label="Red" meaning="Value is not arriving in a usable way." />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Flow style by medium</div>
          <FlowStyleRow medium="data" description="continuous propagation" />
          <FlowStyleRow medium="document" dashArray="10,6" description="document handoff" lineCap="butt" />
          <FlowStyleRow medium="decision" dashArray="2,5,8,5" description="decision gate or checkpoint" lineCap="round" />
          <FlowStyleRow medium="signal" dashArray="1,4" description="lightweight signal or notification" lineCap="round" />
        </div>
      </Section>

      <Section
        number="5"
        title="States and Capabilities"
        intro="On value and enabling nodes, the small dot shows the node's current state. On capability nodes, that dot marks capability maturity instead."
      >
        {["homeostasis", "stress", "fragmentation", "implosion", "explosion"].map((state) => (
          <StateRow key={state} state={state} />
        ))}
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginTop: 12 }}>
          Capability cards use the same band-and-dot structure, but the dot reflects capability maturity rather than operational state.
        </div>
      </Section>

      <Section
        number="6"
        title="Waste"
        intro="Waste nodes model recurring non-value-adding effort in knowledge work."
      >
        {["queue", "rework", "translation", "overprocessing"].map((type) => (
          <WasteRow key={type} type={type} />
        ))}
      </Section>

      <Section
        number="7"
        title="Friction and Loops"
        intro="Friction points and loops help separate symptoms from underlying structure."
      >
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, marginBottom: 12 }}>
          Friction points identify places where multiple constraints converge and destroy value disproportionately.
          They are high-leverage intervention candidates.
        </div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>
          Loops explain persistence. If the same issue keeps returning, inspect the loop before optimizing a single step.
        </div>
      </Section>

      <Section
        number="8"
        title="Using the Side Panels"
        intro="The three tabs are complementary."
      >
        <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.6, marginBottom: 8 }}>
          <strong>Overview</strong>
          <span style={{ color: "#475569" }}> gives the model-level reading: composition, flow health, dominant pressures, and hotspots.</span>
        </div>
        <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.6, marginBottom: 8 }}>
          <strong>Inspect</strong>
          <span style={{ color: "#475569" }}> explains the currently selected node, flow, friction point, or loop in detail.</span>
        </div>
        <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.6 }}>
          <strong>Guide</strong>
          <span style={{ color: "#475569" }}> documents the notation and how to interpret what the diagram is showing.</span>
        </div>
      </Section>
    </div>
  );
}
