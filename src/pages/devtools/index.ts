try {
  chrome.devtools.panels.create(
    "Dev Tools",
    "icons/tabink-64.png",
    "src/pages/panel/index.html"
  );
} catch (e) {
  console.error(e);
}
