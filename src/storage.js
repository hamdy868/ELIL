import { PROFILE_STORAGE_KEY } from './constants.js';
import { createProfile } from './economy.js';

let memoryProfile = createProfile();

function copyProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}

/** Save profile to localStorage and retain an in-memory copy if storage fails. */
export function saveProfile(profile, storage) {
  memoryProfile = copyProfile(profile);
  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // In-memory state remains available when browser storage is blocked.
  }
  return copyProfile(memoryProfile);
}

/** Load a saved profile, falling back to the last in-memory profile on errors. */
export function loadProfile(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    const saved = target?.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const profile = JSON.parse(saved);
      memoryProfile = copyProfile(profile);
      return copyProfile(profile);
    }
  } catch {
    // Use the in-memory copy below.
  }
  return copyProfile(memoryProfile);
}

/** Reset and persist a new base profile. */
export function resetProfile(storage) {
  const profile = createProfile();
  saveProfile(profile, storage);
  return profile;
}
