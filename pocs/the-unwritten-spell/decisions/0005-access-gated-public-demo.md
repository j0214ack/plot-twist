# Decision 0005：Public demo access session 與部署邊界

狀態：Accepted for PoC

日期：2026-07-14

## 問題

Playable spike 需要暫時公開給隊友與評審試玩，但 `/api/spells` 與 `/api/transcriptions` 會消耗伺服器端的 OpenAI 額度。只檢查 CORS 或 `Origin` 無法驗證非瀏覽器 client；要求每位玩家建立帳號又會破壞黑客松 demo 的進入節奏。

## 名詞

- **Demo session**：由 server 簽發、具完整性與期限的短期 session。它授權持有者使用本次 demo API，但不代表真實使用者身分。
- **Access-gated mode**：設定 `DEMO_ACCESS_CODE` 時，玩家先輸入共用 access code，成功後才取得 demo session。
- **Anonymous mode**：未設定 `DEMO_ACCESS_CODE` 時，正式遊戲頁會自動取得 demo session，不要求玩家輸入資料。
- **Allowed origin**：唯一允許啟動瀏覽器 API request 的完整 origin，由 `ALLOWED_ORIGIN` 設定。

## 考慮過的選項

### 直接公開 API

Moving parts 最少，但任何人都能繞過遊戲直接消耗模型額度，因此不採用。

### 永久要求 access code

能阻擋偶然流量與直接濫用，但 Demo Day 會增加評審與現場玩家的摩擦，因此只作為活動前的暫時模式。

### 可切換的 demo session

API 永遠要求 server-issued session；活動前由 access code 換取 session，Demo Day 則自動簽發匿名 session。這保留同一個 API boundary，也不需要為展示當天修改程式碼。

## 決定

- `PUB-1`：`/api/spells` 與 `/api/transcriptions` 在呼叫 OpenAI 前，必須同時通過 exact-origin 檢查與 demo session 驗證。
- `PUB-2`：模型 API 的 browser request 缺少 `Origin`、origin 不等於 `ALLOWED_ORIGIN`、session 缺少／過期／簽章錯誤時，一律拒絕。
- `PUB-3`：若 request 包含 `Sec-Fetch-Site`，只接受 `same-origin`；此 header 是 browser defense-in-depth，不取代 session。
- `PUB-4`：設定 `DEMO_ACCESS_CODE` 時，session endpoint 只在 access code 正確時簽發 session；UI 在取得 session 前不得啟動遊戲或模型呼叫。
- `PUB-5`：未設定 `DEMO_ACCESS_CODE` 時，session endpoint 不要求 code，UI 自動 bootstrap session。Demo Day 只移除環境變數，不改 runtime code。
- `PUB-6`：session 使用 `DEMO_SESSION_SECRET` 簽章並包含期限。正式環境 cookie 使用 `Secure`、`HttpOnly`、`SameSite=Strict`、`Path=/`；session credential 不放在 localStorage、URL 或前端 bundle。
- `PUB-7`：`OPENAI_API_KEY`、`DEMO_ACCESS_CODE` 與 `DEMO_SESSION_SECRET` 只存在 server environment／hosting secret store，不使用 `VITE_` 前綴。
- `PUB-8`：目前不新增會被正常玩家感受到的施法次數 quota。一次 utterance 是一次 `/api/spells` request；其 `SpellBundle` 可以包含一到多個 generated modules，不按 module 數量重複計次。
- `PUB-9`：session、origin、method、content type 與 payload validation 都必須在任何 OpenAI 呼叫之前完成。
- `PUB-10`：Fly.io 是本次短期 playable deployment 的 host，沿用同源前端與 Node/Vite API middleware。這不是 production hosting 標準；PoC 結束後若繼續公開，再把 preview server 換成正式 Node server。

## 安全邊界

Demo session 能阻擋沒有 session 的裸 API request、跨站 browser request 與 session 竄改。它不能證明 request 一定由本專案 JavaScript 發出；持有 access code 的人仍可模擬 client。這是黑客松 PoC 的成本與摩擦折衷，不得宣稱為 production authentication 或 bot protection。

## 暫不處理

- 個人帳號、OAuth、email allowlist 或評審身分管理。
- CAPTCHA、device attestation、WAF 或 production abuse detection。
- Redis／distributed rate limit 與跨 Machine session store。
- 長期 production server、資料庫或持久 session revocation list。

## 對既有決策的關係

不改變 Decisions 0001–0004 的 Game SDK、generated source ABI、生成 profile 或 push-to-talk transport。它只在既有兩個同源模型 API 前增加公開 demo 的 transport authorization boundary。

