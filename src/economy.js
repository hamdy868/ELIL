import {
  DENTEX_VALUE,
  GROUPER_VALUE,
  LIGHT_UPGRADE_PRICES,
  LIGHT_UPGRADE_VALUES,
  LUNG_UPGRADE_PRICES,
  LUNG_UPGRADE_VALUES,
  NET_UPGRADE_PRICES,
  NET_UPGRADE_VALUES,
  RANGE_UPGRADE_PRICES,
  RANGE_UPGRADE_VALUES,
  SARDINE_VALUE,
  SEABREAM_VALUE,
  UPGRADE_KEYS,
} from './constants.js';

const UPGRADE_TABLES = {
  lung: { values: LUNG_UPGRADE_VALUES, prices: LUNG_UPGRADE_PRICES },
  range: { values: RANGE_UPGRADE_VALUES, prices: RANGE_UPGRADE_PRICES },
  light: { values: LIGHT_UPGRADE_VALUES, prices: LIGHT_UPGRADE_PRICES },
  net: { values: NET_UPGRADE_VALUES, prices: NET_UPGRADE_PRICES },
};

const FISH_VALUES = {
  sardine: SARDINE_VALUE,
  seabream: SEABREAM_VALUE,
  grouper: GROUPER_VALUE,
  dentex: DENTEX_VALUE,
};

/** Create a fresh profile with every upgrade at its base level. */
export function createProfile() {
  return {
    money: 0,
    upgrades: { lung: 0, range: 0, light: 0, net: 0 },
  };
}

/** Return the equipment value for one upgrade level. */
export function upgradeValue(profile, key) {
  const table = UPGRADE_TABLES[key];
  if (!table) return undefined;
  const level = Math.max(0, Math.min(table.values.length - 1, profile?.upgrades?.[key] ?? 0));
  return table.values[level];
}

/** Sell a list of fish and return the new profile and the sale total. */
export function sellCatch(profile, fishList = []) {
  const total = fishList.reduce((sum, item) => {
    const type = typeof item === 'string' ? item : item?.type;
    return sum + (FISH_VALUES[type] ?? 0);
  }, 0);
  return {
    profile: { ...profile, money: (profile?.money ?? 0) + total },
    total,
  };
}

/** Buy exactly the next level of an upgrade, preserving the input on failure. */
export function buyUpgrade(profile, key, requestedLevel) {
  const table = UPGRADE_TABLES[key];
  if (!table) return { profile, reason: 'Unknown upgrade' };
  const currentLevel = profile?.upgrades?.[key] ?? 0;
  const nextLevel = currentLevel + 1;
  if (requestedLevel !== undefined && requestedLevel !== nextLevel) {
    return { profile, reason: 'Upgrade levels must be bought in order' };
  }
  if (nextLevel >= table.values.length) {
    return { profile, reason: 'Upgrade is already at maximum level' };
  }
  const price = table.prices[currentLevel];
  if ((profile?.money ?? 0) < price) {
    return { profile, reason: 'Not enough money' };
  }
  const upgrades = { ...profile.upgrades, [key]: nextLevel };
  for (const upgradeKey of UPGRADE_KEYS) upgrades[upgradeKey] ??= 0;
  return {
    profile: { ...profile, money: profile.money - price, upgrades },
    reason: null,
  };
}

/** Sum the prices of every available upgrade level. */
export function totalUpgradeCost() {
  return Object.values(UPGRADE_TABLES)
    .reduce((sum, table) => sum + table.prices.reduce((priceSum, price) => priceSum + price, 0), 0);
}
