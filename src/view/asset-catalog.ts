export type AssetVector = readonly [number, number, number];

export interface BakedEntityAsset {
  url: string;
  rotation?: AssetVector;
  hiddenNodes?: readonly string[];
  animation?: string;
  unlockedLift?: number;
}

export interface RoomAssetPlacement {
  role: "floor" | "wall" | "decoration";
  url: string;
  position: AssetVector;
  size: AssetVector;
  rotation?: AssetVector;
}

const MINI_DUNGEON_ROOT = "/assets/cc0/kenney-mini-dungeon";

const BAKED_ENTITY_ASSETS: Readonly<Record<string, BakedEntityAsset>> = {
  player: {
    url: `${MINI_DUNGEON_ROOT}/character-human.glb`,
    rotation: [0, Math.PI / 2, 0],
    hiddenNodes: ["arm-left", "arm-right"],
    animation: "idle",
  },
  guardian: {
    url: `${MINI_DUNGEON_ROOT}/character-orc.glb`,
    rotation: [0, -Math.PI / 2, 0],
    animation: "idle",
  },
  door: {
    url: `${MINI_DUNGEON_ROOT}/gate.glb`,
    rotation: [0, Math.PI / 2, 0],
    unlockedLift: 2.35,
  },
  key: {
    url: "/assets/cc0/quaternius-key/key.glb",
    rotation: [0, 0, -Math.PI / 2],
  },
};

export const getBakedEntityAsset = (entityId: string): BakedEntityAsset | undefined =>
  BAKED_ENTITY_ASSETS[entityId];

const floorTiles: RoomAssetPlacement[] = [];
for (const x of [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]) {
  for (const z of [-4.5, -1.5, 1.5, 4.5]) {
    floorTiles.push({
      role: "floor",
      url: `${MINI_DUNGEON_ROOT}/floor.glb`,
      position: [x, 0.01, z],
      size: [3.04, 0.08, 3.04],
    });
  }
}

const wallSegments: RoomAssetPlacement[] = [];
for (const x of [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]) {
  wallSegments.push(
    {
      role: "wall",
      url: `${MINI_DUNGEON_ROOT}/wall.glb`,
      position: [x, 1.5, -6],
      size: [3.04, 3, 0.38],
    },
    {
      role: "wall",
      url: `${MINI_DUNGEON_ROOT}/wall.glb`,
      position: [x, 1.5, 6],
      size: [3.04, 3, 0.38],
    },
  );
}
for (const z of [-4.5, -1.5, 1.5, 4.5]) {
  wallSegments.push(
    {
      role: "wall",
      url: `${MINI_DUNGEON_ROOT}/wall.glb`,
      position: [-9, 1.5, z],
      size: [0.38, 3, 3.04],
      rotation: [0, Math.PI / 2, 0],
    },
    {
      role: "wall",
      url: `${MINI_DUNGEON_ROOT}/wall.glb`,
      position: [9, 1.5, z],
      size: [0.38, 3, 3.04],
      rotation: [0, Math.PI / 2, 0],
    },
  );
}

const decorations: RoomAssetPlacement[] = [
  {
    role: "decoration",
    url: `${MINI_DUNGEON_ROOT}/column.glb`,
    position: [-8.15, 1.2, -5.1],
    size: [0.9, 2.4, 0.9],
  },
  {
    role: "decoration",
    url: `${MINI_DUNGEON_ROOT}/column.glb`,
    position: [-8.15, 1.2, 5.1],
    size: [0.9, 2.4, 0.9],
  },
  {
    role: "decoration",
    url: `${MINI_DUNGEON_ROOT}/rocks.glb`,
    position: [7.8, 0.28, -5.05],
    size: [1.4, 0.55, 1.1],
  },
  {
    role: "decoration",
    url: `${MINI_DUNGEON_ROOT}/stones.glb`,
    position: [7.7, 0.18, 5.05],
    size: [1.3, 0.35, 1],
  },
];

export const DUNGEON_ROOM_ASSETS: readonly RoomAssetPlacement[] = [
  ...floorTiles,
  ...wallSegments,
  ...decorations,
];
