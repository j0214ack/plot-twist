# 後續功能筆記：已學會的咒語 Artifact

狀態：Idea only — 本次先記錄，不實作

## 核心想法

一次咒語經 AI 成功生成、驗證並執行後，可以保存成玩家「已學會」的 artifact。之後使用同一招時，直接重新 instantiate 已驗證的 `SpellBundle`，不再呼叫模型。

這會同時降低：

- 重複施法的等待時間；
- 相同能力反覆 code generation 的 API 成本；
- 同一招每次生成結果不同造成的不確定性。

它不應被偽裝成新的生成。UI 必須清楚區分「正在現寫新咒語」與「重施已學會的咒語」。

## 語意檢索與重施路徑

新 utterance 進來時，可以先用 embedding 找出語意最接近的已驗證咒語，但「找到相近結果」不等於一定能直接執行。建議分成三條明確路徑：

```text
新 utterance + 當前場景摘要
  → semantic top-K retrieval
  → reuse gate
      同一 mechanic，且場景／依賴相容 → Recast：直接 instantiate 已驗證 bundle
      只有部分相似                 → Retrieve：當作生成範例，再由模型改寫
      相似度不足                   → Generate：從零生成
```

例如「讓三顆月亮繞著守衛轉」與「召喚三顆紫色小月亮環繞守衛」可能適合 Recast 並替換參數；「讓三顆月亮砸向守衛」雖然名詞高度相似，因果卻完全不同，只能 Generate 或 Retrieve 後重新生成。

每筆可檢索 artifact 至少要保存：

- 原始 utterance 與正規化後的 mechanic／因果摘要；
- embedding、capability／affordance signature 與可替換參數；
- 已通過驗證的 `SpellBundle`、source hash 與 artifact dependencies；
- SDK／compiler 版本、provenance 與 Eval／執行成功紀錄；
- 適用的場景條件，例如需要的 target tags、空間關係與材質能力。

直接重施的 false positive 比漏掉一次可重施機會更危險。語音誤辨識、過期 entity ID、缺少前置 artifact、SDK 版本不相容，或「環繞／撞擊」這類因果差異，都必須讓 reuse gate 拒絕直接執行。

PoC 初期不需要向量資料庫；用 JSON／SQLite 加 in-memory cosine search 就足以驗證。第一組 Eval 可以準備 20 組應重施的 paraphrase、10 組名詞相似但因果不同的 hard negatives，主要觀察直接重施誤判率、節省的 latency 與 API 成本。

這個 Recast path 會替自由語言增加一條不產生新 source 的執行路徑，因此實作前必須新增或更新決策紀錄，清楚標示它與 [Decision 0002 的 `GEN-1`](decisions/0002-reference-harness-boundary.md) 不同；不能把 cache hit 偽裝成現場生成，也不能靜默把未通過 reuse gate 的輸入送進手寫技能。

## 為什麼不能免費無限重施

若最強法術只需生成一次便能零代價永久使用，最合理的玩法會退化成先生成萬用解，再也不碰 generative loop。這同時破壞遊戲平衡與產品核心體驗。

可探索的代價軸：

- 每次重施仍支付依實際結果計量的 Mana；
- 已學會咒語占有限的記憶／法典欄位；
- 強力咒語需要 cooldown、專注、材料或有限 charges；
- 世界或目標改變時，舊 artifact 可能需要重新編譯；
- 保存的是通過 capability validation 的 bundle 與 provenance，不是任意 source 字串。

## 尚待驗證

- 玩家想保存的是原始 utterance、生成程式、參數化 mechanic，還是三者一起？
- 相同法術改目標、顏色、範圍時算重施、參數調整，還是一次新生成？
- 重施成本應鼓勵建立個人 spellbook，但不能讓最佳策略變成完全避開 AI。
- Game SDK 版本變更後，舊 artifact 如何 migration、失效或重新驗證？

在上述問題收斂前，不進入目前 technical spike 的 implementation scope。
