# ELIL — Game Specification (Spec v1)

> A freediving spearfishing game for the browser. ELIL means "the sea" in Amazigh. The setting is inspired by the sea of Zuwara, Libya.
> Method: Spec-Driven Development. Build time budget: 2 days.

This file is the source of truth. If code and spec disagree, fix the code or update the spec first. Do not invent rules, numbers or features that are not written here. If something is missing or ambiguous, stop and ask.

## 0. Overview

### 0.1 Conventions

Every rule carries a tag:

- `[SOURCE]` — grounded in scientific references (see section 11).
- `[GAMEPLAY]` — a design choice or number of ours. It is expected to be tuned by playtesting, so keep every such number in one constants file.

Units: meters (m), seconds (s). Depth is positive downward. Depth 0 is the surface.

### 0.2 Vision

A diver spearfishes among rocks at increasing depths. Every second drains breath, so the player balances greed (one more fish) against survival (going up).

### 0.3 Technical decisions

| Item | Decision |
|---|---|
| Platform | Web, desktop browser only, deployed on GitHub Pages |
| Stack | HTML5 Canvas + plain JavaScript (ES modules). No frameworks, no bundler, no server |
| Persistence | `localStorage` (money and upgrade levels only) |
| Look | Pixel art, calm mood, depth through parallax and lighting |
| Diving style | Freediving (breath-hold, no tank) |
| Controls | Keyboard + mouse, free movement in all directions |
| UI language | English in v1 |

### 0.4 Implementation requirements (for the coding agent)

- Game rules (oxygen, ear pressure, hunting, economy, fish behavior) live in **pure modules with no DOM or Canvas access**, so they can be unit-tested in Node (`node --test`) without a browser.
- All tunable numbers live in one `constants.js`, named exactly as in this spec (for example `OXYGEN_MAX_BASE`).
- The simulation uses a fixed timestep (1/60 s) so that tests are deterministic.
- Randomness goes through an injectable seeded RNG so tests can control it.
- Write the tests from the acceptance criteria in section 9 **before** implementing each system. Test names must contain the criterion ID (for example `AC-1.5`).
- Placeholder art first: colored rectangles and circles. Final sprites replace them without changing logic.

### 0.5 Core loop (one dive = 2 to 3 minutes)

1. Start from the boat and descend.
2. Search for fish among rocks and crevices.
3. Hunt with the speargun.
4. Oxygen drains and ear pressure builds. Decide: continue or ascend.
5. Reach the surface anywhere. The catch is sold automatically.
6. Buy an upgrade and dive deeper.

## 1. Oxygen (breath)

- The diver starts every dive with `OXYGEN_MAX` units, base `OXYGEN_MAX_BASE = 100`. `[GAMEPLAY]`
- Consumption per second = `movementFactor × weightFactor`.

| Factor | Value | Tag |
|---|---|---|
| `MOVE_IDLE` (no movement key held) | 0.7 | `[GAMEPLAY]` |
| `MOVE_SWIM` (movement key held) | 1.0 | `[GAMEPLAY]` |
| `MOVE_FAST` (Shift + movement key held) | 1.8 | `[GAMEPLAY]` — higher effort drains oxygen faster `[SOURCE]` |
| `weightFactor` | `1 + WEIGHT_PER_FISH × fishCarried`, base `WEIGHT_PER_FISH = 0.03` | `[GAMEPLAY]`, reduced by the net upgrade |

- **Instant costs:** `EQUALIZE_COST = 5` per E press, `SHOT_COST = 1` per shot. `[GAMEPLAY]`
- **Last 10 m of ascent:** while depth ≤ `ASCENT_RISK_DEPTH = 10` and the diver is moving toward the surface, consumption is multiplied by `ASCENT_RISK_MULT = 1.5`. `[SOURCE]` (blackout risk peaks in the final stage of ascent as oxygen partial pressure falls); numbers `[GAMEPLAY]`.
- There is **no depth factor** in consumption. The real cost of depth is the length of the way back, covered by the ascent-oxygen indicator below.
- **Oxygen reaches 0 (blackout):** the diver loses consciousness and is pulled to the surface. The player loses **the entire catch of this dive only**. Money and upgrades are kept.

