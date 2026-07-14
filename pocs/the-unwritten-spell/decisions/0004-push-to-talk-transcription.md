# Decision 0004：Push-to-talk 語音詠唱

狀態：Accepted for PoC

日期：2026-07-14

## 問題

文字輸入已證明 generative compiler 能走通，但玩家無法在即時戰鬥中一邊以 WASD 閃躲、一邊輸入中文。語音因此是核心操作路徑，不是 demo polish。

## 共同假設與質疑

所有方案都假設「語音輸入」等於「必須在說話途中即時取得逐字稿」。這不成立：玩家按住詠唱鍵、放開送出的操作本身就是 turn boundary；第一版只需要在放開後快速取得完整 utterance。

## 考慮過的選項

### 維持鍵盤輸入

Moving parts 最少，但直接違反戰鬥中可操作的需求，因此不採用。文字框保留作為無麥克風時的 fallback。

### Browser `SpeechRecognition`

不需自己的 audio endpoint，但瀏覽器支援與服務行為不一致，也無法保證使用 OpenAI。它適合臨時實驗，不適合黑客松 demo 的主要路徑。

### Push-to-talk 錄音後轉錄

Browser 用 `MediaRecorder` 保存一次短 utterance，放開按鍵後把音訊送到同源 server，再由 server 呼叫 OpenAI Transcriptions API。它沿用既有「放開後直接提交、不逐次確認」規則，且不把 API key 暴露到瀏覽器。

### Realtime transcription

適合持續麥克風、即時 partial transcript、自動 turn detection 或語音代理；目前會新增 session、WebRTC／WebSocket、VAD 與更多失敗狀態，沒有改善「一句短咒語放開後施放」的核心價值，因此延後。

## 決定

- 玩家可以按住 `V` 或畫面上的麥克風按鈕錄音，放開後立即轉錄並自動提交施法，不增加確認畫面。
- Browser 只把短音訊送到同源 `/api/transcriptions`；`OPENAI_API_KEY` 繼續只存在 server。
- Playable demo 預設使用品質較高的 `gpt-4o-transcribe`，可用環境變數覆寫；輸入語言標為中文，並提供繁體中文的短咒語範例與遊戲詞彙 context。Mini model 只作為明確的低成本選項，不再是 demo 預設值。
- 第一版使用完整錄音的 request-based transcription，不做 partial transcript、Realtime session、VAD 或持續監聽。
- 轉錄、生成期間遊戲 loop 繼續運作；錄音與生成都是詠唱狀態，玩家仍可用較慢速度移動閃躲。
- 麥克風權限、錄音或轉錄失敗必須顯示，並保留文字輸入 fallback。
- 第一次跳出瀏覽器麥克風權限時，若原本的按壓已被權限視窗中斷，該次只完成授權暖機，不提交法術；旁註要請玩家重新按住再說。
- 明顯過短、尚未形成有效音訊容器的錄音要在 Browser 端攔下，不送到 transcription API，並用操作語言提示「按住、說完、再放開」。
- Push-to-talk 的主要按鈕不能只寫「說話」：idle、按壓中與放開後都要直接表達「按住說話／說完放開」，讓第一次玩的玩家不需要從說明文字猜操作。

## 何時重議

- 放開後的 transcription latency 明顯破壞節奏；
- 玩家需要在說話時看到逐字回饋；
- push-to-talk 在現場噪音中無法可靠界定 utterance；
- 產品改為持續性語音對話或多人語音。

## 官方能力依據

- [Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)
- [GPT-4o Transcribe](https://developers.openai.com/api/docs/models/gpt-4o-transcribe)
- [GPT-4o mini Transcribe](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe)

## 對既有決策的關係

不改變 Decisions 0001–0003 的 Game SDK、generated source ABI 或生成 profile。它只在既有自由文字 utterance 之前增加一個可替換的 audio-to-text transport。
