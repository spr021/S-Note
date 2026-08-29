const CONTENT_SCRIPT_PATH = "src/pages/content/index.js";
const REGISTRATION_ATTEMPTS = 12;
const REGISTRATION_DELAY_MS = 40;

export interface PageMessageResult<T> {
  response: T | null;
  error: string | null;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function rawSend<T>(
  tabId: number,
  message: unknown
): Promise<PageMessageResult<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError?.message ?? null;
      resolve({ response: error ? null : (response as T) ?? null, error });
    });
  });
}

function injectController(tabId: number): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: [CONTENT_SCRIPT_PATH],
      },
      () => resolve(chrome.runtime.lastError?.message ?? null)
    );
  });
}

/**
 * Sends a command to the page and repairs tabs that were already open when
 * the extension was installed or reloaded. Those tabs do not receive manifest
 * content scripts until they are refreshed, so we inject the same packaged
 * entry and retry the command after its asynchronous controller is ready.
 */
export async function sendToPage<T>(
  tabId: number,
  message: unknown
): Promise<PageMessageResult<T>> {
  const first = await rawSend<T>(tabId, message);
  if (first.response !== null) return first;

  const injectionError = await injectController(tabId);
  if (injectionError) return { response: null, error: injectionError };

  let lastError = first.error;
  for (let attempt = 0; attempt < REGISTRATION_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await delay(REGISTRATION_DELAY_MS);
    const retried = await rawSend<T>(tabId, message);
    if (retried.response !== null) return retried;
    lastError = retried.error ?? lastError;
  }

  return {
    response: null,
    error: lastError ?? "The S Note page controller did not start.",
  };
}
