import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DIVE_PHASE_BLACKOUT,
  EQUIPMENT_CARD_BOTTOM_Y,
  EQUIPMENT_CARD_INSET,
  EQUIPMENT_CARD_HEIGHT,
  EQUIPMENT_CARD_LEFT_X,
  EQUIPMENT_CARD_PRICE_OFFSET,
  EQUIPMENT_CARD_RIGHT_X,
  EQUIPMENT_CARD_TITLE_OFFSET,
  EQUIPMENT_CARD_TOP_Y,
  EQUIPMENT_CARD_WIDTH,
  EQUIPMENT_GRID_COLUMNS,
  EQUIPMENT_GRID_ROW_SPLIT,
  EQUIPMENT_MONEY_Y,
  EQUIPMENT_CARD_LEVEL_OFFSET,
  INSTRUCTIONS_LINE_GAP,
  INSTRUCTIONS_PAGE_ONE,
  INSTRUCTIONS_PAGE_TWO,
  INSTRUCTIONS_TEXT_Y,
  INSTRUCTIONS_TITLE_Y,
  MENU_BUTTON_HEIGHT,
  MENU_BUTTON_STEP,
  MENU_BUTTON_WIDTH,
  MENU_BUTTON_X,
  MENU_BUTTON_Y,
  MENU_HINT_OFFSET,
  MENU_PANEL_ALPHA,
  MENU_PANEL_HEIGHT,
  MENU_PANEL_WIDTH,
  MENU_PANEL_X,
  MENU_PANEL_Y,
  MENU_TITLE_Y,
  MENU_DISABLED_HINT,
  RESULT_BLACKOUT_TITLE,
  RESULT_BUTTON_GAP,
  RESULT_BUTTON_COUNT,
  RESULT_BUTTON_WIDTH,
  RESULT_BUTTON_Y,
  RESULT_DETAILS_Y,
  RESULT_MONEY_Y,
  RESULT_PANEL_ALPHA,
  RESULT_TITLE,
  RESULT_TITLE_Y,
  SCREEN_BACK_BUTTON_WIDTH,
  SCREEN_BACK_BUTTON_X,
  SCREEN_BACK_BUTTON_Y,
  SCREEN_EQUIPMENT,
  SCREEN_GAMEPLAY,
  SCREEN_INSTRUCTIONS,
  SCREEN_MAIN_MENU,
  SCREEN_RESULT,
  SCREEN_SETTINGS,
  SCREEN_BUTTON_HEIGHT,
  SCREEN_BUTTON_LABEL_OFFSET,
  SCREEN_TEXT_FONT_PX,
  SCREEN_TITLE_FONT_PX,
  MENU_HINT_RIGHT_INSET,
  MENU_ITEM_FONT_PX,
  MENU_TITLE_FONT_PX,
  SETTINGS_RESET_HEIGHT,
  SETTINGS_RESET_WIDTH,
  SETTINGS_RESET_Y,
  SETTINGS_TITLE_Y,
  EQUIPMENT_TITLE_Y,
  RESULT_PANEL_HEIGHT,
  RESULT_PANEL_SIDE_INSET,
  RESULT_PANEL_TOP,
  RESULT_PROFIT_LINE_OFFSET,
  RESULT_MONEY_LINE_OFFSET,
  UPGRADE_KEYS,
  LUNG_UPGRADE_PRICES,
  RANGE_UPGRADE_PRICES,
  LIGHT_UPGRADE_PRICES,
  NET_UPGRADE_PRICES,
} from './constants.js';
import { upgradeValue } from './economy.js';
import { renderDive } from './render.js';

const MENU_ENTRIES = [
  { label: 'Play', action: 'play', enabled: true },
  { label: 'Equipment', action: 'equipment', enabled: true },
  { label: 'How to Play', action: 'howToPlay', enabled: true },
  { label: 'Settings', action: 'settings', enabled: true },
  { label: 'Locations', action: 'locations', enabled: false, hint: MENU_DISABLED_HINT },
  { label: 'Achievements', action: 'achievements', enabled: false, hint: MENU_DISABLED_HINT },
  { label: 'Collection', action: 'collection', enabled: false, hint: MENU_DISABLED_HINT },
];

