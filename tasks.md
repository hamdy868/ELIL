# ELIL — Implementation Tasks (2 days)

Source of truth: `spec.md`. Every task below points to spec sections and acceptance criteria (AC). A task is finished only when its tests pass.

## Rules for every task

1. Read the listed spec sections first. Do not change `spec.md`. If something is missing, ambiguous or wrong, stop and ask.
2. Write the tests for the listed AC **first** (test names contain the AC ID), watch them fail, then implement.
3. Game rules go in pure modules (no DOM, no Canvas). Rendering and input are thin layers on top.
4. Every number lives in `constants.js` with the exact name used in the spec. No magic numbers elsewhere.
5. Placeholder art only (rectangles, circles). Do not wait for sprites.
6. Touch only the files the task needs. Do not refactor unrelated code.
7. At the end, run all tests, then append one line to `docs/trace.md`: `Txx | AC covered | commit message`.

### Prompt template for each session

```
Read spec.md sections <list> and tasks.md task <Txx>.
1) Write failing tests for <AC list>.
2) Implement the minimum code to pass them.
3) Run all tests and report results.
Do not edit spec.md. Do not add features not in the spec. Ask if anything is unclear.
```

## Suggested structure

```
index.html
assets/                  elil_menu_bg_exciting_lowres.png, sprites later
src/constants.js         every tunable number
src/rng.js               seeded RNG
src/physics.js           movement, drag, collision (pure)
src/oxygen.js            oxygen rules (pure)
src/ear.js               ear pressure rules (pure)
src/hunting.js           shots, arrows, hits (pure)
src/fish.js              fish states and behaviors (pure)
src/world.js             terrain data, zones, crevices, spawning
src/economy.js           money, upgrades, save/load
src/game.js              fixed-timestep loop, dive state machine
src/render.js            Canvas drawing
src/ui.js                HUD and screens
tests/                   one file per module
docs/trace.md            task → AC → commit log (for the presentation)
```

## Day 1 — a playable dive

### Morning: foundation and movement

**T01 Project setup** (est. 40 min)
- Spec: 0.3, 0.4, 8.1
- Build: structure above, `index.html` with a 384×216 canvas scaled by integer factors with `image-rendering: pixelated`, fixed-timestep loop (1/60 s), `constants.js`, seeded RNG, `node --test` working with one trivial test.
- Done when: AC-8.11 passes (crisp integer scaling on resize) and `node --test` runs.

**T02 Movement and physics** (est. 1 h 30)
- Spec: 6.1, 6.2, 6.3
- AC: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.8, 5.3
- Build: input module, diver as placeholder circle, acceleration, drag, diagonal normalization, mouse-facing, camera follow with smoothing (30 m wide window), surface and seabed bounds, dive-start velocity.
- Done when: the diver swims freely with inertia on a flat test seabed.

**T03 World, rocks and collision** (est. 1 h 30)
- Spec: 5.1, 5.2 (rocks only), 6.2
- AC: 5.1, 5.2, 5.8
- Build: terrain as fixed data (seabed slope from 15 m at left to 40 m at right, a set of rocks), sliding collision, zone detection (shallow below 15 m).
- Done when: the diver slides along rocks, and terrain is identical on every dive.

### Evening: the core pressure loop

**T03b Fix rock placement** (est. 30 min) — *added after playtesting T03*
- Spec: 5.2
- AC: 5.10, 5.11 (plus the existing 5.1, 5.2, 5.8 must still pass)
- Build: rocks defined as formations by x position and radius, with the vertical position **computed from the seabed profile** (never typed by hand). Add a pure validator and tests that check every rock against AC-5.10 and AC-5.11. Draw rocks before the seabed.
- Done when: no rock floats, none is buried more than half, and the terrain is still identical on every call.

**T04 Oxygen and dive end** (est. 1 h 30)
- Spec: 1, 5.6
- AC: 1.1–1.11, 5.6, 8.1, 8.2
- Build: oxygen module with the ascent-oxygen formula, oxygen bar with marker, dive state machine (diving → success at surface, or blackout), a minimal result text.
- Done when: the oxygen numbers in AC-1.x match and the marker flashes correctly.

**T05 Ear pressure** (est. 1 h 15)
- Spec: 2
- AC: 2.1–2.11, 6.5, 8.3, 8.4, 8.5
- Build: ear module, E key, indicator, injury flag and descent block, pain slowdown.
- Done when: a descent to 40 m without E ends in injury before 40 m, and E changes debt and oxygen exactly as specified.

**T06 Hunting** (est. 1 h 30)
- Spec: 3, 3.1
- AC: 3.1–3.6 (and 3.7–3.11 once fish exist in T07)
- Build: hold-to-raise, release-to-fire, reload timer and indicator, arrows with rock collision and range limit, one dummy target fish to test hits.
- Done when: arrows behave per AC-3.1 to 3.6.

> End of Day 1 target: a playable placeholder dive with movement, oxygen, ear pressure and shooting. Commit and tag `day1`.

## Day 2 — creatures, world, economy, polish

### Morning: life in the water

**T07 Fish framework, sardine and seabream** (est. 1 h 30)
- Spec: 4, 3.2
- AC: 3.7, 3.8, 3.9, 3.10, 3.11, 4.1, 4.6
- Build: ROAM / FLEE / return states, flee distances by size, raised-weapon multiplier, sardine school of 15, seabream near rocks fleeing to cover, spawning for the shallow zone.
- Done when: the flee distances match AC-3.7 to 3.9 and one shot catches exactly one sardine.

