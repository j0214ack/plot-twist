# Decision 0008：Mobile presentation 與 PWA shell

狀態：Accepted for PoC

日期：2026-07-14

## 問題

目前 playable spike 的輸入與 HUD 以桌面鍵盤、文字欄位和大螢幕為中心。直接把同一套 UI 縮到手機上，會讓玩家無法一邊操作一邊輸入，也會讓瀏覽器工具列與直向 viewport 壓縮遊戲世界。

手機體驗的目的不是複製完整桌面介面，而是讓隊友能用最少操作完成核心循環：橫向移動、按住說出咒語、放開施法，並看到必要結果回饋。

## 名詞

- **Mobile mode**：主要指標為 coarse pointer 且裝置提供 touch points 的輸入環境。這是能力判斷，不依賴 user-agent 名稱或 viewport 寬度猜測機型。
- **Installed display mode**：頁面實際運行在 `fullscreen`／`standalone` display mode，或 iOS `navigator.standalone`。它代表玩家已從主畫面啟動 web app。
- **Mobile presentation**：與桌面共用 Game Host、world、simulation 與 spell pipeline，只替換畫面上的控制與 HUD 組合。

## 考慮過的選項

### 只增加窄螢幕 CSS

Moving parts 最少，但不會產生觸控移動、不能辨認 installed display mode，也仍把文字 console 塞在手機上，因此不採用。

### 建立第二套 mobile game entry

可以完全自由安排手機流程，但會複製 world setup、frame loop、語音與生成 controller，兩套玩法很快漂移，因此不採用。

### 共用 runtime，增加 mobile presentation 與 input adapter

桌面維持 keyboard／完整 HUD；mobile 只提供 virtual joystick、push-to-talk 與稀疏回饋。兩者仍餵同一個 `PlayerInput`、使用同一個語音與 spell pipeline。這個邊界最小且可測，因此採用。

### 為了 PWA 名稱加入離線 service worker

本 demo 的核心施法需要網路與 server-side OpenAI API，離線快取不會讓核心循環可用，反而可能在頻繁部署時保留舊 bundle。官方瀏覽器目前允許使用者從選單安裝具合格 manifest 的 app，不需要為此加入空的 fetch handler，因此本階段不採用 service worker。

## 決定

- `MOB-1`：Mobile mode 由 coarse primary pointer 與 touch capability 決定，不使用 user-agent parser，也不因單純窄視窗把桌面使用者切成手機操作。
- `MOB-2`：Mobile gameplay 是 landscape only。Web app manifest 宣告 landscape orientation；一般瀏覽器若處於 portrait，顯示不可略過的旋轉提示並暫停畫面操作。
- `MOB-3`：Mobile browser mode 在進入遊戲前顯示一次體驗提示：電腦體驗較完整；若仍使用手機，建議加入主畫面後從 icon 啟動。玩家可以繼續使用橫向 browser mode。
- `MOB-4`：若實際 display mode 已是 `fullscreen`／`standalone`，或 iOS 回報 `navigator.standalone`，不顯示 `MOB-3` 的提示。判斷依實際 display mode，不只依 manifest 是否存在。
- `MOB-5`：Mobile presentation 隱藏桌面 title、objective、status cards、guardian HUD、文字 spell console、範例咒語與鍵盤說明。保留 access gate、結果旁註、必要的 next-step guidance 與 victory state。
- `MOB-6`：Mobile 的可操作控制只有左下 virtual joystick 與右下 push-to-talk microphone。手機不提供遊戲內文字咒語 fallback；桌面仍保留 Decision 0004 的文字 fallback。
- `MOB-7`：Virtual joystick 將 pointer 相對中心的位置正規化成既有 `PlayerInput.moveX`／`moveZ`，限制最大幅度並套用 dead zone。pointer release、cancel、blur 或失去 capture 時必須歸零，不能讓角色持續漂移。v0 不另加 mobile dash button。
- `MOB-8`：PWA manifest 使用 `display: fullscreen`、`orientation: landscape`、stable `id`／`start_url` 與 192／512 icons。若平台不支援 fullscreen，允許依標準 fallback 到 standalone。Technical spike 不宣稱 offline support。
- `MOB-9`：Mobile mode 不建立第二套 world、simulation、spell compiler 或 voice controller。裝置模式只決定 presentation 與 `PlayerInput` adapter，不改 Game SDK 或生成機制。

## 驗收

- Pure state tests 覆蓋 desktop、mobile browser、installed fullscreen／standalone 與 portrait gate。
- Joystick tests 覆蓋 dead zone、最大幅度、pointer ownership 與 release／cancel reset。
- Production build 包含可讀取的 manifest、192／512 icons、`viewport-fit=cover` 與 landscape preference。
- 人工 mobile QA 確認 browser mode 顯示一次提示、installed mode 略過提示、portrait 阻擋、landscape 可以移動與按住麥克風。

## 對既有決策的關係

- 不改變 Decisions 0001–0003、0005–0007 的 runtime、generated source、deployment authorization、navigation 或 locomotion 邊界。
- 只部分 supersede Decision 0004 的「文字框保留作為無麥克風 fallback」：該 fallback 繼續存在於桌面 presentation；mobile presentation 依 `MOB-6` 不顯示文字輸入。
