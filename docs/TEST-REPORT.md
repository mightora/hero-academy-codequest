# CodeQuest verification report

Initial suites: 17 October 2026. Runtime startup fix, guided-lesson tests and live Chrome runtime verification: 18 October 2026.

**Implemented and automatically tested:** all 30 missions, all 120 worked variants, 30 concept lessons with 90 explained quick checks, both editable-source language engines, game-action generation, core player state, backwards-compatible backups and the main DOM flows.

**Live Chrome verification, 18 October:** reproduced the toolkit startup failure on `https://codequest.heroacademy.app/`. A classic bootstrap alone still stalled on opaque-origin module imports. Bundled, language-specific classic workers resolved the failure without changing the iframe sandbox or network CSP. Edited C# `Console.WriteLine` and Python `print` programs both produced their actual output and a visible beacon action. Stop interrupted an actively running C# `while (true)` loop and the page remained usable. The bundled workers also pass the host, final-mission, isolation-probe and infinite-loop tests in the Node harness; these now run in deployment CI.

**Still not verified here:** rendered phone, tablet and desktop layouts; full native keyboard/focus behaviour; browser enforcement probes for every CSP restriction; physical touch controls; and actual iPhone Safari, Android and Firefox. The initial 17 October build had no browser testing; the follow-up above is a targeted Chrome runtime check, not device certification.

## Automated results

| Suite | Passed checks | What ran |
| --- | ---: | --- |
| Core curriculum/state/game/lesson tests | 58 | All 40 foundation variants, alternative route, missing repetition evidence, command validation/limits, player isolation, backup round-trip and rejection cases, reward/support separation, memory timeout, trail solvability, all 30 lessons/90 explained checks, varied answer order, old-save migration and isolated learning state |
| CPython WebAssembly | 47 | All 40 Python variants, four different correct solutions, syntax error, dead-code loop evidence rejection and output limit |
| .NET WebAssembly + Roslyn | 49 | All 40 C# variants, six different correct solutions including an expression-bodied method, syntax error, dead-code loop evidence rejection and output limit |
| DOM integration | 14 | All mission/path selectors, foundation completion, Back cancelling a transition, nested blocks, Step, Reset preserving code, saved C# editing, player switching, backup export/import UI, memory board, branching screen and sandbox choices |
| Guided learning DOM integration | 125 | All 30 introductions, all 90 checks, tailored wrong-answer/reveal feedback, final-mission entry, no runtime loading on lesson screens, opt-in speech/Stop controls with a stub speech engine, retained check position, hero isolation, saved final code and parent progress table |
| RuntimeHost/isolated-frame integration with Node worker adapters | 7 | Actual host and iframe bootstrap, both edited-source programs and output, infinite loops, Stop reaching worker termination, responsive host heartbeat and automatic execution deadline |
| Browser-loader branch harness | Additional checks for both languages | All 20 real Python/C# teaching examples and their exact outputs, the vendor browser loader branches, final missions, no page/profile globals, blocked external fetch, infinite-loop termination and responsive host heartbeat |

The six counted suites total **300 passing checks**. The browser-loader harness adds checks recorded by language rather than a single count, including ten teaching examples per language. All 120 worked mission variants are included in the first three suites. These suites and static checks run before GitHub Pages deployment.

`npm run check` also parses the JavaScript and CSS; checks all challenge definitions, static runtime asset existence/size, manifest drift and declared accessibility configuration; and verifies that each static asset is below 25 MiB. The SVG map, original characters and representative world states were rendered with Inkscape and visually inspected. That is artwork inspection, not an HTML layout screenshot.

## Actual runtime evidence

The delivered engines report:

- CPython **3.14.2**, Pyodide **314.0.7**.
- .NET **10.0.13**, Roslyn **4.14.0.0**, with the **C# 13** parser explicitly selected.

The C# tests pass edited source into Roslyn, compile a new assembly and invoke it under WebAssembly. C20 constructs and uses an editable `Robot` class. A precompiled application-only approach is not used. Python goes through the real CPython parser and compiler. Different programs, identifiers and expressions produce correct world actions.

Reference container timings from the runtime startup verification:

