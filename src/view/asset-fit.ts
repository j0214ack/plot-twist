import type { AssetVector } from "./asset-catalog";

export interface AssetBounds {
  min: AssetVector;
  max: AssetVector;
}

export interface AssetFit {
  scale: AssetVector;
  offset: AssetVector;
}

const fitAxis = (minimum: number, maximum: number, target: number): [number, number] => {
  const span = maximum - minimum;
  if (Math.abs(span) < Number.EPSILON) return [1, 0];
  const scale = target / span;
  const rawOffset = -((minimum + maximum) / 2) * scale;
  const offset = Object.is(rawOffset, -0) ? 0 : rawOffset;
  return [scale, offset];
};

export const calculateAssetFit = (bounds: AssetBounds, target: AssetVector): AssetFit => {
  const [scaleX, offsetX] = fitAxis(bounds.min[0], bounds.max[0], target[0]);
  const [scaleY, offsetY] = fitAxis(bounds.min[1], bounds.max[1], target[1]);
  const [scaleZ, offsetZ] = fitAxis(bounds.min[2], bounds.max[2], target[2]);

  return {
    scale: [scaleX, scaleY, scaleZ],
    offset: [offsetX, offsetY, offsetZ],
  };
};
