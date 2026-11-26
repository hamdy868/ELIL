# ELIL art assets (pixel art, transparent PNG)

All sprites face RIGHT. Flip horizontally when the creature moves left. Draw with image smoothing disabled.
Strips hold frames side by side, left to right. Frame width = file width / number of frames.

| File | Frames | Frame size (px) | Notes |
|---|---|---|---|
| diver_swim.png | 2 | 44 x 20 | fins up, fins down. Aiming reuses this sprite (rotate toward the mouse) and draws the speargun in code |
| sardine.png | 2 | 14 x 5 | school fish |
| seabream.png | 2 | 20 x 9 | |
| grouper.png | 2 | 30 x 19 | |
| dentex.png | 2 | 30 x 17 | |
| jellyfish.png | 2 | 14 x 16 | bell pulse |
| moray.png | 2 | 32 x 22 | resting, lunging. The left edge is cut flat on purpose: anchor the left edge at the back of the crevice mouth |
| rock_tile.png | tile | 64 x 64 | seamless. 64 px = 5 m. Fill the rock circles with it (clip to the circles) |
| sand_tile.png | tile | 64 x 64 | seamless. Use for the seabed fill |
| seagrass.png | 1 | 258 x 52 | the bottom edge is cut flat: draw it BEFORE the seabed fill so the base is hidden. Scatter instances along the seabed in the shallow zone |

Scale: the game draws 12.8 px per meter. These sizes replace the placeholder sizes. Hit radii in the code do not change.
