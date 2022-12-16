try {
  chrome.devtools.panels.create(
    "Dev Tools",
    "icons/sticky-note-64.png",
    "src/pages/panel/index.html"
  );
} catch (e) {
  console.error(e);
}
