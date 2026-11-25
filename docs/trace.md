T01 | AC-8.11 | Project setup: 384x216 pixelated canvas, fixed-timestep loop, seeded RNG, constants, and node --test
T02 | AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.6, AC-6.7, AC-6.8, AC-5.3 | Movement and physics: pure physics step, WASD/Shift/mouse input, placeholder circle diver, smoothed 30 m camera, surface and 40 m seabed bounds
T03 | AC-5.1, AC-5.2, AC-5.3, AC-5.8 | World, rocks, and collision: sloped seabed 15-40 m, 20 circle rocks, zoneAt, substepped sliding collision, and terrain rendering
T03b | AC-5.10, AC-5.11 | Fix rock placement: seabed-computed rock formations, pure rock validator, and rocks drawn before seabed
T04 | AC-1.1..1.11, AC-5.6, AC-5.12, AC-8.1, AC-8.2 | Oxygen and dive end: pure oxygen rules, dive state machine (DIVING/SUCCESS/BLACKOUT), HUD oxygen bar with flashing ascent marker, and temporary Enter restart
T05 | AC-2.1 to 2.11, 6.5, 8.3 to 8.5 | Ear pressure, E key, HUD
T06 | AC-3.1 to 3.6 | Hunting: hold-to-raise firing, reload, straight arrows, rock and range collision, dummy fish and HUD
T07 | AC-3.7 to 3.11, AC-4.1, AC-4.6 | Fish: generic flee states, sardine school, seabream near rocks, seeded shallow spawns, fish rendering
T08a | AC-4.2, AC-4.8 (retreated grouper), AC-5.7, AC-5.9 (deep groupers only), AC-5.13, AC-5.14 | Crevices, seeded hide slots, grouper retreat/emergence, moray markers, and terrain validator
T10a | AC-5.4, AC-5.5, AC-5.15, AC-5.16, AC-8.6, AC-8.7 | Light, darkness, creature visibility, and low-oxygen edge darkening
T08c | AC-4.9, AC-4.10, AC-4.11, AC-5.17 | Grouper retreat threshold, crevice line of sight, and fixed layout variety
