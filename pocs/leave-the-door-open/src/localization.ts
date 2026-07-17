import type { ActionOptionId } from "./narrative-actions";
import type { PresentationCueId } from "./presentation";
import type { CalendarWeekdayId, NPCId } from "./world";

export const gameLocales = ["en", "zh-TW"] as const;

export type GameLocale = (typeof gameLocales)[number];

const englishPlayerCopy = {
  "cue.living_room_clock_slow":
    "Living room — The wall clock shows 07:54.",
  "cue.husband_notices_clock":
    "Living room — He looks up, starts to pass beneath it, then stops.",
  "cue.husband_lingers_beneath_clock":
    "Living room — He remains beneath the slow clock longer than usual without touching it.",
  "cue.husband_touches_clock_frame":
    "Living room — He rests his fingers on the clock's frame without changing its time.",
  "cue.performance_beat": "",
  "cue.husband_sits": "Living room — He sits at the far end of the sofa.",
  "cue.husband_rinses_cup":
    "Dining area — He rinses his cup, dries the ring beneath it, and leaves it upside down.",
  "cue.husband_folds_sofa_throw":
    "Living room — He folds the sofa throw into the same narrow rectangle.",
  "cue.husband_turns_off_lights":
    "Living room — He turns off the lamps one by one, leaving the clock visible until last.",
  "cue.husband_leaves_work":
    "Front door — He checks the time, shoulders his work bag, and leaves for the bus.",
  "cue.wife_leaves_work":
    "Front door — She checks that she has her keys and leaves on foot.",
  "cue.wife_returns_work":
    "Dining area — She returns from work and sets down her bag.",
  "cue.husband_returns_work":
    "Living room — He returns from work and leaves his bag beside the sofa.",
  "cue.husband_leaves_shopping":
    "Front door — He takes two cloth bags and the folded shopping list and leaves.",
  "cue.wife_leaves_shopping":
    "Front door — She checks the kitchen light and locks the door behind them.",
  "cue.wife_returns_groceries":
    "Dining area — She returns and puts the cold groceries on the table.",
  "cue.husband_returns_groceries":
    "Dining area — He returns with the remaining grocery bags.",
  "cue.husband_leaves_sunday_outing":
    "Front door — He changes shoes, takes his coat, and goes out for the evening.",
  "cue.wife_leaves_sunday_outing":
    "Front door — She switches off the dining-room light and follows.",
  "cue.wife_returns_sunday_outing":
    "Dining area — She returns from the evening out and hangs up her coat.",
  "cue.husband_returns_sunday_outing":
    "Living room — He returns a moment later and closes the front door.",
  "cue.husband_settles_at_dining_table":
    "Dining area — Martin comes to the table and sits down.",
  "cue.wife_settles_at_dining_table":
    "Dining area — Elise takes the chair across from him.",
  "cue.wife_drinks": "Dining area — She drinks a glass of water.",
  "cue.husband_reaches_door":
    "Hallway — He stops with one hand on the door handle.",
  "cue.world_paused": "The world pauses.",
  "cue.world_resumed": "The world resumes.",
  "cue.husband_interacts_clock":
    "Living room — He adjusts the clock to the current time.",
  "cue.living_room_clock_state_changed":
    "Living room — The clock now shows 07:59.",
  "cue.wife_notices_clock":
    "Dining area — She glances toward the clock and sees the correct time.",
  "cue.husband_opens_door":
    "Hallway — He opens the door just far enough to leave a narrow gap.",
  "cue.hallway_door_state_changed": "Hallway — The door is slightly open.",
  "cue.wife_enters_hallway": "Hallway — She walks into the hallway.",
  "cue.wife_notices_door": "Hallway — She notices the open door.",
  "cue.wife_stays_at_threshold": "Hallway — She remains at the threshold.",
  "cue.wife_steps_inside_room":
    "Room threshold — She steps one pace inside, remains briefly, then returns to the threshold.",
  "cue.wife_opens_room_window":
    "Room — She opens the window one hand-width and leaves it there.",
  "cue.relationship_talk_practical_deflection":
    "Dining area — Martin says, “I think we've been talking around each other.” Elise leaves one hand beside her cup. After a pause, she asks what time he is leaving tomorrow. The first sentence remains unanswered, but not unheard.",
  "cue.relationship_talk_distance_acknowledged":
    "Dining area — Martin says, “I don't know how to start this, but I miss talking to you.” Elise looks at him and says, “I know.” Neither tries to turn the two sentences into a conclusion.",
  "cue.relationship_talk_one_truth_returned":
    "Dining area — Martin says, “I miss knowing how you are when we aren't discussing the day.” Elise answers, “I keep waiting until I can say everything properly.” Martin nods. They let that be enough for tonight.",
  "cue.husband_turns_before_closed_door":
    "Hallway — He walks down the hallway, slowing before the fully closed door. He turns back without reaching it.",
  "cue.wife_takes_long_route":
    "Hallway — She starts into the hallway, stops near its entrance, and returns to the dining area by the longer route.",
  "cue.husband_reaches_closed_handle":
    "Hallway — This time he does not turn back. He reaches the closed door and rests his hand on the handle without moving it.",
  "cue.husband_waits_beside_latch":
    "Hallway — His hand arrives more directly; his thumb waits beside the latch without pressing it. The door remains fully closed.",
  "cue.husband_tests_window_latch":
    "Living room — He tests the window latch, finds its stopping point, and leaves it closed.",
  "cue.wife_squares_hallway_runner":
    "Hallway — She squares the near edge of the runner and leaves the far end untouched.",
  "cue.wife_observes_first_gap":
    "Hallway — She notices the narrow gap and stops away from the threshold without touching the door.",
  "cue.wife_stops_one_step_short":
    "Room threshold — The next morning she stops immediately outside, one step short of crossing. Nothing in the room changes.",
  "cue.wife_holds_at_nearer_mark":
    "Room threshold — On this later return she reaches the nearer stopping mark and does not retreat at once. The door and room remain unchanged.",
  "cue.wife_returns_to_boundary":
    "Room threshold — She returns and places one foot beside, not across, the line.",
  "cue.wife_aligns_toe_with_boundary":
    "Room threshold — She aligns one toe with, not across, the boundary and leaves it there.",
  "cue.wife_shifts_weight_toward_boundary":
    "Room threshold — Her weight shifts toward the room, then settles with one foot beside the line without crossing.",
  "cue.wife_notices_closed_window":
    "Room — From inside, she looks toward the closed window and changes nothing.",
  "cue.wife_pauses_within_window_reach":
    "Room — She stops within reach of the closed window, hands lowered, and changes nothing.",
  "cue.room_window_state_changed":
    "Room — The window is open one hand-width.",
  "cue.room_window_noticed": "Room — The open window is noticed.",
  "character.husband.name": "Martin",
  "character.wife.name": "Elise",
  "action.spend-time-with-clock.label": "Spend a moment with the clock.",
  "action.open-door-a-crack.label": "Open the door just a little.",
  "action.wait-at-threshold.label":
    "Remain at the threshold for one breath.",
  "action.step-inside-room.label":
    "Step across the threshold, then step back.",
  "action.open-room-window.label": "Open the window a little.",
  "action.say-one-honest-thing.label":
    "Try to say one honest thing to Elise.",
  "weekday.monday": "Monday",
  "weekday.tuesday": "Tuesday",
  "weekday.wednesday": "Wednesday",
  "weekday.thursday": "Thursday",
  "weekday.friday": "Friday",
  "weekday.saturday": "Saturday",
  "weekday.sunday": "Sunday",
  "ui.chapterDay": "Chapter 1 — Day {chapterDay}",
  "ui.timelineSeparator": " — ",
  "ui.paused": "[Paused]",
  "ui.running": "[Running]",
  "ui.focus": "Focus: {actor}",
  "ui.you": "You",
  "ui.innerVoice": "Inner voice",
  "ui.awaitingPersona": "Inner voice is responding…",
  "ui.awaitingAwareness": "Considering possibilities…",
  "ui.awaitingWillingness": "Considering the choice…",
  "ui.closedForDay":
    "{actor} has no more to add today. Observe the household or use /resume.",
  "ui.thisPerson": "This person",
  "ui.possibilities": "Possibilities:",
  "ui.feedbackNotReady.husband":
    "He can consider this, but has not chosen to do it now. Ask what still separates considering it from choosing it today.",
  "ui.feedbackNotReady.wife":
    "She can consider this, but has not chosen to do it now. Ask what still separates considering it from choosing it today.",
  "ui.feedbackRefuse.husband":
    "He refuses this step for now. Try another approach.",
  "ui.feedbackRefuse.wife":
    "She refuses this step for now. Try another approach.",
  "firewall.husband.mental_noise.ai_news":
    "I have clearly been reading too much AI news.",
  "firewall.husband.mental_noise.nonsense": "What kind of nonsense is this?",
  "firewall.husband.mental_noise.less_online":
    "I need to spend less time online.",
  "firewall.husband.mental_noise.no_sleep":
    "I really did not sleep enough.",
  "firewall.husband.mental_noise.browsing":
    "What have I been browsing lately?",
  "firewall.husband.protected_pain.not_now":
    "I do not want to think about that now.",
  "firewall.husband.protected_pain.no": "No.",
  "firewall.wife.mental_noise.junk_drawer":
    "Apparently my brain has opened a junk drawer.",
  "firewall.wife.mental_noise.after_midnight":
    "I need to stop reading things after midnight.",
  "firewall.wife.mental_noise.go_back":
    "That thought can go back where it came from.",
  "firewall.wife.mental_noise.no_sleep":
    "I have definitely not slept enough.",
  "firewall.wife.mental_noise.feeding_brain":
    "What have I been feeding my brain lately?",
  "firewall.wife.protected_pain.not_now":
    "I do not want to think about that now.",
  "firewall.wife.protected_pain.no": "No.",
  "firewall.husband.mental_noise.inner_peace":
    "At this point, I have achieved inner peace.",
  "firewall.wife.mental_noise.inner_peace":
    "At this point, I have achieved inner peace.",
  "firewall.husband.mental_noise.silence": "…",
  "firewall.wife.mental_noise.silence": "…",
  "firewall.husband.protected_pain.silence": "…",
  "firewall.wife.protected_pain.silence": "…",
  "terminal.title": "Leave the Door Open — local text playtest",
  "terminal.openingGuide": [
    "You are a voice inside Martin's self-talk.",
    "You cannot control his body.",
    "Your goal: Help Martin discover a next step he can genuinely accept.",
    "",
    "Start here: The living-room clock is three minutes slow. Martin notices it most mornings and usually keeps walking; today he stopped. Talk to him in your own words.",
    'Try: "What made those three minutes worth stopping for today?"',
    'Or: "What do you notice when you let yourself look at it?"',
    "No exact phrase is required.",
    "",
    "If a numbered Possibility appears, type its number.",
    "You can let time continue now to observe, or wait until an intention forms to change the world.",
    "Type /help to see this guide again, or /quit to stop.",
  ].join("\n"),
  "terminal.helpGuide": [
    "You are a voice inside Martin's self-talk.",
    "You cannot control his body.",
    "Your goal: Help Martin discover a next step he can genuinely accept.",
    "",
    "Speak by typing normally. The character may agree, resist, or change gradually.",
    'Try: "What made those three minutes worth stopping for today?"',
    'Or: "What do you notice when you let yourself look at it?"',
    "No exact phrase is required.",
    "Enter a Possibility number when one appears.",
    "You can let time continue now to observe, or wait until an intention forms to change the world.",
    "Use /quit to stop.",
  ].join("\n"),
  "terminal.chapterOpeningGuide": [
    "Chapter 1 — The End of the Hall",
    "Day 1 — Morning",
    "",
    "The clock shows the current time.",
    "The household begins another day.",
    "",
    "The tutorial showed how a possibility can change the world. Here, movement may take more than one conversation or one day.",
    "",
    "Watch the household's routines. When the world pauses, choose whose thoughts to enter with /focus martin or /focus elise. Talk in your own words, or use /resume to let time continue even when no Possibility has formed.",
    "",
    "Current thread: Watch what each person does when their route reaches the hall.",
    "",
    "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
  ].join("\n"),
  "terminal.chapterHelpGuide": [
    "You are a voice inside the current person's self-talk.",
    "You cannot control their body.",
    "Your goal: Help each person discover a next step they can genuinely accept.",
    "",
    "Watch the household's routines. When the world pauses, choose whose thoughts to enter with /focus martin or /focus elise.",
    "Speak by typing normally. The character may agree, resist, or change gradually; no exact phrase is required.",
    "A character may discuss an idea even when it is not an available world action at this pause.",
    "Only numbered Possibilities can be selected as world actions; other conversation can still change how the character thinks.",
    "Enter a Possibility number when one appears, or use /resume to let time continue without one.",
    "Current thread: Watch what each person does when their route reaches the hall.",
    "Use /quit to stop.",
  ].join("\n"),
  "terminal.noActionContinuationGuide": [
    "No world intention formed, so no action was scheduled.",
    "Anything established in conversation remains.",
    "A character may discuss an idea even when it is not an available world action at this pause.",
    "Only numbered Possibilities can be selected as world actions; other conversation can still change how the character thinks.",
    "Time moved to a new routine moment.",
    "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
  ].join("\n"),
  "terminal.nextRoutineGuide": [
    "The accepted intention has played out.",
    "Time moved to a new routine moment.",
    "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
  ].join("\n"),
  "terminal.chapterComplete": [
    "Chapter 1 complete.",
    "The room's window is open one hand-width.",
  ].join("\n"),
  "terminal.tutorialObservationGuide":
    "You let the day pass without changing anything. The clock is still three minutes slow. Anything Martin came to understand in conversation remains. You are back with Martin at the next morning's clock moment.",
  "terminal.emptyInput": "Type a thought, /help, or /quit.",
  "terminal.ended": "Playtest ended.",
  "terminal.noTutorialOption":
    "No numbered Possibility is available yet. Keep talking with Martin about what feels possible with the clock today.",
  "terminal.noOption": "Possibility {optionNumber} is not available.",
  "terminal.cannotAdvance": "The world cannot advance from this moment.",
  "terminal.tutorialFocusUnavailable":
    "That inner voice is not available here. You are hearing Martin's thoughts.",
  "terminal.focusUsage": "Use /focus martin or /focus elise.",
  "terminal.focusPaused": "Focus is available when the world is paused.",
  "terminal.intentionFormed":
    "An intention has formed. Type /resume to let the world continue.",
  "controller.conversationError": "The conversation could not continue.",
  "controller.actionError": "The action could not be considered.",
  "browser.documentTitle": "Leave the Door Open — Friend Playtest",
  "browser.description": "Leave the Door Open — a text-first narrative playtest.",
  "browser.kicker": "A TEXT-FIRST PLAYTEST",
  "browser.subtitle": "A household caught between routines",
  "browser.localeLabel": "Language",
  "browser.accessLabel": "PRIVATE PLAYTEST",
  "browser.accessTitle": "Enter the access code your friend gave you",
  "browser.accessDescription":
    "The code is sent only to this site; model credentials never enter your browser.",
  "browser.accessCodeLabel": "Access code",
  "browser.enter": "Enter",
  "browser.possibilityLabel": "POSSIBILITIES",
  "browser.thoughtLabel": "Say something to the inner voice you can hear",
  "browser.thoughtPlaceholder":
    "You do not need to guess keywords. Ask a question, or offer a perspective they might accept.",
  "browser.submit": "Send",
  "browser.focusMartin": "Enter Martin's thoughts",
  "browser.focusElise": "Enter Elise's thoughts",
  "browser.focusControlsLabel": "Inner voice controls",
  "browser.continue": "Let time continue",
  "browser.help": "How to play",
  "browser.playControlsLabel": "Play controls",
  "browser.ended": "This playtest segment has ended.",
  "browser.newGame": "Start over",
  "browser.footer":
    "Progress is saved for this browser and language. Clearing site data or using another browser starts a separate game.",
  "browser.checking": "Checking…",
  "browser.emptyPossibilities":
    "No possible action has appeared yet. You can keep talking, or let time continue.",
  "browser.busyStarting": "Loading…",
  "browser.busyDialogue": "The character is thinking…",
  "browser.busyTime": "Time is moving…",
  "browser.busyCommand": "Loading…",
  "browser.serviceUnavailable": "The playtest service is unavailable.",
  "browser.invalidAccessCode": "That access code is not correct. Please try again.",
  "browser.sessionExpired":
    "This playtest session is no longer available. Start a new game.",
} as const;