const UPGRADE_LABELS = {
  lung: 'Lung capacity',
  range: 'Spear range',
  light: 'Flashlight',
  net: 'Catch net',
};

const UPGRADE_PRICES = {
  lung: LUNG_UPGRADE_PRICES,
  range: RANGE_UPGRADE_PRICES,
  light: LIGHT_UPGRADE_PRICES,
  net: NET_UPGRADE_PRICES,
};

/** Return menu labels, actions, enabled state, and fixed button bounds. */
export function getMenuModel() {
  return {
    items: MENU_ENTRIES.map((item, index) => ({
      ...item,
      rect: {
        x: MENU_BUTTON_X,
        y: MENU_BUTTON_Y + index * MENU_BUTTON_STEP,
        width: MENU_BUTTON_WIDTH,
        height: MENU_BUTTON_HEIGHT,
      },
    })),
  };
}

/** Return current money and the four upgrade cards. */
export function getEquipmentModel(profile) {
  return {
    money: profile?.money ?? 0,
    cards: UPGRADE_KEYS.map((key, index) => {
      const level = profile?.upgrades?.[key] ?? 0;
      const price = UPGRADE_PRICES[key][level] ?? null;
      const cardX = index % EQUIPMENT_GRID_COLUMNS === 0 ? EQUIPMENT_CARD_LEFT_X : EQUIPMENT_CARD_RIGHT_X;
      const cardY = index < EQUIPMENT_GRID_ROW_SPLIT ? EQUIPMENT_CARD_TOP_Y : EQUIPMENT_CARD_BOTTOM_Y;
      return {
        key,
        label: UPGRADE_LABELS[key],
        level,
        value: upgradeValue(profile, key),
        nextValue: price === null ? null : upgradeValue({ upgrades: { ...profile?.upgrades, [key]: level + 1 } }, key),
        price,
        affordable: price !== null && (profile?.money ?? 0) >= price,
        rect: { x: cardX, y: cardY, width: EQUIPMENT_CARD_WIDTH, height: EQUIPMENT_CARD_HEIGHT },
      };
    }),
  };
}

/** Prepare text and values for the result screen. */
export function getDiveResultModel(result) {
  const fish = result?.fish ?? [];
  const fishList = fish.length ? fish.join(', ') : 'none';
  if (result?.outcome === DIVE_PHASE_BLACKOUT) {
    return {
      title: RESULT_BLACKOUT_TITLE,
      details: `Lost: ${fishList}`,
      profit: null,
      totalMoney: result.totalMoney ?? 0,
    };
  }
  return {
    title: RESULT_TITLE,
    details: `Sold: ${fishList}`,
    profit: result?.profit ?? 0,
    totalMoney: result?.totalMoney ?? 0,
  };
}

/** Resolve a menu/card/button click to a screen action. */
export function screenActionAt(screen, x, y, profile) {
  if (screen === SCREEN_MAIN_MENU) {
    return getMenuModel().items.find((item) => item.enabled && contains(item.rect, x, y))?.action ?? null;
  }
  if (screen === SCREEN_EQUIPMENT) {
    if (contains(backButton(), x, y)) return 'back';
    const card = getEquipmentModel(profile).cards.find((item) => contains(item.rect, x, y));
    return card ? `buy:${card.key}` : null;
  }
  if (screen === SCREEN_SETTINGS) {
    if (contains({ x: (CANVAS_WIDTH - SETTINGS_RESET_WIDTH) / 2, y: SETTINGS_RESET_Y, width: SETTINGS_RESET_WIDTH, height: SETTINGS_RESET_HEIGHT }, x, y)) return 'reset';
    if (contains(backButton(), x, y)) return 'back';
  }
  if (screen === SCREEN_INSTRUCTIONS && contains(backButton(), x, y)) return 'back';
  if (screen === SCREEN_RESULT) {
    const leftX = (CANVAS_WIDTH - RESULT_BUTTON_WIDTH * RESULT_BUTTON_COUNT - RESULT_BUTTON_GAP) / 2;
    const button = { y: RESULT_BUTTON_Y, width: RESULT_BUTTON_WIDTH, height: SCREEN_BUTTON_HEIGHT };
    if (contains({ ...button, x: leftX }, x, y)) return 'again';
    if (contains({ ...button, x: leftX + RESULT_BUTTON_WIDTH + RESULT_BUTTON_GAP }, x, y)) return 'menu';
  }
  return null;
}

