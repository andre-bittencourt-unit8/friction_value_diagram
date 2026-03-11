// SVG rendering helpers for VFD visualization
// Node centers, edge points, bezier curves, flow patterns

import { NODE_WIDTH, NODE_HEIGHT, WASTE_WIDTH, WASTE_HEIGHT } from "./vfd.constants";

/**
 * Get the center point of a node based on its category and position
 */
export function getNodeCenter(node: any): { x: number; y: number } {
  const w = node.category === "waste" ? WASTE_WIDTH : NODE_WIDTH;
  const h = node.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
  return {
    x: (node.x || 0) + w / 2,
    y: (node.y || 0) + h / 2,
  };
}

/**
 * Get the point on a node's edge where a flow should terminate
 * Calculates intersection of line from `from` to node center with node boundary
 */
export function getFlowEdgePoint(
  node: any,
  fromPoint: { x: number; y: number }
): { x: number; y: number } {
  const center = getNodeCenter(node);
  const w = node.category === "waste" ? WASTE_WIDTH / 2 + 2 : NODE_WIDTH / 2 + 2;
  const h = node.category === "waste" ? WASTE_HEIGHT / 2 + 2 : NODE_HEIGHT / 2 + 2;

  const dx = fromPoint.x - center.x || 0.001;
  const dy = fromPoint.y - center.y || 0.001;
  const scale = Math.min(w / Math.abs(dx), h / Math.abs(dy));

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

/**
 * Generate a smooth bezier curve path from point A to point B
 * Used for flows and feedback loops
 */
export function getBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  controlPointBias: number = 0.4
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return `M${x1},${y1} C${x1 + dx * controlPointBias},${y1 + dy * 0.08} ${x2 - dx * controlPointBias},${y2 - dy * 0.08} ${x2},${y2}`;
}

/**
 * Get stroke-dasharray pattern for flow based on medium type
 */
export function getFlowDashPattern(medium: string): string {
  switch (medium) {
    case "document":
      return "10,6";          // Long dashes
    case "decision":
      return "2,5,8,5";       // Dot-dash
    case "signal":
      return "1,4";           // Fine dots
    case "data":
    default:
      return "none";          // Solid line
  }
}

/**
 * Get stroke width for flow based on quality
 */
export function getFlowStrokeWidth(quality: string): number {
  switch (quality) {
    case "broken":
      return 3;
    case "degraded":
      return 2;
    case "good":
    default:
      return 1.5;
  }
}

/**
 * Calculate distance between two points
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two rectangles overlap
 */
export function doRectsOverlap(
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
  minGap: number = 0
): boolean {
  return (
    Math.abs(rect1.x - rect2.x) < (rect1.w + rect2.w) / 2 + minGap &&
    Math.abs(rect1.y - rect2.y) < (rect1.h + rect2.h) / 2 + minGap
  );
}

/**
 * Get the bounding box of all nodes
 */
export function getNodesBoundingBox(
  nodes: any[]
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (!nodes.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  nodes.forEach((n) => {
    const w = n.category === "waste" ? WASTE_WIDTH : NODE_WIDTH;
    const h = n.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
    minX = Math.min(minX, n.x || 0);
    minY = Math.min(minY, n.y || 0);
    maxX = Math.max(maxX, (n.x || 0) + w);
    maxY = Math.max(maxY, (n.y || 0) + h);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate center of mass for a set of nodes
 */
export function getNodesCenterOfMass(nodes: any[]): { x: number; y: number } | null {
  if (!nodes.length) return null;

  let totalX = 0,
    totalY = 0;
  nodes.forEach((n) => {
    const center = getNodeCenter(n);
    totalX += center.x;
    totalY += center.y;
  });

  return {
    x: totalX / nodes.length,
    y: totalY / nodes.length,
  };
}

/**
 * Get node dimensions based on category
 */
export function getNodeDimensions(node: any): { width: number; height: number } {
  if (node.category === "waste") {
    return { width: WASTE_WIDTH, height: WASTE_HEIGHT };
  }
  return { width: NODE_WIDTH, height: NODE_HEIGHT };
}

/**
 * Calculate the angle between two points (in degrees)
 */
export function getAngleBetweenPoints(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
