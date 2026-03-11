import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const NODE_WIDTH = 140;
const NODE_HEIGHT = 54;
const WASTE_WIDTH = 70;
const WASTE_HEIGHT = 50;
const START_X = 60;
const COL_SPACING = 195;
const VALUE_Y = 320;
const ENABLING_Y = 140;
const WASTE_ABOVE_Y = 30;
const WASTE_BELOW_Y = 430;
const ROW_GAP = 22;
const LANE_GAP = 22;

function getNodeSize(node: any): { width: number; height: number } {
  return node.category === "waste"
    ? { width: WASTE_WIDTH, height: WASTE_HEIGHT }
    : { width: NODE_WIDTH, height: NODE_HEIGHT };
}

function getCenterX(node: any): number {
  return node.x + getNodeSize(node).width / 2;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getConnectedNodeIds(nodeId: string, flows: any[]): string[] {
  const connected = new Set<string>();
  flows.forEach((flow) => {
    if (flow.from === nodeId) connected.add(flow.to);
    if (flow.to === nodeId) connected.add(flow.from);
  });
  return Array.from(connected);
}

function compactOrderedNodes(nodes: any[], desiredCenterX: Map<string, number>): void {
  if (!nodes.length) return;

  let cursor = START_X;
  for (const node of nodes) {
    const { width } = getNodeSize(node);
    const desiredLeft = (desiredCenterX.get(node.id) ?? START_X + width / 2) - width / 2;
    node.x = Math.round(Math.max(cursor, desiredLeft));
    cursor = node.x + width + ROW_GAP;
  }

  for (let i = nodes.length - 2; i >= 0; i--) {
    const current = nodes[i];
    const next = nodes[i + 1];
    const { width } = getNodeSize(current);
    current.x = Math.min(current.x, next.x - width - ROW_GAP);
  }
}

function placeBandNodes(
  nodes: any[],
  desiredCenterX: Map<string, number>,
  baseY: number,
  direction: "up" | "down"
): void {
  if (!nodes.length) return;

  const ordered = [...nodes].sort((a, b) => {
    const ax = desiredCenterX.get(a.id) ?? 0;
    const bx = desiredCenterX.get(b.id) ?? 0;
    if (ax !== bx) return ax - bx;
    return a.id.localeCompare(b.id);
  });

  const lanes: any[][] = [];

  for (const node of ordered) {
    const { width } = getNodeSize(node);
    const desiredLeft = (desiredCenterX.get(node.id) ?? START_X + width / 2) - width / 2;

    let laneIndex = 0;
    while (laneIndex < lanes.length) {
      const lane = lanes[laneIndex];
      const last = lane[lane.length - 1];
      const lastWidth = getNodeSize(last).width;
      if (last.x + lastWidth + ROW_GAP <= desiredLeft) break;
      laneIndex++;
    }

    if (!lanes[laneIndex]) lanes[laneIndex] = [];
    lanes[laneIndex].push(node);
  }

  lanes.forEach((lane, laneIndex) => {
    compactOrderedNodes(lane, desiredCenterX);
    lane.forEach((node) => {
      const { height } = getNodeSize(node);
      node.y =
        direction === "up"
          ? baseY - laneIndex * (height + LANE_GAP)
          : baseY + laneIndex * (height + LANE_GAP);
    });
  });
}

function getWasteReference(node: any, nodeById: Record<string, any>, flows: any[]) {
  const parasitises = node.wasteSpec?.parasitises;
  if (parasitises && nodeById[parasitises]) {
    return nodeById[parasitises];
  }

  for (const flow of flows) {
    const other = flow.from === node.id ? flow.to : flow.to === node.id ? flow.from : null;
    if (other && nodeById[other]) return nodeById[other];
  }

  return null;
}

function buildBackboneEdges(nodes: any[], flows: any[]) {
  const nodeById: Record<string, any> = {};
  nodes.forEach((node) => {
    nodeById[node.id] = node;
  });

  const valueLikeNodes = nodes.filter(
    (node) => node.category === "value" || node.category === "capability" || node.state === "void"
  );
  const valueLikeIds = new Set(valueLikeNodes.map((node) => node.id));

  const spineFlows = flows.filter((flow) => {
    const from = nodeById[flow.from];
    const to = nodeById[flow.to];
    if (!from || !to) return false;
    if (from.category === "waste" || to.category === "waste") return false;
    return flow.layer === "spine";
  });

  const outgoing = new Map<string, string[]>();
  spineFlows.forEach((flow) => {
    if (!outgoing.has(flow.from)) outgoing.set(flow.from, []);
    outgoing.get(flow.from)!.push(flow.to);
  });

  const edgeWeights = new Map<string, number>();

  valueLikeNodes.forEach((startNode) => {
    const queue: Array<{ id: string; depth: number }> = [{ id: startNode.id, depth: 0 }];
    const visited = new Set<string>([startNode.id]);

    while (queue.length) {
      const current = queue.shift()!;
      const nextNodes = outgoing.get(current.id) || [];

      nextNodes.forEach((nextId) => {
        if (visited.has(nextId)) return;
        visited.add(nextId);

        if (valueLikeIds.has(nextId) && nextId !== startNode.id) {
          const key = `${startNode.id}->${nextId}`;
          edgeWeights.set(key, (edgeWeights.get(key) || 0) + 1 / Math.max(1, current.depth + 1));
          return;
        }

        queue.push({ id: nextId, depth: current.depth + 1 });
      });
    }
  });

  return {
    valueLikeNodes,
    weightedEdges: Array.from(edgeWeights.entries()).map(([key, weight]) => {
      const [from, to] = key.split("->");
      return { from, to, weight };
    }),
    spineFlows,
  };
}

async function getBackboneOrder(nodes: any[], flows: any[]): Promise<any[]> {
  const { valueLikeNodes, weightedEdges } = buildBackboneEdges(nodes, flows);

  if (valueLikeNodes.length <= 1) return valueLikeNodes;

  const graph = {
    id: "backbone",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.cycleBreaking.strategy": "GREEDY_MODEL_ORDER",
      "elk.layered.thoroughness": "60",
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
    },
    children: valueLikeNodes.map((node, index) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      layoutOptions: {
        "org.eclipse.elk.priority": node.category === "capability" || node.state === "void" ? "60" : "120",
        "org.eclipse.elk.layered.crossingMinimization.positionId": String(index),
      },
    })),
    edges: weightedEdges.map((edge, index) => ({
      id: `backbone-${index}`,
      sources: [edge.from],
      targets: [edge.to],
      layoutOptions: {
        "org.eclipse.elk.priority": String(Math.max(10, Math.round(edge.weight * 100))),
      },
    })),
  };

  const laidOut = await elk.layout(graph);
  const xById = new Map(
    (laidOut.children || []).map((child) => [child.id, child.x ?? 0])
  );

  return [...valueLikeNodes].sort((a, b) => {
    const ax = xById.get(a.id) ?? 0;
    const bx = xById.get(b.id) ?? 0;
    if (ax !== bx) return ax - bx;
    return a.id.localeCompare(b.id);
  });
}