### 1.1 Ascent oxygen (point of no return)

Constants: `ASCENT_SPEED = 1.5` m/s, `ASCENT_SAFETY = 1.25`. `[GAMEPLAY]`

```
required = weightFactor × ASCENT_SAFETY ×
           ( max(depth − 10, 0) / ASCENT_SPEED × 1.0
           + min(depth, 10)     / ASCENT_SPEED × ASCENT_RISK_MULT )
```

When `oxygen <= required`, the ascent-oxygen marker on the oxygen bar flashes red. `[GAMEPLAY]`

## 2. Ear pressure

**Scientific basis `[SOURCE]`:** pressure doubles at 10 m and triples at 20 m. The biggest relative change is near the surface, so equalizing is needed often in the first meters and less often deeper. During ascent pressure equalizes automatically. Pain means the diver must ascend a few meters.

**Ear debt** is an internal gauge from 0 to `EAR_DEBT_MAX = 100`.

```
while descending:  debt += EAR_BASE_RATE / (1 + depth / 10) × metersDescended
fast descent:      the increase is multiplied by FAST_DESCENT_MULT = 1.5
                   (fast descent = downward speed > FAST_DESCENT_SPEED = 2.0 m/s)
```

The curve shape is `[SOURCE]`. `EAR_BASE_RATE = 8` and the multiplier are `[GAMEPLAY]`.

| Debt | Stage | Effect |
|---|---|---|
| 0–39 | NORMAL | none |
| 40–69 | WARNING | visual only: screen edges pulse light blue (no audio in v1) |
| 70–99 | PAIN | max swim speed × `PAIN_SPEED_MULT = 0.7` |
| 100 | INJURED | cannot descend deeper than the depth where debt reached 100, until the dive ends |

- **E press:** reduces debt by up to `EQUALIZE_REDUCTION = 40` (never below 0) and **always** costs `EQUALIZE_COST` oxygen, even when debt is 0. This discourages spamming. There is no cooldown. `[GAMEPLAY]`
- **Ascent:** every meter ascended reduces debt by `ASCENT_DEBT_RELIEF = 10`. E is not needed while ascending. `[SOURCE]`
- Injury is a flag for the dive: once set, it stays until the dive ends even if debt later drops.
- Debt and the injury flag reset when a new dive starts.
- **There is no special penalty for ascending fast.** The only ascent rule is the last-10-meters multiplier in section 1. (A temporary-injury penalty was considered and removed: it models decompression sickness, a scuba risk, not a freediving one.)
- Reference cost: a full dive to 40 m needs about 4 E presses (20 oxygen); with fast descent about 5 (25 oxygen).

## 3. Hunting (speargun)

| Item | Value |
|---|---|
| `SPEAR_RANGE` | 6 m base (upgrades: 7, then 8) |
| `RELOAD_TIME` | 1.5 s after each shot |
| Ammo | unlimited, one shot loaded at a time |
| `ARROW_SPEED` | 18 m/s, no gravity |
| `SHOT_COST` | 1 oxygen |
| Aim | mouse, 360° |
| Hit | the arrow hits a fish: the fish goes straight into the catch |
| Miss | the arrow sticks in a rock, or disappears at max range |
| Rocks | arrows never pass through rocks, so a fish behind a rock cannot be hit |

All values `[GAMEPLAY]`.

### 3.1 Firing and "raised" weapon

- The weapon always points toward the mouse.
- **Raised** = the left mouse button is held down. **Releasing** it fires if the weapon is loaded. If it is still reloading, nothing is fired and nothing is charged.
- While raised, fish flee earlier (below).

### 3.2 Fish flee distances

| Size | `FLEE_DIST` |
|---|---|
| small | 2.5 m |
| medium | 4 m |
| large | 5.5 m |