export type PlayerCopyKey = keyof typeof englishPlayerCopy;

const traditionalChinesePlayerCopy: Record<PlayerCopyKey, string> = {
  "cue.living_room_clock_slow": "客廳——牆上的時鐘顯示 07:54。",
  "cue.husband_notices_clock":
    "客廳——他抬頭看了一眼，正要從時鐘下方走過，卻停了下來。",
  "cue.husband_lingers_beneath_clock":
    "客廳——他在走慢的時鐘下多停了一會兒，沒有碰它。",
  "cue.husband_touches_clock_frame":
    "客廳——他把手指搭在時鐘外框上，沒有調整時間。",
  "cue.performance_beat": "",
  "cue.husband_sits": "客廳——他在沙發最邊上坐下。",
  "cue.husband_rinses_cup":
    "用餐區——他沖洗杯子，擦掉杯底留下的水圈，再把杯子倒扣著。",
  "cue.husband_folds_sofa_throw":
    "客廳——他把沙發毯摺成和平常一樣窄的長方形。",
  "cue.husband_turns_off_lights":
    "客廳——他一盞一盞關掉燈，讓時鐘留到最後。",
  "cue.husband_leaves_work":
    "玄關——他看了一眼時間，把工作包背上肩，出門搭公車。",
  "cue.wife_leaves_work": "玄關——她確認鑰匙帶在身上，步行出門。",
  "cue.wife_returns_work": "用餐區——她下班回家，把包放了下來。",
  "cue.husband_returns_work":
    "客廳——他下班回家，把工作包留在沙發旁。",
  "cue.husband_leaves_shopping":
    "玄關——他拿起兩只布袋和摺好的購物清單，出了門。",
  "cue.wife_leaves_shopping":
    "玄關——她確認廚房的燈已經關好，鎖上門跟了出去。",
  "cue.wife_returns_groceries":
    "用餐區——她回到家，把需要冷藏的東西先放上桌。",
  "cue.husband_returns_groceries":
    "用餐區——他提著其餘的購物袋回來。",
  "cue.husband_leaves_sunday_outing":
    "玄關——他換了鞋、拿起外套，傍晚出門。",
  "cue.wife_leaves_sunday_outing":
    "玄關——她關掉用餐區的燈，跟著出門。",
  "cue.wife_returns_sunday_outing":
    "用餐區——她從晚上的外出回來，把外套掛好。",
  "cue.husband_returns_sunday_outing":
    "客廳——他晚一步回來，關上大門。",
  "cue.husband_settles_at_dining_table":
    "用餐區——馬丁走到桌邊坐下。",
  "cue.wife_settles_at_dining_table":
    "用餐區——伊莉絲在他對面的椅子坐下。",
  "cue.wife_drinks": "用餐區——她喝了一杯水。",
  "cue.husband_reaches_door": "走廊——他一手放在門把上，停了下來。",
  "cue.world_paused": "時間暫停了。",
  "cue.world_resumed": "時間繼續流動。",
  "cue.husband_interacts_clock": "客廳——他把時鐘調到現在的時間。",
  "cue.living_room_clock_state_changed": "客廳——時鐘現在顯示 07:59。",
  "cue.wife_notices_clock":
    "用餐區——她朝時鐘看了一眼，發現時間已經準了。",
  "cue.husband_opens_door":
    "走廊——他只把門打開到留下一道窄縫，便停了手。",
  "cue.hallway_door_state_changed": "走廊——門微微開著。",
  "cue.wife_enters_hallway": "走廊——她走進走廊。",
  "cue.wife_notices_door": "走廊——她注意到那扇開著的門。",
  "cue.wife_stays_at_threshold": "走廊——她在門檻前停留了一會兒。",
  "cue.wife_steps_inside_room":
    "房門口——她跨進房裡一步，短暫停留，再退回門檻。",
  "cue.wife_opens_room_window":
    "房間——她把窗戶打開一掌寬，讓它維持那個樣子。",
  "cue.relationship_talk_practical_deflection":
    "用餐區——馬丁說：「我覺得我們一直在繞著彼此說話。」伊莉絲把一隻手留在杯子旁。停了一會兒，她問他明天幾點出門。第一句話沒有得到回答，但也沒有被當作沒聽見。",
  "cue.relationship_talk_distance_acknowledged":
    "用餐區——馬丁說：「我不知道該怎麼開口，可是我很想念以前跟妳說話的感覺。」伊莉絲看著他，說：「我知道。」兩人都沒有急著替這兩句話下結論。",
  "cue.relationship_talk_one_truth_returned":
    "用餐區——馬丁說：「我很想念那種不只是在交代一天行程、而是真的知道妳過得怎麼樣的感覺。」伊莉絲回答：「我一直在等，等到自己能把一切好好說清楚。」馬丁點點頭。今晚，這樣就夠了。",
  "cue.husband_turns_before_closed_door":
    "走廊——他沿著走廊往前，接近那扇緊閉的門時慢了下來。還沒走到門前，他便轉身回去。",
  "cue.wife_takes_long_route":
    "走廊——她正要走進走廊，卻在入口附近停下，繞了較遠的路回到用餐區。",
  "cue.husband_reaches_closed_handle":
    "走廊——這一次他沒有回頭。他走到緊閉的門前，把手放上門把，卻沒有轉動。",
  "cue.husband_waits_beside_latch":
    "走廊——他的手這次直接多了；拇指停在門閂旁，沒有按下。門依然緊閉。",
  "cue.husband_tests_window_latch":
    "客廳——他試了試窗閂，確認它卡住的位置，仍讓窗戶關著。",
  "cue.wife_squares_hallway_runner":
    "走廊——她把地毯靠近自己的那一端擺正，沒有碰另一端。",
  "cue.wife_observes_first_gap":
    "走廊——她注意到那道窄縫，在離門檻還有一段距離的地方停下，沒有碰門。",
  "cue.wife_stops_one_step_short":
    "房門口——隔天早上，她停在外面，離跨過門檻還差一步。房裡什麼都沒有改變。",
  "cue.wife_holds_at_nearer_mark":
    "房門口——這次回來，她走到了更近的停點，沒有立刻退開。門和房間都維持原樣。",
  "cue.wife_returns_to_boundary":
    "房門口——她再次回來，把一隻腳放在線的旁邊，沒有跨過去。",
  "cue.wife_aligns_toe_with_boundary":
    "房門口——她讓一隻腳尖與界線切齊，沒有越過，停在那裡。",
  "cue.wife_shifts_weight_toward_boundary":
    "房門口——她把重心往房間移了一點，最後仍停在線旁，沒有跨過去。",
  "cue.wife_notices_closed_window":
    "房間——她站在裡面看向緊閉的窗戶，什麼也沒有改變。",
  "cue.wife_pauses_within_window_reach":
    "房間——她停在伸手可及窗戶的位置，雙手垂著，什麼也沒有改變。",
  "cue.room_window_state_changed": "房間——窗戶開了一掌寬。",
  "cue.room_window_noticed": "房間——有人注意到那扇開著的窗戶。",
  "character.husband.name": "馬丁",
  "character.wife.name": "伊莉絲",
  "action.spend-time-with-clock.label": "陪這座時鐘一下。",
  "action.open-door-a-crack.label": "把門稍微打開一點。",
  "action.wait-at-threshold.label": "在門檻前停留一口呼吸的時間。",
  "action.step-inside-room.label": "跨過門檻，再退回來。",
  "action.open-room-window.label": "把窗戶打開一點。",
  "action.say-one-honest-thing.label": "試著對伊莉絲說一句真心話。",
  "weekday.monday": "星期一",
  "weekday.tuesday": "星期二",
  "weekday.wednesday": "星期三",
  "weekday.thursday": "星期四",
  "weekday.friday": "星期五",
  "weekday.saturday": "星期六",
  "weekday.sunday": "星期日",
  "ui.chapterDay": "第一章——第 {chapterDay} 天",
  "ui.timelineSeparator": "——",
  "ui.paused": "[已暫停]",
  "ui.running": "[時間流動中]",
  "ui.focus": "焦點：{actor}",
  "ui.you": "你",
  "ui.innerVoice": "內在聲音",
  "ui.awaitingPersona": "內在聲音正在回應……",
  "ui.awaitingAwareness": "正在思考可能性……",
  "ui.awaitingWillingness": "正在考慮這個選擇……",
  "ui.closedForDay":
    "{actor}今天已經沒有更多想說的了。你可以觀察這個家，或使用 /resume。",
  "ui.thisPerson": "這個人",
  "ui.possibilities": "可能的行動：",
  "ui.feedbackNotReady.husband":
    "他已經能考慮這件事，但現在還沒有選擇去做。試著問問看：從『能夠想像』到『今天願意選擇』之間，還隔著什麼？",
  "ui.feedbackNotReady.wife":
    "她已經能考慮這件事，但現在還沒有選擇去做。試著問問看：從『能夠想像』到『今天願意選擇』之間，還隔著什麼？",
  "ui.feedbackRefuse.husband": "他現在拒絕這一步。試試別的方式。",
  "ui.feedbackRefuse.wife": "她現在拒絕這一步。試試別的方式。",
  "firewall.husband.mental_noise.ai_news":
    "我最近肯定是 AI 新聞看太多了。",
  "firewall.husband.mental_noise.nonsense":
    "這都是些什麼亂七八糟的想法？",
  "firewall.husband.mental_noise.less_online": "我真的該少上點網了。",
  "firewall.husband.mental_noise.no_sleep": "我果然是沒睡飽。",
  "firewall.husband.mental_noise.browsing":
    "我最近到底都在看些什麼？",
  "firewall.husband.protected_pain.not_now": "我現在不想想這個。",
  "firewall.husband.protected_pain.no": "不。",
  "firewall.wife.mental_noise.junk_drawer":
    "看來我的腦子自己拉開了雜物抽屜。",
  "firewall.wife.mental_noise.after_midnight":
    "我真的該停止半夜看那些東西了。",
  "firewall.wife.mental_noise.go_back":
    "這個念頭可以從哪裡來，就回哪裡去。",
  "firewall.wife.mental_noise.no_sleep": "我肯定是沒睡飽。",
  "firewall.wife.mental_noise.feeding_brain":
    "我最近到底都拿什麼東西餵我的腦子？",
  "firewall.wife.protected_pain.not_now": "我現在不想想這個。",
  "firewall.wife.protected_pain.no": "不。",
  "firewall.husband.mental_noise.inner_peace": "我現在已經心如止水。",
  "firewall.wife.mental_noise.inner_peace": "我現在已經心如止水。",
  "firewall.husband.mental_noise.silence": "…",
  "firewall.wife.mental_noise.silence": "…",
  "firewall.husband.protected_pain.silence": "…",
  "firewall.wife.protected_pain.silence": "…",
  "terminal.title": "讓門開著——本機文字試玩",
  "terminal.openingGuide": [
    "你是馬丁自言自語裡的一個聲音。",
    "你無法控制他的身體。",
    "你的目標：幫馬丁找到一個他真正願意接受的下一步。",
    "",
    "起點：客廳的時鐘慢了三分鐘。馬丁幾乎每天早上都會注意到，通常只是繼續往前走；但今天，他停了下來。用你自己的話和他說話。",
    "可以試著問：「今天，為什麼這三分鐘值得你停下來？」",
    "或是：「當你允許自己看著它時，你注意到了什麼？」",
    "不需要猜中任何固定句子。",
    "",
    "如果出現有編號的「可能行動」，輸入它的號碼。",
    "你現在可以讓時間繼續，先觀察；也可以等到一個意圖形成，再改變世界。",
    "輸入 /help 再看一次說明，或輸入 /quit 結束。",
  ].join("\n"),
  "terminal.helpGuide": [
    "你是馬丁自言自語裡的一個聲音。",
    "你無法控制他的身體。",
    "你的目標：幫馬丁找到一個他真正願意接受的下一步。",
    "",
    "直接輸入文字和角色說話。角色可能同意、抗拒，也可能慢慢改變。",
    "可以試著問：「今天，為什麼這三分鐘值得你停下來？」",
    "或是：「當你允許自己看著它時，你注意到了什麼？」",
    "不需要猜中任何固定句子。",
    "出現「可能行動」時，輸入它的號碼。",
    "你現在可以讓時間繼續，先觀察；也可以等到一個意圖形成，再改變世界。",
    "輸入 /quit 結束。",
  ].join("\n"),
  "terminal.chapterOpeningGuide": [
    "第一章——走廊盡頭",
    "第 1 天——早上",
    "",
    "時鐘顯示著正確的時間。",
    "這個家又開始了一天。",
    "",
    "教學讓你看見：一個角色真正接受的可能性，之後可以改變世界。從現在開始，有些移動也許需要不只一次對話，甚至不只一天。",
    "",
    "觀察這個家的日常。時間暫停時，可以用 /focus martin 或 /focus elise 選擇進入誰的想法。用自己的話和他們說，或在還沒有形成「可能行動」時使用 /resume，繼續觀察。",
    "",
    "目前的線索：留意兩人的日常路線抵達走廊時，各自做了什麼。",
    "",
    "選擇要進入誰的想法：/focus martin 或 /focus elise。",
  ].join("\n"),
  "terminal.chapterHelpGuide": [
    "你是目前這個人自言自語裡的一個聲音。",
    "你無法控制他們的身體。",
    "你的目標：幫每個人找到一個自己真正願意接受的下一步。",
    "",
    "觀察這個家的日常。時間暫停時，用 /focus martin 或 /focus elise 選擇進入誰的想法。",
    "直接輸入文字和角色說話。角色可能同意、抗拒，也可能慢慢改變；不需要猜中固定句子。",
    "角色可以討論一個想法，即使它在這次暫停時還不是可以執行的世界行動。",
    "只有有編號的「可能行動」能被選為世界行動；其他對話仍可能改變角色的想法。",
    "出現「可能行動」時輸入號碼，或使用 /resume，在沒有行動時繼續觀察。",
    "目前的線索：留意兩人的日常路線抵達走廊時，各自做了什麼。",
    "輸入 /quit 結束。",
  ].join("\n"),
  "terminal.noActionContinuationGuide": [
    "這次沒有形成改變世界的意圖，因此沒有安排新的行動。",
    "對話中已經建立的理解仍然保留。",
    "角色可以討論一個想法，即使它在這次暫停時還不是可以執行的世界行動。",
    "只有有編號的「可能行動」能被選為世界行動；其他對話仍可能改變角色的想法。",
    "時間來到了下一個日常片刻。",
    "選擇要進入誰的想法：/focus martin 或 /focus elise。",
  ].join("\n"),
  "terminal.nextRoutineGuide": [
    "角色接受的意圖已經在世界裡發生。",
    "時間來到了下一個日常片刻。",
    "選擇要進入誰的想法：/focus martin 或 /focus elise。",
  ].join("\n"),
  "terminal.chapterComplete": [
    "第一章完成。",
    "房間的窗戶開了一掌寬。",
  ].join("\n"),
  "terminal.tutorialObservationGuide":
    "你讓這一天過去，沒有改變任何東西。時鐘依然慢了三分鐘。馬丁在對話中得到的理解仍然保留。隔天早上，你又和他一起回到了時鐘前。",
  "terminal.emptyInput": "輸入一句話、/help 或 /quit。",
  "terminal.ended": "試玩結束。",
  "terminal.noTutorialOption":
    "現在還沒有可以選擇的編號行動。繼續和馬丁談談：今天，他覺得自己可能對時鐘做些什麼？",
  "terminal.noOption": "現在不能選擇第 {optionNumber} 個行動。",
  "terminal.cannotAdvance": "時間目前無法從這個片刻繼續前進。",
  "terminal.tutorialFocusUnavailable":
    "現在還聽不到那個人的內在聲音。你目前聽見的是馬丁的想法。",
  "terminal.focusUsage": "請使用 /focus martin 或 /focus elise。",
  "terminal.focusPaused": "時間暫停時才能切換焦點。",
  "terminal.intentionFormed":
    "一個意圖已經形成。輸入 /resume，讓時間繼續。",
  "controller.conversationError": "這段對話暫時無法繼續。",
  "controller.actionError": "目前無法考慮這個行動。",
  "browser.documentTitle": "讓門開著——朋友試玩版",
  "browser.description": "《讓門開著》——以文字為主的敘事遊戲試玩。",
  "browser.kicker": "文字敘事試玩",
  "browser.subtitle": "一個停在日常縫隙裡的家",
  "browser.localeLabel": "語言",
  "browser.accessLabel": "私人試玩",
  "browser.accessTitle": "輸入朋友給你的 access code",
  "browser.accessDescription":
    "代碼只會送回這個網站；模型憑證不會進入瀏覽器。",
  "browser.accessCodeLabel": "Access code",
  "browser.enter": "進入",
  "browser.possibilityLabel": "可能的行動",
  "browser.thoughtLabel": "對你現在聽見的內在聲音說一句話",
  "browser.thoughtPlaceholder":
    "不需要猜關鍵字。問一個問題，或提出一個他可能願意接受的角度。",
  "browser.submit": "送出",
  "browser.focusMartin": "進入馬丁的想法",
  "browser.focusElise": "進入伊莉絲的想法",
  "browser.focusControlsLabel": "內在聲音控制",
  "browser.continue": "讓時間繼續",
  "browser.help": "玩法說明",
  "browser.playControlsLabel": "遊戲控制",
  "browser.ended": "這一段試玩已結束。",
  "browser.newGame": "重新開始",
  "browser.footer":
    "進度會依這個瀏覽器與語言保存。清除網站資料或改用其他瀏覽器，會開始另一局。",
  "browser.checking": "正在確認……",
  "browser.emptyPossibilities":
    "還沒有浮現可選的行動。你可以繼續談，或讓時間前進。",
  "browser.busyStarting": "讀取中……",
  "browser.busyDialogue": "角色正在想……",
  "browser.busyTime": "時間正在前進……",
  "browser.busyCommand": "讀取中……",
  "browser.serviceUnavailable": "目前無法連上試玩服務。",
  "browser.invalidAccessCode": "Access code 不正確，請再試一次。",
  "browser.sessionExpired": "這個試玩連線已經失效，請重新開始。",
};

