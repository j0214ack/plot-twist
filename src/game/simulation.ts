import { clamp, distanceXZ, normalizeXZ, overlapsXZ, vec3 } from "./math";
import type { WorldEvent } from "./types";
import { GameWorld } from "./world";

export interface PlayerInput {
  moveX: number;
  moveZ: number;
  dash: boolean;
}

export class GameSimulation {
  private casting = false;
  private guardianAttackTimer = 0;
  private dashCooldown = 0;
  private readonly projectileAges = new Map<string, number>();
  private readonly unsubscribe: () => void;
  private levelReady = false;
  private objectiveCompleted = false;

  constructor(private readonly world: GameWorld) {
    this.unsubscribe = world.on((event) => this.handleWorldEvent(event));
  }

  setupLevel(): void {
    if (this.levelReady) return;
    this.levelReady = true;

    this.world.add({
      id: "player",
      name: "The handless writer",
      tags: ["player", "caster", "damageable"],
      position: vec3(-6, 0.7, 0),
      size: vec3(0.8, 1.4, 0.8),
      visual: { shape: "cylinder", color: 0xe6f8ff, emissive: 0x4ecfff },
      stats: { hp: 100, maxHp: 100 },
      protected: true,
    });
    this.world.add({
      id: "guardian",
      name: "The Redactor",
      tags: ["enemy", "guardian", "damageable"],
      position: vec3(2.5, 1, 0),
      size: vec3(1.1, 2, 1.1),
      visual: { shape: "box", color: 0x8b263f, emissive: 0xff204e },
      stats: { hp: 100, maxHp: 100 },
      protected: true,
    });
    this.world.add({
      id: "door",
      name: "The sealed sentence",
      tags: ["door", "locked"],
      position: vec3(7, 1.4, 0),
      size: vec3(0.45, 2.8, 3.2),
      visual: { shape: "box", color: 0x171528, emissive: 0x5a214e },
      affordances: ["lock"],
      protected: true,
    });
    this.world.add({
      id: "portal",
      name: "Unwritten passage",
      tags: ["portal", "story-goal", "enterable"],
      position: vec3(8.6, 1.2, 0),
      size: vec3(0.35, 2.4, 2.4),
      visual: { shape: "portal", color: 0xa85cff, emissive: 0x7b32ff, opacity: 0.85 },
      affordances: ["enterable"],
      protected: true,
    });
  }

  setCasting(casting: boolean): void {
    this.casting = casting;
  }

  get completed(): boolean {
    return this.objectiveCompleted;
  }

  update(deltaSeconds: number, input: PlayerInput): void {
    if (!this.levelReady) return;
    this.dashCooldown = Math.max(0, this.dashCooldown - deltaSeconds);
    this.movePlayer(deltaSeconds, input);
    this.updateProjectiles(deltaSeconds);
    this.updateGuardian(deltaSeconds);
    this.updateObjective();
  }

  dispose(): void {
    this.unsubscribe();
  }

  private movePlayer(deltaSeconds: number, input: PlayerInput): void {
    const player = this.world.get("player");
    if (!player?.active) return;

    const direction = normalizeXZ(vec3(input.moveX, 0, input.moveZ));
    const baseSpeed = this.casting ? 2.25 : 5;
    const canDash = input.dash && this.dashCooldown === 0 && !this.casting;
    const speed = canDash ? 12 : baseSpeed;
    if (canDash) this.dashCooldown = 1.1;

    const doorLocked = this.world.get("door")?.tags.includes("locked") ?? true;
    const maxX = doorLocked ? 6.35 : 9.2;
    this.world.setPosition("player", {
      x: clamp(player.position.x + direction.x * speed * deltaSeconds, -8.4, maxX),
      y: player.position.y,
      z: clamp(player.position.z + direction.z * speed * deltaSeconds, -5.7, 5.7),
    });
  }

  private updateGuardian(deltaSeconds: number): void {
    const guardian = this.world.get("guardian");
    const player = this.world.get("player");
    if (!guardian?.active || !player?.active) return;

    this.guardianAttackTimer += deltaSeconds;
    if (this.guardianAttackTimer < 1.4) return;
    this.guardianAttackTimer %= 1.4;

    const direction = normalizeXZ({
      x: player.position.x - guardian.position.x,
      y: 0,
      z: player.position.z - guardian.position.z,
    });
    const projectile = this.world.add({
      name: "Redacted word",
      tags: ["projectile", "hostile", "damage-source", "reflectable"],
      position: vec3(guardian.position.x - 0.7, 0.65, guardian.position.z),
      size: vec3(0.38, 0.38, 0.38),
      visual: { shape: "sphere", color: 0xff325f, emissive: 0xff0038 },
      velocity: vec3(direction.x * 5.6, 0, direction.z * 5.6),
      ownerId: "game-host",
    });
    this.projectileAges.set(projectile.id, 0);
  }

  private updateProjectiles(deltaSeconds: number): void {
    const player = this.world.get("player");
    for (const projectile of this.world.queryByTag("projectile")) {
      const age = (this.projectileAges.get(projectile.id) ?? 0) + deltaSeconds;
      this.projectileAges.set(projectile.id, age);
      this.world.setPosition(projectile.id, {
        x: projectile.position.x + projectile.velocity.x * deltaSeconds,
        y: projectile.position.y,
        z: projectile.position.z + projectile.velocity.z * deltaSeconds,
      });

      const moved = this.world.get(projectile.id);
      const hitSolid = moved
        ? this.world.queryByTag("solid").some((solid) => overlapsXZ(moved, solid))
        : false;
      if (hitSolid) {
        this.world.hostDestroy(projectile.id);
        this.projectileAges.delete(projectile.id);
      } else if (player?.active && moved && distanceXZ(moved.position, player.position) < 0.62) {
        this.world.damage(projectile.id, player.id, 12);
        this.world.hostDestroy(projectile.id);
        this.projectileAges.delete(projectile.id);
      } else if (age > 4 || !moved || Math.abs(moved.position.x) > 11 || Math.abs(moved.position.z) > 8) {
        this.world.hostDestroy(projectile.id);
        this.projectileAges.delete(projectile.id);
      }
    }
  }

  private handleWorldEvent(event: WorldEvent): void {
    if (event.type === "died" && event.entityId === "guardian" && !this.world.get("key")) {
      const guardian = this.world.get("guardian");
      this.world.add({
        id: "key",
        name: "The only valid key",
        tags: ["key", "unique"],
        position: guardian ? { ...guardian.position, y: 0.35 } : vec3(2.5, 0.35, 0),
        size: vec3(0.75, 0.16, 0.24),
        visual: { shape: "box", color: 0xffd45a, emissive: 0xff9f1c },
        affordances: ["unlocker", "movable"],
        protected: true,
      });
    }

    if (event.type === "unlocked" && event.lockId === "door") {
      this.world.setVisual("door", { color: 0x263a45, emissive: 0x37d6b2, opacity: 0.35 });
    }
  }

  private updateObjective(): void {
    if (this.objectiveCompleted) return;
    const player = this.world.get("player");
    const portal = this.world.get("portal");
    const door = this.world.get("door");
    if (
      player?.active &&
      portal?.active &&
      door?.tags.includes("unlocked") &&
      distanceXZ(player.position, portal.position) < 1
    ) {
      this.objectiveCompleted = true;
    }
  }
}
