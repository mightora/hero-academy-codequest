# Curriculum and assessment

All 30 missions are selectable from the beginning. The map recommends a next mission and First steps as a starting point, without blocking exploration. Completing F10 leads through an adventure break to the Python/C# choice; both paths remain switchable.

## Teaching sequence

Each mission has a dedicated lesson in `dist/lessons.js`, with the default flow **Learn the idea → Little tests → Final mission**:

1. Define the concept in plain language and explain its purpose in the game.
2. Show a small worked example, its expected output or action, and notes that explain how it works. Foundation examples are labelled pseudocode with picture cues. The 20 Python/C# examples execute in the actual language runtimes during testing.
3. Offer three short checks: predict what happens, choose a missing step and investigate/debug a mistake. There are **90 checks** across the 30 missions. Each choice has a tailored explanation, including distractors. Answer order is shuffled deterministically per hero and mission.
4. Apply the concept in the existing final adventure using editable blocks or code. The worked teaching example is deliberately smaller than the mission solution.

Wrong answers allow retries without losing points. “Pip, show me” explains the correct answer and records that support. Check progress survives navigation, reloads, hero switches and validated backup round-trips; it does not replace saved final programs. Returning to the concept keeps the current check position. Speech is opt-in and has a Stop voice control.

All stages remain available for exploration. Opening the final mission early does not mark its checks passed. The guided route waits for a solved or assisted answer before moving to the next check. Learning checks award neither mission completion nor game points, and the parent table distinguishes first-try answers, answers after feedback and revealed answers. These are practice signals, not mastery certificates or a tamper-proof exam.

| Mission | Concept | Visible challenge |
| --- | --- | --- |
| F1 | Instructions | One movement to Pip's charger |
| F2 | Sequence | Arrange a route to the charging station |
| F3 | Order | Supports, deck, then open a bridge |
| F4 | Debugging | Replace the route's incorrect movement |
| F5 | Repetition | Repeat a move across stepping stones |
| F6 | Variables | Store and change power cells |
| F7 | Conditions | Check power before opening a gate |
| F8 | If/else | Let a clear/blocked sensor choose a route |
| F9 | Functions | Define `repair`, then reuse it for two places |
| F10 | Combined foundation mission | Repeat collecting cells, change stored power, check power, open a gate and restore a workshop |
| P11 | Output/basic syntax | `print()` sends a beacon message |
| P12 | Variables/values | Set a robot's name, energy and readiness |
| P13 | Arithmetic | Calculate the supplies needed for panels |
| P14 | Comparisons/booleans | Compare power and open a gate |
| P15 | If/elif/else | Route a parcel to hospital, school or workshop |
| P16 | For/range | Water a zero-indexed row of plants |
| P17 | While | Charge until a beacon reaches its target |
| P18 | Functions/parameters | One repair function takes different places |
| P19 | Lists/iteration | Process all delivery items, including repeats |
| P20 | Python mission | Charge, keep a district list, loop through it and call a condition-checking repair function |
| C11 | Output/statements | `Console.WriteLine()` sends a beacon message |
| C12 | Variables/types | Set string, integer and boolean robot values |
| C13 | Arithmetic | Calculate supplies and remaining energy |
| C14 | Comparisons/booleans | Check a lift's power and reach its floor |
| C15 | If/else | Choose a rescue route with a sensor |
| C16 | For | Activate a zero-indexed row of signals |
| C17 | While | Charge until a beacon reaches its target |
| C18 | Methods/parameters | One repair method takes different places |
| C19 | Collections/foreach | Deliver every entry in an array/collection |
| C20 | Class/combined mission | Construct and use a robot class in a district-restoration program |

## Four variants

Variants are finite and deterministic, making solvability reproducible. F1 changes movement direction; route missions change lengths and arrangements; the bridge changes position and the offered block order; power and arithmetic missions change quantities; sensor missions change their sensor and route positions; repairs change places; delivery lists change length, contents and duplicate quantities; final missions change their places and power goals. Worked solutions for all 120 combinations run in the test suite.

## Behaviour and concept evidence

The goal checker replays validated actions through the world model. It checks positions, power, repair state, correct route, output, all watered/lit positions or the delivery multiset. It does not require an exact source string. The delivery check preserves duplicate counts; repeated delivery of a single item cannot replace the full list.

Where relevant, the checker also requires concept evidence. The actual Python AST and Roslyn syntax trees insert traces into executed loops, conditions, routines and declarations. A loop in dead code does not earn repetition evidence. Functions/methods must be called, and parameter missions require a called routine with a parameter. Different names, ordering, calculations and valid control-flow variations are accepted. Expression-bodied C# methods are supported too.

Evidence is educational feedback, not a proof of mastery or an adversarial exam checker. For example, choosing whether an `if/else` is a clearer solution than an `if/elif/else` is a conversation with the learner; P15 demonstrates the latter, but the outcome checker accepts other genuinely branching correct solutions. The system is deliberately not a source-string template matcher.

Hints progress through a picture clue, an explanation, a partial starting point and a worked example. Using a hint stays attached to that saved adventure. Loading a worked example marks completion as supported even if it is subsequently edited. A fresh variant starts a fresh help record. Starter scaffolding remains available at every text-code level, including the final class mission.

## Player records and rewards

Each player has separate foundation, Python and C# completion, code, lesson stage, check attempts/help, appearance, settings, points, collectibles and practice history. Every attempted coding run can record outcome, whether the intended concept was evidenced, variant and support category. Best completion and original practice events are both retained. Version-1 backups without lesson records migrate to empty lesson progress without changing existing programs, rewards or completion.

The first completed variant of a mission awards 100 points. Each additional variant awards 25 once. Optional treasures and activity keepsakes award separate game points. Repeating an already rewarded variant never deducts points. Worked examples can earn the same game rewards; their learning support is recorded separately.

The sandbox records experiments but never awards a coding-level completion. Mini-games are also separate from the 30 learning levels. There are no lost lives, compulsory streaks, ads, purchases or penalties for mistakes.
