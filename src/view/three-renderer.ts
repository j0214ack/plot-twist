import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinnedModel } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { EntitySnapshot, VisualSpec } from "../game/types";
import {
  DUNGEON_ROOM_ASSETS,
  getBakedEntityAsset,
  type AssetVector,
  type BakedEntityAsset,
  type RoomAssetPlacement,
} from "./asset-catalog";
import { calculateAssetFit } from "./asset-fit";

const updateMaterial = (object: THREE.Object3D, visual: VisualSpec): void => {
  if (object.userData.usesSourceMaterials === true) return;
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    material.color.setHex(visual.color);
    material.emissive.setHex(visual.emissive ?? 0x000000);
    material.opacity = visual.opacity ?? 1;
    material.transparent = material.opacity < 1;
  });
};

export class ThreeGameRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly meshes = new Map<string, THREE.Object3D>();
  private readonly loader = new GLTFLoader();
  private readonly assetCache = new Map<string, Promise<GLTF>>();
  private readonly mixers = new Map<string, THREE.AnimationMixer>();
  private width = 0;
  private height = 0;
  private lastElapsedSeconds = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene.background = new THREE.Color(0x05060d);
    this.scene.fog = new THREE.FogExp2(0x080914, 0.035);
    this.camera.position.set(9.8, 15.5, 13.5);
    this.camera.lookAt(0.6, 0, 0);

    this.addLighting();
    this.addRoom();
    this.addInkMotes();
  }

  sync(entities: EntitySnapshot[], elapsedSeconds: number): void {
    const deltaSeconds = Math.max(0, elapsedSeconds - this.lastElapsedSeconds);
    this.lastElapsedSeconds = elapsedSeconds;
    for (const mixer of this.mixers.values()) mixer.update(deltaSeconds);

    const activeIds = new Set(entities.filter((entity) => entity.active).map((entity) => entity.id));
    for (const [id, mesh] of this.meshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.meshes.delete(id);
        this.mixers.get(id)?.stopAllAction();
        this.mixers.delete(id);
      }
    }

    for (const entity of entities) {
      if (!entity.active) continue;
      let object = this.meshes.get(entity.id);
      if (!object) {
        object = this.createEntityObject(entity);
        object.userData.signature = `${entity.visual.shape}:${entity.size.x}:${entity.size.y}:${entity.size.z}`;
        this.meshes.set(entity.id, object);
        this.scene.add(object);
      }

      object.position.set(entity.position.x, entity.position.y, entity.position.z);
      updateMaterial(object, entity.visual);
      this.animateEntity(object, entity, elapsedSeconds);
    }

    this.resizeIfNeeded();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    for (const mixer of this.mixers.values()) mixer.stopAllAction();
    this.mixers.clear();
    this.renderer.dispose();
  }

  private createEntityObject(entity: EntitySnapshot): THREE.Object3D {
    const fallback = this.createPrimitiveObject(entity);
    const asset = getBakedEntityAsset(entity.id);
    if (!asset) return fallback;

    const root = new THREE.Group();
    fallback.userData.assetFallback = true;
    root.add(fallback);
    void this.attachEntityAsset(root, entity, asset);
    return root;
  }

  private createPrimitiveObject(entity: EntitySnapshot): THREE.Object3D {
    const material = new THREE.MeshStandardMaterial({
      color: entity.visual.color,
      emissive: entity.visual.emissive ?? 0,
      emissiveIntensity: entity.visual.emissive ? 1.7 : 0,
      roughness: entity.tags.includes("key") ? 0.2 : 0.55,
      metalness: entity.tags.includes("key") ? 0.8 : 0.12,
      opacity: entity.visual.opacity ?? 1,
      transparent: (entity.visual.opacity ?? 1) < 1,
    });

    let object: THREE.Object3D;
    switch (entity.visual.shape) {
      case "sphere":
        object = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 2), material);
        object.scale.set(entity.size.x, entity.size.y, entity.size.z);
        break;
      case "cylinder":
        object = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), material);
        object.scale.set(entity.size.x, entity.size.y, entity.size.z);
        break;
      case "portal":
        object = this.createPortal(entity, material);
        break;
      case "box":
      default:
        object = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
        object.scale.set(entity.size.x, entity.size.y, entity.size.z);
        break;
    }

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = !entity.tags.includes("fire");
        child.receiveShadow = entity.tags.includes("wall") || entity.tags.includes("door");
      }
    });
    return object;
  }

  private async attachEntityAsset(
    root: THREE.Group,
    entity: EntitySnapshot,
    asset: BakedEntityAsset,
  ): Promise<void> {
    try {
      const gltf = await this.loadAsset(asset.url);
      if (this.disposed || this.meshes.get(entity.id) !== root) return;

      const { object, animationRoot } = this.createFittedAsset(
        gltf,
        [entity.size.x, entity.size.y, entity.size.z],
        asset.rotation,
        asset.hiddenNodes,
      );
      root.children
        .filter((child) => child.userData.assetFallback === true)
        .forEach((child) => root.remove(child));
      root.add(object);
      root.userData.usesSourceMaterials = true;
      root.userData.assetMotion = object;
      root.userData.unlockedLift = asset.unlockedLift ?? 0;
      this.enableShadows(object, entity.tags.includes("wall") || entity.tags.includes("door"));

      if (asset.animation) {
        const clip = THREE.AnimationClip.findByName(gltf.animations, asset.animation);
        if (clip) {
          const mixer = new THREE.AnimationMixer(animationRoot);
          mixer.clipAction(clip).play();
          this.mixers.set(entity.id, mixer);
        }
      }
    } catch (error) {
      console.warn(`Unable to load CC0 asset for ${entity.id}; keeping primitive fallback.`, error);
    }
  }

  private createPortal(
    entity: EntitySnapshot,
    material: THREE.MeshStandardMaterial,
  ): THREE.Object3D {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.055, 16, 64), material);
    ring.rotation.y = Math.PI / 2;
    ring.scale.set(entity.size.y, entity.size.z, entity.size.x);
    group.add(ring);

    const veilMaterial = new THREE.MeshStandardMaterial({
      color: entity.visual.color,
      emissive: entity.visual.emissive ?? entity.visual.color,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const veil = new THREE.Mesh(new THREE.CircleGeometry(0.47, 48), veilMaterial);
    veil.rotation.y = Math.PI / 2;
    veil.scale.set(entity.size.y, entity.size.z, 1);
    group.add(veil);
    return group;
  }

  private animateEntity(
    object: THREE.Object3D,
    entity: EntitySnapshot,
    elapsedSeconds: number,
  ): void {
    if (entity.tags.includes("portal")) {
      object.rotation.x = Math.sin(elapsedSeconds * 0.7) * 0.08;
      object.rotation.z = Math.sin(elapsedSeconds * 0.45) * 0.08;
    }
    if (entity.tags.includes("fire")) {
      const pulse = 1 + Math.sin(elapsedSeconds * 8) * 0.08;
      object.scale.y = pulse;
      object.rotation.y = elapsedSeconds * 0.35;
    }
    if (entity.tags.includes("projectile")) object.rotation.y = elapsedSeconds * 5;
    if (entity.tags.includes("key")) {
      object.rotation.y = elapsedSeconds * 2.3;
      object.position.y += Math.sin(elapsedSeconds * 4) * 0.08;
    }
    if (entity.tags.includes("door")) {
      const assetMotion = object.userData.assetMotion;
      if (assetMotion instanceof THREE.Object3D) {
        const lift = entity.tags.includes("unlocked") ? (object.userData.unlockedLift as number) : 0;
        assetMotion.position.y = THREE.MathUtils.lerp(assetMotion.position.y, lift, 0.12);
      }
    }
  }

  private loadAsset(url: string): Promise<GLTF> {
    const cached = this.assetCache.get(url);
    if (cached) return cached;
    const request = this.loader.loadAsync(url);
    this.assetCache.set(url, request);
    return request;
  }

  private createFittedAsset(
    gltf: GLTF,
    targetSize: AssetVector,
    rotation: AssetVector = [0, 0, 0],
    hiddenNodes: readonly string[] = [],
  ): { object: THREE.Group; animationRoot: THREE.Object3D } {
    const animationRoot = cloneSkinnedModel(gltf.scene);
    for (const nodeName of hiddenNodes) {
      animationRoot.getObjectByName(nodeName)?.scale.setScalar(0.001);
    }

    const oriented = new THREE.Group();
    oriented.rotation.set(rotation[0], rotation[1], rotation[2]);
    oriented.add(animationRoot);
    oriented.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(oriented);
    if (bounds.isEmpty()) throw new Error("Loaded asset has no renderable bounds.");
    const fit = calculateAssetFit(
      {
        min: [bounds.min.x, bounds.min.y, bounds.min.z],
        max: [bounds.max.x, bounds.max.y, bounds.max.z],
      },
      targetSize,
    );

    const fitted = new THREE.Group();
    fitted.position.set(fit.offset[0], fit.offset[1], fit.offset[2]);
    fitted.scale.set(fit.scale[0], fit.scale[1], fit.scale[2]);
    fitted.add(oriented);

    const motion = new THREE.Group();
    motion.add(fitted);
    return { object: motion, animationRoot };
  }

  private enableShadows(object: THREE.Object3D, receiveShadow: boolean): void {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = receiveShadow;
    });
  }

  private addRoomAsset(placement: RoomAssetPlacement): void {
    const root = new THREE.Group();
    root.position.set(placement.position[0], placement.position[1], placement.position[2]);
    const fallback = this.createRoomFallback(placement);
    fallback.userData.assetFallback = true;
    root.add(fallback);
    this.scene.add(root);

    void this.loadAsset(placement.url)
      .then((gltf) => {
        if (this.disposed || root.parent !== this.scene) return;
        const { object } = this.createFittedAsset(
          gltf,
          placement.size,
          placement.rotation,
        );
        root.remove(fallback);
        root.add(object);
        this.enableShadows(object, placement.role !== "decoration");
      })
      .catch((error: unknown) => {
        console.warn(`Unable to load room asset ${placement.url}; keeping fallback.`, error);
      });
  }

  private createRoomFallback(placement: RoomAssetPlacement): THREE.Object3D {
    const material = new THREE.MeshStandardMaterial({
      color: placement.role === "floor" ? 0x171828 : 0x111424,
      emissive: placement.role === "wall" ? 0x10142b : 0x000000,
      roughness: 0.82,
    });
    if (placement.role === "floor") {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      floor.rotation.x = -Math.PI / 2;
      floor.scale.set(placement.size[0], placement.size[2], 1);
      floor.receiveShadow = true;
      return floor;
    }

    const geometry =
      placement.role === "wall"
        ? new THREE.BoxGeometry(1, 1, 1)
        : new THREE.DodecahedronGeometry(0.5, 0);
    const object = new THREE.Mesh(geometry, material);
    object.scale.set(placement.size[0], placement.size[1], placement.size[2]);
    object.receiveShadow = placement.role === "wall";
    return object;
  }

  private addLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0x8fcfff, 0x130c1e, 1.4);
    this.scene.add(hemisphere);

    const moon = new THREE.DirectionalLight(0xcbe9ff, 3.2);
    moon.position.set(-4, 12, 7);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -12;
    moon.shadow.camera.right = 12;
    moon.shadow.camera.top = 10;
    moon.shadow.camera.bottom = -10;
    this.scene.add(moon);

    const portalGlow = new THREE.PointLight(0x8a46ff, 28, 11, 2);
    portalGlow.position.set(8.3, 2, 0);
    this.scene.add(portalGlow);
  }

  private addRoom(): void {
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x18172a,
      roughness: 0.88,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    this.scene.add(floor);

    for (const placement of DUNGEON_ROOM_ASSETS) this.addRoomAsset(placement);

    const sigilMaterial = new THREE.MeshBasicMaterial({
      color: 0x6944a8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const sigil = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.24, 64), sigilMaterial);
    sigil.rotation.x = -Math.PI / 2;
    sigil.position.set(2.5, 0.025, 0);
    this.scene.add(sigil);
  }

  private addInkMotes(): void {
    const points = new Float32Array(180 * 3);
    for (let index = 0; index < points.length; index += 3) {
      points[index] = (Math.random() - 0.5) * 22;
      points[index + 1] = Math.random() * 7 + 0.4;
      points[index + 2] = (Math.random() - 0.5) * 16;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    const material = new THREE.PointsMaterial({
      color: 0x87d9ff,
      size: 0.035,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    this.scene.add(new THREE.Points(geometry, material));
  }

  private resizeIfNeeded(): void {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }
}