| Measurement | Python | C# |
| --- | ---: | ---: |
| Direct WebAssembly startup with local assets | 1,838 ms | 525 ms |
| Browser-loader branch in Node VM, assets already local | 1,803 ms | 2,097 ms |
| First C# compile and run in direct WebAssembly suite | — | 1,511 ms |
| Termination of actively looping worker in Node harness | 9 ms | 12 ms |

The host integration test also observes worker termination and disposal after a deliberate 200 ms observation window. Its roughly 5.25 second automatic-timeout measurement includes a 250 ms cleanup observation after the configured five-second execution budget. These timings do not include internet downloads and are not phone benchmarks.

The direct Node .NET test logs a nonfatal optional Wasm symbol-file loading message; all compilation and behaviour assertions pass. The isolated static loader includes that symbol resource in its actual manifest.

Generated machine-readable results are in:

- `tests/python-results.json`
- `tests/csharp-results.json`
- `tests/dom-results.json`
- `tests/worker-results.json`
- `tests/host-results.json`

## Specific regression checks

- Reset constructs a fresh world and preserves the saved program.
- A player switch does not reveal the previous hero's code, completion, points, settings or appearance.
- Export/import restores all players, code, variant/help state, appearance and settings. Malformed, oversized, duplicate-player and unknown-block backups are rejected.
- Lesson/check state is saved per hero without changing mission points or completion. Version-1 backups without lesson data keep their old code and rewards. Malformed lesson/check records are rejected.
- All 90 quick checks have a prediction/completion/debugging task and an explanation for every choice. Incorrect answers keep Next disabled; a correct or revealed answer allows it. Reveals remain labelled as assisted.
- Reviewing a lesson preserves final code and current check position. Exploring the final mission early does not pass checks. Teaching screens do not trigger the heavyweight language download.
- A correct outcome without the required loop is not a repetition completion. A loop inside dead code does not supply loop evidence.
- Different correct route/program/calculation/method solutions are accepted.
- Unmatched memory cards schedule their flip-back for exactly **3,000 ms**, and activity disposal clears the timer.
- All three trail treasures have valid paths through the obstacle grid.
- Stop is handled outside the busy worker. Both an infinite Python loop and an infinite C# loop are terminated while the host heartbeat continues.
- Repeated execution-phase messages cannot keep resetting the deadline. Results and errors dispose of their workers.
- Back clears automatic transitions in the DOM integration test.
- User-supplied program text is escaped in HTML and assigned as textarea content. Imported profile structures are rebuilt from whitelisted fields.

## Required browser/device follow-up

Before presenting this as a device-verified release, exercise the deployed static app in current Chrome/Edge, Firefox and Safari, plus actual target iPhone/iPad/Android hardware:

1. Open each language from a cold HTTP cache, watch progress, cancel, retry, and run edited P20/C20 code.
2. Confirm sandboxed module Blobs load, external network probes are blocked, saved profiles cannot be accessed from user code, and Stop kills both infinite loops.
3. Render and inspect 320, 375, 390 and 430 px phone widths, tablet widths, desktop and short landscape screens. Confirm no page overflow and that map panning stays inside the map.
4. Repeat with large text, browser zoom and reduced motion. Confirm every required action remains reachable.
5. Tab through the maps, block nesting/reordering, native text editor escape sequence, Help, dialogs, player switch, backup import and game controls. Verify focus restoration and a screen reader.
6. Try adjacent press-and-hold movement, movement tracks, glider gaps, all memory pairs and the three-second mismatch delay. Confirm double-tapping controls does not zoom, while normal page zoom remains available.
7. Complete a mission/activity and use Back during each celebration. Confirm no late navigation happens.
8. Export a real downloaded backup, reload the browser, import that file and compare both players.
9. Read representative lessons, answer a check incorrectly, review the idea, ask Pip for help, return to saved final code and test Hear/Stop voice with the actual device speech engine. Inspect the new lesson and check layouts at the same widths and text settings.

These are outstanding verification items, not claims that an unfinished language parser or placeholder level is complete. The implementation uses the real engines and complete mission definitions; browser/device compatibility still needs direct validation.
