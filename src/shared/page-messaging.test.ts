import { sendToPage } from "./page-messaging";

describe("page messaging", () => {
  test("injects the content controller and retries when a tab has no receiver", async () => {
    let controllerReady = false;
    let sendCount = 0;
    const executeScript = jest.fn(
      (
        _injection: chrome.scripting.ScriptInjection<[], void>,
        callback?: (results: chrome.scripting.InjectionResult<void>[]) => void
      ) => {
        controllerReady = true;
        callback?.([]);
      }
    );

    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: { lastError: undefined },
        tabs: {
          sendMessage: (
            _tabId: number,
            _message: unknown,
            callback: (response?: unknown) => void
          ) => {
            sendCount += 1;
            if (controllerReady) callback({ ok: true, active: true });
            else {
              chrome.runtime.lastError = {
                message:
                  "Could not establish connection. Receiving end does not exist.",
              } as chrome.runtime.LastError;
              callback();
              chrome.runtime.lastError = undefined;
            }
          },
        },
        scripting: { executeScript },
      },
    });

    const result = await sendToPage<{ ok: boolean; active: boolean }>(7, {
      type: "SNOTE_TOGGLE_LAYER",
      open: true,
    });

    expect(result.response).toEqual({ ok: true, active: true });
    expect(result.error).toBeNull();
    expect(sendCount).toBe(2);
    expect(executeScript).toHaveBeenCalledWith(
      {
        target: { tabId: 7 },
        files: ["src/pages/content/index.js"],
      },
      expect.any(Function)
    );
  });
});
