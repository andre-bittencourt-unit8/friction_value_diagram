import React, { useMemo } from "react";
import {
  AGENTIC_ACCENT,
  CAPABILITY_KIND_LABELS,
  FLOW_MEDIUM_LABELS,
  FORCE_CATEGORY_LABELS,
  QUALITY_COLORS,
  STATE_COLORS,
  STATE_LABELS,
  TRANSFORM_CHARACTER_COLORS,
  TRANSFORM_CHARACTER_LABELS,
  VALUE_NATURE_LABELS,
  WASTE_LABELS,
} from "../lib/vfd.constants";

interface OverviewPanelProps {
  vfdData: any;
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #dbe3ef" }}>
        {title}
      </div>
      {intro ? (
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
          {intro}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  accent = "#cbd5e1",
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}): React.ReactElement {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function DistributionRow({
  label,
  count,
  total,
  color,
  hint,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  hint?: string;
}): React.ReactElement {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: "#0f172a", minWidth: 0 }}>
          <strong>{label}</strong>
          {hint ? <span style={{ color: "#94a3b8" }}> · {hint}</span> : null}
        </div>
        <div style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>{count} · {pct}%</div>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#e2e8f0", overflow: "hidden", width: "100%" }}>
        <div
          style={{
            width: pct === 0 ? "0%" : `max(${pct}%, 12px)`,
            minWidth: pct > 0 ? 12 : 0,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ label: string; meta?: string }>;
  empty: string;
}): React.ReactElement {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{empty}</div>
      ) : (
        items.map((item, index) => (
          <div key={`${item.label}-${index}`} style={{ marginBottom: index === items.length - 1 ? 0 : 10 }}>
            <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.45 }}>
              <strong>{item.label}</strong>
              {item.meta ? <span style={{ color: "#64748b" }}> — {item.meta}</span> : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function OverviewPanel({ vfdData }: OverviewPanelProps): React.ReactElement {
  const summary = useMemo(() => {
    const definition = vfdData?.definition || {};
    const nodes = Array.isArray(vfdData?.nodes) ? vfdData.nodes : [];
    const flows = Array.isArray(vfdData?.flows) ? vfdData.flows : [];
    const forces = Array.isArray(vfdData?.forces) ? vfdData.forces : [];
    const frictions = Array.isArray(vfdData?.frictionPoints) ? vfdData.frictionPoints : [];
    const loops = Array.isArray(vfdData?.feedbackLoops) ? vfdData.feedbackLoops : [];

    const nodeMap = Object.fromEntries(nodes.map((node: any) => [node.id, node]));
    const valueNodes = nodes.filter((node: any) => node.category === "value" && node.state !== "void");
    const enablingNodes = nodes.filter((node: any) => node.category === "enabling");
    const wasteNodes = nodes.filter((node: any) => node.category === "waste");
    const capabilityNodes = nodes.filter((node: any) => node.category === "capability" || node.state === "void");
    const modeledWorkNodes = nodes.filter((node: any) => node.category !== "waste" && node.category !== "capability" && node.state !== "void");

    const countBy = (items: any[], getter: (item: any) => string | undefined | null) => {
      const counts: Record<string, number> = {};
      items.forEach((item) => {
        const key = getter(item);
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    };

    const transformCounts = countBy(modeledWorkNodes, (node) => node.transformCharacter || undefined);
    const valueNatureCounts: Record<string, number> = {};
    modeledWorkNodes.forEach((node: any) => {
      const primaryNature =
        (node.valueNatures || []).find((entry: any) => entry?.isPrimary)?.nature || node.valueNatures?.[0]?.nature;
      if (!primaryNature) return;
      valueNatureCounts[primaryNature] = (valueNatureCounts[primaryNature] || 0) + 1;
    });

    const stateCounts = countBy(nodes, (node) => node.state || undefined);
    const qualityCounts = countBy(flows, (flow) => flow.quality || "good");
    const mediumCounts = countBy(flows, (flow) => flow.medium || "data");
    const wasteCounts = countBy(wasteNodes, (node) => node.wasteSpec?.wasteType || "queue");
    const capabilityKindCounts = countBy(capabilityNodes, (node) => node.capabilitySpec?.kind || "automation");
    const forceCategoryCounts = countBy(forces, (force) => force.category || undefined);
    const forcePolarityCounts = countBy(forces, (force) => force.polarity || "constraining");
    const loopPolarityCounts = countBy(loops, (loop) => loop.polarity || "reinforcing");

    const hinderingForceCounts: Record<string, number> = {};
    forces
      .filter((force: any) => force.polarity !== "enabling")
      .forEach((force: any) => {
        if (!force.actingOn) return;
        hinderingForceCounts[force.actingOn] = (hinderingForceCounts[force.actingOn] || 0) + 1;
      });

    const attachedWasteCounts: Record<string, number> = {};
    wasteNodes.forEach((node: any) => {
      const target = node.wasteSpec?.parasitises;
      if (!target) return;
      attachedWasteCounts[target] = (attachedWasteCounts[target] || 0) + 1;
    });

    const degradedFlowCounts: Record<string, number> = {};
    flows
      .filter((flow: any) => flow.quality === "degraded" || flow.quality === "broken")
      .forEach((flow: any) => {
        [flow.from, flow.to].forEach((nodeId) => {
          if (!nodeId) return;
          degradedFlowCounts[nodeId] = (degradedFlowCounts[nodeId] || 0) + 1;
        });
      });

    const topRanked = (counts: Record<string, number>, limit: number, labelResolver: (id: string) => string) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count]) => ({
          label: labelResolver(id),
          meta: `${count}`,
        }));

    const topFrictions = [...frictions]
      .sort((a: any, b: any) => {
        const order = { critical: 4, high: 3, moderate: 2, low: 1 } as Record<string, number>;
        return (order[b.severity || "low"] || 0) - (order[a.severity || "low"] || 0);
      })
      .slice(0, 3)
      .map((friction: any) => ({
        label: friction.title || "Friction Point",
        meta: `${friction.severity || "moderate"} · ${nodeMap[friction.primaryNode]?.label || friction.primaryNode || "Unassigned"}`,
      }));

    const dominantTransform = Object.entries(transformCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominantNature = Object.entries(valueNatureCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominantMedium = Object.entries(mediumCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominantWaste = Object.entries(wasteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominantForce = Object.entries(forceCategoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const synthesis = [
      dominantTransform
        ? `Most modeled work is tagged as ${String(TRANSFORM_CHARACTER_LABELS[dominantTransform] || dominantTransform).toLowerCase()} transformation.`
        : null,
      dominantNature
        ? `The most common value label in the semantic bands is ${String(VALUE_NATURE_LABELS[dominantNature] || dominantNature).toLowerCase()}.`
        : null,
      dominantMedium
        ? `Flows propagate mainly through ${String(FLOW_MEDIUM_LABELS[dominantMedium] || dominantMedium).toLowerCase()}.`
        : null,
      dominantWaste
        ? `The main leak is ${String(WASTE_LABELS[dominantWaste] || dominantWaste).toLowerCase()}.`
        : null,
      dominantForce
        ? `Constraining pressure is led by ${String(FORCE_CATEGORY_LABELS[dominantForce] || dominantForce).toLowerCase()} forces.`
        : null,
    ].filter(Boolean) as string[];

    return {
      definition,
      counts: {
        value: valueNodes.length,
        enabling: enablingNodes.length,
        waste: wasteNodes.length,
        capabilities: capabilityNodes.length,
        flows: flows.length,
        frictions: frictions.length,
        loops: loops.length,
      },
      transformCounts,
      valueNatureCounts,
      stateCounts,
      qualityCounts,
      mediumCounts,
      wasteCounts,
      capabilityKindCounts,
      forceCategoryCounts,
      forcePolarityCounts,
      loopPolarityCounts,
      topFrictions,
      topHinderingNodes: topRanked(hinderingForceCounts, 3, (id) => nodeMap[id]?.label || id),
      topWasteNodes: topRanked(attachedWasteCounts, 3, (id) => nodeMap[id]?.label || id),
      topDegradedNodes: topRanked(degradedFlowCounts, 3, (id) => nodeMap[id]?.label || id),
      synthesis,
    };
  }, [vfdData]);

  const definition = summary.definition || {};
  const totalTransforms = Object.values(summary.transformCounts).reduce((sum, count) => sum + count, 0);
  const totalValueNatures = Object.values(summary.valueNatureCounts).reduce((sum, count) => sum + count, 0);
  const totalStates = Object.values(summary.stateCounts).reduce((sum, count) => sum + count, 0);
  const totalQualities = Object.values(summary.qualityCounts).reduce((sum, count) => sum + count, 0);
  const totalMediums = Object.values(summary.mediumCounts).reduce((sum, count) => sum + count, 0);
  const totalWaste = Object.values(summary.wasteCounts).reduce((sum, count) => sum + count, 0);
  const totalForceCategories = Object.values(summary.forceCategoryCounts).reduce((sum, count) => sum + count, 0);
  const totalForcePolarity = Object.values(summary.forcePolarityCounts).reduce((sum, count) => sum + count, 0);
  const totalLoops = Object.values(summary.loopPolarityCounts).reduce((sum, count) => sum + count, 0);
  const totalCapabilities = Object.values(summary.capabilityKindCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ paddingBottom: 24 }}>
      <Section title="Model Framing">
        <div style={{ padding: 14, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
            {definition.processName || "VFD Diagram"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
            {definition.description || "Where is value being destroyed — and why?"}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["Value Atom", definition.valueAtom],
              ["Output", definition.output],
              ["Customer", definition.customer],
              ["Configuration", definition.valueConfiguration],
              ["Trigger", definition.trigger],
              ["Endpoint", definition.endpoint],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.55 }}>{value}</div>
                </div>
              ))}
            {definition.configurationNotes ? (
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55 }}>
                {definition.configurationNotes}
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="Structural Snapshot" intro="Counts below reflect what is currently modeled and visible in the main system map.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <MetricCard label="Value Nodes" value={summary.counts.value} accent="#22c55e" />
          <MetricCard label="Enabling Nodes" value={summary.counts.enabling} accent="#3b82f6" />
          <MetricCard label="Waste Nodes" value={summary.counts.waste} accent="#ef4444" />
          <MetricCard label="Capabilities" value={summary.counts.capabilities} accent={AGENTIC_ACCENT} />
          <MetricCard label="Flows" value={summary.counts.flows} accent="#64748b" />
          <MetricCard label="Friction / Loops" value={`${summary.counts.frictions} / ${summary.counts.loops}`} accent="#8b5cf6" />
        </div>
      </Section>

      <Section title="Node Condition" intro="State and category describe what kinds of work exist and what condition those nodes are in.">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>State Distribution</div>
          {Object.entries(STATE_LABELS).map(([state, label]) => (
            <DistributionRow
              key={state}
              label={label}
              count={summary.stateCounts[state] || 0}
              total={totalStates}
              color={STATE_COLORS[state] || "#94a3b8"}
            />
          ))}
        </div>
        {totalCapabilities > 0 ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Capability Types</div>
            {Object.entries(CAPABILITY_KIND_LABELS).map(([kind, label]) => (
              <DistributionRow
                key={kind}
                label={label}
                count={summary.capabilityKindCounts[kind] || 0}
                total={totalCapabilities}
                color={AGENTIC_ACCENT}
              />
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Semantic Bands" intro="The top band on value and enabling cards uses text tags, not icons. These distributions summarize those tags across the model.">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Transformation Tags</div>
          {Object.entries(TRANSFORM_CHARACTER_LABELS).map(([transform, label]) => (
            <DistributionRow
              key={transform}
              label={label}
              count={summary.transformCounts[transform] || 0}
              total={totalTransforms}
              color={TRANSFORM_CHARACTER_COLORS[transform] || "#475569"}
            />
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Value Labels</div>
          {Object.entries(VALUE_NATURE_LABELS).map(([nature, label]) => (
            <DistributionRow
              key={nature}
              label={label}
              count={summary.valueNatureCounts[nature] || 0}
              total={totalValueNatures}
              color="#64748b"
              hint="shown as text in the node band"
            />
          ))}
        </div>
      </Section>

      <Section title="Propagation Profile" intro="Flow color indicates health. Flow line style indicates medium.">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Flow Quality</div>
          {[
            ["good", "Good", QUALITY_COLORS.good],
            ["degraded", "Degraded", QUALITY_COLORS.degraded],
            ["broken", "Broken", QUALITY_COLORS.broken],
          ].map(([quality, label, color]) => (
            <DistributionRow
              key={quality}
              label={label}
              count={summary.qualityCounts[quality] || 0}
              total={totalQualities}
              color={String(color)}
            />
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Flow Medium</div>
          {Object.entries(FLOW_MEDIUM_LABELS).map(([medium, label]) => (
            <DistributionRow
              key={medium}
              label={label}
              count={summary.mediumCounts[medium] || 0}
              total={totalMediums}
              color="#64748b"
            />
          ))}
        </div>
      </Section>

      <Section title="Waste and Pressure" intro="These are the dominant failure patterns and the pressure sources behind them.">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Waste Types</div>
          {Object.entries(WASTE_LABELS).map(([type, label]) => (
            <DistributionRow
              key={type}
              label={label}
              count={summary.wasteCounts[type] || 0}
              total={totalWaste}
              color="#ef4444"
            />
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Force Balance</div>
          <DistributionRow
            label="Helping"
            count={summary.forcePolarityCounts.enabling || 0}
            total={totalForcePolarity}
            color="#22c55e"
          />
          <DistributionRow
            label="Hindering"
            count={(summary.forcePolarityCounts.constraining || 0) + Object.keys(summary.forcePolarityCounts)
              .filter((key) => key !== "enabling" && key !== "constraining")
              .reduce((sum, key) => sum + (summary.forcePolarityCounts[key] || 0), 0)}
            total={totalForcePolarity}
            color="#ef4444"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Force Categories</div>
          {Object.entries(FORCE_CATEGORY_LABELS).map(([category, label]) => (
            <DistributionRow
              key={category}
              label={label}
              count={summary.forceCategoryCounts[category] || 0}
              total={totalForceCategories}
              color="#64748b"
            />
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Loop Polarity</div>
          <DistributionRow label="Reinforcing" count={summary.loopPolarityCounts.reinforcing || 0} total={totalLoops} color="#dc2626" />
          <DistributionRow label="Balancing" count={summary.loopPolarityCounts.balancing || 0} total={totalLoops} color="#2563eb" />
        </div>
      </Section>

      <Section title="Priority Areas" intro="These are the best entry points for review or intervention.">
        <div style={{ display: "grid", gap: 10 }}>
          <ListCard title="Highest-Severity Friction" items={summary.topFrictions} empty="No friction points defined." />
          <ListCard title="Most Burdened by Hindering Forces" items={summary.topHinderingNodes} empty="No force hotspots yet." />
          <ListCard title="Most Parasitized by Waste" items={summary.topWasteNodes} empty="No waste hotspots yet." />
          <ListCard title="Most Touched by Degraded Flows" items={summary.topDegradedNodes} empty="No degraded or broken flow hotspots yet." />
        </div>
      </Section>

      <Section title="Synthesis" intro="A short reading based on the current model structure.">
        <div style={{ padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          {summary.synthesis.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Not enough structured data yet to synthesize the model.</div>
          ) : (
            summary.synthesis.map((line, index) => (
              <div key={index} style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.6, marginBottom: index === summary.synthesis.length - 1 ? 0 : 8 }}>
                {line}
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}
