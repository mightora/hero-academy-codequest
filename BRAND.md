# Hero Academy — brand, look and feel

Version 1.0 · 13 October 2026

This is the reference for building another app in the Hero Academy family. It captures the current reading game's visual identity and the agreed interaction style: an original superhero adventure, pictures before explanations, quiet play, and help without punishment.

The guide was checked against the application source at commit `f8f2e54`. It is a source-based design specification, not a claim that every screen has passed visual or accessibility testing. Where the prototype uses slightly different shades or sizes, the canonical values below are the defaults for new work.

## 1. Brand foundation

| Item | Direction |
| --- | --- |
| Brand name | Hero Academy |
| First product | Hero Academy Reading |
| Purpose | Help children grow skills and confidence through enjoyable adventures. |
| Primary audience | Children aged approximately 5–11, including children who find reading difficult. |
| Supporting audience | Parents, teachers and other trusted grown-ups. |
| Personality | Warm, adventurous, encouraging, playful and calm. |
| Child's role | The child is the hero: choosing, exploring, helping and repairing. |
| Emotional outcome | “I can try. I can get help. My actions make a difference.” |
| Learning stance | Teach and practise explicitly; distinguish assistance from independent performance. |

Use **Hero Academy** as the family identity. A future product may be named **Hero Academy Maths** or **Hero Academy Money**; these are naming examples, not cleared product names. Keep the umbrella identity consistent and let the subtitle describe the subject. Do not invent an unrelated logo and visual style for each subject.

The name is a working brand, not a confirmed trade-mark-cleared identity. No open-source licence has been selected for the repository.

## 2. Recognisable signatures

A new app should immediately share these characteristics:

1. Cream page backgrounds with deep teal text and framing.
2. Muted green environments, warm orange actions and golden rewards.
3. Original flat SVG illustration with soft shapes and rounded strokes.
4. A customisable hero and Pip, the friendly robot companion.
5. Large controls, rounded cards, letter tiles and gentle physical shadows.
6. Short child-facing labels supported by pictures.
7. Quiet-by-default play; voice only when requested.
8. Visible consequences: a place lights up, a lift rises, a friend is rescued.
9. Mistakes lead to useful help, not lost lives or shame.
10. Detailed instructions and settings live in Grown-ups.

## 3. Identity and logo

### Header identity

The current header uses a teal shield with a golden star-like mark, alongside the uppercase **HERO ACADEMY** wordmark in Arial at weight 900. The header wordmark is approximately 19px on desktop and 15–17px on small screens. This uppercase treatment belongs to the identity; do not apply it to reading exercises or long text.

The CSS shield uses this shape:

```css
clip-path: polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%);
```

The standard header mark is 42 × 46px, with smaller versions in compact game bars. Do not distort its proportions.

### App icon

Reuse [`dist/icon.svg`](dist/icon.svg). It has a 192 × 192 viewBox, a rounded deep-teal outer square, an inner teal shield and a golden star. The app icon and header shield are related variants, not identical artwork.

### Usage rules

- Use the supplied SVG for favicons and app icons; preserve its geometry.
- Leave clear space of at least one quarter of the mark's width around it. This is the guide's rule for new layouts.
- Use the mark with the wordmark for the first introduction; the mark alone is suitable for compact controls and app icons.
- Put the identity on cream or deep teal surfaces, with sufficient separation from surrounding artwork.
- Keep the logo out of reading task answer choices unless identifying the brand is the purpose.
- Do not borrow existing superhero franchise marks, costumes, names or silhouettes.

## 4. Colour system

### Canonical interface palette

These values are the current root CSS tokens in [`dist/style.css`](dist/style.css).

| Token | Hex | Role |
| --- | --- | --- |
| `--ink` | `#14353B` | Main text, dark framing, primary buttons, HUD |
| `--teal` | `#126B62` | Brand shield, selected states, progress |
| `--mint` | `#D9EEE1` | Soft supportive surfaces |
| `--paper` | `#F8F5EC` | Page and dialog background |
| `--orange` | `#EF733E` | Important action accent |
| `--yellow` | `#F6D46C` | Stars, treasure and reward accent |
| `--border` | `#DBE1D6` | Quiet separators and card borders |

### Supporting shades already in use

| Colour | Hex | Use |
| --- | --- | --- |
| Warm card | `#FFFDF7` | Cards and adventure shell |
| Environment mint | `#DCEADD` | Hero scenes and supportive panels |
| World grass | `#CBDCC0` | Explorable town ground |
| Water blue | `#91BDC7` | River |
| Path sand | `#E8DFB9` | Town paths |
| Active game teal | `#15786D` | Illustrated controls and guidance |
| Correct answer surface | `#D7EDD7` | Positive feedback |
| Hint surface | `#FBEFCD` | Help and retry guidance |
| Focus orange | `#DC652E` | Keyboard focus outline |

