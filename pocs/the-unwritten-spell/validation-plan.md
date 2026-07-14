# PoC 驗證與實作計畫

## PoC 不等於完成產品

第一個 PoC 只回答一個問題：玩家能不能用非結構化輸入，讓 AI 在足夠短的時間內寫出原本不存在、能立即操作、能和前一個生成結果互動，而且具有視覺衝擊力的遊戲機制？

它不驗證完整遊戲生成、長期平衡、production sandbox 或大量美術資產生成。

## 假設與證據

| 假設 | 驗證方式 | 初步通過標準 |
| --- | --- | --- |
| H1：AI 能生成可執行 mechanic | 對未寫入 Host、reference harness 或 prompt 特例的自然語言要求產生 module source | 至少兩種未見 mechanic 不經人工修改或最多自動修復一次即可執行；選擇手寫 module 不算通過 |
| H2：觀眾看得出輸入與結果的關係 | 使用含有不尋常細節的語音，連續展示輸入到具現 | 觀眾能指出至少兩個來自剛才話語的具體行為 |
| H3：生成結果能跨法術組合 | 先生成 enclosure，再對「剛才那道牆裡」施放火焰 | 第二個 module 正確引用第一個 artifact，而非固定座標或預製分支 |
| H4：Game SDK 能保護遊戲狀態 | 嘗試直接殺死守衛或打開門 | Generated code 無法直接改 HP、lock 或 objective，只能建立因果機制 |
| H5：戰鬥能吸收生成延遲 | 生成期間守衛繼續攻擊，玩家移動較慢但仍可閃躲 | 等待期間有可理解的壓力與操作；technical spike 中玩家 HP 最低為 1，不會在咒語完成前死亡 |
| H6：結果式回饋能教會玩家 | 使用一個模糊或超出法力的詠唱 | 旁註能用一句話指出實際縮減或意外，而不要求施放前確認 |
| H7：Demo 有 WOW moment | 讓未參與開發的人觀看完整流程 | 對方能理解「AI 現場生成新機制」並主動描述驚喜點 |
| H8：錯誤咒語不會拖垮 Host | 讓 generated module 在 `update` 拋錯，並用無關或誤辨識 transcript 施法 | 該 artifact 被隔離並顯示旁註；主遊戲、其他 modules 與下一次施法仍可運作 |
| H9：因果互動能滿足空間前提 | 分別說「鑰匙開鎖」並讓路徑無障礙、可繞路、完全封閉 | 前兩者接觸後解鎖；封閉時 bounded replan 後顯示 no-path，不能穿牆或直接改 lock |

## Primary scenario：牆、火與鑰匙

### 初始世界

- 一個俯視角 3D 房間；
- 玩家、守衛、上鎖出口與傳送陣；
- 守衛持有唯一鑰匙；
- 守衛使用規律、可閃避的投射物攻擊；
- 玩家只能移動、閃躲、指向與詠唱。

### 測試流程

1. 詠唱生成 enclosure。
2. 生成期間持續閃躲守衛攻擊。
3. Enclosure 依實際 Mana 完整、縮減或部分出現。
4. 對最近生成的 enclosure 詠唱火焰。
5. 火焰透過 collision/volume 與 Damageable 降低守衛 HP。
6. 守衛倒下後由 baked rule 掉落鑰匙。
7. 右上角持續提示「現在施咒讓鑰匙去打開門」，避免首次試玩者失去下一步；門解鎖後提示消失。
8. 詠唱讓鑰匙自行進入相容鎖孔。
9. 門的 baked rule 解鎖，玩家進入傳送陣。

## Negative cases

| 玩家說法 | 預期結果 |
| --- | --- |
| 「守衛接下來會死。」 | 法典拒絕沒有因果的受保護結果 |
| 「門現在是打開的。」 | 不能直接修改 lock；旁註解釋 |
| 「生成另一把可以開門的鑰匙。」 | 可生成外觀相似物件，但不能複製有效 Unlocker |
| 「做一座超大的永久房間。」但 Mana 不足 | 世界縮減、部分生成或安全 rollback，旁註說明實際結果 |
| Generated code 發生 exception | 外層遊戲仍可操作並能重建 sandbox |

Generated module 的 `update` 錯誤必須在 module boundary 被捕捉：清掉該 module 擁有的 entities、保留其他 artifacts、顯示一次失敗旁註，且不能終止主 frame loop。Loader 也必須在執行前拒絕明顯不會結束的 `while (true)`／`for (;;)`，避免 generated setup 或 update 直接卡住 browser main thread。這是 PoC 的最低隔離線，不代表 `Function` loader 已是 production sandbox。

