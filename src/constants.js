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

// Light and visibility (Spec 5.3)
export const LIGHT_RADIUS = 5;
export const LIGHT_RADIUS_LEVEL_1 = 6.5;
export const LIGHT_RADIUS_LEVEL_2 = 8;
export const FLASHLIGHT_BASE_LEVEL = 0;
export const FLASHLIGHT_LEVEL_1 = 1;
export const FLASHLIGHT_LEVEL_2 = 2;
export const CREATURE_HIDE_DARKNESS = 0.5;
export const DARKNESS_AT_SURFACE = 0;
export const DARKNESS_AT_SHALLOW_DEPTH = 0.6;
export const DARKNESS_AT_WORLD_DEPTH = 0.85;
export const LIGHT_EDGE_STEPS = 3;
export const LIGHT_EDGE_WIDTH = 1;
export const LOW_OXYGEN_THRESHOLD = 0.2;
export const LOW_OXYGEN_EDGE_WIDTH_PX = 8;
export const LOW_OXYGEN_EDGE_ALPHA_MAX = 1;

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
export const CREVICE_LAYOUTS = [
  { x: 48, width: 1.2, wallHeight: 2 },
  { x: 55.5, width: 1.4, wallHeight: 3 },
  { x: 66, width: 1.6, wallHeight: 4 },
  { x: 75, width: 1.8, wallHeight: 2 },
  { x: 84, width: 2.0, wallHeight: 3 },
  { x: 93, width: 2.2, wallHeight: 4 },
  { x: 102, width: 2.4, wallHeight: 2 },
  { x: 111, width: 2.5, wallHeight: 4 },
];
export const CREVICE_ROCK_RADIUS = 1.2;
export const GROUPER_SLOT_PROBABILITY = 0.6;
export const MORAY_SLOT_PROBABILITY = 0.25;
export const GROUPER_FRONT_OFFSET = 0.8;
export const GROUPER_BACK_OFFSET = 2.4;
export const GROUPER_RETREAT_DIST = 3.0;
export const GROUPER_EMERGE_DISTANCE = 8;
export const GROUPER_EMERGE_TIME = 4;
export const GROUPER_FLEE_SPEED_MULT = 0.8;
export const GROUPER_VALUE = 80;
export const SARDINE_VALUE = 5;
export const SEABREAM_VALUE = 20;
export const DENTEX_VALUE = 120;
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

// Economy and upgrade tables (Spec 7, 7.1)
export const LUNG_UPGRADE_VALUES = [OXYGEN_MAX_BASE, 125, 155];
export const LUNG_UPGRADE_PRICES = [100, 250];
export const RANGE_UPGRADE_VALUES = [SPEAR_RANGE, 7, 8];
export const RANGE_UPGRADE_PRICES = [120, 300];
export const LIGHT_UPGRADE_VALUES = [LIGHT_RADIUS, 6.5, 8];
export const LIGHT_UPGRADE_PRICES = [80, 200];
export const NET_UPGRADE_VALUES = [WEIGHT_PER_FISH, 0.02, 0.01];
export const NET_UPGRADE_PRICES = [80, 200];
export const UPGRADE_KEYS = ['lung', 'range', 'light', 'net'];
export const PROFILE_STORAGE_KEY = 'elil.profile';

// Screen names and layout (Spec 8.4)
export const SCREEN_MAIN_MENU = 'MAIN_MENU';
export const SCREEN_GAMEPLAY = 'GAMEPLAY';
export const SCREEN_EQUIPMENT = 'EQUIPMENT';
export const SCREEN_INSTRUCTIONS = 'INSTRUCTIONS';
export const SCREEN_SETTINGS = 'SETTINGS';
export const SCREEN_RESULT = 'RESULT';
export const MAIN_MENU_BACKGROUND_SRC = 'assets/elil_menu_bg_exciting_lowres.png';
export const MENU_PANEL_X = 68;
export const MENU_PANEL_Y = 12;
export const MENU_PANEL_WIDTH = 248;
export const MENU_PANEL_HEIGHT = 192;
export const MENU_PANEL_ALPHA = 0.76;
export const MENU_BUTTON_X = 94;
export const MENU_BUTTON_Y = 39;
export const MENU_BUTTON_WIDTH = 196;
export const MENU_BUTTON_HEIGHT = 19;
export const MENU_BUTTON_STEP = 22;
export const MENU_TITLE_Y = 27;
export const MENU_HINT_OFFSET = 9;
export const MENU_HINT_RIGHT_INSET = 5;
export const MENU_TITLE_FONT_PX = 16;
export const MENU_ITEM_FONT_PX = 8;
export const EQUIPMENT_CARD_LEFT_X = 30;
export const EQUIPMENT_CARD_RIGHT_X = 198;
export const EQUIPMENT_CARD_TOP_Y = 48;
export const EQUIPMENT_CARD_BOTTOM_Y = 108;
export const EQUIPMENT_CARD_WIDTH = 156;
export const EQUIPMENT_CARD_HEIGHT = 52;
export const EQUIPMENT_CARD_INSET = 6;
export const EQUIPMENT_GRID_COLUMNS = 2;
export const EQUIPMENT_GRID_ROW_SPLIT = 2;
export const SCREEN_BACK_BUTTON_X = 12;
export const SCREEN_BACK_BUTTON_Y = 184;
export const SCREEN_BACK_BUTTON_WIDTH = 72;
export const SCREEN_BUTTON_HEIGHT = 18;
export const EQUIPMENT_MONEY_Y = 30;
export const EQUIPMENT_TITLE_Y = 15;
export const EQUIPMENT_CARD_TEXT_INSET = 6;
export const EQUIPMENT_CARD_TITLE_OFFSET = 12;
export const EQUIPMENT_CARD_LEVEL_OFFSET = 27;
export const EQUIPMENT_CARD_PRICE_OFFSET = 42;
export const SETTINGS_RESET_Y = 92;
export const SETTINGS_TITLE_Y = 42;
export const SETTINGS_RESET_WIDTH = 160;
export const SETTINGS_RESET_HEIGHT = 24;
export const RESULT_BUTTON_COUNT = 2;
export const MENU_DISABLED_HINT = 'Coming soon';
export const RESULT_TITLE_Y = 62;
export const RESULT_DETAILS_Y = 91;
export const RESULT_MONEY_Y = 109;
export const RESULT_BUTTON_Y = 158;
export const RESULT_BUTTON_WIDTH = 116;
export const RESULT_BUTTON_GAP = 16;
export const RESULT_PANEL_ALPHA = 0.84;
export const RESULT_PANEL_SIDE_INSET = 18;
export const RESULT_PANEL_TOP = 34;
export const RESULT_PANEL_HEIGHT = 142;
export const RESULT_PROFIT_LINE_OFFSET = -8;
export const RESULT_MONEY_LINE_OFFSET = 4;
export const RESULT_TITLE = 'Dive complete';
export const RESULT_BLACKOUT_TITLE = 'You blacked out – catch lost';
export const INSTRUCTIONS_TITLE_Y = 38;
export const INSTRUCTIONS_TEXT_Y = 74;
export const INSTRUCTIONS_LINE_GAP = 14;
export const INSTRUCTIONS_PAGE_ONE = 'Hunt fish and return to the surface before your breath runs out.';
export const INSTRUCTIONS_PAGE_TWO = 'Your catch is sold when you surface. A blackout loses this dive’s catch.';
export const SCREEN_TITLE_FONT_PX = 12;
export const SCREEN_TEXT_FONT_PX = 8;
export const SCREEN_BUTTON_LABEL_OFFSET = 3;

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
