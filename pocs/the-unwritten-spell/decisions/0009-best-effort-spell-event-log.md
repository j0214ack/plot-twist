# Decision 0009：Best-effort 咒語事件紀錄

狀態：Accepted for PoC

日期：2026-07-14

## 問題

隊員與測試玩家正在用自由文字與語音嘗試未預期的咒語。若 server 沒有留下原始 utterance，我們無法整理真實玩法、重現失敗案例，或建立下一輪 STT／生成模型 Eval。另一方面，這是五天內完成的黑客松 PoC；為了絕不漏失事件而新增資料庫、queue 或阻塞施法，成本高於目前需要。

## 考慮過的選項

### 不記錄，只靠玩家回報

Moving parts 最少，但會漏掉辨識錯誤與玩家說不清楚的原句，無法形成可重跑的 Eval，因此不採用。

### 寫入 Machine 本機檔案

實作容易，但 Fly Machine 的 root filesystem 是 ephemeral；deploy 或 restart 後可能消失。若掛 volume，還要新增基礎設施、單機 ownership 與備份考量，因此不採用。

### 寫入外部資料庫或 log service

可以長期保存與查詢，但會新增 credential、schema、失敗重試與營運成本。PoC 目前只需要回看最近幾天的咒語，因此延後。

### Structured stdout

每次有效的 `/api/spells` request 完成或失敗後，輸出一行 JSON。Fly 會收集 app stdout，現階段提供七天的 searchable logs。允許少量事件遺失，logger 失敗也不能使施法失敗。

## 決定

- `LOG-1`：每個通過 transport validation、實際進入 generative compiler 的 utterance，成功或失敗都 best-effort 記錄一次。
- `LOG-2`：event 至少包含固定 event name／version、server timestamp、原始 utterance、focused entity、結果、compiler latency；成功時包含 module count，失敗時包含 bounded error message。
- `LOG-3`：event 是單行 JSON，寫到 server stdout，讓本機與 Fly 使用同一條 observability path。
- `LOG-4`：不記錄原始音檔、session cookie、完整 scene snapshot、recent artifacts、generated source、API key 或模型私有推理。
- `LOG-5`：log 是 best-effort。寫入失敗不得改變 HTTP response 或阻塞玩家施法；允許少量事件遺失，不引入 retry、queue 或資料庫。
- `LOG-6`：只記 `/api/spells`，不在 `/api/transcriptions` 重複記同一個語音 utterance。這也讓文字與語音咒語進入同一份紀錄。
- `LOG-7`：Fly 目前的七天 retention 只適用於本次黑客松與短期 playtest。需要長期資料、使用者歷史或更強 durability 時，必須另開 decision 選擇 external sink，不能把 stdout 說成永久資料庫。

## 對既有決策的關係

- 不改變 Decision 0002 的 generative compiler、source ABI 或 validation boundary；只觀察真正進入 compiler 的 request。
- 不改變 Decision 0004 的 push-to-talk transport，也不保存音訊。
- 補充 Decision 0005 的短期 deployment observability；維持其「不新增長期資料庫」非目標。