- `[SOURCE]` direction: large and heavily hunted fish flee from farther away (4–5 m in fished areas versus 2–3 m in reserves), and fish tell a diver carrying a speargun from one without. The **exact numbers are `[GAMEPLAY]`**.
- While the weapon is raised, flee distance is multiplied by `AIMING_FLEE_MULT = 1.3`. `[GAMEPLAY]` For a large fish this is 7.15 m.
- Because 5.5 m is close to the base range of 6 m, large fish can only be taken by a slow approach, from behind a rock, or with the range upgrade.
- Fish inside crevices can only be hit from an angle that has a clear line of sight.
- The **zone caution** mechanic (fish get warier as you hunt) is **out of scope** (see section 10).

## 4. Creatures

Every fish has three states: **ROAM**, **FLEE** (when the player comes within its flee distance), and back to **ROAM** after `RETURN_TO_ROAM_DELAY = 3` s with the player outside the flee distance. `[GAMEPLAY]`

| Type | Size | Zone | Value | Behavior | Flee speed* |
|---|---|---|---|---|---|
| Sardine | small | shallow | 5 | School of 15 moving together. One shot catches one fish | 1.4 |
| White seabream | medium | shallow | 20 | Roams within 3 m of rocks and flees toward the nearest rock | 1.1 |
| Grouper | large | deep | 80 | Waits at the mouth of a crevice and **retreats inside** when the player is within flee distance. It comes back out if the player stays at least 8 m away for 4 s | 0.8 |
| Dentex | large | deep | 120 | Fast. Circles within 15 m of its home point and approaches when the player is still (speed < 0.3 m/s for 1.5 s) | 1.5 |

*Relative to the player's normal swim speed (1.0). All values `[GAMEPLAY]`. A retreated grouper cannot be hit.

### 4.1 Hazards

| Hazard | Zone | Behavior | Effect |
|---|---|---|---|
| Jellyfish | both | Floats slowly and bobs; easy to avoid | On contact: −8 oxygen and swim speed × 0.5 for 2 s. No stacking while slowed |
| Moray eel | deep | Lives only in crevices whose slot is "moray". Lunges when the player is within 1.5 m of the crevice mouth | −10 oxygen once, then retracts. 3 s cooldown |

All values `[GAMEPLAY]`.

If time runs short, cut in this order: dentex first, then moray eel. The game stays complete with four creatures (sardine, seabream, grouper, jellyfish).

> Species are well-known Mediterranean fish, but their abundance near Zuwara has **not been verified**. Verify before claiming it in the presentation.

## 5. World

| Item | Decision |
|---|---|
| `WORLD_WIDTH` | 120 m (adjustable) |
| `WORLD_DEPTH` | 40 m, from the surface (0) to the deepest seabed; cannot go below the seabed |
| Boat | At the surface, at x = 60 m. Start point and visual only |
| Sides | Invisible walls on both sides |
| Terrain | **Fixed**: identical every dive, stored as data. Randomized terrain is out of scope |

### 5.1 Zones

| | Shallow | Deep |
|---|---|---|
| Depth | 0–15 m | 15–40 m |
| Seabed | Posidonia seagrass and open rock groups | Rock walls, crevices, small caves |
| Fish | sardine, seabream, jellyfish | grouper, dentex, moray, jellyfish |
| Feel | calm, safe, good for learning | tense, higher reward |

The seabed slopes from about 15 m at the left edge to 40 m at the right edge, so the player chooses how far to venture from the boat. `[GAMEPLAY]`

### 5.2 Rocks and crevices `[GAMEPLAY]`

- Rocks are solid. The diver cannot enter them and slides along their surface with no rebound.
- **Rocks rest on the seabed. No rock floats in open water.** Every rock circle is either **grounded** (its lowest point touches the seabed, and it is embedded in the seabed by at most half of its radius) or **stacked** (it rests on top of another supported rock: it overlaps that rock and its center is higher).
- Rocks are grouped into **formations**: mounds of 1 to 4 overlapping circles. Collision uses the circles. The drawn look will be replaced by pixel art later.
- **Draw order:** rocks are drawn before the seabed, so the embedded part of a rock is hidden by the ground and the rock looks planted.
- A crevice is a gap between rocks, 1.2 to 2.5 m wide, closed at the back, with no other exit.
- `CREVICE_COUNT_DEEP = 8` crevices in the deep zone (provisional; finalize when the map is designed).
- Each crevice has a **hide slot** filled at the start of every dive using the seeded RNG:

