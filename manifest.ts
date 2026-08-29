import packageJson from "./package.json";

const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  background: {
    service_worker: "src/pages/background/index.js",
    type: "module",
  },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: {
      "16": "icons/sticky-note-16.png",
      "24": "icons/sticky-note-24.png",
      "32": "icons/sticky-note-32.png",
      "48": "icons/sticky-note-48.png",
    },
  },
  icons: {
    "16": "icons/sticky-note-16.png",
    "24": "icons/sticky-note-24.png",
    "32": "icons/sticky-note-32.png",
    "48": "icons/sticky-note-48.png",
    "64": "icons/sticky-note-64.png",
    "128": "icons/sticky-note-128.png",
    "256": "icons/sticky-note-256.png",
    "512": "icons/sticky-note-512.png",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["src/pages/content/index.js"],
      css: ["assets/css/contentStyle.chunk.css"],
      run_at: "document_idle",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["assets/js/*.js", "assets/css/*.css", "icons/*"],
      matches: ["*://*/*"],
    },
  ],
  permissions: ["activeTab", "contextMenus", "scripting", "storage"],
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Ctrl+B",
        mac: "Command+B",
      },
    },
  },
};

export default manifest;
