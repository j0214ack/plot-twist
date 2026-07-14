import type { SpellArtifact, Vec3 } from "../game/types";

export interface SpellSceneEntity {
  id: string;
  name: string;
  tags: string[];
  affordances: string[];
  position: Vec3;
}

export interface SpellCompileRequest {
  utterance: string;
  focusedEntityId?: string;
  scene: SpellSceneEntity[];
  recentArtifacts: SpellArtifact[];
}

export interface SpellModelInput extends SpellCompileRequest {
  sdkContract: string;
}

export interface GeneratedModuleSource {
  id: string;
  label: string;
  tags: string[];
  dependsOn: string[];
  source: string;
}

export interface SpellBundle {
  summary: string;
  modules: GeneratedModuleSource[];
}
