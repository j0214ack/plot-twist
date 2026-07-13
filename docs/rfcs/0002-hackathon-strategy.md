# RFC 0002：Hackathon 策略、OpenAI 能力與產品定位

> 狀態：Discussion
>
> 建立日期：2026-07-13
>
> 官方能力盤點日期：2026-07-13；API、模型與 deprecation 狀態在實作前需再次確認

## 摘要

這份 RFC 要回答兩個策略問題：

1. 如何讓作品與 OpenAI Build Week 的主題形成必要、可展示的連結，而不是只在背景呼叫一次模型？
2. 如何描述這個專案的價值，又不把它包裝成未經驗證的「敘事治療」或心理健康產品？

黑客松不是完整產品發表。優先順序應是：

1. 30 秒內看懂。
2. 有一個明確的 WOW／Magic Moment。
3. 評審能想像它在活動後如何擴張。

## 非目標與底線

- 不主打「敘事治療」、digital therapy、診斷、治療或療效。
- 不說 AI 找到了故事背後的心理真相。
- 不替故事中的第三人推測意圖。
- 不把內容安全分類器描述成心理健康安全系統。
- 不為了列出很多 OpenAI 能力，把每個 API 都塞進 live demo。

目前較安全且準確的類別是：

- 互動式敘事
- 創意表達工具
- playable perspective／可玩的觀點
- 將回憶翻譯成另一種媒介的引擎

## 對外包裝候選

### A. Playable Memories

> What if your memories were levels in a game?
>
> 如果你的回憶，本來就是一個可以玩的關卡呢？

優點：30 秒內有畫面，AI、遊戲與個人敘事的關係直覺。

風險：「回憶」可能包含高度私密或創傷內容，需要輸入邊界與隱私說明。

### B. Perspective Engine

> Turn a story into a perspective you can play.
>
> 把一段故事，變成一個可以親自走過的觀點。

優點：最貼近真正要驗證的 Story → Experience。

風險：概念較抽象，需要漂亮且清楚的畫面才能成立。

### C. Interactive Story Canvas

> Anyone can turn a lived moment into an interactive artwork.

優點：創作與普及價值清楚，避開健康產品宣稱。

風險：若互動機制不獨特，容易被理解為另一個內容生成器。

### 建議

黑客松 pitch 優先用 A 的 hook、B 的核心技術描述、C 的長期社會價值：

> 如果回憶是可以玩的關卡呢？PlotTwist 把一段故事轉成一個可以親自走過的觀點，讓任何人都能創作互動式的個人敘事。

這是提案，不是定案；團隊仍需確認「回憶」是否是希望承接的內容範圍。

## OpenAI／Codex 能力盤點

### P0：Responses API＋Structured Outputs

**用途**：把自然語言故事轉成受控的 `ExperienceSpec`，包括已知事件、使用者解讀、未知、候選張力、敘事鏡頭、模板與參數。

**為什麼適合**：Structured Outputs 能要求模型遵守 JSON Schema，比一般 JSON mode 更適合接 deterministic Renderer。官方目前建議 reasoning、tool-calling 與 multi-turn workflow 使用 Responses API。

**建議做法**：

- 以 `gpt-5.6` 作為品質基準，再用較低成本／低延遲型號做代表性 eval。
- schema 內保留 `known_events`、`user_interpretation`、`unknowns`，避免 AI 把推測偽裝成事實。
- 每次輸出都經使用者確認，再送進 Renderer。
- 為 10–20 個固定故事建立小型 eval set，記錄 resonance、過度推論、schema failure 與 latency。

**優先度**：核心、live demo 必要。

### P0：Codex 作為開發與驗證流程

**用途**：讓 Codex 實作模板、生成測試、執行視覺 QA、修復 regression、維護 schema／prompt eval，以及產生可重現的 build log。

**為什麼適合**：活動明確鼓勵使用 Codex。官方文件也提供 Codex CLI、非互動模式與 Codex SDK，可把 coding agent 納入 CI/CD 或內部工程 workflow。

**建議做法**：

- 把「完成」寫成機器可驗證條件：schema tests、範例故事 snapshot、瀏覽器 smoke test、public URL health check。
- 保存 prompt／schema 變更與 eval 結果，讓評審看見 Codex 不只是幫忙打字，而是推動可重現的迭代 loop。
- Hackathon 不必把 Codex SDK 塞進終端使用者 runtime；build process 本身就可以是清楚、可信的 Codex 使用案例。

**優先度**：核心開發流程；台上用一張簡圖或一個具體例子說清楚。

### P0：Moderation API

**用途**：對自由輸入的文字做第一層內容分類與 routing，例如自傷、威脅、暴力或其他不適合遊戲化的內容。

**能力**：`omni-moderation-latest` 接受文字與圖片，官方說明 moderation endpoint 可免費使用。

**限制**：分類結果只是應用政策的 signal，不應自動等同心理危機判斷，也不能取代人工設計、清楚出口或專業協助。

**優先度**：若 live demo 接受自由輸入則必要；若只用固定故事，仍需在產品遠景中說明。

### P1：Image API／GPT Image 2

**用途**：

- 產生 mood frame、場景背景、符號或 ending card。
- 依故事參數改變色彩與象徵，但不動核心遊戲規則。
- 以 reference image 保持已設計好的藝術方向。

**能力**：官方將 GPT Image 2 描述為目前的高品質圖片生成與編輯模型；Image API 可調整尺寸、品質與格式，Responses API 也能透過 image generation tool 產圖。