/** Pure screen navigation for click and keyboard actions. */
export function transitionScreen(screen, action) {
  if (screen === SCREEN_MAIN_MENU) {
    if (action === 'play') return SCREEN_GAMEPLAY;
    if (action === 'equipment') return SCREEN_EQUIPMENT;
    if (action === 'howToPlay') return SCREEN_INSTRUCTIONS;
    if (action === 'settings') return SCREEN_SETTINGS;
    return screen;
  }
  if ([SCREEN_EQUIPMENT, SCREEN_INSTRUCTIONS, SCREEN_SETTINGS].includes(screen) && action === 'back') {
    return SCREEN_MAIN_MENU;
  }
  if (screen === SCREEN_GAMEPLAY && ['success', 'blackout'].includes(action)) return SCREEN_RESULT;
  if (screen === SCREEN_RESULT && action === 'menu') return SCREEN_MAIN_MENU;
  if (screen === SCREEN_RESULT && action === 'again') return SCREEN_GAMEPLAY;
  return screen;
}

/** Render one app screen. The menu background is only used in the menu branch. */
export function renderScreen(ctx, appState, { backgroundImage } = {}) {
  ctx.imageSmoothingEnabled = false;
  if (appState.screen === SCREEN_MAIN_MENU) {
    renderMainMenu(ctx, appState.menuBackgroundEnabled === false ? null : backgroundImage);
  } else if (appState.screen === SCREEN_EQUIPMENT) {
    renderEquipment(ctx, appState.profile);
  } else if (appState.screen === SCREEN_SETTINGS) {
    renderSettings(ctx);
  } else if (appState.screen === SCREEN_INSTRUCTIONS) {
    renderInstructions(ctx);
  } else if (appState.screen === SCREEN_RESULT) {
    renderResult(ctx, appState.result);
  } else if (appState.screen === SCREEN_GAMEPLAY && appState.gameState) {
    renderDive(ctx, appState.gameState);
  }
}

