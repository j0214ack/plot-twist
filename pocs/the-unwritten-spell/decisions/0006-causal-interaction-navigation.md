# Decision 0006：因果互動、接觸與動態尋路

狀態：Accepted for PoC

日期：2026-07-14

## 問題

玩家說「鑰匙開鎖」時，這句話具有明確的因果主體與合法 affordance，不等於直接把門的 protected lock state 改成 unlocked。然而目前 compiler 容易只在玩家明說「飛、移動」時建立移動階段；而 Game SDK 的 `moveToward` 也不檢查 generated solid geometry。結果是短句可能在遠處直接嘗試 unlock 而失敗，長句反而成功，且同一座牢籠會擋投射物卻不擋鑰匙。

這不是鑰匙或牢籠的特例，而是世界缺少「互動目標需要先滿足空間前提」的通用語意。

## 名詞

- **Interaction goal**：玩家希望 actor 對 target 完成的 affordance，例如 key 對 door 執行 unlock。
- **Contact precondition**：interaction 生效前，actor 必須進入 target 的有效接觸距離。
- **Locomotion effect**：描述 actor 如何移動及受哪些限制的 first-class world capability。飛、滾、滑行或相位移動可以由 generated module 賦予；是否形成獨立 module 依 Decision 0007 的 lifecycle 判準決定。
- **Navigation plan**：根據目前動態 solid geometry，讓 movable actor 到達 target 接觸範圍的一組路徑點。

## 考慮過的選項

### 要求玩家明說移動

Moving parts 最少，但把系統的隱藏實作限制轉嫁給玩家。「鑰匙開鎖」與「讓鑰匙飛去開鎖」只有 locomotion 明確度不同，不應一個無聲失敗、一個成功，因此不採用。

### Prompt 補一句後繼續使用直線 `moveToward`

可以改善短句，卻仍會穿過 generated walls，也無法區分 moving、blocked、no-path 與 arrived。它不能解決 emergent geometry 的核心矛盾，因此不採用為完整方案。

### 新增 `keyUnlockDoor()` 或 `approachAndUnlock()`

Demo 最可靠，但把特定解法 bake 進 Host，違反 Game SDK 只提供可組合原子能力與 Decision 0002 的 generative compiler 邊界，因此不採用。

### 通用 contact、navigation 與 structured interaction

Host 提供 collision-aware movement、動態 path planning、path following 與有原因的 interaction result；generated module 依 utterance 組合它們。這保留生成式機制，也讓所有 movable actor、solid geometry 與 affordance 共享同一套世界規則，因此採用。

## 決定

- `NAV-1`：「鑰匙開鎖」這類同時包含合法 actor 與 affordance 的句子是 causal interaction goal，不是 protected outcome assignment。只有「門現在已經打開」等省略可模擬原因的狀態宣告才由法典拒絕。
- `NAV-2`：若 interaction 有 contact precondition，而 actor 尚未接觸 target，compiler 必須生成滿足前提的時間性行為，再 invoke affordance；不得只在 `setup` 原地呼叫 interaction。
- `NAV-3`：玩家未指定 locomotion 時，系統使用保守、可觀察的 physical navigation 預設。玩家不必為了讓合法 interaction 生效而學會說「飛」。
- `NAV-4`（由 Decision 0007 補充）：飛、滾、滑行可以形成獨立 locomotion module，不只是句中的 modifier；在 v0 的俯視角 XZ navigation 中仍受 solid collider 阻擋。只有明確生成並獲准的穿牆／相位因果機制，才可以忽略一般 collider。
- `NAV-5`：所有經 public Game SDK 移動的 physical entity 都必須尊重 baked 與 generated solid geometry。投射物、鑰匙或其他 movable actor 可以有不同碰撞後果，但不能使用互相矛盾的空間判定。
- `NAV-6`：Game SDK 提供通用的 path planning 與 path following capability，不提供鑰匙、門或關卡專用的 navigation helper。Path planning 必須讀取當下世界，因此後生成的牢籠也會改變可達性。
- `NAV-7`：navigation 與 interaction 回傳 structured status，至少能區分 moving／arrived／blocked／no-path／invalid，以及 applied／out-of-range／incompatible／already-complete。不得只用沒有原因的 boolean 讓失敗靜默消失。
- `NAV-8`：generated behavior 預設先做可觀察的 direct-contact attempt；若撞上 solid，再切換 path planning。Retry 與 replan 必須 incremental、有上限且不阻塞 frame。超過時間或確定 no-path 時停止嘗試，並由旁註顯示一般化訊息，例如「鑰匙找不到能接觸到門的路。」
- `NAV-9`：PoC 驗收至少涵蓋無障礙、可繞路、完全封閉、明確相位移動與直接 protected outcome 五類案例。語意理解使用 live Eval；碰撞、尋路、timeout、protected state 與 feedback 使用 deterministic tests。

## v0 邊界

- Navigation 使用俯視角 XZ 平面與現有 entity bounds；不在這一階段建立完整 3D navmesh、跳躍、飛行高度或群體避障。
- Host 可以實作 A* 等確定性演算法；AI 不必在每個 spell source 裡重新生成 pathfinding 演算法。
- Path 是短生命週期執行資料，不是永久 SpellArtifact。世界幾何改變或下一步被阻擋時，generated module 可以重新規劃。
- 旁註只在終止、縮減或值得注意的阻擋時回饋，不逐 frame 報告 navigation 狀態。

## 對既有決策的關係

不推翻 Decisions 0001–0005。它補足 `game-sdk.md` 已列出但尚未實作的 collider、sensor 與 interaction 因果邊界，並使 Decision 0002 的 generated modules 能用通用 capability 建立「抵達後互動」的機制，而不是選擇預製技能。Decision 0007 後續補充 locomotion 的 first-class capability 與 module boundary，但保留本決定的 contact、navigation 與 bounded failure 規則。
