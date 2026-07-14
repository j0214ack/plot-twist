# The Unwritten Spell／未寫之咒

> 一個沒有手的施法者，只能說出願望；一支活著的羽毛筆，會把他的話現場寫成新的遊戲機制。

狀態：Playable technical spike（Generative compiler 已接通）

更新日期：2026-07-14

## 要驗證的核心命題

玩家能否透過語音等非結構化輸入，讓 AI 在正在運行的 3D 遊戲中現場生成程式碼，產生一個原本不存在、可以立即操作、可以和既有世界互動，而且足以讓觀眾感到驚喜的新機制？

這個 PoC 不把 AI 限縮成從技能表選擇能力，也不只讓 AI 輸出 `Trigger → Effect` 規則。AI 的主要產物是可以 hot-load 的遊戲程式；穩定的 Game Host 則提供世界、物理、事件與安全邊界。

本方向刻意探索與既有 [RFC 0002](../../docs/rfcs/0002-hackathon-strategy.md) 中「不自由生成任意遊戲程式碼」不同的假設。它目前只是團隊成員的獨立 PoC，不代表舊 RFC 已被全隊正式推翻。

## 一句話體驗

> 說出一個世界裡原本不存在的魔法，在 AI 書寫它的期間閃躲攻擊，然後親眼看它成為可以玩的新規則。

## 故事設定

世界由不可任意改寫的《法典》維持。玩家曾是書寫者，但現在沒有雙手，無法拾取、開門、操作機關或普通攻擊；他只能行走、閃躲、指向目標並開口詠唱。

陪伴玩家的是一支活著的羽毛筆，暫稱「旁註」。玩家提出意圖，旁註把語言編譯成魔法，法典負責拒絕非法結果與執行世界規則。

旁註不是聊天助手，也不替玩家解題。它預設保持安靜，以書寫、墨跡、動作和短音效呈現生成狀態；只有在法術被縮減、失敗、遭法典拒絕或產生值得注意的意外時，才用一句文字或聲音補充實際發生了什麼。

## 核心循環

```text
玩家看見困境
  → 指向目標並自由詠唱
  → AI 生成、驗證並載入程式碼
  → 玩家在詠唱期間以較慢速度閃躲
  → 法術依目前世界與法力實際具現
  → 世界模擬後果
  → 旁註只在必要時解釋或吐槽結果
  → 玩家根據結果修改下一次說法
```

目前不做施法前的效果預覽、精確 Mana 估價或逐次確認。玩家只看得到當下法力，並透過實際結果逐漸理解這個世界如何解讀自己的話。

## 第一個完整情境

玩家被關在房間裡。守衛擋在上鎖的出口與傳送陣前，唯一能開門的鑰匙在守衛身上。守衛倒下後，鑰匙才會成為世界中的可互動物件。

### 正規但開放的解法

1. 玩家說：「把守衛關起來。」
2. AI 生成一道環繞守衛的牆；玩家在生成期間閃躲。
3. 玩家說：「在剛才那道牆裡放一把火。」
4. 第二個法術引用第一次生成的 enclosure；火焰透過正常傷害規則慢慢消耗守衛 HP。
5. 守衛倒下，鑰匙掉在仍然燃燒或封閉的空間裡。
6. 玩家說：「鑰匙，去你該去的地方。」
7. AI 生成鑰匙的移動行為；鑰匙進入鎖孔後，由門的既有規則完成解鎖。

「牆＋火」不是漏洞。若能力透過世界中可觀察、可反應、可能失敗的因果鏈達成結果，它就是本 PoC 想驗證的 emergent gameplay。真正要防的是 generated code 直接把 `guardian.hp` 設為零或把關卡標成完成。

### 隱藏解法／第二個驗證情境

1. 玩家指著側牆說：「這裡應該要有一個房間。」
2. AI 生成一個永久 `WorldPatch`，新增房間與入口。
3. 玩家進入新房間，再說：「把這個房間連到傳送陣所在的房間。」
4. 第二個 `WorldPatch` 讀取第一次新增的空間，產生通道並繞過守衛。

這條路徑需要可持續的空間 topology、跨法術指涉與可 rollback 的永久修改，技術風險高於「牆＋火」，因此不是第一個 technical spike 的 critical path。

## 已收斂的設計決定

- 整體故事與關卡困境是 baked；解法與當下能力可以即時生成。
- AI 生成真正的程式碼，不只選擇模板或填寫規則 DSL。
- Generated code 透過 Game SDK 作用於世界，不取得完整引擎或受保護狀態的直接存取權。
- 玩家沒有手；所有會改變世界的行動都必須透過詠唱完成。
- 玩家可以正常移動、瞄準與閃躲。
- 戰鬥本身承擔生成等待期間的操作，不另外製作節奏遊戲。
- 詠唱期間移動較慢；持續性效果需要專注，專注也可能降低移動速度。
- 魔法可以創造原因，不能直接宣告受保護的結果。
- 不做每次施法前的聊天確認、效果預覽或精確 Mana 預估。
- 法力成本由 Game SDK 對實際執行結果計量，而不是只相信模型文字或 generated code 自報。
- 旁註預設不說話；它根據實際結果提供稀疏、情境式的說明。

## 文件

