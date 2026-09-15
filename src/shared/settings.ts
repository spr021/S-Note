import { readStorage, writeStorage } from "./storage";

export type ThemeMode = "light" | "dark";

export interface SNoteSettings {
  /** Show the floating toggle-layer button on web pages. */
  showLauncher: boolean;
  /** Colour scheme used by the S Note popup. */
  theme: ThemeMode;
}

export const SETTINGS_KEY = "snote.settings.v1";

export const DEFAULT_SETTINGS: SNoteSettings = Object.freeze<SNoteSettings>({
  showLauncher: true,
  theme: "dark",
});

/**
 * Coerces whatever is in storage (missing, partial, or written by an older
 * version) into a complete, type-safe settings object.
 */
export function normalizeSettings(value: unknown): SNoteSettings {
  const record =
    value && typeof value === "object" ? (value as Partial<SNoteSettings>) : {};

  return {
    showLauncher:
      typeof record.showLauncher === "boolean"
        ? record.showLauncher
        : DEFAULT_SETTINGS.showLauncher,
    theme:
      record.theme === "light" || record.theme === "dark"
        ? record.theme
        : DEFAULT_SETTINGS.theme,
  };
}

export async function getSettings(): Promise<SNoteSettings> {
  return normalizeSettings(await readStorage<unknown>(SETTINGS_KEY));
}

/**
 * `updateSettings` is a read-modify-write of the whole settings object, so two
 * rapid toggles could otherwise read the same snapshot and clobber each other.
 * A single promise queue serializes those updates.
 */
let settingsQueue: Promise<unknown> = Promise.resolve();

function enqueueSettingsWrite<T>(task: () => Promise<T>): Promise<T> {
  const result = settingsQueue.then(task, task);
  settingsQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function updateSettings(
  patch: Partial<SNoteSettings>
): Promise<SNoteSettings> {
  return enqueueSettingsWrite(async () => {
    const next = normalizeSettings({ ...(await getSettings()), ...patch });
    await writeStorage({ [SETTINGS_KEY]: next });
    return next;
  });
}

/** Reads a settings value out of a `chrome.storage.onChanged` payload. */
export function settingsFromChange(
  change: chrome.storage.StorageChange | undefined
): SNoteSettings {
  return normalizeSettings(change?.newValue);
}
