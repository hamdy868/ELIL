// Tunable game constants. Names must match spec.md exactly.

// Rendering & simulation (Spec 0.4, 8.1)
export const CANVAS_WIDTH = 384;
export const CANVAS_HEIGHT = 216;
export const FIXED_DT = 1 / 60;
export const PIXELS_PER_METER = 12.8;

// World bounds and zones (Spec 5, 5.1)
export const WORLD_WIDTH = 120;
export const WORLD_DEPTH = 40;
export const BOAT_X = 60;
export const SHALLOW_DEPTH = 15;
export const ZONE_SHALLOW = 'SHALLOW';
export const ZONE_DEEP = 'DEEP';

// Fixed terrain data (Spec 5.1, 5.2)
export const SEABED_PROFILE = [
  [0, 15],
  [20, 16],
  [40, 19],
  [60, 23],
  [80, 29],
  [100, 35],
  [120, 40],
];

export const ROCK_EMBED_FRACTION = 0.25;
export const ROCK_STACK_OVERLAP_FRACTION = 0.15;
export const ROCK_MAX_GAP_BASE = 0.1;
export const ROCK_MAX_GAP_RADIUS_FACTOR = 0.05;
export const ROCK_MAX_EMBED_FACTOR = 0.5;
export const ROCK_MIN_TOP_DEPTH = 1;

// Rock formations defined by x and radius only (y is computed from seabed / support)
export const ROCK_FORMATIONS = [
  // Shallow zone (< 15 m): 5 circles across 2 formations
  [
    { x: 7, radius: 2.2 },
    { x: 10.5, radius: 2.0 },
    { x: 8.8, radius: 1.5, support: 0 },
  ],
  [
    { x: 18, radius: 2.1 },
    { x: 19.2, radius: 1.4, support: 0 },
  ],
  // Deep zone (>= 15 m): 15 circles across 6 formations
  [
    { x: 35, radius: 2.0 },
    { x: 38.2, radius: 2.2 },
  ],
  [
    { x: 48, radius: 2.4 },
    { x: 51.8, radius: 2.2 },
    { x: 50.5, radius: 1.5, support: 1 },
  ],
  [
    { x: 65, radius: 2.2 },
    { x: 68.5, radius: 2.4 },
    { x: 66.5, radius: 1.5, support: 0 },
  ],
  [
    { x: 76, radius: 2.6 },
    { x: 80.2, radius: 2.5 },
    { x: 77.8, radius: 1.8, support: 0 },
  ],
  [
    { x: 94, radius: 2.5 },
    { x: 95.4, radius: 1.7, support: 0 },
  ],
  [
    { x: 111, radius: 2.5 },
    { x: 115, radius: 2.6 },
  ],
];

// Movement physics (Spec 6.1)
export const SPEED_NORMAL = 2.0;
export const SPEED_FAST = 3.2;
export const ACCEL_NORMAL = 4.0;
export const ACCEL_FAST = 6.4;
export const DECEL_RATE = 1.5;
export const DIVE_START_VY = 1.0;

// Diver collision & look (Spec 6.2, 6.3)
export const DIVER_RADIUS = 0.4;
export const COLLISION_MAX_STEP_DIST = 0.15;
export const COLLISION_ITERATIONS = 3;
export const DIVER_MAX_TILT_RAD = Math.PI / 4;
export const FIN_SWAY_RATE = 6.0;

// Camera (Spec 6.3)
export const CAMERA_WIDTH = CANVAS_WIDTH / PIXELS_PER_METER;
export const CAMERA_HEIGHT = CANVAS_HEIGHT / PIXELS_PER_METER;
export const CAMERA_SMOOTHING = 8.0;
export const CAMERA_MIN_Y = -2;

// Oxygen (Spec 1, 1.1)
export const OXYGEN_MAX_BASE = 100;
export const MOVE_IDLE = 0.7;
export const MOVE_SWIM = 1.0;
export const MOVE_FAST = 1.8;
export const WEIGHT_PER_FISH = 0.03;
export const EQUALIZE_COST = 5;
export const SHOT_COST = 1;
export const ASCENT_RISK_DEPTH = 10;
export const ASCENT_RISK_MULT = 1.5;
export const ASCENT_SPEED = 1.5;
export const ASCENT_SAFETY = 1.25;

// Dive state machine (Spec 5.6)
export const DIVE_ARM_DEPTH = 1.0;
export const DIVE_PHASE_DIVING = 'DIVING';
export const DIVE_PHASE_SUCCESS = 'SUCCESS';
export const DIVE_PHASE_BLACKOUT = 'BLACKOUT';

// HUD layout & timing (Spec 8.2)
export const OXYGEN_BAR_X = 8;
export const OXYGEN_BAR_Y = 8;
export const OXYGEN_BAR_WIDTH = 80;
export const OXYGEN_BAR_HEIGHT = 8;
export const OXYGEN_FLASH_HZ = 4;

// Ear pressure (Spec 2, 8.2, 8.3)
export const EAR_DEBT_MAX = 100;
export const EAR_BASE_RATE = 8;
export const EAR_PRESSURE_SCALE_DEPTH = 10;
export const FAST_DESCENT_MULT = 1.5;
export const FAST_DESCENT_SPEED = 2.0;
export const EQUALIZE_REDUCTION = 40;
export const ASCENT_DEBT_RELIEF = 10;
export const PAIN_SPEED_MULT = 0.7;

export const EAR_WARNING_THRESHOLD = 40;
export const EAR_PAIN_THRESHOLD = 70;
export const EAR_INJURED_THRESHOLD = 100;
export const EAR_STAGE_NORMAL = 'NORMAL';
export const EAR_STAGE_WARNING = 'WARNING';
export const EAR_STAGE_PAIN = 'PAIN';
export const EAR_STAGE_INJURED = 'INJURED';
export const EAR_PULSE_HZ = 2;
export const EAR_INJURY_MESSAGE = 'Ears injured - cannot dive deeper';
