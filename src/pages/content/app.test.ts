import { STORAGE_KEY, type WebNote } from "@src/shared/notes";
import { startSNote } from "./app";

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

describe("S Note content experience", () => {
  test("supports text and spatial tools on the website layer", async () => {
    const values: Record<string, unknown> = {};
    const storageListeners: Array<
      (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string
      ) => void
    > = [];
    const messageListeners: Array<
      (
        message: unknown,
        sender: chrome.runtime.MessageSender,
        respond: (value: unknown) => void
      ) => void
    > = [];
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: {
          lastError: undefined,
          onMessage: {
            addListener: (listener: typeof messageListeners[number]) =>
              messageListeners.push(listener),
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
              storageListeners.forEach((listener) =>
                listener(changes, "local")
              );
            },
          },
          onChanged: {
            addListener: (listener: typeof storageListeners[number]) =>
              storageListeners.push(listener),
          },
        },
      },
    });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 260,
        top: 180,
        bottom: 205,
        width: 160,
        height: 25,
        x: 100,
        y: 180,
        toJSON: () => ({}),
      }),
    });
    if (!(globalThis.CSS && "escape" in globalThis.CSS)) {
      Object.defineProperty(globalThis, "CSS", {
        configurable: true,
        value: { escape: (value: string) => value },
      });
    }

    document.body.innerHTML = `
      <p id="first">A good web notebook keeps the source close.</p>
      <p id="second">Comments preserve why a passage mattered.</p>
      <button id="page-action">Website action</button>
      <input id="page-input" />`;
    await startSNote();
    const host = document.querySelector<HTMLDivElement>(
      "#snote-extension-root"
    );
    const shadow = host?.shadowRoot;
    expect(shadow).not.toBeNull();
    let layerState: unknown;
    messageListeners[0](
      { type: "SNOTE_GET_LAYER_STATE" },
      {} as chrome.runtime.MessageSender,
      (value) => {
        layerState = value;
      }
    );
    expect(layerState).toMatchObject({
      active: false,
      mode: "select",
      count: 0,
    });
    const websiteAction = jest.fn();
    const pageButton =
      document.querySelector<HTMLButtonElement>("#page-action");
    pageButton?.addEventListener("click", websiteAction);
    pageButton?.click();
    expect(websiteAction).toHaveBeenCalledTimes(1);
    const pageInput = document.querySelector<HTMLInputElement>("#page-input");
    pageInput?.focus();
    expect(document.activeElement).toBe(pageInput);
    pageInput?.blur();
    expect(
      document.documentElement.classList.contains("snote-layer-visible")
    ).toBe(false);

    shadow?.querySelector<HTMLButtonElement>(".launcher")?.click();
    expect(
      shadow?.querySelector(".layer-toolbar")?.classList.contains("visible")
    ).toBe(true);
    const minimizeToolbar = shadow?.querySelector<HTMLButtonElement>(
      '[aria-label="Minimize toolbar"]'
    );
    minimizeToolbar?.click();
    expect(
      shadow?.querySelector(".layer-toolbar")?.classList.contains("minimized")
    ).toBe(true);
    const expandToolbar = shadow?.querySelector<HTMLButtonElement>(
      '[aria-label="Expand toolbar"]'
    );
    expandToolbar?.click();
    expect(
      shadow?.querySelector(".layer-toolbar")?.classList.contains("minimized")
    ).toBe(false);
    expect(
      document.documentElement.classList.contains("snote-layer-visible")
    ).toBe(true);
    pageButton?.click();
    expect(websiteAction).toHaveBeenCalledTimes(1);
    pageInput?.focus();
    expect(document.activeElement).not.toBe(pageInput);

    const firstText = document.querySelector("#first")?.firstChild as Text;
    const selection = window.getSelection();
    const highlightRange = document.createRange();
    highlightRange.setStart(firstText, 7);
    highlightRange.setEnd(firstText, 19);
    selection?.removeAllRanges();
    selection?.addRange(highlightRange);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await flush();

    const toolbar = shadow?.querySelector<HTMLElement>(".quick-toolbar");
    expect(toolbar?.classList.contains("visible")).toBe(true);
    shadow
      ?.querySelector<HTMLButtonElement>(
        '[data-action="highlight"][data-color="yellow"]'
      )
      ?.click();
    await flush();

    expect(document.querySelector(".snote-highlight")?.textContent).toBe(
      "web notebook"
    );
    expect((values[STORAGE_KEY] as WebNote[])[0]).toMatchObject({
      kind: "highlight",
      quote: "web notebook",
      color: "yellow",
    });

    const secondText = document.querySelector("#second")?.firstChild as Text;
    const commentRange = document.createRange();
    commentRange.setStart(secondText, 0);
    commentRange.setEnd(secondText, 8);
    selection?.removeAllRanges();
    selection?.addRange(commentRange);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await flush();
    shadow
      ?.querySelector<HTMLButtonElement>('[data-action="comment"]')
      ?.click();

    const textarea =
      shadow?.querySelector<HTMLTextAreaElement>(".editor textarea");
    expect(textarea).not.toBeNull();
    if (textarea) textarea.value = "This explains the value of comments.";
    shadow
      ?.querySelector<HTMLButtonElement>('[data-editor-action="save"]')
      ?.click();
    await flush();

    const stored = values[STORAGE_KEY] as WebNote[];
    expect(stored.find((note) => note.kind === "comment")).toMatchObject({
      quote: "Comments",
      text: "This explains the value of comments.",
    });
    const commentMark = document.querySelector<HTMLElement>(
      ".snote-comment-anchor"
    );
    expect(commentMark?.textContent).toBe("Comments");
    expect(commentMark?.classList.contains("snote-comment-marker")).toBe(true);

    commentMark?.click();
    const editArea =
      shadow?.querySelector<HTMLTextAreaElement>(".editor textarea");
    expect(editArea?.value).toBe("This explains the value of comments.");
    if (editArea) editArea.value = "Updated anchored comment.";
    shadow
      ?.querySelector<HTMLButtonElement>('[data-editor-action="save"]')
      ?.click();
    await flush();
    expect(
      (values[STORAGE_KEY] as WebNote[]).find((note) => note.kind === "comment")
        ?.text
    ).toBe("Updated anchored comment.");

    shadow?.querySelector<HTMLButtonElement>('[data-mode="mark"]')?.click();
    shadow
      ?.querySelector<HTMLElement>(".mark-capture")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, clientX: 240, clientY: 320 })
      );
    const markEditor =
      shadow?.querySelector<HTMLTextAreaElement>(".editor textarea");
    if (markEditor) markEditor.value = "Review this diagram later.";
    shadow
      ?.querySelector<HTMLButtonElement>('[data-editor-action="save"]')
      ?.click();
    await flush();

    expect(
      (values[STORAGE_KEY] as WebNote[]).find((note) => note.kind === "mark")
    ).toMatchObject({
      text: "Review this diagram later.",
      position: { x: 240, y: 320 },
    });
    expect(shadow?.querySelector(".annotation-mark")?.textContent).toContain(
      "Review this diagram later."
    );

    shadow?.querySelector<HTMLButtonElement>('[data-mode="draw"]')?.click();
    const svg = shadow?.querySelector<SVGSVGElement>("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toContain("draw");
    const pointer = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y,
      });
      Object.defineProperty(event, "pointerId", { value: 7 });
      return event;
    };
    svg?.dispatchEvent(pointer("pointerdown", 40, 50));
    svg?.dispatchEvent(pointer("pointermove", 60, 70));
    svg?.dispatchEvent(pointer("pointermove", 90, 72));
    svg?.dispatchEvent(pointer("pointerup", 90, 72));
    await flush();

    const drawing = (values[STORAGE_KEY] as WebNote[]).find(
      (note) => note.kind === "drawing"
    );
    expect(drawing?.drawing?.points).toHaveLength(3);
    expect(
      shadow?.querySelectorAll(".drawing-svg path[data-snote-id]")
    ).toHaveLength(1);

    shadow?.querySelector<HTMLButtonElement>('[data-mode="select"]')?.click();
    const dragHandle = shadow?.querySelector<HTMLElement>(".mark-handle");
    const dragEvent = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y,
      });
      Object.defineProperty(event, "pointerId", { value: 9 });
      return event;
    };
    dragHandle?.dispatchEvent(dragEvent("pointerdown", 240, 320));
    window.dispatchEvent(dragEvent("pointermove", 300, 380));
    window.dispatchEvent(dragEvent("pointerup", 300, 380));
    await flush();
    expect(
      (values[STORAGE_KEY] as WebNote[]).find((note) => note.kind === "mark")
        ?.position
    ).toEqual({
      x: 300,
      y: 380,
    });

    shadow?.querySelector<HTMLButtonElement>('[data-mode="erase"]')?.click();
    const sticky = shadow?.querySelector<HTMLElement>(".annotation-mark");
    sticky?.click();
    await flush();
    expect(
      (values[STORAGE_KEY] as WebNote[]).some((note) => note.kind === "mark")
    ).toBe(false);

    expect(shadow?.querySelector(".launcher-count")?.textContent).toBe("3");

    shadow?.querySelector<HTMLButtonElement>(".launcher")?.click();
    expect(
      document.documentElement.classList.contains("snote-layer-visible")
    ).toBe(false);
    expect(
      shadow?.querySelector(".layer-toolbar")?.classList.contains("visible")
    ).toBe(false);
    expect(
      shadow?.querySelector("svg")?.classList.contains("annotations-visible")
    ).toBe(false);
    expect(document.querySelector(".snote-highlight")).toBeNull();
    pageButton?.click();
    expect(websiteAction).toHaveBeenCalledTimes(2);

    messageListeners[0](
      { type: "SNOTE_SET_MODE", mode: "mark" },
      {} as chrome.runtime.MessageSender,
      (value) => {
        layerState = value;
      }
    );
    await flush();
    expect(layerState).toMatchObject({ active: true, mode: "mark", count: 3 });
    expect(
      document.documentElement.classList.contains("snote-layer-visible")
    ).toBe(true);
    expect(document.querySelector(".snote-highlight")).not.toBeNull();
    expect(
      shadow?.querySelector("svg")?.classList.contains("annotations-visible")
    ).toBe(true);

    shadow?.querySelector<HTMLElement>(".mark-capture")?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 410,
        clientY: 210,
      })
    );
    const unsavedDraft =
      shadow?.querySelector<HTMLTextAreaElement>(".editor textarea");
    if (unsavedDraft) unsavedDraft.value = "Save this when the layer hides.";
    shadow?.querySelector<HTMLButtonElement>(".launcher")?.click();
    await flush();
    expect(
      (values[STORAGE_KEY] as WebNote[]).find(
        (note) =>
          note.kind === "mark" &&
          note.text === "Save this when the layer hides."
      )
    ).toBeDefined();
    expect(
      document.documentElement.classList.contains("snote-layer-visible")
    ).toBe(false);
  });
});