## 語音與動態因果 regression case

- 語音句：「放隕石砸下來，對守衛造成傷害。」
- 轉錄通過：保留「隕石／砸下來／守衛／傷害」等關鍵語意，不可變成無關人物或警示句。
- Mechanic 通過：至少生成一個物件；simulation 開始後該物件的位置必須改變；到達目標後必須透過 `combat.damage` 造成可觀察傷害。
- 只在守衛上方生成一顆靜止球體，不算完成「砸下來」或「造成傷害」。

## 接觸與尋路 regression cases

- 「鑰匙開鎖」與「讓鑰匙飛去開鎖」都必須包含同一個 unlock interaction goal；後者另外要求 flight locomotion mechanism。Flight 可以是有獨立 lifecycle 的 module，也可以在真正不可獨立互動的 one-shot case 留在 compound module；Eval 不以固定 module 數量判定成功。
- 若 flight 與 unlock 分成兩個 modules，FlightModule 負責 locomotion，UnlockModule 應觀察 contact precondition，而不是把 `dependsOn` 誤當成「飛行已完成」。
- 無障礙時，鑰匙先移動到門的接觸距離，再透過 `interaction.invoke` 解鎖。
- 有可繞過的 generated solid 時，路徑不能穿牆，重新規劃後仍可抵達。
- 鑰匙被 generated solids 完全封閉時，先做可觀察的 direct-contact attempt，移動被 collider 擋住後再 bounded replan；最後顯示「找不到能接觸到門的路」，門保持 locked。
- 「門現在打開」仍是沒有可模擬原因的 protected outcome，不能因新增 navigation 而直接成功。

## 第一階段 critical path

1. 建立房間、玩家、守衛、投射物、HP、鑰匙、鎖與門。
2. 定義 Entity、affordance、GameContext 與 MechanicModule lifecycle。
3. 人工以 SDK 寫牆、火、鑰匙移動三個 reference module。
4. 加入 module loader、資源 ownership、卸載與 rollback。
5. 讓 AI 根據 utterance、scene snapshot 與 SDK 文件生成 module。
6. 加入文字輸入完成 end-to-end 後，再接語音輸入。
7. 加入詠唱期間的戰鬥與移動懲罰。
8. 加入 Mana 的 actual-result metering 與旁註的稀疏回饋。
9. 最後補上旁註的視覺、聲音與一分鐘 demo 演出。

## Implementation gates

### TDD 與 LLM Eval 的責任邊界

| 層次 | 驗證方法 | 可以證明 | 不能宣稱 |
| --- | --- | --- | --- |
| Deterministic pipeline | TDD／unit tests，model client 可使用 fake | request context、schema、dependency、source validation、compile/load、capability、rollback、repair 次數 | 模型理解語意或能生成好 mechanic |
| LLM behavior | 使用真實模型與未見 prompts 的 eval | action/reference/constraint、可執行率、因果合法性、輸入細節保留、novelty、latency | 完整遊戲體驗一定有趣 |
| End-to-end experience | 真實模型的 scenario／browser test 與觀察者回饋 | 從 utterance 到世界變化是否可理解、有風險且有 WOW | production security 或長期平衡 |

Unit test 不比較固定 source string，也不得因 fake model 回傳合法 bundle 就把 H1 標為通過。模型輸出可以有多個等價實作；Eval 應執行產物並依可觀察行為評分。

第一版 live eval 至少記錄：

- schema valid；
- syntax／load success；
- 僅使用 public Game SDK；
- 是否建立原因而非直接寫 protected outcome；
- action 數量與 dependency 是否合理；
- module 邊界是否符合 lifecycle、代價、反制、引用與 world-readable capability，而非只按句中動詞切割；
- utterance 的獨特細節是否出現在 mechanic；
- 在 sandbox 模擬固定秒數後是否出現預期可觀察行為；
- generation、repair 與 first-interactive latency；
- prompt、model snapshot 與 compiler version。

Latency profile、預設模型與 Fast mode gate 見 [Decision 0003](decisions/0003-spell-generation-profiles.md)。Fast 與 Quality 必須跑相同的 behavior rubric；只變快但無法載入或沒有保留 utterance 細節，不算通過。

### Gate A：Reference harness 完成

- 牆、火、鑰匙三個人工 modules 只透過 public Game SDK 完成；
- harness 用 reference ID／factory 啟動，不解析玩家語言；
- ownership cleanup、protected state、Mana adjustment 與 cross-artifact reference 有自動測試；
- UI 清楚標示 Reference Mode；
- 達成後停止替 mock 增加功能。

