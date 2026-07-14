# 後續功能筆記：已學會的咒語 Artifact

狀態：Idea only — 本次先記錄，不實作

## 核心想法

一次咒語經 AI 成功生成、驗證並執行後，可以保存成玩家「已學會」的 artifact。之後使用同一招時，直接重新 instantiate 已驗證的 `SpellBundle`，不再呼叫模型。

這會同時降低：

- 重複施法的等待時間；
- 相同能力反覆 code generation 的 API 成本；
- 同一招每次生成結果不同造成的不確定性。

它不應被偽裝成新的生成。UI 必須清楚區分「正在現寫新咒語」與「重施已學會的咒語」。

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