The prototype contains related local shades. Prefer the canonical tokens for new interface components; use supporting shades deliberately for scenes rather than adding arbitrary colours.

### Hero suit colours

Keep these customisation choices consistent with [`dist/state.js`](dist/state.js):

| Suit | Hex |
| --- | --- |
| Orange | `#EC7540` |
| Teal | `#13786E` |
| Blue | `#586CCA` |
| Berry | `#AD4B7F` |

The orange suit is intentionally a different shade from the orange interface action token.

### Colour behaviour

Use deep teal text on light surfaces, cream/white text on deep teal, and dark text on orange or yellow controls. Colour alone must not signal correctness, selection or locking: pair it with a tick, border, shape, lock icon or accessible label.

For new work, check contrast: target at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for essential control boundaries and graphical information against adjacent colours. These are acceptance targets, not a certification of the current app.

## 5. Typography and readable text

Use the existing local system stack:

```css
font-family: Arial, Helvetica, sans-serif;
```

No webfont download is required. Avoid decorative comic lettering for instructions, words or answer choices. Do not claim a font treats dyslexia.

| Role | Existing reference size | Guidance for new apps |
| --- | --- | --- |
| Base interface | 16px | Retain as a general baseline |
| Main game heading | 21–27px | Short, bold, easy to scan |
| Reading word or tile | 27–34px before scaling | Keep prominent and separate from decoration |
| Story passage | 24px before scaling | Generous line height, approximately 1.8 |
| Child action | 16–20px | Short label plus a picture |
| Adult body text | 14–16px | Connected prose and headings are appropriate |
| Secondary map label | 11–12px | Never the only way to understand a required action |

The existing app provides reading scale choices of 1, 1.15 and 1.3, and letter-spacing choices of 0, 0.04em and 0.08em. Preserve user preferences. Avoid forcing increased spacing for everyone.

Use the mild negative tracking of the current headings only on interface titles. Reading words, passages and tiles need clear, uncompressed letter spacing. Avoid justified paragraphs and long all-capital instructions.

## 6. Illustration and character system

### Overall art direction

Use flat, original, friendly 2D artwork: rounded geometric shapes, matte fills, muted natural colours, clear silhouettes and restrained detail. Prefer editable SVGs for interface icons, object pictures, landmarks and simple characters. Subtle ground shadows are useful; glossy 3D, photorealism and intense neon effects do not match this identity.

The map is a welcoming town with paths, water, trees, workshops, gardens and signal towers. The player's purpose is to help and restore, not to frighten or destroy.

### The hero

Reuse `hero()` in [`dist/art.js`](dist/art.js), which has a 200 × 240 viewBox. Its identity includes a friendly face, dark teal mask and boots, selectable suit colour, pale gold chest emblem and optional golden cape. Emblems are star, diamond and lightning bolt.

Preserve proportions and silhouette when creating new poses. New skin tones, hairstyles or other character variants may extend the family; they should share the same proportions, friendly expression, palette relationships and level of detail. Do not treat the current single character appearance as a restriction on who can be a hero.

### Pip

Reuse `robot()` in [`dist/art.js`](dist/art.js), which has a 140 × 170 viewBox. Pip has a warm gold/orange body, rounded rectangular head, dark teal face panel, mint eyes, a small smile, an antenna and a light chest badge.

Pip is a companion and source of help. Pip does not continuously narrate, scold, mock mistakes or interrupt play. Additional robots may have alternate colours while retaining the recognisable design language.

### Object pictures

Reuse the style of [`dist/objects.js`](dist/objects.js): 130 × 130 object illustrations with simple, recognisable shapes. Pictures used as answer choices must be distinguishable and reviewed for ambiguity. Decorative detail must not reveal or confuse the intended learning answer.

### Landmarks and world

Reuse `landmark()` and `terrain()` in [`dist/adventure.js`](dist/adventure.js). Landmarks use a 130 × 120 viewBox; the town uses a 1000 × 660 logical coordinate space. Repair states use warmer accents and visible changes, with ticks marking completed places.

The fixed map coordinates are specific to this game. A future app can use different world geometry while retaining the same palette, drawing style and interaction conventions.

## 7. Icons and picture prompts

The existing line icon system uses a 24 × 24 viewBox, 1.8-unit strokes, round caps and round joins. Use `icon()` in [`dist/art.js`](dist/art.js) as the reference.

