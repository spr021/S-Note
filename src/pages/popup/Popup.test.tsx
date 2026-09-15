import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Popup from "./Popup";
import { STORAGE_KEY, type WebNote } from "@src/shared/notes";
import { SETTINGS_KEY, type SNoteSettings } from "@src/shared/settings";

describe("S Note popup", () => {
  test("saves and renders a page note for the active website", async () => {
    const values: Record<string, unknown> = {};
    const messages: unknown[] = [];
    const listeners: Array<
      (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string
      ) => void
    > = [];
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: { lastError: undefined },
        tabs: {
          query: (
            _query: unknown,
            callback: (tabs: chrome.tabs.Tab[]) => void
          ) =>
            callback([
              {
                id: 4,
                url: "https://example.com/article#section",
                title: "Example article",
              } as chrome.tabs.Tab,
            ]),
          sendMessage: (
            _id: number,
            message: { type?: string },
            callback: (response: unknown) => void
          ) => {
            messages.push(message);
            callback({
              ok: true,
              active:
                message.type === "SNOTE_SET_MODE" ||
                (message.type === "SNOTE_TOGGLE_LAYER" &&
                  (message as { open?: boolean }).open),
              mode: "select",
              count: 0,
            });
          },
        },
        storage: {
          local: {
            get: (
              key: string,
              callback: (result: Record<string, unknown>) => void
            ) => callback({ [key]: values[key] }),
            set: (updates: Record<string, unknown>, callback: () => void) => {
              const changes: Record<string, chrome.storage.StorageChange> = {};
              Object.entries(updates).forEach(([key, newValue]) => {
                changes[key] = { oldValue: values[key], newValue };
                values[key] = newValue;
              });
              callback();
              listeners.forEach((listener) => listener(changes, "local"));
            },
          },
          onChanged: {
            addListener: (listener: typeof listeners[number]) =>
              listeners.push(listener),
            removeListener: (listener: typeof listeners[number]) => {
              const index = listeners.indexOf(listener);
              if (index >= 0) listeners.splice(index, 1);
            },
          },
        },
      },
    });
    Object.defineProperty(window, "close", {
      configurable: true,
      value: jest.fn(),
    });
    Object.defineProperty(window, "confirm", {
      configurable: true,
      value: jest.fn(() => true),
    });

    render(<Popup />);
    await screen.findByText("Example article");
    expect(messages).toContainEqual({ type: "SNOTE_GET_LAYER_STATE" });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Unhide notes" }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(messages).toContainEqual({
      type: "SNOTE_TOGGLE_LAYER",
      open: true,
    });

    for (const [name, mode] of [
      ["Highlight", "highlight"],
      ["Comment", "comment"],
      ["Sticky mark", "mark"],
      ["Pen", "draw"],
    ] as const) {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name }));
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(messages).toContainEqual({ type: "SNOTE_SET_MODE", mode });
    }

    expect(window.close).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Page note"), {
      target: { value: "Remember this source." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save note" }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await screen.findByText("Remember this source.");
    await waitFor(() =>
      expect(values[STORAGE_KEY] as WebNote[]).toHaveLength(1)
    );
    expect((values[STORAGE_KEY] as WebNote[])[0]).toMatchObject({
      kind: "page",
      url: "https://example.com/article",
      pageTitle: "Example article",
    });

    fireEvent.click(screen.getByRole("button", { name: "All notes" }));
    expect(await screen.findByText("example.com")).not.toBeNull();
    expect(screen.getByText("1 note")).not.toBeNull();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete all notes from example.com",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect(values[STORAGE_KEY] as WebNote[]).toHaveLength(0)
    );
    expect(screen.getByText("No notes here yet.")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const launcherSwitch = screen.getByRole("switch", {
      name: "Toggle-layer button",
    });
    expect(launcherSwitch.getAttribute("aria-checked")).toBe("true");

    await act(async () => {
      fireEvent.click(launcherSwitch);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect((values[SETTINGS_KEY] as SNoteSettings).showLauncher).toBe(false)
    );
    expect(
      screen
        .getByRole("switch", { name: "Toggle-layer button" })
        .getAttribute("aria-checked")
    ).toBe("false");

    const themeSwitch = screen.getByRole("switch", { name: "Dark theme" });
    expect(themeSwitch.getAttribute("aria-checked")).toBe("true");
    await act(async () => {
      fireEvent.click(themeSwitch);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect((values[SETTINGS_KEY] as SNoteSettings).theme).toBe("light")
    );
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("surfaces a storage failure instead of hanging on loading", async () => {
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: { lastError: { message: "storage unavailable" } },
        tabs: {
          query: (
            _query: unknown,
            callback: (tabs: chrome.tabs.Tab[]) => void
          ) =>
            callback([
              {
                id: 4,
                url: "https://example.com/",
                title: "Example",
              } as chrome.tabs.Tab,
            ]),
          sendMessage: (
            _id: number,
            _message: unknown,
            callback: (response: unknown) => void
          ) => callback({ ok: true, active: false, mode: "select", count: 0 }),
        },
        storage: {
          local: {
            get: (
              _key: string,
              callback: (result: Record<string, unknown>) => void
            ) => callback({}),
            set: (_values: Record<string, unknown>, callback: () => void) =>
              callback(),
          },
          onChanged: {
            addListener: () => undefined,
            removeListener: () => undefined,
          },
        },
      },
    });

    render(<Popup />);

    expect(await screen.findByText("storage unavailable")).not.toBeNull();
    expect(screen.queryByText("Loading notes…")).toBeNull();
  });
});
