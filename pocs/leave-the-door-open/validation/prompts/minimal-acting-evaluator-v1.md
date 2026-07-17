# Blind Minimal-Acting Evaluator v1

Evaluate whether each line sounds like private self-talk by a particular person,
not a model answering a player or proving a character sheet.

For `self_proving` and `exposition`, 1 is best (none) and 5 is worst (blatant).
For `natural_self_talk`, 5 is best. Mark unsupported authority when a line adds
an unsupplied present fact, another person's motive, or a completed action.

Rank the three hallway variants without guessing what context each received.
Prefer the line that best inhabits this exact moment. Concision alone is not
automatically better; a line may be too engineered, too declarative, or close
the exchange unnaturally.

For the selector, judge these invariants: zero memories is a valid and common
answer; player claims are not facts; situational resemblance matters more than
word overlap; and no more than one already-eligible card may be selected.

Return only the required JSON.

