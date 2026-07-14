# STT 模型候選研究

狀態：Research note，尚未決定更換模型

更新日期：2026-07-14

## 現況

Playable demo 目前使用 OpenAI `gpt-4o-transcribe`，指定 `zh` 並提供繁體中文咒語詞彙 prompt。真實麥克風 playtest 仍出現「隕石／傷害」等關鍵詞誤聽，因此需要用同一批台灣中文錄音比較候選模型；本筆記不授權直接切換 production provider。

## 候選

### OpenAI 現有模型

- `gpt-4o-transcribe` 仍是官方目前最高品質的 file／batch transcription 選項；`gpt-4o-mini-transcribe` 是較便宜的小模型，不是準確度升級。
- `gpt-realtime-whisper` 是新的 streaming STT，主打低延遲 transcript deltas 與 latency／accuracy tuning。官方沒有宣稱它比 `gpt-4o-transcribe` 更準；它比較可能改善等待體驗，而不是直接解決台灣中文關鍵詞誤聽。
- `gpt-4o-transcribe-diarize` 增加 speaker labels，但不支援 prompt 或 logprobs；單人咒語不需要 diarization，因此不適合本案。
- `gpt-audio-1.5` 可以直接理解 audio 並輸出文字，值得作為「從語音抽取 spell intent」的獨立 Eval；但它不是忠實逐字稿專用模型，不能直接取代玩家 transcript echo 與原句 log。
- 目前 baseline 已使用 `language: "zh"` 與遊戲詞彙 prompt。下一個低風險實驗是取得 `gpt-4o-transcribe` logprobs，辨認低信心關鍵詞，再決定要重說、修正或走第二模型；不憑單一 playtest 直接換型號。
- 官方資料：[GPT-4o Transcribe](https://developers.openai.com/api/docs/models/gpt-4o-transcribe)、[GPT-Realtime-Whisper](https://developers.openai.com/api/docs/models/gpt-realtime-whisper)、[Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)、[gpt-audio-1.5](https://developers.openai.com/api/docs/models/gpt-audio-1.5)。

### xAI Grok STT

- xAI 公布的整體 benchmark 與價格有競爭力，也提供 keyterm biasing。
- 但目前官方 supported languages 清單沒有列出 Chinese／Mandarin。
- 結論：不能只依英文或整體 WER 宣稱它適合本 demo；只有在 API 實測能穩定處理繁中後，才加入正式比較。
- 官方資料：[Speech-to-text](https://docs.x.ai/developers/model-capabilities/audio/speech-to-text)、[Grok STT and TTS APIs](https://x.ai/news/grok-stt-and-tts-apis)。

### MediaTek Research Breeze-ASR-25

- 以 Whisper-large-v2 為基礎，針對台灣中文、台灣口音與中英 code-switching 調整。
- Apache 2.0、模型權重免費，但不是免費 managed API；2B 模型需要自行準備推論服務與 GPU。
- 結論：語言情境最貼近本 demo，值得作為台灣中文自架候選；黑客松期間是否採用取決於 GPU、延遲與部署時間。
- 官方資料：[MediaTek 發布說明](https://www.mediatek.com/zh-tw/press-room/mediatek-research-unveils-mr-breeze-asr-25-an-open-source-ai-model-for-taiwanese-speech)、[Breeze-ASR-25 model card](https://huggingface.co/MediaTek-Research/Breeze-ASR-25)。

## 建議比較方式

蒐集 30–50 段隊員以實際裝置錄製的短咒語，保留人工逐字稿；同一批音檔至少比較目前 baseline 與 Breeze-ASR-25，Grok 確認中文可用後再加入。中文主要看 CER、遊戲關鍵詞 recall、完整 intent 成功率、端到端 latency 與成本，不只看供應商公布的整體 WER。