| Slot content | Probability |
|---|---|
| grouper | 60% |
| moray | 25% |
| empty | 15% |

### 5.3 Light and visibility `[GAMEPLAY]`

- Darkness overlay: 0% at depth 0, 60% at 15 m, 85% at 40 m, linear in between.
- Only a circle around the diver is clearly visible: `LIGHT_RADIUS = 5` m base, widened by the flashlight upgrade.

### 5.4 Parallax depth `[GAMEPLAY]`

Three background layers with relative scroll speeds: far 0.2 (ruins and haze), mid 0.5 (rocks and seagrass), near 1.2 (large seagrass passing in front of the diver).

### 5.5 Fish per dive `[GAMEPLAY]`

| Zone | Content |
|---|---|
| Shallow | sardine school of 15, 4 seabream, 2 jellyfish |
| Deep | one grouper per crevice whose slot is grouper, 2 dentex, one moray per crevice whose slot is moray, 1 jellyfish |

### 5.6 End of a dive

- **Success:** reaching depth 0 at **any** horizontal position, **after the diver has been deeper than `DIVE_ARM_DEPTH = 1.0` m at least once** (the dive itself starts at depth 0, so without this rule it would end immediately). `[GAMEPLAY]` The catch is sold automatically, lungs refill, ear debt resets to 0.
- **Failure:** blackout (oxygen 0). The catch of this dive is lost (section 1).

## 6. Controls and movement

| Input | Action |
|---|---|
| W A S D | Swim in four directions |
| Mouse | Aim, 360° |
| Left mouse button (hold, release) | Raise the speargun, then fire |
| Shift (held) | Fast swim |
| E | Equalize ear pressure |

### 6.1 Physics `[GAMEPLAY]`

| Item | Value |
|---|---|
| `SPEED_NORMAL` | 2.0 m/s max |
| `SPEED_FAST` | 3.2 m/s max |
| Acceleration | reaches max speed in about 0.5 s (about 4.0 m/s² normal, 6.4 m/s² fast) |
| Deceleration | with no keys held, velocity decays exponentially with rate 1.5 per second (about 0.1 m/s after 2 s from 2.0 m/s) |
| Diagonals | direction is normalized; diagonal speed is not higher than straight speed |
| Pain stage (section 2) | max speeds × 0.7 |
| Carrying fish | does **not** slow the diver; it only raises oxygen use (section 1) |
| Dive start | diver appears at the boat at depth 0 with initial downward velocity 1.0 m/s; the player has control immediately |

### 6.2 Collision

- The diver is a circle of radius 0.4 m.
- On touching a rock, the velocity component into the rock surface is removed and the diver keeps sliding along it.
- The diver cannot go below the seabed or above the surface (reaching the surface ends the dive).

### 6.3 Look and camera

- The diver faces left or right depending on the mouse position, tilts toward its movement direction (up to 45°), and fin sway scales with speed.
- The camera follows the diver with smoothing and shows a window 30 m wide and about 17 m tall. There is no minimap, because reaching the surface anywhere ends the dive.

## 7. Economy and upgrades

- Money starts at 0. The catch is sold automatically at the surface: sardine 5, seabream 20, grouper 80, dentex 120. `[GAMEPLAY]`
- Diving is always free, so the game can never become stuck. Failing only means a dive with no profit.
- Money and upgrade levels are saved to `localStorage` after every dive and every purchase. A **Reset** button in Settings clears everything. If `localStorage` is unavailable, the game keeps working with in-memory state.

### 7.1 Upgrades (4 upgrades, 2 levels each, bought in order) `[GAMEPLAY]`

| Upgrade | Base | Level 1 | Level 2 |
|---|---|---|---|
| Lung capacity (`OXYGEN_MAX`) | 100 | 125 (price 100) | 155 (price 250) |
| Spear range (`SPEAR_RANGE`) | 6 m | 7 m (price 120) | 8 m (price 300) |
| Flashlight (`LIGHT_RADIUS`) | 5 m | 6.5 m (price 80) | 8 m (price 200) |
| Catch net (`WEIGHT_PER_FISH`) | 0.03 | 0.02 (price 80) | 0.01 (price 200) |

