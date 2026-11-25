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
  [
    { x: 7, radius: 2.2 },
    { x: 10.5, radius: 2.0 },
    { x: 8.8, radius: 1.5, support: 0 },
  ],
  [
    { x: 18, radius: 2.1 },
    { x: 19.2, radius: 1.4, support: 0 },
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
export const SPEAR_RANGE = 6;
export const RELOAD_TIME = 1.5;
export const ARROW_SPEED = 18;
export const FLEE_DIST_SMALL = 2.5;
export const FLEE_DIST_MEDIUM = 4;
export const FLEE_DIST_LARGE = 5.5;
export const AIMING_FLEE_MULT = 1.3;
export const RETURN_TO_ROAM_DELAY = 3;
export const SARDINE_SCHOOL_SIZE = 15;
export const SARDINE_HIT_RADIUS = 0.2;
export const SEABREAM_HIT_RADIUS = 0.4;
export const SEABREAM_ROAM_RADIUS = 3;
export const SARDINE_FLEE_SPEED_MULT = 1.4;
export const SEABREAM_FLEE_SPEED_MULT = 1.1;
export const GENERIC_FISH_FLEE_SPEED_MULT = 1;
export const SARDINE_DRAW_SIZE_PX = 5;
export const SEABREAM_DRAW_SIZE_PX = 10;
export const SHALLOW_FISH_MIN_DEPTH = 2;
export const SHALLOW_FISH_MAX_DEPTH = 13;
export const SHALLOW_SEABREAM_COUNT = 4;
export const CREVICE_COUNT_DEEP = 8;
export const CREVICE_DEPTH = 3.0;
export const CREVICE_MIN_WIDTH = 1.2;
export const CREVICE_MAX_WIDTH = 2.5;
export const CREVICE_WIDTH = 1.8;
export const CREVICE_ROCK_RADIUS = 1.2;
export const CREVICE_START_X_RATIO = 0.4;
export const GROUPER_SLOT_PROBABILITY = 0.6;
export const MORAY_SLOT_PROBABILITY = 0.25;
export const GROUPER_FRONT_OFFSET = 0.8;
export const GROUPER_BACK_OFFSET = 2.4;
export const GROUPER_EMERGE_DISTANCE = 8;
export const GROUPER_EMERGE_TIME = 4;
export const GROUPER_FLEE_SPEED_MULT = 0.8;
export const GROUPER_VALUE = 80;
export const GROUPER_DRAW_SIZE_PX = 20;
export const MORAY_MARKER_SIZE_PX = 4;
export const CREVICE_SIDE_WALL_STACK_OFFSET = (CREVICE_DEPTH + 2 * DIVER_RADIUS) / 2;
export const CREVICE_VALIDATION_EPSILON = 1e-9;
export const FISH_ROAM_SPEED = 0.3;
export const SARDINE_SCHOOL_SPREAD = 0.5;
export const GENERIC_FISH_HIT_RADIUS = 0.4;
export const FISH_DEFAULT_SEED = 1;
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
