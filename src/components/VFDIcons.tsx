// Icon components for VFD visualization
// Waste icons, transform character icons, badges, state indicators

import React from "react";
import {
  WASTE_ICON_COLORS,
  STATE_COLORS,
  FRICTION_SEVERITY_COLORS,
} from "../lib/vfd.constants";

/**
 * Waste type icon — rendered inside waste nodes
 */
export function WasteIcon({
  type,
  size = 18,
  color,
}: {
  type: string;
  size?: number;
  color?: string;
}): React.ReactElement | null {
  const c = color || WASTE_ICON_COLORS[type] || "#64748b";
  const s = size;

  // Queue — clock (waiting)
  if (type === "queue") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }

  // Rework — refresh arrow
  if (type === "rework") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    );
  }

  // Translation — language/translate
  if (type === "translation") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7h8M8 4v3M4 11c1.5 2.5 4 4 8 4" />
        <path d="M20 20l-3-6-3 6M14.5 18h5" />
      </svg>
    );
  }

  // Overprocessing — grid
  if (type === "overprocessing") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    );
  }

  return null;
}

/**
 * Transform character icon — rendered in value/enabling nodes
 */
export function TransformIcon({
  type,
  size = 13,
}: {
  type: string;
  size?: number;
}): React.ReactElement | null {
  const c = "#64748b";
  const s = size;

  // Analytical — magnifying glass
  if (type === "analytical") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="4" stroke={c} strokeWidth="1" fill="none" />
        <path d="M10 10l3 3" stroke={c} strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  // Interpretive — head with brain
  if (type === "interpretive") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6c0-2 1.5-3.5 3.5-3.5S9 4 9 6" stroke={c} strokeWidth="1" fill="none" />
        <circle cx="5.5" cy="6" r="3.5" stroke={c} strokeWidth="1" fill="none" />
        <path d="M3 6v3h5v-3" stroke={c} strokeWidth="0.8" fill="none" />
      </svg>
    );
  }

  // Integrative / Generative — interconnected nodes
  if (type === "integrative" || type === "generative") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="1.5" stroke={c} strokeWidth="1" fill="none" />
        <circle cx="12" cy="4" r="1.5" stroke={c} strokeWidth="1" fill="none" />
        <circle cx="8" cy="12" r="1.5" stroke={c} strokeWidth="1" fill="none" />
        <path d="M4 4l8 0l-4 8Z" stroke={c} strokeWidth="0.8" fill="none" />
      </svg>
    );
  }

  // Evaluative — balance scales
  if (type === "evaluative") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="2" x2="8" y2="5" stroke={c} strokeWidth="1" />
        <rect x="3" y="5" width="3" height="2" stroke={c} strokeWidth="1" fill="none" />
        <rect x="10" y="5" width="3" height="2" stroke={c} strokeWidth="1" fill="none" />
        <path d="M4 7v3M12 7v3M3 10h10" stroke={c} strokeWidth="1" fill="none" />
      </svg>
    );
  }

  // Procedural — steps/checklist
  if (type === "procedural") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3l1.5 1.5l3-3" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 7l1.5 1.5l3-3" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11l1.5 1.5l3-3" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9" y1="4" x2="14" y2="4" stroke={c} strokeWidth="0.8" opacity="0.5" />
        <line x1="9" y1="8" x2="14" y2="8" stroke={c} strokeWidth="0.8" opacity="0.5" />
        <line x1="9" y1="12" x2="14" y2="12" stroke={c} strokeWidth="0.8" opacity="0.5" />
      </svg>
    );
  }

  return null;
}

/**
 * Value nature icon — rendered in value-focused contexts
 */
