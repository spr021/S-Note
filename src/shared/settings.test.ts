import {
  DEFAULT_SETTINGS,
  getSettings,
  normalizeSettings,
  settingsFromChange,
  SETTINGS_KEY,
  updateSettings,
} from "./settings";

describe("settings storage", () => {
  let data: Record<string, unknown>;

  beforeEach(() => {
    data = {};
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: { lastError: undefined },
        storage: {
          local: {
            get: (
              key: string,
              callback: (result: Record<string, unknown>) => void
            ) => callback({ [key]: data[key] }),
            set: (values: Record<string, unknown>, callback: () => void) => {
              Object.assign(data, values);
              callback();
            },
          },
        },
      },
    });
  });

  test("falls back to defaults when nothing is stored", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test("normalizes malformed stored values", () => {
    expect(normalizeSettings([])).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ showLauncher: "yes", theme: "neon" })).toEqual(
      DEFAULT_SETTINGS
    );
    expect(normalizeSettings({ theme: "system" })).toEqual({
      showLauncher: true,
      theme: "system",
    });
  });

  test("merges partial updates and persists the result", async () => {
    const next = await updateSettings({ theme: "light" });

    expect(next).toEqual({ showLauncher: true, theme: "light" });
    expect(data[SETTINGS_KEY]).toEqual({ showLauncher: true, theme: "light" });
    expect((await getSettings()).theme).toBe("light");

    const toggled = await updateSettings({ showLauncher: false });
    expect(toggled).toEqual({ showLauncher: false, theme: "light" });
  });

  test("serializes concurrent updates so no patch is lost", async () => {
    await Promise.all([
      updateSettings({ showLauncher: false }),
      updateSettings({ theme: "light" }),
    ]);

    expect(await getSettings()).toEqual({
      showLauncher: false,
      theme: "light",
    });
  });

  test("reads settings out of a storage change event", () => {
    expect(
      settingsFromChange({
        newValue: { showLauncher: false },
      } as chrome.storage.StorageChange)
    ).toEqual({ showLauncher: false, theme: "system" });
    expect(settingsFromChange(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(
      settingsFromChange({
        newValue: undefined,
      } as chrome.storage.StorageChange)
    ).toEqual(DEFAULT_SETTINGS);
  });
});
