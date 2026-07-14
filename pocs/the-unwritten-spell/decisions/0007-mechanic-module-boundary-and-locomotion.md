# Decision 0007：MechanicModule 邊界與 first-class locomotion

狀態：Accepted design direction；implementation pending

日期：2026-07-14

## 問題

「讓鑰匙飛去開鎖」同時包含移動方式與互動目標。若把整句固定視為一個 action／module，飛行很難被維持、解除、反制或讓後續法術引用；但若看到每個動詞就拆 module，則會增加 generated source、dependency 與失敗點，並把自然語言的表面結構誤當成 runtime 架構。

同時，若每個 generated module 都自己生成飛行物理、碰撞與尋路，模型負擔會過大且世界規則容易互相矛盾；若 Host 直接提供 `flyToAndUnlock()` 之類的固定技能，又會退化成預製能力表。

真正需要決定的不是「飛是不是動詞」，而是：什麼因果機制值得擁有獨立 runtime 邊界，以及 locomotion 應由穩定 Host 或 generated code 負責到哪一層。

## 名詞

- **Runtime mechanism**：一段在世界中持續或等待條件、能產生可觀察因果的行為。
- **First-class capability**：世界可以查詢、模擬、計量並讓其他機制一致反應的能力；不是只藏在某段 generated code 裡的慣例。
- **Locomotion effect**：附著在 actor 上、描述其移動方式與限制的世界能力，例如 physical、flight、burrow 或 phase。
- **MechanicModule**：擁有一段 runtime mechanism 及其資源、listener、effect 與 cleanup 的生命週期單位。
- **Compound module**：為了完成同一個短生命週期因果，內含多個步驟但只需要一起建立、成功或清除的 module。

First-class capability 與 MechanicModule 是兩個不同維度：Host 可以把 locomotion 做成 first-class capability，而 generated FlightModule 則負責賦予、設定、維持與移除某個 locomotion effect。

## 考慮過的選項

### 所有移動都留在 interaction module 內

最少 generated modules，也最接近目前實作；但飛行無法獨立計量、反制、持續或被其他法術引用，長期會讓每個 mechanic 重複實作移動。

### 由 AI 生成完整 FlightModule、物理與尋路

保留最大生成自由，但模型必須反覆生成確定性演算法，容易出現碰撞規則不一致、無限 retry、效能與 syntax 問題。

### Host 提供固定 `fly()` 或 `flyToAndUnlock()` 技能

最穩定，但把具體玩法 bake 進 SDK，會把 generative compiler 降為技能選擇器。

### Host 提供 first-class locomotion substrate，AI 生成使用它的 modules

Host 只擁有通用移動、碰撞、尋路與 effect lifecycle；AI 決定何時、對誰、以什麼參數與代價產生 FlightModule 或其他 locomotion mechanism。這讓生成保持開放，同時不必重新發明底層演算法，因此採用。

## 決定

### Module 邊界判準

- `MOD-1`：module 不是語法中的動詞、名詞或 action 數量；它是具有獨立 ownership 與 lifecycle 的 runtime mechanism。
- `MOD-2`：判斷一段機制是否應拆成獨立 module 時，依序檢查：
  1. 是否需要在主要 interaction 前後獨立存在或終止；
  2. 是否有自己的 Mana、專注或其他資源代價；
  3. 是否能被敵人、環境或另一個法術獨立阻擋、解除或改寫；
  4. 是否需要被後續 module／spell 獨立引用或重用；
  5. 是否改變世界可查詢、可反應的 capability。
- `MOD-3`：若一段機制具有獨立 lifecycle，或必須能被獨立反制／引用，預設拆成 module。資源代價與 world-readable capability 是支持拆分的重要訊號，但不因單一詞彙或單一訊號機械拆分。
- `MOD-4`：若多個步驟只共同完成一次、短生命週期且不可獨立互動的因果，可以保留為 compound module。例如一次性拋物線只是某顆投射物命中的內部運動，不必自動拆出 LocomotionModule。
- `MOD-5`：Eval 不以固定 module 數量判斷語意正確。它驗證每個 module 的因果責任、dependency、lifecycle、protected-state 邊界與可觀察結果；同一句話可以有多個合理的 module graph。

### Locomotion 邊界

- `LOC-1`：locomotion 是 Game SDK 的 first-class capability。世界必須能一致地把 actor 的 locomotion effect 帶入移動、碰撞、navigation、cost、feedback 與 cleanup。
- `LOC-2`：Host 提供通用 locomotion substrate 與確定性的碰撞／尋路能力，不提供 `flyKeyToDoor()` 等 entity、關卡或解法專用 helper。
- `LOC-3`：generated module 可以賦予、修改與移除 locomotion effect。FlightModule 生成的是具體規則與生命週期，不自行重寫 A*、collider resolution 或 Host internals。
- `LOC-4`：飛行不等於相位移動。FlightModule 若未另外取得 phase／collision-policy capability，仍受 solid geometry 阻擋。
- `LOC-5`：玩家未指定 locomotion 時，合法 interaction goal 仍採用保守 physical navigation；「飛」不是讓 interaction 從失敗變成功的隱藏關鍵字。
- `LOC-6`：`dependsOn` 只保證 dependency artifact 已建立，不代表前一個 module 的時間性行為已完成。以「飛去開鎖」為例，FlightModule 負責移動，UnlockModule 觀察 contact precondition，接觸後才 invoke；沒有路徑或逾時時保持 locked 並回報原因。

## 例子

### 「讓鑰匙飛去開鎖」

若 flight 具有自己的持續、代價、碰撞與可反制狀態，合理的輸出是：

```text
FlightModule
  └─ 賦予鑰匙 flight locomotion，讓它嘗試接觸門

UnlockModule (dependsOn FlightModule artifact)
  └─ 觀察鑰匙與門的 contact，成立後 invoke unlock
```

若某個 one-shot mechanic 的飛行只是不可獨立存在的短暫演出，也可以生成一個 compound module。兩者都必須滿足相同碰撞、contact、protected state 與 bounded failure 規則。

### 「讓火球沿著陰影爬過牆面」

重點不是把「沿著、爬、牆」各拆一個 module，而是 generated module 能否透過 first-class locomotion substrate 建立一個可觀察、可中斷且遵守世界限制的新 motion policy。

## PoC 階段邊界

- v0 仍只驗證俯視角 XZ navigation，不因 first-class locomotion 立即加入完整 3D navmesh、飛行高度、跳躍或群體避障。
- 可以先讓 flight 成為有獨立 lifecycle 的 XZ locomotion effect，保留視覺、代價與反制語意；完整垂直運動留待後續。
- 第一個 implementation slice 應先驗證 effect ownership、collision、contact observer、dependency cleanup 與 no-path；不擴充成固定技能庫。

## 對既有決策的關係

- 本決定部分 supersede Decision 0002 的 `GEN-3`：「action 決定 module 數量」只保留為辨認玩家因果要求的輸入線索，不再作為 runtime module 數量規則；新的權威判準是 `MOD-1`–`MOD-5`。
- 本決定補充並部分 supersede Decision 0006 的 locomotion modifier 定義與 `NAV-4`。飛、滾、滑行可以形成獨立 module；是否拆分由 lifecycle、代價、反制、引用與 capability 判準決定。`NAV-4` 中「飛行仍受 solid collider 阻擋」的部分由 `LOC-4` 保留。
- 本決定不改變 Decision 0002 的 Reference harness／generative compiler 邊界，也不改變 Decision 0006 的 contact、dynamic navigation、bounded retry 與 protected interaction 決定。
