import type { EntitySnapshot, Vec3 } from "./types";

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const distanceXZ = (a: Vec3, b: Vec3): number =>
  Math.hypot(a.x - b.x, a.z - b.z);

export const distance3D = (a: Vec3, b: Vec3): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const lengthXZ = (value: Vec3): number => Math.hypot(value.x, value.z);

export const normalizeXZ = (value: Vec3): Vec3 => {
  const length = lengthXZ(value);
  return length === 0 ? vec3() : vec3(value.x / length, 0, value.z / length);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const pointInsideEntityXZ = (point: Vec3, entity: EntitySnapshot): boolean =>
  Math.abs(point.x - entity.position.x) <= entity.size.x / 2 &&
  Math.abs(point.z - entity.position.z) <= entity.size.z / 2;

export const overlapsXZ = (left: EntitySnapshot, right: EntitySnapshot): boolean =>
  Math.abs(left.position.x - right.position.x) < (left.size.x + right.size.x) / 2 &&
  Math.abs(left.position.z - right.position.z) < (left.size.z + right.size.z) / 2;