**T08a Crevices, hide slots and grouper** (est. 1 h 15)
- Spec: 0.4, 4, 4.1, 5.2, 5.5
- AC: 4.2, 4.8 (retreated grouper part), 5.7, 5.9 (deep part, groupers only), 5.13, 5.14
- Build: 8 crevices built from rock formations, hide slots (60/25/15) filled from the seeded RNG, a fresh seed per dive in the running game (also for the shallow spawn from T07), the grouper with front and retreated positions.
- Done when: the 1000-dive slot test passes, the crevice validator passes, and the same seed gives the same dive.

**T08c Rework grouper and crevice variety** (est. 1 h) — *added after playtesting T08a*
- Spec: 3.2, 4, 5.2
- AC: 4.9, 4.10, 4.11, 5.17 (and 4.2, 5.14 must still pass). **AC-4.8 changed**: the old "retreated grouper cannot be hit" test must be replaced by AC-4.10 and AC-4.11.
- Build: grouper retreat distance `GROUPER_RETREAT_DIST = 3.0` m (3.9 m with the weapon raised), retreated grouper stays hittable with a clear line, and crevices that differ in width and wall height (fixed data).

**T08b Moray eel** (est. 45 min) — *cut after the dentex if time is short*
- Spec: 4.1
- AC: 4.4, 4.8 (moray part)
- Build: a moray in every crevice whose slot is moray; it lunges when the player is within 1.5 m of the mouth, costs 10 oxygen once, retracts, 3 s cooldown; arrows ignore it.

**T09 Jellyfish and dentex** (est. 1 h) — *first to cut if time is short*
- Spec: 4, 4.1
- AC: 4.3, 4.7
- Build: jellyfish drift and contact effect, dentex circling and approach when the player is still.

**T10a Light, darkness and creature visibility** (est. 1 h) — *never cut: this is what makes searching fun*
- Spec: 5.3, 8.3 (low-oxygen effect)
- AC: 5.4, 5.5, 5.15, 5.16, 8.6, 8.7
- Build: darkness overlay by depth, the light circle, creatures drawn only where the visibility rule allows, low-oxygen edge darkening.

**T10b Parallax** (est. 30 min) — *cut if time is short*
- Spec: 5.4
- Build: three parallax layers with placeholder shapes (far 0.2, mid 0.5, near 1.2).

### Evening: economy, screens, deploy

**T11 Economy and saving** (est. 1 h)
- Spec: 7
- AC: 4.5, 7.1–7.8
- Build: selling at the surface, four upgrades with two levels, sequential purchase, `localStorage` with in-memory fallback, reset.
- Done when: all AC-7.x pass, including reload persistence.

**T12 Screens** (est. 1 h 15)
- Spec: 8.4
- AC: 8.8, 8.9, 8.10, 8.16
- Build: main menu with the background image (**menu only**, never in gameplay), Play / Equipment / How to Play / Settings enabled, the other three disabled with "Coming soon", Equipment cards, result screens.

**T12b How to Play screen** (est. 45 min) — *do not cut*
- Spec: 8.6
- AC: 8.12, 8.13, 8.14, 8.15
- Build: seven-page instructions screen reachable from the main menu. Numbers in the text must come from `constants.js` (AC-8.15 proves it).

**T13 State effects** (est. 45 min)
- Spec: 8.3
- Build: edge pulses for ear stages, injury message, blackout fade, hit flashes.

**T14 Sprites swap** (est. 1 h) — *the art is ready in assets/, see assets/MANIFEST.md*
- Spec: 8.1, 8.5
- Build: replace the placeholders with the sprites, in this order: diver, fish, rock and seabed tiles, seagrass. Facing follows the movement direction (flip horizontally). Animate by alternating frames (about 4 frames per second, faster when swimming fast). Aiming rotates the swim sprite toward the mouse and draws the speargun as a short line in code. Fill rock circles with the rock tile clipped to the circles, and the seabed with the sand tile. Draw seagrass before the seabed fill. Logic and hit radii must not change, and all tests must still pass.

**T15 Tuning pass** (est. 45 min)
- Play five full dives. Change only `constants.js`. If a number changes, tell the author so `spec.md` is updated first.

**T16 Deploy and presentation trail** (est. 45 min)
- Publish on GitHub Pages and test the public link in a clean browser.
- `README.md` with how to play and how to run the tests.
- Check `docs/trace.md` is complete: it is the evidence for the presentation (spec → tests → code).

## Revised order after the T08a playtest

T10a (darkness and visibility) → T08c (grouper and crevice variety) → T09 (jellyfish and dentex) → T08b (moray) → T11 → T12 → T12b → T13 → T10b (parallax) → T14 → T15 → T16.

## If time runs short, cut in this order

1. Dentex (T09 part 2), then moray (T08 part 2).
2. Catch net upgrade (T11 part).
3. Parallax (T10b).
4. Jellyfish animation polish and hit flashes (T13 part).

Never cut: oxygen, ear pressure, hunting, light and darkness (T10a), selling and upgrades, saving, the How to Play screen. They are the game.

## Art track (for the author, parallel to the code)

Generate with the AI tool in this order, one consistent pixel-art style, transparent backgrounds: diver (side view, long fins, swim and aim poses), sardine, seabream, grouper, rocks and seabed tiles, seagrass, jellyfish, dentex, moray, boat, simplified seahorse logo. Match the palette in the main-menu image.
