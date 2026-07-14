# Decision 0002：Reference harness 與生成式編譯器的邊界

狀態：Accepted for PoC

日期：2026-07-14

## 問題

Game SDK 需要先用人工 module 驗證，真正產品卻要理解自由語言並生成新程式碼。如果兩個階段共用一個模糊的「文字輸入 → 技能」介面，reference code 很容易長成關鍵字 router 或預製技能表，最後讓 demo 看似可玩，卻沒有驗證核心命題。

## 名詞

- **Utterance**：玩家一次提交的原始話語。
- **Action**：玩家要求世界新增或改變的一段因果機制。
- **Reference**：action 指向的既有 entity、空間或先前 artifact，不是另一個 action。
- **Constraint**：範圍、材質、條件、持續時間等對 action 的限制，不是另一個 action。
- **SpellBundle**：一次 utterance 的編譯結果，包含一到多個有順序或依賴關係的 generated modules。
- **Reference harness**：只用來證明 SDK 能力的人工測試入口，不理解自然語言。

## 決定

### Phase A：Reference harness

- `RHB-1`：harness 只能用明確的 reference ID 或直接 module factory 啟動牆、火與鑰匙三個人工 modules。
- `RHB-2`：harness 不得根據玩家文字做 keyword、regex、intent 或語意判斷。
- `RHB-3`：harness UI 必須標示 Reference Mode，不得讓觀眾誤認為模型正在理解或生成能力。
- `RHB-4`：harness 測試只回答 SDK、affordance、ownership、Mana、lifecycle 與 cross-artifact reference 是否成立。
- `RHB-5`：自然語言失敗案例進入 Phase B eval set；不得為了讓 harness 通過而增加 parser 分支。

Phase A 的 exit gate：三個 reference modules 都能只透過 public Game SDK 完成；直接結果被 protected affordance 阻擋；module dispose 能清理資源；第二個 module 能引用第一個 artifact。達成後停止擴充 harness。

### Phase B：Generative compiler

- `GEN-1`：自由語言只能進入真正的模型路徑；模型產物必須包含新生成的 module source code，不能只是挑 reference ID。
- `GEN-2`：一次 utterance 可以編譯成一個 `SpellBundle`，其中包含一到多個 atomic modules。
- `GEN-3`：action 決定 module 數量；reference 與 constraint 不應被誤算成另一個 module。
- `GEN-4`：多個 modules 必須顯式描述順序或 dependency，後一個 module 可以引用前一個 artifact。
- `GEN-5`：模型輸出需經 syntax check、capability validation、load 與最多一次自動修復；失敗時 rollback，不回退成關鍵字技能選擇。
- `GEN-6`：驗收必須包含未寫入 reference harness 的 utterances 與 mechanics。

### Generated source ABI

- 每個 `source` 是一個 JavaScript expression；求值結果必須是一個 `MechanicModuleFactory`，不是 TypeScript、ES module、JSON、markdown code fence 或一段會在頂層直接改世界的 script。
- Factory 只接收該 module 在 `dependsOn` 宣告的唯讀 artifact bindings，並回傳一個符合 public `MechanicModule` lifecycle 的物件。
- `GameContext` 只在 Host 呼叫 `module.setup(context)` 時提供。Generated source 不會拿到 `GameWorld`、renderer、DOM、API key 或其他 Host internals。
- Bundle executor 依陣列順序 instantiate／load modules，將前一個 module 的實際 `SpellArtifact` 綁到後一個 module 宣告的 dependency ID。
- Bundle 是一個執行單位：任一 factory、shape validation 或 `setup` 失敗時，必須按相反順序 dispose 這次 bundle 已載入的 modules，不能留下半套世界修改。
- 同 realm loader 只能驗證 source ABI、capability surface 與 rollback，不是 security sandbox；此限制沿用 Decision 0001，不得在成果中宣稱已安全執行不受信任程式碼。

概念介面：

```ts
type DependencyBindings = Readonly<Record<string, SpellArtifact>>;
type MechanicModuleFactory = (dependencies: DependencyBindings) => MechanicModule;
```

單一 module source 範例：

```js
(dependencies) => ({
  label: "Orbit hostile projectiles",
  tags: ["gravity", "projectile-control"],
  setup(context) {
    // Query and affect the world only through context.
  },
  update(deltaSeconds) {},
  dispose() {},
})
```

例子：

```text
「在剛才那道牆裡燃起一場火」
→ 一個 fire module；牆是 reference

「生成一道牆，然後在裡面放火」
→ enclosure module
→ fire module，dependsOn enclosure artifact

「用火焰構成一道牆」
→ 可能是一個複合 mechanic；不得只因同時出現「火」與「牆」就武斷拆成兩招
```

生成式 UI 可以在完成編譯後顯示「正在寫第 1／2 句」等執行狀態，但不要求玩家逐招確認，也不顯示模型私有推理內容。

## 明確禁止的捷徑

- `if utterance.includes("火")` 選擇手寫 FireModule；
- 用關鍵字優先序處理 action／reference 歧義；
- 為 eval 失敗句子增加 regex 特例；
- 把模型只用來輸出 `wall | fire | key` 類別，卻宣稱是現場生成機制；
- 模型失敗後靜默切換成手寫技能，讓 demo 看不出 fallback。

## 對現有決策的關係

本決定不推翻 Decision 0001 的 web stack 或同 realm technical spike。它補足 reference modules 與 generated code 之間原本沒有寫清楚的 implementation gate，並強化 `game-sdk.md` 已有的「reference module 不得成為 prompt 對應技能」要求。
