import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  AGENTIC_ACCENT,
  AGENTIC_BAND,
  AGENTIC_BORDER,
  AGENTIC_TEXT,
  AGENTIC_TINT,
  CAPABILITY_KIND_LABELS,
  LAYERS,
  AGENT_MATURITY_COLORS,
  STATE_COLORS,
  STATE_LABELS,
  WASTE_ICON_COLORS,
  QUALITY_COLORS,
  FORCE_CATEGORY_COLORS,
  FRICTION_SEVERITY_COLORS,
  NODE_WIDTH,
  NODE_HEIGHT,
  WASTE_WIDTH,
  WASTE_HEIGHT,
  FRICTION_BADGE_RADIUS,
  SVG,
  INTERACTION,
  ENABLING_TINT,
  TRANSFORM_CHARACTER_COLORS,
  VALUE_NATURE_LABELS,
  WASTE_TINT,
} from "../lib/vfd.constants";
import {
  getNodeCenter,
  getFlowEdgePoint,
  getBezierPath,
  getFlowDashPattern,
  getFlowStrokeWidth,
  getAngleBetweenPoints,
} from "../lib/vfd.rendering";
import {
  WasteIcon,
} from "./VFDIcons";
import { boundingBox } from "../lib/layout";
import OverviewPanel from "./OverviewPanel";
import InspectPanel from "./InspectPanel";
import GuidePanel from "./GuidePanel";
import AnalystAIPanel, { type AnalystAnnotation } from "./AnalystAIPanel";

interface VFDRendererProps {
  vfdData: any;
  fileName: string;
  validation: any;
  onLoadNew: () => void;
  onLoadVisualization: (data: unknown, fileName: string) => void | Promise<void>;
  onLoadSaved: () => void | Promise<void>;
  onRearrange: () => void | Promise<void>;
  onSaveVisualization: () => void;
  onNodePositionChange: (nodeId: string, x: number, y: number) => void;
  onElementChange: (elementType: string, elementId: string, changes: Record<string, any>) => void;
  onExportPdf: (payload: { diagramSvg: string; selectedElement: any; selectedType: string | null }) => void;
  isLayouting: boolean;
  saveStatus: "idle" | "saved" | "error";
  hasSavedVisualization: boolean;
}

export default function VFDRenderer({
  vfdData,
  fileName,
  validation,
  onLoadNew,
  onLoadVisualization,
  onLoadSaved,
  onRearrange,
  onSaveVisualization,
  onNodePositionChange,
  onElementChange,
  onExportPdf,
  isLayouting,
  saveStatus,
  hasSavedVisualization,
}: VFDRendererProps): React.ReactElement {
  const getLinkedCapabilityProfile = useCallback(
    (node: any) => {
      const profiles = vfdData.capabilityProfiles || vfdData.agentProfiles || [];
      if (node.capabilitySpec?.profileId) {
        return profiles.find((profile: any) => profile.id === node.capabilitySpec.profileId) || null;
      }
      return profiles.find((profile: any) => profile.capabilityNodeId === node.id) || null;
    },
    [vfdData.agentProfiles, vfdData.capabilityProfiles]
  );

  const getTransformTag = useCallback((transformCharacter?: string) => {
    switch (transformCharacter) {
      case "analytical":
        return "ANALYTICAL";
      case "interpretive":
        return "INTERPRETIVE";
      case "integrative":
        return "INTEGRATIVE";
      case "generative":
        return "GENERATIVE";
      case "evaluative":
        return "EVALUATIVE";
      case "procedural":
        return "PROCEDURAL";
      default:
        return null;
    }
  }, []);

  const getAnnotationVisual = useCallback((style: AnalystAnnotation["style"]) => {
    switch (style) {
      case "bottleneck":
        return { stroke: "#d97706", fill: "rgba(245, 158, 11, 0.12)", glow: "rgba(245, 158, 11, 0.22)" };
      case "risk":
        return { stroke: "#dc2626", fill: "rgba(239, 68, 68, 0.12)", glow: "rgba(239, 68, 68, 0.22)" };
      case "opportunity":
        return { stroke: "#16a34a", fill: "rgba(34, 197, 94, 0.12)", glow: "rgba(34, 197, 94, 0.22)" };
      case "change-impact":
        return { stroke: "#7c3aed", fill: "rgba(139, 92, 246, 0.12)", glow: "rgba(139, 92, 246, 0.22)" };
      case "focus":
      default:
        return { stroke: "#2563eb", fill: "rgba(59, 130, 246, 0.12)", glow: "rgba(59, 130, 246, 0.22)" };
    }
  }, []);

  const wrapAnnotationText = useCallback((text: string) => {
    const normalized = text.trim().replace(/\s+/g, " ");
    if (!normalized) return [];

    const maxCharsPerLine = 28;
    const words = normalized.split(" ");
    const lines: string[] = [];
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        current = candidate;
        return;
      }

      if (current) {
        lines.push(current);
      }

      if (word.length <= maxCharsPerLine) {
        current = word;
        return;
      }

      let remainder = word;
      while (remainder.length > maxCharsPerLine) {
        lines.push(`${remainder.slice(0, maxCharsPerLine - 1)}-`);
        remainder = remainder.slice(maxCharsPerLine - 1);
      }
      current = remainder;
    });

    if (current) {
      lines.push(current);
    }

    return lines.slice(0, 4);
  }, []);

  // ── State ──────────────────────────────────────────────────────────────
  const [layers, setLayers] = useState<Set<string>>(new Set(["value", "enabling", "waste"]));
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [analystAnnotations, setAnalystAnnotations] = useState<AnalystAnnotation[]>([]);
  const [panelTab, setPanelTab] = useState<"overview" | "guide" | "inspect" | "analyst">("guide");
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [zoom, setZoom] = useState(0.8);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [draggedNode, setDraggedNode] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasAutoCenteredRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preAnnotationLayersRef = useRef<Set<string> | null>(null);

  // ── Computed lookups ───────────────────────────────────────────────────
  const nodeMap = useMemo(() => {
    const map: Record<string, any> = {};
    vfdData.nodes?.forEach((n: any) => {
      map[n.id] = n;
    });
    return map;
  }, [vfdData.nodes]);

  const getRequiredLayersForAnnotation = useCallback(
    (annotation: AnalystAnnotation) => {
      const required = new Set<string>();

      const addNodeLayer = (nodeId: string) => {
        const node = nodeMap[nodeId];
        if (!node) return;
        if (node.category === "value" && node.state !== "void") required.add("value");
        if (node.category === "enabling") required.add("enabling");
        if (node.category === "waste") required.add("waste");
        if (node.category === "capability" || node.state === "void") required.add("voids");
      };

      if (annotation.targetType === "node") {
        annotation.ids.forEach(addNodeLayer);
      }

      if (annotation.targetType === "flow") {
        annotation.ids.forEach((flowId) => {
          const flow = vfdData.flows?.find((entry: any) => entry.id === flowId);
          if (!flow) return;
          addNodeLayer(flow.from);
          addNodeLayer(flow.to);
        });
      }

      if (annotation.targetType === "friction") {
        required.add("friction");
        annotation.ids.forEach((frictionId) => {
          const friction = vfdData.frictionPoints?.find((entry: any) => entry.id === frictionId);
          if (!friction) return;
          addNodeLayer(friction.primaryNode);
        });
      }

      if (annotation.targetType === "loop") {
        required.add("loops");
        annotation.ids.forEach((loopId) => {
          const loop = vfdData.feedbackLoops?.find((entry: any) => entry.id === loopId);
          if (!loop) return;
          addNodeLayer(loop.fromNode);
          addNodeLayer(loop.toNode);
        });
      }

      return required;
    },
    [nodeMap, vfdData.feedbackLoops, vfdData.flows, vfdData.frictionPoints]
  );

  const svgDimensions = useMemo(() => {
    const allNodes = vfdData.nodes || [];
    const bb = boundingBox(allNodes);
    // Keep a large white working margin so dragged nodes do not get trapped at the canvas edge.
    const padX = 260;
    const padTop = 420;
    const padBottom = 260;
    return {
      width: bb ? Math.max(SVG.WIDTH, bb.maxX - bb.minX + padX * 2) : SVG.WIDTH,
      height: bb ? Math.max(SVG.HEIGHT, bb.maxY - bb.minY + padTop + padBottom) : SVG.HEIGHT,
      offsetX: bb ? padX - bb.minX : padX,
      offsetY: bb ? padTop - bb.minY : padTop,
    };
  }, [vfdData.nodes]);

  const currentSelectedElement = useMemo(() => {
    if (!selectedElement?.id || !selectedType) return null;

    if (selectedType === "node") {
      return vfdData.nodes?.find((node: any) => node.id === selectedElement.id) || null;
    }
    if (selectedType === "flow") {
      return vfdData.flows?.find((flow: any) => flow.id === selectedElement.id) || null;
    }
    if (selectedType === "friction") {
      return vfdData.frictionPoints?.find((friction: any) => friction.id === selectedElement.id) || null;
    }
    if (selectedType === "loop") {
      return vfdData.feedbackLoops?.find((loop: any) => loop.id === selectedElement.id) || null;
    }

    return null;
  }, [selectedElement, selectedType, vfdData.feedbackLoops, vfdData.frictionPoints, vfdData.flows, vfdData.nodes]);

  const clientPointToDiagram = useCallback(
    (clientX: number, clientY: number) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return null;

      return {
        x: (clientX - canvasRect.left - pan.x - svgDimensions.offsetX) / zoom,
        y: (clientY - canvasRect.top - pan.y - svgDimensions.offsetY) / zoom,
      };
    },
    [pan.x, pan.y, svgDimensions.offsetX, svgDimensions.offsetY, zoom]
  );