function renderMainMenu(ctx, backgroundImage) {
  if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    ctx.fillStyle = '#0c3559';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  ctx.globalAlpha = MENU_PANEL_ALPHA;
  ctx.fillStyle = '#071522';
  ctx.fillRect(MENU_PANEL_X, MENU_PANEL_Y, MENU_PANEL_WIDTH, MENU_PANEL_HEIGHT);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = `${MENU_TITLE_FONT_PX}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('ELIL', CANVAS_WIDTH / 2, MENU_TITLE_Y);
  ctx.font = `${MENU_ITEM_FONT_PX}px monospace`;
  for (const item of getMenuModel().items) {
    ctx.fillStyle = item.enabled ? '#24536c' : '#41474d';
    ctx.fillRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
    ctx.fillStyle = item.enabled ? '#ffffff' : '#a9adb2';
    ctx.fillText(item.label, CANVAS_WIDTH / 2, item.rect.y + MENU_HINT_OFFSET);
    if (!item.enabled) {
      ctx.textAlign = 'right';
      ctx.fillText(item.hint, item.rect.x + item.rect.width - MENU_HINT_RIGHT_INSET, item.rect.y + MENU_HINT_OFFSET);
      ctx.textAlign = 'center';
    }
  }
}

function renderEquipment(ctx, profile) {
  fillScreen(ctx, '#09263d');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `${SCREEN_TITLE_FONT_PX}px monospace`;
  ctx.fillText('Equipment', CANVAS_WIDTH / 2, EQUIPMENT_TITLE_Y);
  ctx.font = `${SCREEN_TEXT_FONT_PX}px monospace`;
  ctx.fillText(`Money: ${profile?.money ?? 0}`, CANVAS_WIDTH / 2, EQUIPMENT_MONEY_Y);
  for (const card of getEquipmentModel(profile).cards) {
    ctx.fillStyle = '#163b53';
    ctx.fillRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(card.label, card.rect.x + EQUIPMENT_CARD_INSET, card.rect.y + EQUIPMENT_CARD_TITLE_OFFSET);
    ctx.fillText(`Level ${card.level}: ${card.value}`, card.rect.x + EQUIPMENT_CARD_INSET, card.rect.y + EQUIPMENT_CARD_LEVEL_OFFSET);
    ctx.fillText(card.price === null ? 'MAX LEVEL' : `Price: ${card.price} | Buy`, card.rect.x + EQUIPMENT_CARD_INSET, card.rect.y + EQUIPMENT_CARD_PRICE_OFFSET);
  }
  drawButton(ctx, backButton(), 'Back');
}

function renderSettings(ctx) {
  fillScreen(ctx, '#09263d');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `${SCREEN_TITLE_FONT_PX}px monospace`;
  ctx.fillText('Settings', CANVAS_WIDTH / 2, SETTINGS_TITLE_Y);
  drawButton(ctx, { x: (CANVAS_WIDTH - SETTINGS_RESET_WIDTH) / 2, y: SETTINGS_RESET_Y, width: SETTINGS_RESET_WIDTH, height: SETTINGS_RESET_HEIGHT }, 'Reset profile');
  drawButton(ctx, backButton(), 'Back');
}

function renderInstructions(ctx) {
  fillScreen(ctx, '#09263d');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `${SCREEN_TITLE_FONT_PX}px monospace`;
  ctx.fillText('How to Play', CANVAS_WIDTH / 2, INSTRUCTIONS_TITLE_Y);
  ctx.font = `${SCREEN_TEXT_FONT_PX}px monospace`;
  ctx.fillText(INSTRUCTIONS_PAGE_ONE, CANVAS_WIDTH / 2, INSTRUCTIONS_TEXT_Y);
  ctx.fillText(INSTRUCTIONS_PAGE_TWO, CANVAS_WIDTH / 2, INSTRUCTIONS_TEXT_Y + INSTRUCTIONS_LINE_GAP);
  drawButton(ctx, backButton(), 'Back');
}

function renderResult(ctx, result) {
  fillScreen(ctx, '#061724');
  ctx.globalAlpha = RESULT_PANEL_ALPHA;
  ctx.fillStyle = '#0e3047';
  ctx.fillRect(RESULT_PANEL_SIDE_INSET, RESULT_PANEL_TOP, CANVAS_WIDTH - 2 * RESULT_PANEL_SIDE_INSET, RESULT_PANEL_HEIGHT);
  ctx.globalAlpha = 1;
  const model = getDiveResultModel(result);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `${SCREEN_TITLE_FONT_PX}px monospace`;
  ctx.fillText(model.title, CANVAS_WIDTH / 2, RESULT_TITLE_Y);
  ctx.font = `${SCREEN_TEXT_FONT_PX}px monospace`;
  ctx.fillText(model.details, CANVAS_WIDTH / 2, RESULT_DETAILS_Y);
  if (model.profit !== null) ctx.fillText(`Total profit: ${model.profit}`, CANVAS_WIDTH / 2, RESULT_MONEY_Y + RESULT_PROFIT_LINE_OFFSET);
  ctx.fillText(`Money: ${model.totalMoney}`, CANVAS_WIDTH / 2, RESULT_MONEY_Y + RESULT_MONEY_LINE_OFFSET);
  const leftX = (CANVAS_WIDTH - RESULT_BUTTON_WIDTH * RESULT_BUTTON_COUNT - RESULT_BUTTON_GAP) / 2;
  drawButton(ctx, { x: leftX, y: RESULT_BUTTON_Y, width: RESULT_BUTTON_WIDTH, height: SCREEN_BUTTON_HEIGHT }, 'Dive again');
  drawButton(ctx, { x: leftX + RESULT_BUTTON_WIDTH + RESULT_BUTTON_GAP, y: RESULT_BUTTON_Y, width: RESULT_BUTTON_WIDTH, height: SCREEN_BUTTON_HEIGHT }, 'Main menu');
}

function fillScreen(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawButton(ctx, rect, label) {
  ctx.fillStyle = '#24536c';
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `${SCREEN_TEXT_FONT_PX}px monospace`;
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2 + SCREEN_BUTTON_LABEL_OFFSET);
}

function backButton() {
  return {
    x: SCREEN_BACK_BUTTON_X,
    y: SCREEN_BACK_BUTTON_Y,
    width: SCREEN_BACK_BUTTON_WIDTH,
    height: SCREEN_BUTTON_HEIGHT,
  };
}

function contains(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