Total price of everything: 1330. If time runs short, cut the catch net first.

Why these numbers matter:

- **Range 8 m:** a large fish with a raised weapon flees at 7.15 m (5.5 × 1.3). Ranges 6 and 7 cannot take it; range 8 can. The upgrade unlocks something that was impossible before.
- **Lung capacity:** a dive to 40 m uses about 78 units (descent, 3 to 4 equalizations, and 37.5 ascent oxygen), leaving about 22 units for hunting at capacity 100 and about 77 at 155.
- **Pacing:** a good shallow dive earns about 80, a good deep dive about 180. Buying everything takes 10 to 15 dives.

## 8. UI and visuals

### 8.1 Rendering `[GAMEPLAY]`

- Draw on a 384×216 canvas and scale up by integer factors with `image-rendering: pixelated` (about 12.8 px per meter). Letterbox when the window does not fit exactly. No smoothing.
- Diver about 32 px tall. Fish are drawn larger than life so they are readable: sardine 5 px, seabream 10 px, grouper and dentex 20 px.
- UI language: English.

### 8.2 HUD

| Element | Position | Behavior |
|---|---|---|
| Oxygen bar | top left | decreases with consumption |
| Ascent-oxygen marker | on the oxygen bar | a line at `required / OXYGEN_MAX`; flashes red when the bar level reaches it |
| Depth counter | top right | meters |
| Ear indicator | next to depth | green (0–39), yellow (40–69), red (70+), injury icon at 100 |
| Catch counter | bottom left | fish carried |
| Reload indicator | under the crosshair | fills over 1.5 s |
| Crosshair | at the mouse | gray while reloading |

### 8.3 State effects (visual only, no audio in v1)

| State | Effect |
|---|---|
| Ear WARNING | screen edges pulse light blue |
| Ear PAIN | edges pulse red and the image sways slightly |
| Ear INJURED | message "Ears injured – cannot dive deeper" and a red line at the current depth |
| Oxygen below 20% | screen edges gradually go black |
| Blackout | the whole image darkens, then the result screen appears |
| Jellyfish touch or moray bite | short red flash |

### 8.4 Screens

1. **Main menu:** the pixel-art background image, with a semi-transparent dark panel behind the buttons for legibility. **Play**, **Equipment**, **How to Play** and **Settings** (contains Reset) are enabled. **Locations**, **Achievements** and **Collection** are disabled and show "Coming soon".
2. **Equipment:** one card per upgrade with current level and price, and current money at the top.
3. **How to Play:** an instructions screen reached from the main menu (see 8.6). **Back** returns to the main menu.
4. **Dive result:** on success, the list of fish sold and the total profit. On blackout, "You blacked out – catch lost" with the list of what was lost.

### 8.6 How to Play screen

Purpose: the player must be able to learn every rule and the physics of the game without outside help. The screen is split into pages with Next and Back buttons (Esc or Back leaves). English text.

**Every number shown on this screen must be read from `constants.js`, never typed into the text**, so the instructions can never disagree with the game. Pages:

1. **Goal:** hunt fish, get back to the surface before your breath runs out, sell the catch, buy upgrades, dive deeper. If you black out you lose only that dive's catch.
2. **Controls:** the five inputs from section 6 (W A S D, mouse, hold-and-release left button, Shift, E).
3. **Breath:** what the oxygen bar and the ascent marker mean (when the bar reaches the marker you only have enough breath to get back, so ascend now); resting uses less, swimming and fast swimming use more; each carried fish adds weight and drains more; the last 10 m of the ascent drain faster; each shot and each E press costs oxygen.
4. **Ears:** pressure builds as you go down, fastest near the surface; press E to equalize (it costs oxygen even if you did not need it); indicator colors for warning, pain and injury; pain slows you; injury blocks going deeper for the rest of the dive; going up relieves pressure.
5. **Hunting:** hold the left button to raise the speargun, release to fire; reload time; the arrow stops at rocks; fish flee earlier when the weapon is raised; large fish flee from far away, so approach slowly or ambush from behind a rock; the range upgrade changes what is possible.
6. **Movement physics:** you glide and slow down gradually when you release the keys; diagonal movement is not faster; carrying fish does not slow you but costs breath; Shift is faster but drains breath faster and raises ear pressure faster when descending.
7. **Fish and dangers:** each fish with its value; jellyfish (drains oxygen and slows you); moray eels (hide in crevices and strike when you come close); crevices can hold a valuable grouper, a moray, or nothing.

