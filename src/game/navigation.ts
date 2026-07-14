import { distanceXZ } from "./math";
import type {
  EntitySnapshot,
  NavigationFollowResult,
  NavigationPath,
  NavigationPlanResult,
  Vec3,
} from "./types";
import type { GameWorld } from "./world";

const CELL_SIZE = 0.4;
const WORLD_MARGIN = 2.4;
const MAX_VISITED_CELLS = 10_000;
const CONTACT_MARGIN = 0.02;

interface GridCell {
  x: number;
  z: number;
}

interface GridBounds {
  minX: number;
  minZ: number;
  columns: number;
  rows: number;
}

const keyOf = ({ x, z }: GridCell): string => `${x}:${z}`;

const positionOf = (cell: GridCell, bounds: GridBounds, y: number): Vec3 => ({
  x: bounds.minX + cell.x * CELL_SIZE,
  y,
  z: bounds.minZ + cell.z * CELL_SIZE,
});

const cellOf = (position: Vec3, bounds: GridBounds): GridCell => ({
  x: Math.round((position.x - bounds.minX) / CELL_SIZE),
  z: Math.round((position.z - bounds.minZ) / CELL_SIZE),
});

const verticalOverlap = (actor: EntitySnapshot, solid: EntitySnapshot): boolean =>
  Math.abs(actor.position.y - solid.position.y) < (actor.size.y + solid.size.y) / 2;

const pointBlocked = (
  point: Vec3,
  actor: EntitySnapshot,
  solids: EntitySnapshot[],
): boolean =>
  solids.some(
    (solid) =>
      verticalOverlap(actor, solid) &&
      Math.abs(point.x - solid.position.x) < (actor.size.x + solid.size.x) / 2 + 0.01 &&
      Math.abs(point.z - solid.position.z) < (actor.size.z + solid.size.z) / 2 + 0.01,
  );

const buildBounds = (
  actor: EntitySnapshot,
  target: EntitySnapshot,
  solids: EntitySnapshot[],
): GridBounds => {
  const minX =
    Math.floor(
      (Math.min(
        actor.position.x,
        target.position.x,
        ...solids.map((solid) => solid.position.x - solid.size.x / 2),
      ) -
        WORLD_MARGIN) /
        CELL_SIZE,
    ) * CELL_SIZE;
  const maxX =
    Math.ceil(
      (Math.max(
        actor.position.x,
        target.position.x,
        ...solids.map((solid) => solid.position.x + solid.size.x / 2),
      ) +
        WORLD_MARGIN) /
        CELL_SIZE,
    ) * CELL_SIZE;
  const minZ =
    Math.floor(
      (Math.min(
        actor.position.z,
        target.position.z,
        ...solids.map((solid) => solid.position.z - solid.size.z / 2),
      ) -
        WORLD_MARGIN) /
        CELL_SIZE,
    ) * CELL_SIZE;
  const maxZ =
    Math.ceil(
      (Math.max(
        actor.position.z,
        target.position.z,
        ...solids.map((solid) => solid.position.z + solid.size.z / 2),
      ) +
        WORLD_MARGIN) /
        CELL_SIZE,
    ) * CELL_SIZE;

  return {
    minX,
    minZ,
    columns: Math.round((maxX - minX) / CELL_SIZE) + 1,
    rows: Math.round((maxZ - minZ) / CELL_SIZE) + 1,
  };
};

const neighborsOf = (cell: GridCell, bounds: GridBounds): GridCell[] => {
  const neighbors: GridCell[] = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let z = -1; z <= 1; z += 1) {
      if (x === 0 && z === 0) continue;
      const next = { x: cell.x + x, z: cell.z + z };
      if (next.x >= 0 && next.z >= 0 && next.x < bounds.columns && next.z < bounds.rows) {
        neighbors.push(next);
      }
    }
  }
  return neighbors;
};