**風險**：live 生成會增加延遲與不穩定性；部分組織可能需要先完成 API Organization Verification。

**建議**：先用它製作或變形素材；只有延遲實測通過，才放進 live critical path。

### P1：Speech API

**用途**：根據 `ExperienceSpec` 生成短旁白、角色台詞或結尾問題，提升個人化與情緒完成度。

**能力**：官方 Text to Speech guide 目前以 `gpt-4o-mini-tts` 為例，支援語氣、速度、情緒範圍等控制，也支援串流播放。

**要求與限制**：

- 必須向使用者清楚揭露聲音由 AI 生成。
- 官方文件不同頁面的模型狀態可能更新不同步；實作前需在專案帳號確認可用 model ID。
- 聲音的戲劇性不能取代互動機制本身。

**優先度**：WOW layer；核心互動完成後再加。

### P2：Realtime API

**用途**：讓使用者用語音講故事，或用低延遲語音完成角色扮演。

**能力**：Realtime API 適合需要低延遲的 live audio；若只是生成一段旁白，官方建議使用 request-based audio API 即可。

**建議**：第一版不要用。只有在「即時對話本身就是核心互動」時才值得增加連線、狀態與音訊 UX 複雜度。

### P2／Spike only：Videos API／Sora 2

**用途候選**：

- 生成活動提交用的 1 分鐘 teaser 或過場素材。
- 從代表性畫面延伸短片，測試「回憶變關卡」的視覺語言。
- 作為輸出媒介比較實驗，不是遊戲 Renderer 的替代品。

**目前官方狀態**：

- Videos API 可程式化建立、延伸、編輯與管理影片。
- Sora 2 可由文字或圖片生成含同步音訊的影片。
- 生成是非同步 job，需要 polling 或 webhook；長片與高解析度延遲更高。
- **官方已公告 Videos API、`sora-2` 與 `sora-2-pro` 將於 2026-09-24 關閉。**

**策略結論**：可以做一次 time-boxed spike，但不要讓 live demo、核心產品敘事或長期架構依賴它。若使用，應預先生成並準備 fallback；實作前再次檢查官方 deprecation 與是否已有替代方案。

## 建議的 Demo 技術切面

```text
User Story
  → Moderation / Scope Gate
  → Responses API + Structured Outputs
  → User Confirmation
  → Deterministic Experience Renderer
  → Optional TTS / Image Layer
```

Codex 位於另一條 build loop：

```text
Experience Schema / Templates / Evals
  → Codex implements and tests
  → Browser smoke test + visual check
  → Failing case becomes regression fixture
  → Repeat
```

## 建議的黑客松取捨

### Live critical path

1. 一個故事輸入或固定案例。
2. 一次 Responses API call，回傳受 schema 約束的 ExperienceSpec。
3. 一個完成度高的 Renderer template。
4. 一次明確的 perspective shift。
5. deterministic fallback。

### 有時間再加

1. AI 旁白。
2. GPT Image 2 產生的 ending card 或 mood layer。
3. 第二、第三個模板。
4. 預先生成的 Sora teaser。

### 不做為核心

- 現場等待影片生成完成。
- 自由生成任意遊戲程式碼。
- 完整心理健康流程。
- 為了看起來「AI 很多」而加入沒有驗證價值的 agent orchestration。

## 評審可能問的問題

### 「這是不是敘事治療？」

建議回答：

> 不是。我們沒有提供診斷或治療，也不宣稱療效。這是一個互動式敘事與創意表達原型；它探索的是媒介如何讓人看見同一故事的不同觀點。

### 「AI 憑什麼說這是故事的核心？」

建議回答：

> AI 不宣告核心，只提出候選的張力與鏡頭。使用者會看到事件、自己的解讀、未知與 AI 推測是分開的，並在生成體驗前確認或修改。

### 「為什麼一定要用 AI？」

建議回答：

> 模板可以手工設計，但把任意自然語言故事即時轉成受控、可確認的 ExperienceSpec，需要模型理解語意、保留不確定性，並選擇適合的敘事與互動參數。AI 負責高層翻譯，Renderer 保證品質。

### 「你們怎麼對使用者心理健康負責？」

建議回答：

> 第一版刻意不定位為健康產品，限制輸入範圍，不處理危機內容、不替第三人猜動機，並讓使用者保有確認、修改、跳過與刪除的控制。若未來要進入健康領域，會先引入專業者、具親身經驗的參與者以及正式驗證。

## 本 RFC 需要的團隊決策

- [ ] 對外 hook 選 A、B、C，或提出新版本。
- [ ] 確認 Demo 是否接受現場自由故事。
- [ ] 決定唯一的 live Renderer template 與 Magic Moment。
- [ ] 決定是否加入 Speech API。
- [ ] 決定是否做最多半天的 Videos API spike；失敗即停止。
- [ ] 定義 Codex 在 build／eval loop 中可被展示的一個具體成果。
- [ ] 寫出不適合進入體驗的內容範圍與 fallback。

## 官方參考資料

- [Model guidance／GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Image generation／GPT Image](https://developers.openai.com/api/docs/guides/image-generation)
- [Text to speech](https://developers.openai.com/api/docs/guides/text-to-speech)
- [Realtime and audio](https://developers.openai.com/api/docs/guides/realtime)
- [Moderation](https://developers.openai.com/api/docs/guides/moderation)
- [Video generation with Sora](https://developers.openai.com/api/docs/guides/video-generation)
- [Codex SDK](https://developers.openai.com/codex/codex-sdk)