- [體驗與魔法系統](design.md)
- [World Model 與 Game SDK v0](game-sdk.md)
- [PoC 驗證與實作計畫](validation-plan.md)
- [STT 模型候選研究](stt-model-candidates.md)
- [後續功能筆記：已學會的咒語 Artifact](learned-spell-artifacts.md)
- [Public demo access session 與部署邊界](decisions/0005-access-gated-public-demo.md)
- [因果互動、接觸與動態尋路](decisions/0006-causal-interaction-navigation.md)
- [MechanicModule 邊界與 first-class locomotion](decisions/0007-mechanic-module-boundary-and-locomotion.md)
- [Mobile presentation 與 PWA shell](decisions/0008-mobile-presentation-and-pwa-shell.md)
- [Best-effort 咒語事件紀錄](decisions/0009-best-effort-spell-event-log.md)

## 執行 playable spike

需求：Node.js、npm，以及一把只放在本機 server 的 OpenAI API key。

```bash
cp .env.example .env.local
# 編輯 .env.local，填入 OPENAI_API_KEY；不要使用 VITE_ 前綴
npm install
npm run dev
```

開啟 `http://127.0.0.1:5173`。預設畫面使用真正的 generative compiler：原始 utterance 與 scene snapshot 送到本機 `/api/spells`，由 server 透過 OpenAI Responses API 取得 structured `SpellBundle`；瀏覽器只收到 generated source，不會取得 API key。

桌面按住 `V`（或畫面上的「按住說話」按鈕）即可用麥克風詠唱，說完放開後會經本機 `/api/transcriptions` 轉成文字並直接施放。第一次使用時需允許瀏覽器麥克風權限；權限視窗若中斷原本的按壓，依旁註提示重新按住一次即可。Playable demo 預設使用 `gpt-4o-transcribe`；桌面若無法錄音仍可使用文字輸入。手機 presentation 為 landscape only，只保留左下 virtual joystick 與右下 push-to-talk，不提供遊戲內文字輸入；完整邊界見 [Decision 0008](decisions/0008-mobile-presentation-and-pwa-shell.md)。API key 在語音流程中同樣只存在 server。

```bash
npm test       # deterministic pipeline／Game SDK／rollback
npm run build  # TypeScript 與 production bundle
npm run eval:live
```

`eval:live` 使用真實模型與未寫入 reference harness 的 prompt，結果輸出到 ignored 的 `evals/results/`。它不是 unit test：模型輸出不比對固定 source，而是實際載入、執行並觀察產生與移動的 entity。

## Public playable preview

公開 preview 以同源 Fly app 提供靜態遊戲與兩個模型 API。`OPENAI_API_KEY`、`DEMO_SESSION_SECRET` 與活動前使用的 `DEMO_ACCESS_CODE` 必須存成 hosting secrets；正式 origin 由 `ALLOWED_ORIGIN` 設定。設定 access code 時，玩家先解鎖一次並取得短效 HttpOnly session；Demo Day 移除 `DEMO_ACCESS_CODE` 後，頁面會自動取得 anonymous demo session，模型 API 仍保留 exact-origin 與 signed-session 驗證。完整邊界見 [Decision 0005](decisions/0005-access-gated-public-demo.md)。

- Playable URL：<https://plot-twist-unwritten-spell.fly.dev/>
- 活動前的 access code 只透過團隊私訊分享，不提交至 Git 或前端 bundle。
- Demo Day 切換成免輸入模式：`flyctl secrets unset DEMO_ACCESS_CODE --app plot-twist-unwritten-spell`。不需要修改或重新 build runtime code。
- 每次真正送進 generative compiler 的咒語會以單行 JSON 寫入 server stdout；可用 Fly Dashboard 的 Search logs 或 `fly logs` 回看。這是允許少量遺失、保留期有限的 playtest 紀錄，不保存原始音檔、場景或 generated source；完整邊界見 [Decision 0009](decisions/0009-best-effort-spell-event-log.md)。

## 第一筆 live Eval 證據

2026-07-14 以 `gpt-5.6` 測試「召喚三顆紫色的小月亮，排成三角形繞著守衛移動」：

- 16.6 秒取得一個新生成的 module；
- module 實際生成 3 個紫色 sphere；
- 模擬 3 秒後 3 個 entity 都有移動；
- source 使用 120° phase、守衛中心與 orbit target，保留三角形／環繞語意；
- 沒有使用 `window`、`fetch`、timer 等未宣告 global；
- 同一流程已在 Arc 中由輸入框端到端驗證。

這只通過第一個 H1 case，不代表模型已在所有 utterance 上可靠。後續仍需要多 action、reference／constraint、protected outcome、跨法術 dependency 與 latency 的 eval set。

## 隕石 regression 證據

2026-07-14 針對「放隕石砸下來，對守衛造成傷害」完成兩層驗證：

- `gpt-4o-transcribe` 對合成繁中音訊輸出完整原句，約 0.79 秒；
- 補強 source ABI 後，Fast profile（Luna + low）連續三次約 4.8–5.9 秒生成一個新 module；
- 三次 module 都從守衛上方生成隕石，以 3D `moveToward` 墜落，抵達後透過 `combat.damage` 造成 30–35 傷害；
- 每次 simulation 都觀察到 1 個生成物、1 個移動物件與實際 HP 下降，三次 live Eval 皆通過。

合成音訊不是現場噪音下的最終語音品質保證；仍需用隊員的麥克風做人工 playtest。

## 暫不處理

- 任意生成完整遊戲或完整 genre。
- Production 等級的任意程式碼 sandbox。
- 大量即時生成 3D mesh、動畫或影片。
- 完整角色成長、裝備、技能樹與數值平衡。
- 多種敵人、長關卡與多人遊戲。
- 把旁註做成會持續對話或主動提示解法的助手。