const simplify = (waypoints: Vec3[]): Vec3[] => {
  if (waypoints.length < 3) return waypoints;
  const result = [waypoints[0]!];
  for (let index = 1; index < waypoints.length - 1; index += 1) {
    const previous = result[result.length - 1]!;
    const current = waypoints[index]!;
    const next = waypoints[index + 1]!;
    const firstX = Math.sign(current.x - previous.x);
    const firstZ = Math.sign(current.z - previous.z);
    const secondX = Math.sign(next.x - current.x);
    const secondZ = Math.sign(next.z - current.z);
    if (firstX !== secondX || firstZ !== secondZ) result.push(current);
  }
  result.push(waypoints[waypoints.length - 1]!);
  return result;
};

export const planToContact = (
  world: GameWorld,
  actorId: string,
  targetId: string,
  contactDistance: number,
): NavigationPlanResult => {
  const actor = world.get(actorId);
  const target = world.get(targetId);
  if (
    !actor?.active ||
    !actor.affordances.includes("movable") ||
    !target?.active ||
    !Number.isFinite(contactDistance) ||
    contactDistance < 0
  ) {
    return { status: "invalid" };
  }
  if (distanceXZ(actor.position, target.position) <= contactDistance) {
    return { status: "arrived" };
  }

  const solids = world
    .queryByTag("solid")
    .filter((solid) => solid.id !== actorId && solid.id !== targetId);
  const bounds = buildBounds(actor, target, solids);
  if (bounds.columns * bounds.rows > MAX_VISITED_CELLS) return { status: "no-path" };

  const start = cellOf(actor.position, bounds);
  const plannedContactDistance = Math.max(0, contactDistance - CONTACT_MARGIN);
  const startKey = keyOf(start);
  const frontier: GridCell[] = [start];
  const cameFrom = new Map<string, string | undefined>([[startKey, undefined]]);
  const cost = new Map<string, number>([[startKey, 0]]);
  const cells = new Map<string, GridCell>([[startKey, start]]);
  let goal: GridCell | undefined;
  let visited = 0;

  while (frontier.length > 0 && visited < MAX_VISITED_CELLS) {
    frontier.sort((left, right) => {
      const leftPosition = positionOf(left, bounds, actor.position.y);
      const rightPosition = positionOf(right, bounds, actor.position.y);
      const leftScore =
        (cost.get(keyOf(left)) ?? Number.POSITIVE_INFINITY) +
        Math.max(0, distanceXZ(leftPosition, target.position) - plannedContactDistance);
      const rightScore =
        (cost.get(keyOf(right)) ?? Number.POSITIVE_INFINITY) +
        Math.max(0, distanceXZ(rightPosition, target.position) - plannedContactDistance);
      return leftScore - rightScore;
    });
    const current = frontier.shift()!;
    const currentKey = keyOf(current);
    const currentPosition = positionOf(current, bounds, actor.position.y);
    visited += 1;

    if (distanceXZ(currentPosition, target.position) <= plannedContactDistance) {
      goal = current;
      break;
    }

    for (const next of neighborsOf(current, bounds)) {
      const nextPosition = positionOf(next, bounds, actor.position.y);
      if (pointBlocked(nextPosition, actor, solids)) continue;

      const diagonal = next.x !== current.x && next.z !== current.z;
      if (diagonal) {
        const alongX = positionOf({ x: next.x, z: current.z }, bounds, actor.position.y);
        const alongZ = positionOf({ x: current.x, z: next.z }, bounds, actor.position.y);
        if (pointBlocked(alongX, actor, solids) || pointBlocked(alongZ, actor, solids)) continue;
      }

      const nextKey = keyOf(next);
      const nextCost = (cost.get(currentKey) ?? 0) + (diagonal ? Math.SQRT2 : 1) * CELL_SIZE;
      if (nextCost >= (cost.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
      cost.set(nextKey, nextCost);
      cameFrom.set(nextKey, currentKey);
      cells.set(nextKey, next);
      if (!frontier.some((candidate) => keyOf(candidate) === nextKey)) frontier.push(next);
    }
  }

  if (!goal) return { status: "no-path" };

  const reversed: Vec3[] = [];
  let cursor: string | undefined = keyOf(goal);
  while (cursor && cursor !== startKey) {
    const cell = cells.get(cursor);
    if (!cell) break;
    reversed.push(positionOf(cell, bounds, actor.position.y));
    cursor = cameFrom.get(cursor);
  }
  const waypoints = simplify(reversed.reverse());
  if (waypoints.length === 0) return { status: "no-path" };

  return {
    status: "path-found",
    path: {
      actorId,
      targetId,
      contactDistance,
      waypoints,
      cursor: 0,
    },
  };
};

export const stepDirectlyToContact = (
  world: GameWorld,
  actorId: string,
  targetId: string,
  options: { contactDistance: number; speed: number },
  deltaSeconds: number,
): NavigationFollowResult => {
  const actor = world.get(actorId);
  const target = world.get(targetId);
  if (
    !actor?.active ||
    !actor.affordances.includes("movable") ||
    !target?.active ||
    !Number.isFinite(options.contactDistance) ||
    options.contactDistance < 0
  ) {
    return { status: "invalid", blockerIds: [] };
  }

  const distance = distanceXZ(actor.position, target.position);
  if (distance <= options.contactDistance) return { status: "arrived", blockerIds: [] };
  const remaining = distance - options.contactDistance;
  const step = Math.min(remaining, Math.max(0, options.speed) * Math.max(0, deltaSeconds));
  if (step === 0) return { status: "moving", blockerIds: [] };
  const movement = world.moveWithSolidCollision(actorId, {
    x: actor.position.x + ((target.position.x - actor.position.x) / distance) * step,
    y: actor.position.y,
    z: actor.position.z + ((target.position.z - actor.position.z) / distance) * step,
  });
  if (movement.status === "invalid") return { status: "invalid", blockerIds: [] };
  if (movement.status === "blocked") {
    return { status: "blocked", blockerIds: movement.blockerIds };
  }
  return {
    status: step >= remaining ? "arrived" : "moving",
    blockerIds: [],
  };
};

export const followNavigationPath = (
  world: GameWorld,
  path: NavigationPath,
  speed: number,
  deltaSeconds: number,
): NavigationFollowResult => {
  const actor = world.get(path.actorId);
  const target = world.get(path.targetId);
  if (!actor?.active || !target?.active || !actor.affordances.includes("movable")) {
    return { status: "invalid", blockerIds: [] };
  }
  if (distanceXZ(actor.position, target.position) <= path.contactDistance) {
    return { status: "arrived", blockerIds: [] };
  }

  while (
    path.cursor < path.waypoints.length &&
    distanceXZ(actor.position, path.waypoints[path.cursor]!) <= 0.08
  ) {
    path.cursor += 1;
  }
  const waypoint = path.waypoints[path.cursor];
  if (!waypoint) return { status: "blocked", blockerIds: [] };

  const distance = distanceXZ(actor.position, waypoint);
  const step = Math.min(distance, Math.max(0, speed) * Math.max(0, deltaSeconds));
  if (step === 0) return { status: "moving", blockerIds: [] };
  const movement = world.moveWithSolidCollision(path.actorId, {
    x: actor.position.x + ((waypoint.x - actor.position.x) / distance) * step,
    y: actor.position.y,
    z: actor.position.z + ((waypoint.z - actor.position.z) / distance) * step,
  });
  if (movement.status === "invalid") return { status: "invalid", blockerIds: [] };
  if (movement.status === "blocked") {
    return { status: "blocked", blockerIds: movement.blockerIds };
  }

  if (step >= distance) path.cursor += 1;
  const movedActor = world.get(path.actorId);
  if (movedActor && distanceXZ(movedActor.position, target.position) <= path.contactDistance) {
    return { status: "arrived", blockerIds: [] };
  }
  return { status: "moving", blockerIds: [] };
};