### 8.5 Assets (pixel art, one consistent style)

| Asset | Count | Note |
|---|---|---|
| Diver (swim + aiming pose) | 4–6 frames | side view, long fins |
| The four fish | 2 frames each | sardine, seabream, grouper, dentex |
| Jellyfish and moray | 2–3 frames each | |
| Rocks and seabed | 6–8 tileable pieces | |
| Seagrass and background layers | 3 layers | far, mid, near |
| Boat | 1 | |
| Simplified logo and seahorse | 2 | simpler than the full brand art |

Draw priority: diver, then fish, then rocks. Use placeholders until sprites arrive.
Provided asset: the main-menu background (`elil_menu_bg_exciting_lowres.png`, 384×216). The diver in that image is the author's own photo. **It is used on the main menu screen only, before Play is pressed. It must never appear during gameplay, on the Equipment screen, or on the result screen.** In-game, the diver is a separate sprite.

## 9. Acceptance criteria

Each row must become an automated test (name contains the ID). Tolerances are in parentheses. "Raised" means the left mouse button is held.

### 9.1 Oxygen

| ID | Condition | Expected |
|---|---|---|
| AC-1.1 | Idle, 0 fish | 0.7 units/s |
| AC-1.2 | Normal swim, 0 fish | 1.0 units/s |
| AC-1.3 | Fast swim, 5 fish | 2.07 units/s (±0.01) |
| AC-1.4 | Swimming toward the surface at depth ≤ 10 m, 0 fish | 1.5 units/s |
| AC-1.5 | Ascent oxygen from 40 m, 0 fish | 37.5 (±0.1) |
| AC-1.6 | Ascent oxygen from 20 m, 0 fish | 20.83 (±0.1) |
| AC-1.7 | Ascent oxygen from 40 m, 5 fish | 43.13 (±0.1) |
| AC-1.8 | E pressed | oxygen −5 |
| AC-1.9 | Shot fired | oxygen −1 |
| AC-1.10 | Oxygen reaches 0 | blackout; this dive's catch cleared; money and upgrades unchanged |
| AC-1.11 | Oxygen ≤ required ascent oxygen | warning flag is true |

### 9.2 Ear pressure

| ID | Condition | Expected |
|---|---|---|
| AC-2.1 | Descend 0 → 10 m, no E | debt ≈ 55 (±2) |
| AC-2.2 | Descend toward 40 m, no E | debt reaches 100 before 40 m (uncapped value would be ≈ 129) and INJURED is set |
| AC-2.3 | Descend 0 → 10 m at fast-descent speed, no E | debt ≈ 83 (±3) |
| AC-2.4 | Downward speed 2.1 m/s vs 1.9 m/s | multiplier 1.5 vs 1.0 |
| AC-2.5 | E at debt 10 | debt 0, oxygen −5 |
| AC-2.6 | E at debt 0 | debt 0, oxygen −5 |
| AC-2.7 | E at debt 70 | debt 30 |
| AC-2.8 | Ascend 3 m from debt 70 | debt 40 |
| AC-2.9 | Debt 45 / 75 / 100 | stage WARNING / PAIN / INJURED |
| AC-2.10 | INJURED, then try to descend below the injury depth | rejected; descending down to the injury depth again is allowed |
| AC-2.11 | New dive starts | debt 0 and injury flag cleared |

### 9.3 Hunting

