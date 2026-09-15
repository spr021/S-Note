/**
 * Voluntary donation link. Tips go directly to the developer, not Google.
 * `chrome.tabs.create` needs no extra permission and keeps the popup open.
 */
export const SUPPORT_URL = "https://buymeacoffee.com/spr021";

export function openSupportPage(): void {
  void chrome.tabs.create({ url: SUPPORT_URL });
}