export const playerCopyCatalog = {
  en: englishPlayerCopy,
  "zh-TW": traditionalChinesePlayerCopy,
} satisfies Record<GameLocale, Record<PlayerCopyKey, string>>;

export const localize = (
  locale: GameLocale,
  key: PlayerCopyKey,
  values: Record<string, string | number> = {},
): string =>
  playerCopyCatalog[locale][key].replace(
    /\{([A-Za-z][A-Za-z0-9]*)\}/g,
    (_, name: string) => {
      const value = values[name];
      if (value === undefined) {
        throw new Error(`Missing localization value: ${name}`);
      }
      return String(value);
    },
  );

export const localizeCue = (
  locale: GameLocale,
  cueId: PresentationCueId,
): string => localize(locale, `cue.${cueId}` as PlayerCopyKey);

export const localizeActionLabel = (
  locale: GameLocale,
  optionId: ActionOptionId,
): string => localize(locale, `action.${optionId}.label` as PlayerCopyKey);

export const localizeCharacterName = (
  locale: GameLocale,
  actorId: NPCId,
): string => localize(locale, `character.${actorId}.name` as PlayerCopyKey);

export const localizeWeekday = (
  locale: GameLocale,
  weekdayId: CalendarWeekdayId,
): string => localize(locale, `weekday.${weekdayId}` as PlayerCopyKey);

export const localizeFirewallResponse = (
  locale: GameLocale,
  responseId: string,
): string => localize(locale, `firewall.${responseId}` as PlayerCopyKey);

export const isGameLocale = (value: unknown): value is GameLocale =>
  typeof value === "string" &&
  (gameLocales as readonly string[]).includes(value);
