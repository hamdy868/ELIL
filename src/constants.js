// Tunable game constants. Names must match spec.md exactly.

// Rendering & simulation (Spec 0.4, 8.1)
export const CANVAS_WIDTH = 384;
export const CANVAS_HEIGHT = 216;
export const FIXED_DT = 1 / 60;
export const PIXELS_PER_METER = 12.8;

// World bounds (Spec 5)
export const WORLD_WIDTH = 120;
export const WORLD_DEPTH = 40;
export const BOAT_X = 60;

// Movement physics (Spec 6.1)
export const SPEED_NORMAL = 2.0;
export const SPEED_FAST = 3.2;
export const ACCEL_NORMAL = 4.0;
export const ACCEL_FAST = 6.4;
export const DECEL_RATE = 1.5;
export const DIVE_START_VY = 1.0;

// Diver collision & look (Spec 6.2, 6.3)
export const DIVER_RADIUS = 0.4;
export const DIVER_MAX_TILT_RAD = Math.PI / 4;
export const FIN_SWAY_RATE = 6.0;

// Camera (Spec 6.3)
export const CAMERA_WIDTH = CANVAS_WIDTH / PIXELS_PER_METER;
export const CAMERA_HEIGHT = CANVAS_HEIGHT / PIXELS_PER_METER;
export const CAMERA_SMOOTHING = 8.0;
export const CAMERA_MIN_Y = -2;
