# World Model 與 Game SDK v0

## SDK 的目的

Game SDK 是 AI 生成程式碼與穩定遊戲世界之間的唯一邊界。它不提供 `trapGuard()`、`createMagneticRail()` 等預製玩法；它提供足以讓 generated code 組出新玩法的低階世界能力，同時保護關卡狀態、限制資源並支援 rollback。

PoC 要探索的是「開放生成機制、固定執行環境」，不是讓模型重寫整個遊戲專案。

## Generated spell 的產物

一次詠唱可以產生其中一種或多種產物：

```text
SpellArtifact
├─ MechanicModule  持續運作的輸入、物理、戰鬥與狀態邏輯
├─ WorldPatch      可以持續到後續詠唱的物件或空間修改
└─ GeneratedUI     法術需要的 HUD、標記或操作回饋
```

第一版不採用 `SpellContract`、施法前 cost preview 或 `ManaLease`。成本直接由 Game SDK 根據實際執行結果計量。

## Entity 模型

世界中的角色、投射物、牆、鑰匙與門都以 Entity 表示：

```ts
interface Entity {
  id: string;
  tags: string[];
  transform: Transform;
  physics?: PhysicsBody;
  visual?: VisualState;
  stats?: Record<string, number>;
  state: Record<string, unknown>;
  affordances: string[];
}
```

範例：

```text
player      → player, caster
guardian    → enemy, guardian, damageable, inventory-carrier
projectile  → projectile, hostile, reflectable
key         → key, movable, unlocker, unique
door        → door, lock, openable
wall        → wall, buildable-surface
portal      → portal, enterable, story-goal
```

`state` 允許 generated code 建立新的語意狀態，例如 `magnetized` 或 `echoCount`；受保護的 HP、存活、鎖與 objective 則不放在可任意寫入的 state 中。

## Game SDK 的能力面

| 服務 | v0 能力 |
| --- | --- |
| World | query、spawn、destroy 非保護 Entity、讀取 tags 與 bounds |
| Space | current room、focused surface、建立 geometry/collider、持續的 WorldPatch |
| Physics | force、velocity、rigid body、collider、sensor、raycast、joint |
| Combat | 建立受限 DamageSource、接受碰撞後的 damage、status 與 death event |
| Events | update、collision、enter/exit、spawn/destroy、custom event |
| Time | timer、cooldown、duration；歷史軌跡列為後續能力 |
| Input | 玩家移動、瞄準、語音文字、當前 focus 與手勢資料 |
| Render | primitive geometry、material、color、emissive、trail、particle |
| Audio | 一次性與空間音效；生成語音不在 technical spike critical path |
| UI | HUD、world label、狀態圖示與 generated component mount point |
| Story | 讀取 objective、threat 與 story anchor；不能直接完成 objective |

## Affordance 與受保護狀態

Generated code 取得的是能力介面，不是可任意修改的底層物件。

```text
Guardian HP  → 只能由 Damageable 接收有效 DamageSource 後改變
Door lock    → 只能由 Lock 接受相容 Unlocker 後改變
Story goal   → 只能由玩家實際進入 Enterable portal 後完成
Unique key   → 可以移動，但不能複製出另一個有效 Unlocker
```

以下操作不應存在：

```ts
guardian.hp = 0;
guardian.alive = false;
door.locked = false;
story.completed = true;
world.destroy(guardian);
```

合法做法是建立會參與世界模擬的原因，例如 collider、火焰區域、推力、反射面或鑰匙的移動控制器。

## Runtime cost metering

目前不做施法前 cost preview，也不要求玩家確認法力配置。Generated code 執行會影響世界的 SDK 呼叫時，由 Game Host 根據實際請求與現有 Mana 即時計量。

例如牆壁成本可以取決於面積、厚度、材質與 integrity；火焰則取決於 DPS、volume 與 duration。若玩家法力不足，SDK 可以：

1. 縮小或降低參數；
2. 只完成部分結果；
3. 縮短生命週期；
4. 安全失敗並 rollback。

SDK 回傳實際結果與調整原因：

```ts
interface WorldMutationResult<T> {
  requested: T;
  actual?: T;
  manaSpent: number;
  adjustments: string[];
  status: "complete" | "partial" | "rejected";
}
```

這些 telemetry 同時用於 Mana Bar 與旁註的結果式回饋。成本不能只依賴 prompt、模型自報或程式碼長度。

## 跨法術持續與指涉

「在剛才那道牆裡放火」要求後一次詠唱能找到前一次產物。Game Host 需要保存：

- 每個 SpellArtifact 的穩定 ID、owner 與 tags；
- 生成的 enclosure、room 與 corridor 關係；
- 玩家目前 focus、current room 與 recently referenced entities；
- WorldPatch 是否為 ephemeral、concentration-bound 或 persistent；
- module dispose 後哪些資源應清除、哪些應保留。

詠唱 context 至少包含：

```ts
interface CastContext {
  utterance: string;
  focusedEntity?: string;
  focusedSurface?: string;
  currentRoom: string;
  visibleEntities: string[];
  recentArtifacts: string[];
}
```

## MechanicModule lifecycle

概念介面：

```ts
interface MechanicModule {
  setup(context: GameContext): void;
  update?(deltaSeconds: number): void;
  dispose(): void;
}
```

每個 module 必須擁有自己建立的 entity、event listener、timer 與 UI，才能在失敗、解除專注或重設關卡時完整清除。

## PoC sandbox 與 rollback

第一版可以把 Game Host 放在可重建的 sandboxed iframe 或其他隔離容器中。目標不是完成 production security，而是：

- generated code 無法取得 GitHub token、檔案系統、網路憑證或父頁面權限；
- syntax/runtime error 不會摧毀外層控制介面；
- module 失敗時可以卸載或重建房間；
- 上一個成功版本可以保留為 demo fallback；
- log 能區分生成、編譯、載入、runtime 與 rollback 失敗。

## SDK v0 的驗證方式

在接 AI 以前，先人工使用同一套 SDK 寫三個 reference module：

1. 圍住指定 Entity 的牆；
2. 在指定 enclosure 內持續造成傷害的火焰；
3. 讓唯一鑰匙移動到相容鎖孔。

如果其中任一 module 必須繞過 SDK 修改 Game Host，代表 SDK 缺少必要原子能力。Reference module 的目的只是驗證 SDK，不應成為 production runtime 中按 prompt 選擇的預製技能。