function getBandAnchorX(
  node: any,
  nodeById: Record<string, any>,
  flows: any[],
  centerXById: Map<string, number>,
  fallbackX: number
): number {
  if (node.category === "waste") {
    const ref = getWasteReference(node, nodeById, flows);
    return ref ? centerXById.get(ref.id) ?? fallbackX : fallbackX;
  }

  const neighbors = getConnectedNodeIds(node.id, flows)
    .map((id) => nodeById[id])
    .filter(Boolean)
    .filter((neighbor) => neighbor.category === "value" || neighbor.category === "capability" || neighbor.state === "void")
    .map((neighbor) => centerXById.get(neighbor.id))
    .filter((value): value is number => value !== undefined);

  return average(neighbors) ?? fallbackX;
}

export function needsLayout(nodes: any[]): boolean {
  if (!nodes.length) return false;

  const zeros = nodes.filter((node) => !node.x && !node.y).length;
  if (zeros > nodes.length * 0.3) return true;

  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const aw = a.category === "waste" ? WASTE_WIDTH : NODE_WIDTH;
      const ah = a.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
      const bw = b.category === "waste" ? WASTE_WIDTH : NODE_WIDTH;
      const bh = b.category === "waste" ? WASTE_HEIGHT : NODE_HEIGHT;
      if (
        Math.abs((a.x || 0) - (b.x || 0)) < (aw + bw) / 2 + 12 &&
        Math.abs((a.y || 0) - (b.y || 0)) < (ah + bh) / 2 + 12
      ) {
        overlaps++;
      }
    }
  }

  return overlaps > nodes.length * 0.15;
}

export async function autoLayout(data: any): Promise<any> {
  const result = JSON.parse(JSON.stringify(data));
  const nodes: any[] = result.nodes || [];
  const flows: any[] = result.flows || [];
  if (!nodes.length) return result;

  const nodeById: Record<string, any> = {};
  nodes.forEach((node) => {
    nodeById[node.id] = node;
  });

  const orderedBackbone = await getBackboneOrder(nodes, flows);
  orderedBackbone.forEach((node, index) => {
    node.x = START_X + index * COL_SPACING;
    node.y = VALUE_Y;
  });

  const centerXById = new Map(
    orderedBackbone.map((node) => [node.id, getCenterX(node)])
  );
  const fallbackX = average(Array.from(centerXById.values())) ?? START_X + NODE_WIDTH / 2;

  const enablingNodes = nodes.filter((node) => node.category === "enabling");
  const wasteAboveNodes = nodes.filter((node) => {
    if (node.category !== "waste") return false;
    return getWasteReference(node, nodeById, flows)?.category === "enabling";
  });
  const wasteBelowNodes = nodes.filter((node) => {
    if (node.category !== "waste") return false;
    return getWasteReference(node, nodeById, flows)?.category !== "enabling";
  });

  const enablingAnchors = new Map(
    enablingNodes.map((node) => [
      node.id,
      getBandAnchorX(node, nodeById, flows, centerXById, fallbackX),
    ])
  );
  const wasteAboveAnchors = new Map(
    wasteAboveNodes.map((node) => [
      node.id,
      getBandAnchorX(node, nodeById, flows, centerXById, fallbackX),
    ])
  );
  const wasteBelowAnchors = new Map(
    wasteBelowNodes.map((node) => [
      node.id,
      getBandAnchorX(node, nodeById, flows, centerXById, fallbackX),
    ])
  );

  placeBandNodes(enablingNodes, enablingAnchors, ENABLING_Y, "down");
  placeBandNodes(wasteAboveNodes, wasteAboveAnchors, WASTE_ABOVE_Y, "up");
  placeBandNodes(wasteBelowNodes, wasteBelowAnchors, WASTE_BELOW_Y, "down");

  return result;
}

export function boundingBox(nodes: any[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (!nodes.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const { width, height } = getNodeSize(node);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + width);
    maxY = Math.max(maxY, node.y + height);
  });

  return { minX, minY, maxX, maxY };
}