| ID | Condition | Expected |
|---|---|---|
| AC-3.1 | Release within 1.5 s of the last shot | no shot, no oxygen cost |
| AC-3.2 | Arrow hits a fish | fish added to catch, oxygen −1 |
| AC-3.3 | Arrow hits a rock | arrow removed, no fish hit |
| AC-3.4 | Arrow reaches max range | arrow removed |
| AC-3.5 | Fish behind a rock | cannot be hit |
| AC-3.6 | Arrow travels 6 m | takes 0.333 s (±0.02) |
| AC-3.7 | Large fish, not raised, player at 6.0 m / 5.0 m | does not flee / flees |
| AC-3.8 | Large fish, raised | flees at 7.15 m (±0.05) |
| AC-3.9 | Medium fish, not raised, player at 3.9 m | flees |
| AC-3.10 | Range 8, large fish raised at 7.5 m, aligned | shot hits |
| AC-3.11 | Same as AC-3.10 with range 7 | shot does not reach |

### 9.4 Creatures

| ID | Condition | Expected |
|---|---|---|
| AC-4.1 | Fish fled, player stays outside flee distance for 3 s | fish returns to ROAM |
| AC-4.2 | Grouper retreated, player ≥ 8 m away for 4 s | grouper emerges |
| AC-4.3 | Jellyfish touches player | oxygen −8; speed × 0.5 for 2 s; no stacking |
| AC-4.4 | Player within 1.5 m of a moray crevice mouth | oxygen −10 once, moray retracts, 3 s cooldown |
| AC-4.5 | Sell 1 sardine + 1 grouper | +85 money |
| AC-4.6 | Shot into a sardine school | exactly one sardine caught |
| AC-4.7 | Player speed < 0.3 m/s for 1.5 s | dentex moves toward the player |

### 9.5 World

| ID | Condition | Expected |
|---|---|---|
| AC-5.1 | Swim into a rock | slides along it, no penetration, no rebound |
| AC-5.2 | Depth reaches 15.0 m | zone becomes DEEP |
| AC-5.10 | Every rock circle in the terrain data | grounded (vertical gap between its bottom and the seabed at its x is ≤ 0.1 m + 0.05 × radius, and its embedded depth is ≤ 0.5 × radius) or stacked on a supported rock (overlaps it and its center is higher) |
| AC-5.11 | Every rock circle in the terrain data | lies entirely inside 0 to `WORLD_WIDTH` horizontally and its top is below the surface (depth ≥ 1 m) |
| AC-5.3 | Try to go below the seabed | movement rejected |
| AC-5.4 | Darkness at 0 / 15 / 40 m | 0% / 60% / 85% |
| AC-5.5 | Base light radius | 5 m |
| AC-5.12 | Dive just started at depth 0, diver has not yet been deeper than 1 m | the dive does not end |
| AC-5.6 | Surface reached at any x, after having been deeper than 1 m | dive success: catch sold, lungs refilled, ear debt 0 |
| AC-5.7 | 1000 dives, one crevice | grouper 600, moray 250, empty 150 (±50 each) |
| AC-5.8 | Two consecutive dives | identical terrain |
| AC-5.9 | Start of a dive | shallow: 15 sardines, 4 seabream, 2 jellyfish; deep: counts follow section 5.5 |

### 9.6 Controls and movement

| ID | Condition | Expected |
|---|---|---|
| AC-6.1 | W from rest | 2.0 m/s within 0.5 s (±0.1) |
| AC-6.2 | W + D together | speed magnitude 2.0, not 2.83 |
| AC-6.3 | Shift + S | 3.2 m/s |
| AC-6.4 | Release keys at 2.0 m/s | ≤ 0.1 m/s after 2 s |
| AC-6.5 | Ear stage PAIN, normal swim | max speed 1.4 m/s |
| AC-6.6 | Carrying 5 fish | max speed unchanged |
| AC-6.7 | Mouse to the left of the diver | diver faces left |
| AC-6.8 | Dive starts | downward velocity 1.0 m/s at depth 0 |

### 9.7 Economy