export function ValueNatureIcon({
  nature,
  size = 14,
}: {
  nature: string;
  size?: number;
}): React.ReactElement | null {
  const c = "#64748b";
  const s = size;

  if (nature === "knowledge_generation") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="3.5" stroke={c} strokeWidth="1.2" />
        <path d="M9.8 9.8L13 13" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (nature === "artifact_production") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2.5h5l3 3V13a1 1 0 0 1-1 1H4.8A.8.8 0 0 1 4 13.2V2.5Z" stroke={c} strokeWidth="1.1" fill="none" />
        <path d="M9 2.5V6h3" stroke={c} strokeWidth="1.1" />
      </svg>
    );
  }

  if (nature === "risk_reduction") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2.2l4 1.4v3.2c0 2.7-1.5 4.9-4 6-2.5-1.1-4-3.3-4-6V3.6L8 2.2Z" stroke={c} strokeWidth="1.1" fill="none" />
        <path d="M6.2 7.9l1.2 1.2 2.4-2.5" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (nature === "alignment") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="8" r="1.5" stroke={c} strokeWidth="1.1" />
        <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.1" />
        <circle cx="8" cy="4" r="1.5" stroke={c} strokeWidth="1.1" />
        <path d="M5.3 7.2 6.7 5.1M9.3 5.1l1.4 2.1M5.7 8h4.6" stroke={c} strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  if (nature === "commitment") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="4.6" stroke={c} strokeWidth="1.1" />
        <path d="M6.1 8.1 7.4 9.4 10.2 6.6" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (nature === "capability_enablement") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.2 6.8a2.4 2.4 0 1 1 3.7 2l-3.6 3.7a1.4 1.4 0 1 1-2-2l3.7-3.6" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.6 5.2l1.2-1.2a1.4 1.4 0 1 1 2 2l-1.2 1.2" stroke={c} strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

/**
 * Friction point badge — rendered on nodes where friction points occur
 */
export function FrictionBadge({
  severity,
  count = 1,
  radius = 12,
}: {
  severity: string;
  count?: number;
  radius?: number;
}): React.ReactElement {
  const bgColor = FRICTION_SEVERITY_COLORS[severity] || "#6b7280";
  const severityInitial: Record<string, string> = { critical: "C", high: "H", moderate: "M", low: "L" };
  const label = count > 1 ? count.toString() : (severityInitial[severity] || "!");

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx={radius} cy={radius} r={radius} fill={bgColor} opacity="0.9" />
      <text
        x={radius}
        y={radius}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={radius * 0.9}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

/**
 * State color swatch — visual indicator of node state
 */
export function StateColorSwatch({
  state,
  size = 12,
}: {
  state: string;
  size?: number;
}): React.ReactElement {
  const color = STATE_COLORS[state] || "#94a3b8";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        border: `1px solid ${color}`,
        display: "inline-block",
      }}
    />
  );
}

/**
 * Severity badge — for friction points or other severity indicators
 */
export function SeverityBadge({
  severity,
}: {
  severity: string;
}): React.ReactElement {
  const bgColor = FRICTION_SEVERITY_COLORS[severity] || "#6b7280";
  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    moderate: "Moderate",
    low: "Low",
  };

  return (
    <div
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "3px",
        backgroundColor: bgColor,
        color: "white",
        fontSize: "11px",
        fontWeight: "600",
      }}
    >
      {labels[severity] || severity}
    </div>
  );
}

/**
 * Force intensity indicator — 1-3 dots
 */
export function ForceIntensity({
  intensity,
  size = 4,
  spacing = 2,
}: {
  intensity: number;
  size?: number;
  spacing?: number;
}): React.ReactElement {
  const dots = Math.max(1, Math.min(3, Math.floor(intensity)));

  return (
    <div style={{ display: "flex", gap: spacing }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: i <= dots ? "currentColor" : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Org relation badge — shows organizational distance
 */
export function OrgRelationBadge({
  relation,
}: {
  relation: string;
}): React.ReactElement {
  const colors: Record<string, string> = {
    embedded: "#22c55e",      // Green
    aligned: "#3b82f6",       // Blue
    matrixed: "#eab308",      // Amber
    service: "#f97316",       // Orange
    contracted: "#ef4444",    // Red
    regulatory: "#8b5cf6",    // Purple
  };

  const labels: Record<string, string> = {
    embedded: "Embedded",
    aligned: "Aligned",
    matrixed: "Matrixed",
    service: "Service",
    contracted: "Contracted",
    regulatory: "Regulatory",
  };

  const color = colors[relation] || "#6b7280";
  const label = labels[relation] || relation;

  return (
    <div
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: "3px",
        backgroundColor: color,
        color: "white",
        fontSize: "10px",
        fontWeight: "600",
      }}
    >
      {label}
    </div>
  );
}