Picture instructions use 64 × 64 illustrations in soft rounded containers. The current sequence is hear/read → tap/swap → check. Extend this vocabulary gradually rather than inventing a different symbol for the same action in each app.

The prototype also uses emoji and text glyphs for speakers, navigation and locks. Their appearance varies by device. For a new app, prefer the original SVG icon family for consistent rendering; preserve the established meaning of each control.

Decorative SVGs use `aria-hidden="true"`. Functional icon-only buttons need clear accessible labels. Never remove text labels needed by an adult or screen-reader user simply to make the screen look cleaner.

## 8. Components and surfaces

| Component | Visual and interaction contract |
| --- | --- |
| Primary button | Deep teal background, light text, 12px radius, bold label |
| Quest start/next | Warm orange background, dark text; play/arrow symbol |
| Secondary button | Warm white surface, dark text, quiet border |
| Selected choice | Teal border and pale mint fill, plus accessible selection state |
| Letter tile | Warm white, 2px border, 12px radius, small downward shadow |
| Empty word slot | Pale mint with dashed outline; clear tap-to-remove behaviour when filled |
| Hint | Warm pale yellow; highlights the relevant step or tile |
| Correct feedback | Mint surface, tick/star, small visual celebration |
| Card | Warm white, 16–20px radius, subtle border |
| Main game shell | 24px desktop radius, approximately 18px on phones |
| Keyboard focus | 3px orange outline, 4px offset |
| Adult panel | Bordered light surface with clear headings and readable explanations |

Use short shadows that make controls feel tangible. For example, the choice cards use a 4px downward shadow. Avoid strong floating-card shadows everywhere.

Use an 8px spacing rhythm as a **new-work convention**: 8, 16, 24 and 32px. The prototype has local spacing differences; this is not an exact inventory of every margin. Maintain clear separation between the world, activity, feedback and main action.

## 9. Screen patterns

### Exploration

A dark teal HUD frames the town. The hero moves when a location is tapped; a compact quest panel explains the selected place using a picture and a short label. **Go** starts the activity. **Next** finds the next quest; movement controls remain visible on phones. Treasures are optional and separate from reading performance.

### Learning challenge

Separate the illustrated consequence from the calm task area. Show a word, picture choice or tiles clearly. Keep **Hear**, **Slow**, **Help**, **Reset** and **Check/Next** predictable. Help focuses on the relevant error. Successful tasks visibly power a system or help a character.

Do not add intense movement behind the word or a compulsory time limit. A visual demonstration should be brief and repeatable.

### Rewards

Show the character, collected object and stars. Use short action labels to return to the world or visit the hero. No compulsory spoken celebration, random paid rewards, loot boxes or pressure to preserve a streak.

### Grown-ups

Use fuller explanations for settings, practice records, backups and learning limitations. Keep these out of the child's required flow. A child should not need to read an adult paragraph or type a name before beginning play.

## 10. Writing and voice

### Child-facing language

Default to one or two words: **Play**, **Go**, **Hear**, **Slow**, **Help**, **Check**, **Next**, **Hero**, **Map**, **Reset**. Reading passages can be longer when they are the task itself; menus and navigation should not become extra reading tests.

| Situation | Preferred | Avoid |
| --- | --- | --- |
| Start | “Play” with a clear symbol | “Commence your learning experience” |
| Retry | A retry picture and available help | “Wrong”, “Failed”, “You lost” |
| Success | Tick, star; optional “Well done!” | Mandatory long congratulatory speech |
| Help | Show the next step | Repeating a long instruction paragraph |
| Adult record | “Completed with support” | “Passed”, “Mastered” without adequate evidence |

Use UK English in interface copy. Learning content and pronunciation require review for the intended learners' accent and dialect.

### Audio identity

The requested delivery is a gentle, female-sounding English voice. This is a preference, not an available browser gender setting or a guarantee of a particular voice.

- Quiet play is the default: opening a screen, moving, checking answers and collecting rewards must not trigger an unsolicited spoken instruction.
- Word/story speech starts after a speaker button is tapped.
- Whole-word voice pace is 0.85 by default; options are 0.75, 0.85 and 1. Slow replay uses 0.65.
- Keep pitch at 1 and volume at 1; do not artificially raise pitch to imitate a female voice or lower volume so far that speech is hard to hear.
- Prefer suitable English voices; British English is a preference. Let grown-ups preview and save their choice.
- Stop previous speech before replaying; provide a Stop control.
- Keep optional direction prompts short, such as “Hear. Tap.”
- General device speech is not a model for isolated phonemes. Sound teaching needs reviewed recordings.