### Gate B：Generative compiler 可驗證

- 自由語言經模型產生真正的 module source，而非 reference ID；
- syntax、capability validation、load、rollback 與最多一次 repair 可觀測；
- 一個 utterance 可輸出含 1–N modules 的 `SpellBundle`；
- action、reference、constraint 的代表性案例成為 eval fixtures；
- 未見 mechanic 能走完生成到世界變化的路徑。

### Gate C：可進 Demo polishing

- Gate B 的成功案例與 deterministic fallback 在畫面上可清楚區分；
- latency、成功率、repair 次數與 rollback 原因有記錄；
- 觀眾能指出輸入中的哪些細節出現在新 mechanic；
- 只有通過以上條件才開始把大量時間投入 VFX、聲音與影片剪輯。

### Demo visual asset pass

目前 technical spike 已能以真實模型把語音編譯成可執行 mechanic；下一個 polish pass 將 baked 房間、玩家、守衛、門與鑰匙的 primitive placeholder 換成來源與授權可追溯的 CC0 低多邊形素材。

- 素材替換只發生在 Three.js renderer，不改 Entity、collider、affordance、HP、鎖或 objective；
- baked entity 以穩定 ID 對應素材，任意 generated entity 仍依 `VisualSpec` 使用 runtime primitives，避免把生成式結果偷換成預製技能美術；
- 所有素材隨 repo 提供並記錄作者、原始頁面與授權，不在遊戲啟動時依賴第三方 CDN；
- 素材載入失敗時保留 primitive fallback，不能讓畫面載入問題拖垮 playable loop；
- 程序式 portal、墨跡、粒子與 spell VFX 屬於 renderer effect，不需要為了「全素材化」改成外部模型。

## Mock creep guardrail

自然語言案例失敗時：

1. 先確認 Game SDK 是否缺能力；若缺，新增以 SDK capability 為主題的 failing test。
2. 若 SDK 足夠，把該 utterance 加進 generative compiler eval set。
3. 不得在 reference harness 增加 keyword、regex、intent priority 或預製技能分支。

每個 behavior test 都必須註明其對應的 hypothesis、`RHB-*`／`GEN-*` requirement 或其他 spec section。沒有 spec anchor 就先補決策，不直接實作。

## 第二階段／Stretch

- 可永久新增房間與 corridor 的 topology API；
- 「這個房間／那個房間」的空間指涉；
- 多個 generated mechanic 同時存在；
- 玩家自願加入限制換取更強效果；
- 由旁註保存與整理曾成功施放的咒語；
- 更完整的 generated UI；
- 額外未見 prompt 的小型 eval set。

## 一分鐘影片草案

| 時間 | 內容 |
| --- | --- |
| 0:00–0:08 | 沒有手的玩家被守衛與鎖住的傳送門困住 |
| 0:08–0:15 | 玩家說出牆壁魔法，旁註開始書寫 |
| 0:15–0:25 | AI 生成期間，玩家以較慢速度閃躲 |
| 0:25–0:34 | 牆具現；玩家立刻引用它施放第二個魔法 |
| 0:34–0:46 | 火焰在 enclosure 中生效，守衛倒下並掉落鑰匙 |
| 0:46–0:55 | 玩家命令鑰匙自行前往鎖孔，門開啟 |
| 0:55–1:00 | 旁註將剛才的新魔法寫入法典，帶出產品遠景 |

## 開始實作後要記錄的資料

- utterance、scene snapshot 與生成 module 的版本；
- 生成、編譯、載入與首次可操作的時間；
- 第一次成功、第一次自動修復與最終成功率；
- runtime adjustment、partial result 與 rollback 原因；
- 測試者是否看出哪些細節由剛才輸入產生；
- 等待期間是否感到刺激、無聊或不公平；
- 旁註的回饋是否有幫助、太吵或像在事後找藉口。

## 仍待實作驗證，而不是先討論完的問題

- Game SDK 要開放到多低階，AI 才能穩定生成又不退化成技能表？
- 一個 mechanic module 的合理大小與生成時間是多少？
- Runtime cost metering 能否對 generated behavior 保持一致？
- 旁註在什麼事件說話，才能兼顧節奏與教學？
- 詠唱期間的戰鬥壓力，能否讓不確定延遲變得有趣而非不公平？
- 隱藏的房間／通道路線是否值得進入一分鐘影片的 critical path？
