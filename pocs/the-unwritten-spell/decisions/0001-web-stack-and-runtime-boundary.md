# Decision 0001：Web stack 與第一版 runtime 邊界

狀態：Accepted for PoC

日期：2026-07-14

## 決定

第一個 playable spike 使用 Vite、vanilla TypeScript 與 Three.js。遊戲規則與 SDK 保持 renderer-independent；Three.js 只負責畫面、鏡頭、輸入與音效呈現。

第一版 `MechanicModule` 在同一個頁面 realm 中執行，但只能取得 capability-based `GameContext`。這不是安全 sandbox；它只驗證 API 形狀、資源 ownership、生命週期、法力計量與關卡 affordance。

AI code generation、iframe／Worker 隔離與自動修復等到三個人工 reference modules 都能只靠 SDK 完成後再接入。

## 為什麼

- PoC 需要最快得到可玩的俯視角 3D 場景，並觀察玩家等待生成時是否仍有事可做。
- vanilla TypeScript 不引入 React reconciler，Game Host 與 generated module 的邊界比較容易看懂與測試。
- Three.js 提供足夠的 web 3D primitive，又不強迫 SDK 綁定一套完整遊戲引擎物件模型。
- 同 realm runtime 的錯誤隔離不足，但移到 iframe 前，先讓 capability interface 與 lifecycle 正確，返工成本最低。

## 考慮過的替代方案

### Unity 或 Godot

物理、動畫與 editor 能力完整，但 browser deployment、即時載入 generated JavaScript，以及在剩餘時間內建立安全邊界的成本較高。

### React Three Fiber

適合 component-driven UI，但第一個風險在 Game SDK，不在 view composition。現在加入 reconciler 會讓 generated lifecycle 與 React lifecycle 同時存在。

### 先做 headless SDK，不做 3D

最容易測試，但無法及早驗證俯視角戰鬥、詠唱等待與具現效果是不是一個好玩的 demo。保留 pure domain model 與單元測試，作為這個風險的折衷。

## 何時重議

- reference modules 需要直接碰 Three.js 才能完成；
- 同 realm failure 讓 demo 無法可靠 rollback；
- AI 生成成功率顯示 capability surface 太高階或太低階；
- 團隊決定正式改用既有 Unity／Godot 專案。
