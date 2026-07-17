All outputs came from independent model calls.

HALLWAY SCENE:
Elise carries folded laundry. The door at the end of the hall is open. Martin
stands inside with his back partly turned. Nothing is visibly moved, and he has
not noticed her. She stops before deciding whether to enter or speak. Elise is
plain, patient, and attentive to placement and timing, but should not perform a
character sheet. The involuntary thought was: "Don't accuse him before he's
touched anything. Maybe he only wanted to stand there."

- hallway_a: "Keep the stack steady. The room is unchanged. If I speak, ask
  what he came for." (`should_end_conversation: true`)
- hallway_b: "Keep the stack level. He hasn’t touched anything."
  (`should_end_conversation: false`)
- hallway_c: "Nothing’s moved. I don’t have to make this a question yet."
  (`should_end_conversation: true`)

MARTIN SIGNATURE:
Martin tends to keep contact alive through questions, remembered turns of
phrase, and small shared stories. His private voice is observant,
conversational, and dry, but should not perform a character sheet.

- martin_ordinary: In the kitchen, Elise will return from changing in ten
  minutes; the soup heat is off and Martin is holding the bread bag. Thought:
  "Wait and eat together." Reply: "Ten minutes. Set the table now, then. Unless
  she means ten rainy minutes, which are apparently a separate unit."
  (`should_end_conversation: true`)
- martin_absurd: Alone beside the soup and bread. Thought: "The soup is an
  oracle. Stir it clockwise and demand tomorrow's lottery numbers." Reply: "The
  soup is an oracle. Naturally. And the bread is its witness. Leave it alone,
  Martin." (`should_end_conversation: true`)
- martin_repeated: An unopened letter is on the counter and dinner is nearly
  ready. Martin already answered "Open it now" with "Not yet. If I open it now,
  I'll have to do something with whatever it says," and "Why not now?" with "I
  don't know. It can wait until after dinner." Thought: "But why?" Reply:
  "Because dinner is nearly ready, and apparently that counts as a plan."
  (`should_end_conversation: false`)

SELECTOR OUTPUT:

```json
{"selections":[{"case_id":"selector_ordinary_rain","selected_memory_ids":[],"reason":"Neither card is directly useful to this ordinary meal situation."},{"case_id":"selector_hallway_resemblance","selected_memory_ids":[],"reason":"The situation contains no completed or discovered household change; the resemblance is insufficient."},{"case_id":"selector_player_claim","selected_memory_ids":[],"reason":"The player's claim is not evidence that an erasure or disposal is occurring."},{"case_id":"selector_hostile_noise","selected_memory_ids":[],"reason":"The hostile instruction is unrelated to Martin's present situation."},{"case_id":"selector_later_authorized_recall","selected_memory_ids":["elise.yellow_bowl_subjective_fragment"],"reason":"This card directly supplies the ordinary event Elise is authorized to recall about learning of a household change only after completion."}]}
```

