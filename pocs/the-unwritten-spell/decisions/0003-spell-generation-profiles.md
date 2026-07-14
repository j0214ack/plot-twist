# Decision 0003：Spell generation profiles

狀態：Accepted for PoC

日期：2026-07-14

## 問題

第一個 `gpt-5.6`／medium reasoning live Eval 花費 16.6 秒。這段時間雖可由戰鬥吸收，但已長到玩家可能在第一個咒語完成前失去耐心；只改善等待演出不能解決真正的 first-interactive latency。

## 共同假設

PoC 仍要求模型輸出真正的 `MechanicModule` source，而不是把 Fast mode 偷換成技能選擇、規則 DSL 或預先生成內容。每個 profile 都必須使用相同的未見 prompt Eval，不能只以延遲判定成功。

## 考慮過的選項

### 不新增模式，只保留 Sol／medium

結構最少、目前已有一筆成功證據，但 16 秒不適合反覆試玩的核心循環，因此不採用。

### 兩階段 plan → code

可先顯示 plan，但多一次 sequential model round trip；除非第一階段能直接形成可玩的部分結果，否則會增加真正延遲，因此不採用。

### Streaming generated source

可以提早顯示真實輸出進度，但不完整 JavaScript 不能安全載入；它改善等待感，不改善 mechanic 首次可操作時間，因此不是 Fast mode 的核心。

### Request profiles

保留一條 compiler／schema／runtime，只替換 model、reasoning effort 與可選 service tier。這是可逆、可量測且 moving parts 最少的方案。

## 決定

- `fast` 是 playable spike 預設：`gpt-5.6-luna` + reasoning effort `low`。
- `quality` 用於比較與困難案例：`gpt-5.6`（Sol alias）+ reasoning effort `medium`。
- `service_tier: priority` 僅由明確環境設定啟用，因為會增加成本；預設使用 standard tier。
- 可用環境變數覆寫 model／reasoning，方便 Eval；UI 不把 profile 偽裝成遊戲內魔法規則。
- Fast 失敗時必須顯示失敗。第一版不靜默 fallback 到 reference module，也不自動再呼叫 Quality，以免 latency、成本與成功來源不可觀測。
- 每筆 live Eval 記錄 mode、model、reasoning effort、service tier、latency 與可觀察行為。

初步 gate：簡單單一 mechanic 的 Fast mode 目標為 8 秒內完成，且仍通過 syntax／load、public SDK、輸入細節與 observable behavior rubric。這只是 PoC 目標，不是 production SLA。

## 初始 Eval 證據

- Luna／`none` 曾在 4.0 秒內回傳，但 source syntax invalid、無法載入，因此不採用為 playable 預設。
- Luna／`low` 的紫月軌道案例為 5.4 秒，生成 3 個 entity 且全部移動。
- Luna／`low` 的紫焰傷害案例為 6.5 秒，生成 1 個 damage source，3 秒模擬內對守衛造成 42 傷害。

這兩筆只證明目前代表案例可玩，後續仍應用更多未見 prompts 持續量測成功率。

## 對既有決策的關係

不推翻 Decisions 0001／0002。Source ABI、真實 code generation、reference harness 邊界與 same-realm limitation 全部不變。
