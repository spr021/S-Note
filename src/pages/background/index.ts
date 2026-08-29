import reloadOnUpdate from "virtual:reload-on-update-in-background-script";
import { sendToPage } from "@src/shared/page-messaging";

reloadOnUpdate("pages/background");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "snote-highlight",
      title: "Highlight with S Note",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: "snote-comment",
      title: "Comment on selection with S Note",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: "snote-layer",
      title: "Unhide S Note annotations",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "snote-mark-mode",
      title: "Place a sticky mark with S Note",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "snote-draw-mode",
      title: "Draw with S Note",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "snote-erase-mode",
      title: "Erase an S Note annotation",
      contexts: ["page"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "snote-highlight") {
    void sendToPage(tab.id, {
      type: "SNOTE_CREATE_HIGHLIGHT",
      color: "yellow",
    });
  }
  if (info.menuItemId === "snote-comment") {
    void sendToPage(tab.id, { type: "SNOTE_CREATE_COMMENT" });
  }
  if (info.menuItemId === "snote-layer") {
    void sendToPage(tab.id, { type: "SNOTE_TOGGLE_LAYER", open: true });
  }
  const modes: Record<string, "mark" | "draw" | "erase"> = {
    "snote-mark-mode": "mark",
    "snote-draw-mode": "draw",
    "snote-erase-mode": "erase",
  };
  const mode = modes[String(info.menuItemId)];
  if (mode) {
    void sendToPage(tab.id, { type: "SNOTE_SET_MODE", mode });
  }
});