See [`dist/audio.js`](dist/audio.js) for the current implementation.

## 11. Motion and feedback

Motion communicates an outcome or a possible action. It must not dominate the learning task.

Existing references: walking transitions approximately 0.5 seconds; lift progression approximately 0.55 seconds; reward feedback approximately 0.6 seconds; a gentle quest-marker bob approximately 2.6 seconds. Decorative looping cues should be limited to where they help find an action.

Respect both `prefers-reduced-motion` and the in-app Reduce animation setting. Reduce or remove movement, smooth scrolling and decorative loops; retain the completion state, focus, selected answer and outcome. No flashing celebrations or shaking entire screens for a mistake.

## 12. Phone and accessibility rules

- Design child controls for touch as well as keyboard.
- Use at least 44 × 44 CSS-pixel touch areas; prefer 48–56px for frequent child actions. This is the guide's acceptance target, not a claim that all existing controls meet it.
- Provide visible focus and meaningful labels; ensure logical keyboard order and dialog focus behaviour.
- Never make drag-and-drop the only way to answer; tapping tiles must work.
- Use `viewport-fit=cover`, safe-area padding and dynamic viewport heights on iPhone.
- The page must not overflow horizontally. An exploration world may pan inside its clearly bounded viewport.
- Phone reading dialogs can fill the screen, with reachable close and primary action controls.
- Preserve scroll position while answering; resizing text must not hide the essential action.
- Current narrow breakpoints are 700px and 380px; also check short landscape screens.
- Verify representative 320, 375, 390 and 430px phone widths, tablet and desktop layouts, portrait/landscape, enlarged reading text and reduced motion.
- Test audio and visual layout on actual iPhone Safari before claiming support has been verified.

Accessibility adjustments are part of the identity, not a different visual theme. Do not claim the design cures dyslexia or has clinically proven outcomes.

## 13. Extending the family

Keep the shell, identity, palette, component treatment, Pip, icon vocabulary, voice controls and accessibility behaviour consistent. Change the world, task objects and subject content to fit the new learning goal.

For example, a money game can use shops and coin sorting; a maths game can use power cells and quantities. The task must have a believable consequence in the adventure. Do not assume a reading app's phonics progression is suitable for another subject.

Separate cosmetic/game progress from learning records. Keep the parent explanation accurate about what is measured and how help affects the record.

### Asset reference

| Need | Starting point |
| --- | --- |
| App icon | [`dist/icon.svg`](dist/icon.svg) |
| Shared colours and component treatment | [`dist/style.css`](dist/style.css) |
| Hero, Pip and line icons | [`dist/art.js`](dist/art.js) |
| Object-picture style and rescue scene | [`dist/objects.js`](dist/objects.js) |
| Town and landmark style | [`dist/adventure.js`](dist/adventure.js) |
| Voice behaviour | [`dist/audio.js`](dist/audio.js) |
| Current screen flow | [`dist/app.js`](dist/app.js) |

## 14. Brief for a future coding or design agent

Copy this with the relevant assets into the next project:

> Build this app as part of the Hero Academy family. Read BRAND.md and inspect the referenced SVG and CSS assets before designing. Retain the cream/deep-teal palette, muted green environments, orange actions, golden rewards, original rounded flat SVG style, customisable hero and Pip. Use large touch controls, picture-led navigation and very short child labels. Play is quiet by default; speech happens only when requested. Make learning actions visibly help the adventure. Keep the task area calm and put adult explanations in Grown-ups. Preserve keyboard access, text adjustments, reduced motion and iPhone safe areas. Change the subject and world content while keeping the identity and interaction conventions consistent. Do not copy existing superhero franchises or claim dyslexia treatment/diagnostic accuracy. State which features and device checks are actually complete.

## 15. Acceptance checklist

Before delivering a new family app, confirm:

- [ ] Identity and palette match this guide and supplied assets.
- [ ] New illustration looks like it belongs beside Pip and the existing hero.
- [ ] Navigation can be understood through pictures and short labels.
- [ ] Learning text is prominent and free from distracting movement.
- [ ] There is no automatic stream of spoken instructions.
- [ ] Help is useful; mistakes do not remove lives or shame the child.
- [ ] Learning actions have visible consequences in the adventure.
- [ ] Colour is not the only indication of state.
- [ ] Keyboard, touch, enlarged text and reduced motion have been checked.
- [ ] Actual iPhone testing is reported accurately.
- [ ] Adult explanations distinguish support, practice and independent performance.
- [ ] Asset provenance and learning/effectiveness claims are accurate.

Update this guide when a family-wide design decision changes. Reference the guide in future project briefs rather than relying on a screenshot alone.