// ── Event handlers ─────────────────────────────────────────────────────
  const toggleLayer = useCallback(
    (layerId: string) => {
      const newLayers = new Set(layers);

      // Layer dependencies: if adding waste/friction/loops/capabilities, include value & enabling
      if (
        ["waste", "friction", "loops", "voids"].includes(layerId) &&
        !newLayers.has(layerId)
      ) {
        newLayers.add("value");
        newLayers.add("enabling");
      }

      if (newLayers.has(layerId)) {
        newLayers.delete(layerId);
      } else {
        newLayers.add(layerId);
      }

      // Value layer is always on
      if (newLayers.size === 0) {
        newLayers.add("value");
      }

      setLayers(newLayers);
    },
    [layers]
  );

  const handleSvgWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 / INTERACTION.ZOOM_STEP : INTERACTION.ZOOM_STEP;
      const newZoom = Math.max(INTERACTION.MIN_ZOOM, Math.min(INTERACTION.MAX_ZOOM, zoom * delta));
      setZoom(newZoom);
    },
    [zoom]
  );

  const handleSvgMouseDown = useCallback((e: React.MouseEvent) => {
    // Left click drag (button 0) or middle click drag (button 1)
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedNode) {
        const point = clientPointToDiagram(e.clientX, e.clientY);
        if (!point) return;
        const nextX = Math.max(
          draggedNode.minX,
          Math.min(draggedNode.maxX, point.x - draggedNode.offsetX)
        );
        const nextY = Math.max(
          draggedNode.minY,
          Math.min(draggedNode.maxY, point.y - draggedNode.offsetY)
        );
        onNodePositionChange(
          draggedNode.id,
          nextX,
          nextY
        );
        return;
      }

      if (isPanning && panStart) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [clientPointToDiagram, draggedNode, isPanning, onNodePositionChange, panStart]
  );

  const handleSvgMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
    setDraggedNode(null);
  }, []);

  const handleExportPdf = useCallback(() => {
    if (!svgRef.current) return;

    const clonedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
    clonedSvg.style.transform = "none";
    clonedSvg.style.transition = "none";
    clonedSvg.style.transformOrigin = "0 0";
    clonedSvg.style.maxWidth = "100%";
    clonedSvg.style.height = "auto";

    onExportPdf({
      diagramSvg: clonedSvg.outerHTML,
      selectedElement: currentSelectedElement,
      selectedType,
    });
  }, [currentSelectedElement, onExportPdf, selectedType]);

  const handleCenterView = useCallback(() => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const contentWidth = svgDimensions.width * zoom;
    const contentHeight = svgDimensions.height * zoom;

    setPan({
      x: Math.round((canvasRect.width - contentWidth) / 2 - svgDimensions.offsetX),
      y: Math.round((canvasRect.height - contentHeight) / 2 - svgDimensions.offsetY),
    });
  }, [svgDimensions.height, svgDimensions.offsetX, svgDimensions.offsetY, svgDimensions.width, zoom]);

  useEffect(() => {
    if (hasAutoCenteredRef.current) return;
    handleCenterView();
    hasAutoCenteredRef.current = true;
  }, [handleCenterView]);

  useEffect(() => {
    setAnalystAnnotations([]);
  }, [fileName]);

  useEffect(() => {
    if (analystAnnotations.length === 0) {
      if (preAnnotationLayersRef.current) {
        setLayers(new Set(preAnnotationLayersRef.current));
        preAnnotationLayersRef.current = null;
      }
      return;
    }

    if (!preAnnotationLayersRef.current) {
      preAnnotationLayersRef.current = new Set(layers);
    }

    const requiredLayers = new Set<string>();
    analystAnnotations.forEach((annotation) => {
      getRequiredLayersForAnnotation(annotation).forEach((layer) => requiredLayers.add(layer));
    });

    setLayers((current) => {
      const next = new Set(current);
      requiredLayers.forEach((layer) => next.add(layer));
      if (next.size === current.size && Array.from(next).every((layer) => current.has(layer))) {
        return current;
      }
      return next;
    });
  }, [analystAnnotations, getRequiredLayersForAnnotation, layers]);

  const handleLoadFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          await onLoadVisualization(data, file.name);
        } catch {
          await onLoadVisualization(null, file.name);
        } finally {
          e.target.value = "";
        }
      };
      reader.readAsText(file);
    },
    [onLoadVisualization]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: any) => {
      if (e.button !== 0) return;

      const point = clientPointToDiagram(e.clientX, e.clientY);
      if (!point) return;
      const nodeWidth = node.category === "waste" ? WASTE_WIDTH : NODE_WIDTH;
      const nodeHeight = node.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
      const sideMargin = 20;
      const topMargin = 84;
      const bottomMargin = 20;

      setDraggedNode({
        id: node.id,
        offsetX: point.x - node.x,
        offsetY: point.y - node.y,
        minX: sideMargin - svgDimensions.offsetX,
        minY: topMargin - svgDimensions.offsetY,
        maxX: svgDimensions.width - svgDimensions.offsetX - nodeWidth - sideMargin,
        maxY: svgDimensions.height - svgDimensions.offsetY - nodeHeight - bottomMargin,
      });
      e.stopPropagation();
      e.preventDefault();
    },
    [clientPointToDiagram, svgDimensions.height, svgDimensions.offsetX, svgDimensions.offsetY, svgDimensions.width]
  );

  const handleNodeClick = useCallback((node: any) => {
    setSelectedElement(node);
    setSelectedType("node");
    setPanelTab("inspect");
  }, []);

  const handleFlowClick = useCallback((flow: any) => {
    setSelectedElement(flow);
    setSelectedType("flow");
    setPanelTab("inspect");
  }, []);

  const handleFrictionClick = useCallback((friction: any) => {
    setSelectedElement(friction);
    setSelectedType("friction");
    setPanelTab("inspect");
  }, []);

  const handleLoopClick = useCallback((loop: any) => {
    setSelectedElement(loop);
    setSelectedType("loop");
    setPanelTab("inspect");
  }, []);

  // ── Node visibility logic ──────────────────────────────────────────────
  const isNodeVisible = (node: any): boolean => {
    if (node.category === "value" && node.state !== "void") return layers.has("value");
    if (node.category === "enabling") return layers.has("enabling");
    if (node.category === "waste") return layers.has("waste");
    if (node.category === "capability" || node.state === "void") return layers.has("voids");
    return false;
  };

  const isFlowVisible = (flow: any): boolean => {
    const fromNode = nodeMap[flow.from];
    const toNode = nodeMap[flow.to];
    if (!fromNode || !toNode) return false;
    return isNodeVisible(fromNode) && isNodeVisible(toNode);
  };

  const renderAnnotationLabel = useCallback(
    (x: number, y: number, text: string, style: AnalystAnnotation["style"], key: string) => {
      const visual = getAnnotationVisual(style);
      const lines = wrapAnnotationText(text);
      const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
      const width = Math.max(116, Math.min(320, longestLine * 6.8 + 24));
      const height = Math.max(22, lines.length * 13 + 10);
      return (
        <g key={key} style={{ pointerEvents: "none" }}>
          <rect
            x={x - width / 2}
            y={y}
            width={width}
            height={height}
            rx="11"
            fill="#ffffff"
            stroke={visual.stroke}
            strokeWidth="1.5"
          />
          <text x={x} y={y + 13} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={visual.stroke}>
            {lines.map((line, index) => (
              <tspan key={`${key}-${index}`} x={x} dy={index === 0 ? 0 : 12}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    },
    [getAnnotationVisual, wrapAnnotationText]
  );

  const getAnnotationStackOffset = useCallback((index: number) => {
    const stackOrder = index % 3;
    return stackOrder * 44;
  }, []);

  // ── Node rendering functions ───────────────────────────────────────────

  const renderValueNode = (node: any): React.ReactElement => {
    const isSelected = selectedElement?.id === node.id && selectedType === "node";
    const isHovered = hoveredElement === node.id;
    const stateColor = STATE_COLORS[node.state] || "#94a3b8";
    const frameColor = "#cbd5e1";
    const transformTag = getTransformTag(node.transformCharacter);
    const transformColor = TRANSFORM_CHARACTER_COLORS[node.transformCharacter || "analytical"] || "#475569";
    const primaryNature = (node.valueNatures || []).find((entry: any) => entry?.isPrimary)?.nature || node.valueNatures?.[0]?.nature;
    const semanticTag = transformTag && primaryNature
      ? `${transformTag} ${String(VALUE_NATURE_LABELS[primaryNature] || primaryNature).toUpperCase()}`
      : transformTag || (primaryNature ? String(VALUE_NATURE_LABELS[primaryNature] || primaryNature).toUpperCase() : null);
    return (
      <g
        key={node.id}
        onClick={() => handleNodeClick(node)}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        onMouseEnter={() => setHoveredElement(node.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: draggedNode?.id === node.id ? "grabbing" : "grab" }}
      >
        {/* Main card */}
        <rect
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="8"
          fill="#ffffff"
          stroke={isSelected ? "#3b82f6" : isHovered ? "#60a5fa" : frameColor}
          strokeWidth={isSelected || isHovered ? 2.4 : 1.8}
        />

        <rect
          x={node.x + 6}
          y={node.y + 6}
          width={NODE_WIDTH - 12}
          height={16}
          rx="8"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        <circle
          cx={node.x + 14}
          cy={node.y + 16}
          r={4.5}
          fill={stateColor}
          stroke="#ffffff"
          strokeWidth="1.25"
        />

        {semanticTag && (
          <text
            x={node.x + 24}
            y={node.y + 18}
            fontSize="8.5"
            fontWeight="700"
            fill={transformColor}
            opacity="0.95"
          >
            {semanticTag.length > 34 ? `${semanticTag.slice(0, 31)}...` : semanticTag}
          </text>
        )}

        {/* Label */}
        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 40}
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="600"
          fill="#0f172a"
          style={{ pointerEvents: "none" }}
        >
          {node.label || "Untitled"}
        </text>

        {/* Sublabel */}
        {node.sublabel && (
          <text
            x={node.x + NODE_WIDTH / 2}
            y={node.y + 56}
            textAnchor="middle"
            fontSize="9"
            fill="#64748b"
            style={{ pointerEvents: "none" }}
          >
            {node.sublabel.length > 34 ? node.sublabel.slice(0, 31) + "..." : node.sublabel}
          </text>
        )}

        {/* Value ratio bar (bottom left) */}
        {node.metrics?.valueRatio !== undefined && (
          <rect
            x={node.x + 2}
            y={node.y + NODE_HEIGHT - 4}
            width={(NODE_WIDTH - 4) * Math.max(0, Math.min(1, node.metrics.valueRatio))}
            height="3"
            rx="1"
            fill="#22c55e"
            opacity="0.7"
          />
        )}

      </g>
    );
  };

  const renderEnablingNode = (node: any): React.ReactElement => {
    const isSelected = selectedElement?.id === node.id && selectedType === "node";
    const isHovered = hoveredElement === node.id;
    const stateColor = STATE_COLORS[node.state] || "#94a3b8";
    const transformTag = getTransformTag(node.transformCharacter);
    const transformColor = TRANSFORM_CHARACTER_COLORS[node.transformCharacter || "analytical"] || "#475569";
    const primaryNature = (node.valueNatures || []).find((entry: any) => entry?.isPrimary)?.nature || node.valueNatures?.[0]?.nature;
    const semanticTag = transformTag && primaryNature
      ? `${transformTag} ${String(VALUE_NATURE_LABELS[primaryNature] || primaryNature).toUpperCase()}`
      : transformTag || (primaryNature ? String(VALUE_NATURE_LABELS[primaryNature] || primaryNature).toUpperCase() : null);

    return (
      <g
        key={node.id}
        onClick={() => handleNodeClick(node)}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        onMouseEnter={() => setHoveredElement(node.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: draggedNode?.id === node.id ? "grabbing" : "grab" }}
      >
        <rect
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="8"
          fill={ENABLING_TINT}
          stroke={isSelected ? "#2563eb" : isHovered ? "#60a5fa" : "#bfdbfe"}
          strokeWidth={isSelected || isHovered ? 2.4 : 1.8}
        />

        <rect
          x={node.x + 6}
          y={node.y + 6}
          width={NODE_WIDTH - 12}
          height={16}
          rx="8"
          fill="#ffffff"
          stroke="#dbeafe"
          strokeWidth="1"
        />

        <circle
          cx={node.x + 14}
          cy={node.y + 16}
          r={4.5}
          fill={stateColor}
          stroke="#ffffff"
          strokeWidth="1.25"
        />

        {semanticTag && (
          <text
            x={node.x + 24}
            y={node.y + 18}
            fontSize="8.5"
            fontWeight="700"
            fill={transformColor}
            opacity="0.95"
          >
            {semanticTag.length > 34 ? `${semanticTag.slice(0, 31)}...` : semanticTag}
          </text>
        )}

        {/* Label */}
        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 40}
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="600"
          fill="#0f172a"
          style={{ pointerEvents: "none" }}
        >
          {node.label || "Untitled"}
        </text>

        {node.sublabel && (
          <text
            x={node.x + NODE_WIDTH / 2}
            y={node.y + 56}
            textAnchor="middle"
            fontSize="9"
            fill="#64748b"
            style={{ pointerEvents: "none" }}
          >
            {node.sublabel.length > 34 ? node.sublabel.slice(0, 31) + "..." : node.sublabel}
          </text>
        )}
      </g>
    );
  };

  const renderWasteNode = (node: any): React.ReactElement => {
    const isSelected = selectedElement?.id === node.id && selectedType === "node";
    const isHovered = hoveredElement === node.id;
    const wasteType = node.wasteSpec?.wasteType || "queue";
    const iconColor = WASTE_ICON_COLORS[wasteType];
    const wasteTag = String(wasteType).toUpperCase();

    return (
      <g
        key={node.id}
        onClick={() => handleNodeClick(node)}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        onMouseEnter={() => setHoveredElement(node.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: draggedNode?.id === node.id ? "grabbing" : "grab" }}
      >
        {/* Card */}
        <rect
          x={node.x}
          y={node.y}
          width={WASTE_WIDTH}
          height={WASTE_HEIGHT}
          rx="10"
          fill={WASTE_TINT}
          stroke={isSelected ? "#3b82f6" : isHovered ? "#f87171" : "#fca5a5"}
          strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
        />

        <rect
          x={node.x + 5}
          y={node.y + 5}
          width={WASTE_WIDTH - 10}
          height={16}
          rx="7"
          fill="#fff7f7"
          stroke="#fecaca"
          strokeWidth="1"
        />

        <text
          x={node.x + 12}
          y={node.y + 18}
          fontSize="8.5"
          fontWeight="700"
          fill={iconColor}
          opacity="0.95"
        >
          {wasteTag}
        </text>

        <text
          x={node.x + WASTE_WIDTH / 2}
          y={node.y + 39}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#44403c"
          style={{ pointerEvents: "none" }}
        >
          {(node.label || "Waste").length > 22 ? (node.label || "Waste").slice(0, 21) + "…" : (node.label || "Waste")}
        </text>

        {node.sublabel && (
          <text
            x={node.x + WASTE_WIDTH / 2}
            y={node.y + 54}
            textAnchor="middle"
            fontSize="8.5"
            fill="#94a3b8"
            style={{ pointerEvents: "none" }}
          >
            {node.sublabel.length > 24 ? node.sublabel.slice(0, 23) + "…" : node.sublabel}
          </text>
        )}
      </g>
    );
  };

  const renderVoidNode = (node: any): React.ReactElement => {
    const isSelected = selectedElement?.id === node.id && selectedType === "node";
    const isHovered = hoveredElement === node.id;
    const capabilityProfile = getLinkedCapabilityProfile(node);
    const capabilityKind = node.capabilitySpec?.kind || capabilityProfile?.kind || "automation";
    const capabilityLabel = `${(CAPABILITY_KIND_LABELS[capabilityKind] || "Capability").toUpperCase()} CAPABILITY`;
    const maturityColor = AGENT_MATURITY_COLORS[node.capabilitySpec?.maturity || capabilityProfile?.maturity || "conceptual"] || "#cbd5e1";

    return (
      <g
        key={node.id}
        onClick={() => handleNodeClick(node)}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        onMouseEnter={() => setHoveredElement(node.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: draggedNode?.id === node.id ? "grabbing" : "grab" }}
      >
        <rect
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="8"
          fill={AGENTIC_TINT}
          stroke={isSelected ? "#3b82f6" : isHovered ? AGENTIC_ACCENT : AGENTIC_BORDER}
          strokeWidth={isSelected || isHovered ? 2.2 : 1.6}
        />

        <rect
          x={node.x + 6}
          y={node.y + 6}
          width={NODE_WIDTH - 12}
          height={16}
          rx="8"
          fill={AGENTIC_BAND}
          stroke="#d6dde7"
          strokeWidth="1"
        />

        <circle
          cx={node.x + 14}
          cy={node.y + 16}
          r={4.5}
          fill={maturityColor}
          stroke="#ffffff"
          strokeWidth="1.25"
        />

        <text
          x={node.x + 24}
          y={node.y + 18}
          fontSize="8.5"
          fontWeight="700"
          fill={AGENTIC_TEXT}
          opacity="0.95"
        >
          {capabilityLabel.length > 28 ? capabilityLabel.slice(0, 25) + "..." : capabilityLabel}
        </text>

        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 40}
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="600"
          fill="#0f172a"
          style={{ pointerEvents: "none" }}
        >
          {(capabilityProfile?.name || node.label || "Capability").length > 24
            ? (capabilityProfile?.name || node.label || "Capability").slice(0, 23) + "…"
            : (capabilityProfile?.name || node.label || "Capability")}
        </text>

        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 55}
          textAnchor="middle"
          fontSize="8.5"
          fill={AGENTIC_TEXT}
          style={{ pointerEvents: "none" }}
        >
          {(node.sublabel || capabilityProfile?.description || "Missing capability").length > 28
            ? (node.sublabel || capabilityProfile?.description || "Missing capability").slice(0, 27) + "…"
            : (node.sublabel || capabilityProfile?.description || "Missing capability")}
        </text>
      </g>
    );
  };

  const getFlowGeometry = (flow: any) => {
    const fromNode = nodeMap[flow.from];
    const toNode = nodeMap[flow.to];

    if (!fromNode || !toNode) return null;

    const fromCenter = getNodeCenter(fromNode);
    const toCenter = getNodeCenter(toNode);

    // For cross-row flows (vertical), force top/bottom edge connection so arrows
    // arrive at 90° perpendicular to the node face, not at the corner.
    let fromPt: { x: number; y: number };
    let toPt: { x: number; y: number };
    const reverseFlow = vfdData.flows?.find(
      (candidate: any) => candidate.from === flow.to && candidate.to === flow.from
    );
    const reverseOffset =
      reverseFlow && reverseFlow.id !== flow.id
        ? flow.id.localeCompare(reverseFlow.id) < 0
          ? -12
          : 12
        : 0;

    if (Math.abs(toCenter.y - fromCenter.y) > 60) {
      const fH = fromNode.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
      const tH = toNode.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
      if (fromCenter.y < toCenter.y) {
        fromPt = { x: fromCenter.x + reverseOffset, y: fromNode.y + fH };
        toPt   = { x: toCenter.x + reverseOffset,   y: toNode.y };
      } else {
        fromPt = { x: fromCenter.x + reverseOffset, y: fromNode.y };
        toPt   = { x: toCenter.x + reverseOffset,   y: toNode.y + tH };
      }
    } else {
      fromPt = getFlowEdgePoint(fromNode, toCenter);
      toPt   = getFlowEdgePoint(toNode, fromCenter);

      if (reverseOffset !== 0) {
        fromPt = { x: fromPt.x, y: fromPt.y + reverseOffset * 0.35 };
        toPt = { x: toPt.x, y: toPt.y + reverseOffset * 0.35 };
      }
    }

    return { fromPt, toPt };
  };

  const renderFlow = (flow: any): React.ReactElement => {
    const geometry = getFlowGeometry(flow);
    if (!geometry) return <g key={flow.id} />;

    const { fromPt, toPt } = geometry;

    const color = QUALITY_COLORS[flow.quality] || "#22c55e";
    const dashPattern = getFlowDashPattern(flow.medium);
    const strokeWidth = getFlowStrokeWidth(flow.quality);

    const isHovered = hoveredElement === flow.id;

    return (
      <g
        key={flow.id}
        onClick={() => handleFlowClick(flow)}
        onMouseEnter={() => setHoveredElement(flow.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: "pointer", opacity: isHovered ? 1 : 0.8 }}
      >
        {/* Main path */}
        <path
          d={getBezierPath(fromPt.x, fromPt.y, toPt.x, toPt.y)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dashPattern}
        />

        {/* Label — only on hover to avoid clutter */}
        {flow.label && isHovered && (
          <text
            x={(fromPt.x + toPt.x) / 2}
            y={(fromPt.y + toPt.y) / 2 - 6}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#475569"
            style={{ pointerEvents: "none" }}
          >
            {flow.label.length > 20 ? flow.label.slice(0, 17) + "..." : flow.label}
          </text>
        )}
      </g>
    );
  };

  const renderFlowArrowhead = (flow: any): React.ReactElement | null => {
    const geometry = getFlowGeometry(flow);
    if (!geometry) return null;

    const { fromPt, toPt } = geometry;
    const color = QUALITY_COLORS[flow.quality] || "#22c55e";
    const strokeWidth = getFlowStrokeWidth(flow.quality);
    const angle = (getAngleBetweenPoints(fromPt, toPt) * Math.PI) / 180;
    const arrowLength = 8 + strokeWidth * 1.5;
    const arrowHalfWidth = 4 + strokeWidth;

    const leftX =
      toPt.x - Math.cos(angle) * arrowLength + Math.sin(angle) * arrowHalfWidth;
    const leftY =
      toPt.y - Math.sin(angle) * arrowLength - Math.cos(angle) * arrowHalfWidth;
    const rightX =
      toPt.x - Math.cos(angle) * arrowLength - Math.sin(angle) * arrowHalfWidth;
    const rightY =
      toPt.y - Math.sin(angle) * arrowLength + Math.cos(angle) * arrowHalfWidth;

    return (
      <polygon
        key={`${flow.id}-arrow`}
        points={`${toPt.x},${toPt.y} ${leftX},${leftY} ${rightX},${rightY}`}
        fill={color}
        opacity={hoveredElement === flow.id ? 1 : 0.9}
        style={{ pointerEvents: "none" }}
      />
    );
  };

  const renderFrictionBadge = (friction: any): React.ReactElement | null => {
    const primaryNode = nodeMap[friction.primaryNode];
    if (!primaryNode || !isNodeVisible(primaryNode)) return null;

    const nodeCenter = getNodeCenter(primaryNode);
    const offsetX = NODE_WIDTH / 2 + 16;
    const offsetY = NODE_HEIGHT / 2 - 12;

    return (
      <g
        key={friction.id}
        onClick={() => handleFrictionClick(friction)}
        onMouseEnter={() => setHoveredElement(friction.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: "pointer" }}
      >
        <circle
          cx={nodeCenter.x + offsetX}
          cy={nodeCenter.y - offsetY}
          r={FRICTION_BADGE_RADIUS}
          fill={FRICTION_SEVERITY_COLORS[friction.severity] || "#6b7280"}
          opacity="0.9"
        />
        <text
          x={nodeCenter.x + offsetX}
          y={nodeCenter.y - offsetY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="700"
          fill="white"
          style={{ pointerEvents: "none" }}
        >
          {friction.severity.charAt(0).toUpperCase()}
        </text>
      </g>
    );
  };

  const renderFeedbackLoop = (loop: any): React.ReactElement | null => {
    const fromNode = nodeMap[loop.fromNode];
    const toNode = nodeMap[loop.toNode];

    if (!fromNode || !toNode || !isNodeVisible(fromNode) || !isNodeVisible(toNode)) {
      return null;
    }

    const fromCenter = getNodeCenter(fromNode);
    const toCenter = getNodeCenter(toNode);

    const loopColor = loop.color || "#8b5cf6";
    const isReinforcing = loop.polarity === "reinforcing";

    // Create a curved path that goes around the nodes
    const midX = (fromCenter.x + toCenter.x) / 2;
    const midY = Math.min(fromCenter.y, toCenter.y) - 60;

    return (
      <g
        key={loop.id}
        onClick={() => handleLoopClick(loop)}
        onMouseEnter={() => setHoveredElement(loop.id)}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ cursor: "pointer" }}
      >
        {/* Curved path */}
        <path
          d={`M ${fromCenter.x} ${fromCenter.y} Q ${midX} ${midY} ${toCenter.x} ${toCenter.y}`}
          stroke={loopColor}
          strokeWidth="2"
          fill="none"
          strokeDasharray={isReinforcing ? "none" : "4,4"}
          markerEnd={`url(#loop-arrow-${loop.polarity})`}
          opacity="0.7"
        />

        {/* Polarity label — placed at actual quadratic bezier midpoint (t=0.5), not the control point */}
        {(() => {
          const labelX = midX; // x simplifies to midX for symmetric control point
          const labelY = 0.25 * fromCenter.y + 0.5 * midY + 0.25 * toCenter.y;
          return (
            <>
              <circle cx={labelX} cy={labelY} r="12" fill={loopColor} opacity="0.8" />
              <text
                x={labelX}
                y={labelY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="700"
                fill="white"
              >
                {isReinforcing ? "R" : "B"}
              </text>
            </>
          );
        })()}
      </g>
    );
  };

  const renderNodeAnnotation = useCallback(
    (annotation: AnalystAnnotation, nodeId: string, index: number): React.ReactElement | null => {
      const node = nodeMap[nodeId];
      if (!node || !isNodeVisible(node)) return null;

      const visual = getAnnotationVisual(annotation.style);
      const width = node.category === "waste" ? WASTE_WIDTH : NODE_WIDTH;
      const height = node.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
      const pad = node.category === "waste" ? 7 : 8;

      return (
        <g key={`annotation-node-${nodeId}-${index}`} style={{ pointerEvents: "none" }}>
          <rect
            x={node.x - pad}
            y={node.y - pad}
            width={width + pad * 2}
            height={height + pad * 2}
            rx={12}
            fill={visual.fill}
            stroke={visual.glow}
            strokeWidth="10"
            opacity="0.65"
          />
          <rect
            x={node.x - pad}
            y={node.y - pad}
            width={width + pad * 2}
            height={height + pad * 2}
            rx={12}
            fill="none"
            stroke={visual.stroke}
            strokeWidth="3"
            strokeDasharray={annotation.style === "change-impact" ? "8 5" : undefined}
          />
          {annotation.label
            ? renderAnnotationLabel(
                node.x + width / 2,
                node.y - pad - 24 - getAnnotationStackOffset(index),
                annotation.label,
                annotation.style,
                `annotation-node-label-${nodeId}-${index}`
              )
            : null}
        </g>
      );
    },
    [getAnnotationStackOffset, getAnnotationVisual, isNodeVisible, nodeMap, renderAnnotationLabel]
  );

  const renderFlowAnnotation = useCallback(
    (annotation: AnalystAnnotation, flowId: string, index: number): React.ReactElement | null => {
      const flow = vfdData.flows?.find((entry: any) => entry.id === flowId);
      if (!flow || !isFlowVisible(flow)) return null;

      const geometry = getFlowGeometry(flow);
      if (!geometry) return null;

      const visual = getAnnotationVisual(annotation.style);
      const { fromPt, toPt } = geometry;
      const path = getBezierPath(fromPt.x, fromPt.y, toPt.x, toPt.y);

      return (
        <g key={`annotation-flow-${flowId}-${index}`} style={{ pointerEvents: "none" }}>
          <path d={path} stroke={visual.glow} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5" />
          <path
            d={path}
            stroke={visual.stroke}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={annotation.style === "change-impact" ? "8 5" : undefined}
            opacity="0.95"
          />
          {annotation.label
            ? renderAnnotationLabel(
                (fromPt.x + toPt.x) / 2,
                (fromPt.y + toPt.y) / 2 - 24 - getAnnotationStackOffset(index),
                annotation.label,
                annotation.style,
                `annotation-flow-label-${flowId}-${index}`
              )
            : null}
        </g>
      );
    },
    [getAnnotationStackOffset, getAnnotationVisual, isFlowVisible, renderAnnotationLabel, vfdData.flows]
  );

  const renderFrictionAnnotation = useCallback(
    (annotation: AnalystAnnotation, frictionId: string, index: number): React.ReactElement | null => {
      const friction = vfdData.frictionPoints?.find((entry: any) => entry.id === frictionId);
      const primaryNode = friction ? nodeMap[friction.primaryNode] : null;
      if (!friction || !primaryNode || !isNodeVisible(primaryNode)) return null;

      const visual = getAnnotationVisual(annotation.style);
      const nodeCenter = getNodeCenter(primaryNode);
      const cx = nodeCenter.x + NODE_WIDTH / 2 + 16;
      const cy = nodeCenter.y - (NODE_HEIGHT / 2 - 12);
      const label = annotation.label || friction.title || "Friction hotspot";
      const labelY = cy - FRICTION_BADGE_RADIUS - 36 - getAnnotationStackOffset(index);

      return (
        <g key={`annotation-friction-${frictionId}-${index}`} style={{ pointerEvents: "none" }}>
          <path
            d={`M ${cx} ${cy - FRICTION_BADGE_RADIUS - 8} L ${cx} ${labelY + 24}`}
            stroke={visual.stroke}
            strokeWidth="2"
            strokeDasharray={annotation.style === "change-impact" ? "6 4" : undefined}
            opacity="0.85"
          />
          <circle
            cx={cx}
            cy={cy}
            r={FRICTION_BADGE_RADIUS + 7}
            fill={visual.fill}
            stroke={visual.glow}
            strokeWidth="7"
            opacity="0.7"
          />
          <circle
            cx={cx}
            cy={cy}
            r={FRICTION_BADGE_RADIUS + 7}
            fill="#ffffff"
            stroke={visual.stroke}
            strokeWidth="3"
            strokeDasharray={annotation.style === "change-impact" ? "6 4" : undefined}
          />
          {renderAnnotationLabel(cx, labelY, label, annotation.style, `annotation-friction-label-${frictionId}-${index}`)}
        </g>
      );
    },
    [getAnnotationStackOffset, getAnnotationVisual, isNodeVisible, nodeMap, renderAnnotationLabel, vfdData.frictionPoints]
  );

  const renderLoopAnnotation = useCallback(
    (annotation: AnalystAnnotation, loopId: string, index: number): React.ReactElement | null => {
      const loop = vfdData.feedbackLoops?.find((entry: any) => entry.id === loopId);
      const fromNode = loop ? nodeMap[loop.fromNode] : null;
      const toNode = loop ? nodeMap[loop.toNode] : null;
      if (!loop || !fromNode || !toNode || !isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

      const visual = getAnnotationVisual(annotation.style);
      const fromCenter = getNodeCenter(fromNode);
      const toCenter = getNodeCenter(toNode);
      const midX = (fromCenter.x + toCenter.x) / 2;
      const midY = Math.min(fromCenter.y, toCenter.y) - 60;
      const labelY = 0.25 * fromCenter.y + 0.5 * midY + 0.25 * toCenter.y;

      return (
        <g key={`annotation-loop-${loopId}-${index}`} style={{ pointerEvents: "none" }}>
          <path d={`M ${fromCenter.x} ${fromCenter.y} Q ${midX} ${midY} ${toCenter.x} ${toCenter.y}`} stroke={visual.glow} strokeWidth="10" fill="none" opacity="0.5" />
          <path
            d={`M ${fromCenter.x} ${fromCenter.y} Q ${midX} ${midY} ${toCenter.x} ${toCenter.y}`}
            stroke={visual.stroke}
            strokeWidth="4"
            fill="none"
            strokeDasharray={annotation.style === "change-impact" ? "8 5" : undefined}
            opacity="0.95"
          />
          {annotation.label
            ? renderAnnotationLabel(
                midX,
                labelY - 30 - getAnnotationStackOffset(index),
                annotation.label,
                annotation.style,
                `annotation-loop-label-${loopId}-${index}`
              )
            : null}
        </g>
      );
    },
    [getAnnotationStackOffset, getAnnotationVisual, isNodeVisible, nodeMap, renderAnnotationLabel, vfdData.feedbackLoops]
  );

  const renderAnalystAnnotations = useCallback(() => {
    if (analystAnnotations.length === 0) return null;

    return analystAnnotations.flatMap((annotation, annotationIndex) =>
      annotation.ids.map((id, idIndex) => {
        if (annotation.targetType === "node") {
          return renderNodeAnnotation(annotation, id, annotationIndex * 10 + idIndex);
        }
        if (annotation.targetType === "flow") {
          return renderFlowAnnotation(annotation, id, annotationIndex * 10 + idIndex);
        }
        if (annotation.targetType === "friction") {
          return renderFrictionAnnotation(annotation, id, annotationIndex * 10 + idIndex);
        }
        return renderLoopAnnotation(annotation, id, annotationIndex * 10 + idIndex);
      })
    );
  }, [analystAnnotations, renderFlowAnnotation, renderFrictionAnnotation, renderLoopAnnotation, renderNodeAnnotation]);

  // ── Main render ────────────────────────────────────────────────────────
  const visibleNodes = vfdData.nodes?.filter(isNodeVisible) || [];
  const visibleFlows = vfdData.flows?.filter(isFlowVisible) || [];
  const visibleFrictions = layers.has("friction")
    ? vfdData.frictionPoints?.filter((fp: any) => nodeMap[fp.primaryNode] && isNodeVisible(nodeMap[fp.primaryNode])) || []
    : [];
  const visibleLoops = layers.has("loops")
    ? vfdData.feedbackLoops?.filter(
        (loop: any) =>
          nodeMap[loop.fromNode] &&
          nodeMap[loop.toNode] &&
          isNodeVisible(nodeMap[loop.fromNode]) &&
          isNodeVisible(nodeMap[loop.toNode])
      ) || []
    : [];

  const warningCount = validation?.issues?.filter((i: any) => i.severity === "warning").length || 0;
  const definition = vfdData.definition || {};
  const formatMetricValue = (metric: any) => {
    if (metric === undefined || metric === null) return null;
    if (typeof metric === "number") return metric;
    if (typeof metric === "object" && metric.value !== undefined && metric.value !== null) {
      return `${metric.value}${metric.unit ? metric.unit : ""}`;
    }
    return null;
  };
  const processName = definition.processName || "VFD Diagram";
  const processVersion = definition.version ? `v${definition.version}` : null;
  const processDescription =
    definition.description ||
    "Where is value being destroyed — and why?";
  return (
    <div style={{ height: "100vh", display: "flex", background: "#f8fafc", width: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Model header */}
        <div
          style={{
            padding: "14px 16px 8px 16px",
            background: "#f8fafc",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.15 }}>
                {processName}
              </div>
              {processVersion && (
                <div style={{ fontSize: 12, color: "#64748b" }}>{processVersion}</div>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{fileName}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              {processDescription}
            </div>
            {definition.configurationNotes && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.5, maxWidth: 980 }}>
                {definition.configurationNotes}
              </div>
            )}
          </div>
        </div>

        {/* Layer bar */}
        <div
          style={{
            padding: "4px 16px 10px 16px",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid #dbe3ef",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
            {LAYERS.map((layer, index) => (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.key)}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  background: layers.has(layer.key) ? "#0f172a" : "#e2e8f0",
                  color: layers.has(layer.key) ? "#ffffff" : "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "all .15s",
                  whiteSpace: "nowrap",
                }}
                title={layer.question}
              >
                {`L${index + 1} ${layer.label}`}
              </button>
            ))}
          </div>
          <button
            onClick={handleCenterView}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Center View
          </button>
        </div>

        {/* SVG Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
            cursor: draggedNode ? "grabbing" : isPanning ? "grabbing" : "grab",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          onWheel={handleSvgWheel}
        >
          <svg
            ref={svgRef}
            width={svgDimensions.width}
            height={svgDimensions.height}
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            style={{
              background: "#ffffff",
              transform: `translate(${pan.x + svgDimensions.offsetX}px, ${pan.y + svgDimensions.offsetY}px) scale(${zoom})`,
              transformOrigin: "0 0",
              transition: isPanning || draggedNode ? "none" : "transform .15s",
              pointerEvents: "auto",
              display: "block",
            }}
          >
            {/* Marker definitions */}
            <defs>
              {["reinforcing", "balancing"].map((polarity) => (
                <marker
                  key={`loop-arrow-${polarity}`}
                  id={`loop-arrow-${polarity}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
                </marker>
              ))}
            </defs>

            {/* Flows (lowest layer) */}
            {visibleFlows.map(renderFlow)}

            {/* Feedback loops */}
            {visibleLoops.map(renderFeedbackLoop)}

            {/* Nodes */}
            {visibleNodes.map((node) => {
              if (node.category === "capability" || node.state === "void") return renderVoidNode(node);
              if (node.category === "waste") return renderWasteNode(node);
              if (node.category === "enabling") return renderEnablingNode(node);
              return renderValueNode(node);
            })}

            {/* Flow arrowheads on top so tips don't disappear under nodes */}
            {visibleFlows.map(renderFlowArrowhead)}

            {/* Friction badges (on top) */}
            {visibleFrictions && visibleFrictions.map(renderFrictionBadge).filter(Boolean)}

            {/* Analyst walkthrough overlay */}
            {renderAnalystAnnotations()}
          </svg>
        </div>
      </div>

      {/* Side Panel */}
      <div
        style={{
          width: 620,
          background: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
          {/* Panel header */}
          <div
            style={{
              height: 40,
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              fontSize: 11,
              fontWeight: 700,
              color: "#475569",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "guide", label: "Guide" },
                { id: "analyst", label: "Analyst AI" },
                { id: "inspect", label: "Inspect" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPanelTab(tab.id as "overview" | "guide" | "inspect" | "analyst")}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: panelTab === tab.id ? "#0f172a" : "#ffffff",
                    color: panelTab === tab.id ? "#ffffff" : "#475569",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "12px 16px",
              wordWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "normal",
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: panelTab === "guide" ? "block" : "none", height: "100%" }}>
              <GuidePanel />
            </div>
            <div style={{ display: panelTab === "analyst" ? "block" : "none", height: "100%" }}>
              <AnalystAIPanel
                vfdData={vfdData}
                fileName={fileName}
                selectedElement={currentSelectedElement}
                selectedType={selectedType}
                onAnnotationsChange={setAnalystAnnotations}
              />
            </div>
            <div style={{ display: panelTab === "inspect" ? "block" : "none", height: "100%" }}>
              <InspectPanel
                element={currentSelectedElement}
                elementType={selectedType}
                vfdData={vfdData}
                onElementChange={onElementChange}
              />
            </div>
            <div style={{ display: panelTab === "overview" ? "block" : "none", height: "100%" }}>
              <OverviewPanel vfdData={vfdData} />
            </div>
          </div>
      </div>
    </div>
  );
}
