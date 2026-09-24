import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Popup from "./Popup";
import { STORAGE_KEY, type WebNote } from "@src/shared/notes";
import { SETTINGS_KEY, type SNoteSettings } from "@src/shared/settings";
import { SUPPORT_URL } from "@src/shared/support";
import { feedbackMailtoUrl } from "@src/shared/feedback";

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string
) => void;

/**
 * The chrome mock is installed once and mutated per test. Redefining
 * `globalThis.chrome` between tests is unreliable on some Node/Jest versions,
 * which previously made the second test reuse the first test's mock.
 */
describe("S Note popup", () => {
  const values: Record<string, unknown> = {};
  const messages: unknown[] = [];
  const listeners: StorageListener[] = [];
  const createTab = jest.fn((_properties: unknown, callback?: () => void) =>
    callback?.()
  );
  let lastError: { message: string } | undefined;
  let activeTab: chrome.tabs.Tab[] = [];

  beforeAll(() => {
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: {
          get lastError() {
            return lastError;
          },
        },
        tabs: {
          create: createTab,
          query: (
            _query: unknown,
            callback: (tabs: chrome.tabs.Tab[]) => void
          ) => callback(activeTab),
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
            addListener: (listener: StorageListener) =>
              listeners.push(listener),
            removeListener: (listener: StorageListener) => {
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
  });

  beforeEach(() => {
    Object.keys(values).forEach((key) => delete values[key]);
    messages.length = 0;
    listeners.length = 0;
    lastError = undefined;
    activeTab = [
      {
        id: 4,
        url: "https://example.com/article#section",
        title: "Example article",
      } as chrome.tabs.Tab,
    ];
  });

  test("saves and renders a page note for the active website", async () => {
    render(<Popup />);
    await screen.findByText("Example article");
    expect(messages).toContainEqual({ type: "SNOTE_GET_LAYER_STATE" });

    const footerSupport = screen.getByRole("button", {
      name: "Buy me a coffee",
    });
    expect(footerSupport.className).toContain("support-link");
    fireEvent.click(footerSupport);
    expect(createTab).toHaveBeenCalledWith(
      { url: SUPPORT_URL },
      expect.any(Function)
    );

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

    const systemRadio = screen.getByRole("radio", {
      name: "System",
    }) as HTMLInputElement;
    expect(systemRadio.checked).toBe(true);

    const lightRadio = screen.getByRole("radio", { name: "Light" });
    await act(async () => {
      fireEvent.click(lightRadio);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect((values[SETTINGS_KEY] as SNoteSettings).theme).toBe("light")
    );
    expect(document.documentElement.dataset.theme).toBe("light");

    const darkRadio = screen.getByRole("radio", { name: "Dark" });
    await act(async () => {
      fireEvent.click(darkRadio);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect((values[SETTINGS_KEY] as SNoteSettings).theme).toBe("dark")
    );
    expect(document.documentElement.dataset.theme).toBe("dark");

    const cardSupport = screen.getByRole("button", {
      name: "Buy me a coffee",
    });
    expect(cardSupport.className).toContain("support-button");
    expect(document.querySelector(".support-footer")).toBeNull();
  });

  test("opens the feedback dialog and sends a typed message", async () => {
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<Popup />);
    await screen.findByText("Example article");

    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    const dialog = screen.getByRole("dialog", { name: "Send feedback" });

    const sendButton = within(dialog).getByRole("button", {
      name: "Send feedback",
    });
    expect((sendButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText("Type of feedback"), {
      target: { value: "Feature request" },
    });
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "Please add tags." },
    });
    expect((sendButton as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      fireEvent.click(sendButton);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.getAttribute("href")).toBe(
      feedbackMailtoUrl({
        type: "Feature request",
        message: "Please add tags.",
      })
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    click.mockRestore();
  });

  test("opens feedback from settings and closes it with Escape", async () => {
    render(<Popup />);
    await screen.findByText("Example article");

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(
      screen.getByRole("dialog", { name: "Send feedback" })
    ).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("surfaces a storage failure instead of hanging on loading", async () => {
    lastError = { message: "storage unavailable" };
    activeTab = [
      {
        id: 4,
        url: "https://example.com/",
        title: "Example",
      } as chrome.tabs.Tab,
    ];

    render(<Popup />);

    expect(await screen.findByText("storage unavailable")).not.toBeNull();
    expect(screen.queryByText("Loading notes…")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Buy me a coffee" })
    ).not.toBeNull();
  });
});
