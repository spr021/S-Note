/**
 * Voluntary donation link. Tips go directly to the developer, not Google.
 * `chrome.tabs.create` needs no extra permission; the callback swallows any
 * failure (for example a blocked tab) so it can never crash the popup.
 */
export const SUPPORT_URL = "https://buymeacoffee.com/spr021";

export function openSupportPage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: SUPPORT_URL }, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}