| ID | Condition | Expected |
|---|---|---|
| AC-7.1 | Money 150, buy lung level 1 (100) | money 50, capacity 125 |
| AC-7.2 | Money 99, buy an item costing 100 | rejected, money 99 |
| AC-7.3 | Buy level 2 before level 1 | rejected |
| AC-7.4 | Blackout after catching 5 fish | money and upgrades unchanged |
| AC-7.5 | Reload the page after a purchase | money and levels restored |
| AC-7.6 | Press Reset | money 0, all upgrades at base |
| AC-7.7 | Sum of all upgrade prices | 1330 |
| AC-7.8 | `localStorage` throws | game still runs with in-memory state |

### 9.8 UI

| ID | Condition | Expected |
|---|---|---|
| AC-8.1 | Capacity 100, required 37.5 | marker at 37.5% of the bar |
| AC-8.2 | Oxygen ≤ required | marker flashes red |
| AC-8.3 | Debt 45 | indicator yellow, edges pulse light blue |
| AC-8.4 | Debt 75 | indicator red |
| AC-8.5 | Debt 100 | injury message shown and descent blocked |
| AC-8.6 | Depth 40 m | darkness 85% and light circle radius 5 m |
| AC-8.7 | Oxygen < 20% | screen edges darken |
| AC-8.8 | Click Achievements, Collection or Locations | nothing opens; "Coming soon" shown |
| AC-8.9 | Reach the surface with sardine + grouper | result screen shows profit 85 |
| AC-8.10 | Blackout | "You blacked out – catch lost" screen, money unchanged |
| AC-8.11 | Resize the window | image stays crisp with an integer scale |
| AC-8.12 | Click How to Play on the main menu | the instructions screen opens at page 1 |
| AC-8.13 | Next / Back on the instructions screen | moves between the 7 pages; Back on page 1 or Esc returns to the main menu |
| AC-8.14 | The controls page | lists all five inputs from section 6 |
| AC-8.15 | Change `OXYGEN_MAX_BASE`, `SPEAR_RANGE` or `FLEE_DIST` values in `constants.js` | the instructions text shows the new values with no other edit |
| AC-8.16 | Play is pressed | the main-menu background image is no longer drawn anywhere (gameplay, Equipment, results, instructions) |

## 10. Later (not in v1)

- Polespear as a second weapon.
- Zone caution: fish get warier where the player hunts a lot, and recover when the player stays away `[SOURCE]` for the idea.
- Randomized terrain.
- Buoyancy (the body rises near the surface and sinks deeper as the lungs compress).
- Additional zones and locations.
- Collection (encyclopedia) and achievements.
- Sound design (bubbles, low-oxygen warning).
- Arabic UI and Tifinagh text (verify the Tifinagh spelling of ELIL with a native writer first).
- Skeletal animation for the diver.

## 11. Sources

- DAN, ear equalization: https://dan.org/health-medicine/health-resource/dive-medical-reference-books/ears-diving/ears-equalization/
- DAN, Smart Guide to Ear Equalization (descending needs fewer equalizations): https://dan.org/health-resource-type/smart-guides/page/3/
- Hydrostatic pressure (1 atm per 10 m), Exploring Our Fluid Earth: https://www.manoa.hawaii.edu/exploringourfluidearth/physical/ocean-depths/pressure
- Freediving blackout and latent hypoxia: https://en.wikipedia.org/wiki/Freediving_blackout
- DAN, hypoxia in breath-hold diving: https://dan.org/alert-diver/article/hypoxia-in-breath-hold-diving/
- Oxygen desaturation in deep versus shallow freedives: https://pmc.ncbi.nlm.nih.gov/articles/PMC10615935
- Fish flight distance and spearfishing (Mediterranean), ICES Journal of Marine Science 2018: https://sciencedaily.com/releases/2018/07/180703105940.htm
- Fish flight distance and customary closures (Papua New Guinea), Conservation Biology 2010: https://sciencedaily.com/releases/2011/03/110321134724.htm
- Ryan, Rigby and Przybylski 2006, motivational pull of video games: https://link.springer.com/content/pdf/10.1007%2Fs11031-006-9051-8.pdf
- Dave the Diver gameplay loop analysis: https://www.avclub.com/dave-the-diver-review-gameplay-loop-roguelike-fish-restaurant-management

All other numbers in this document are `[GAMEPLAY]` and were not taken from a source.
