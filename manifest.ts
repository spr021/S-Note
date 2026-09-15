import packageJson from "./package.json";

const BACKGROUND_ENTRY = "src/pages/background/index.js";

/**
 * Cross-browser Manifest V3.
 *
 * Chrome runs `background.service_worker`; Firefox does not support extension
 * service workers and runs `background.scripts` as an event page instead. Each
 * browser ignores the key it does not use, so a single manifest ships to both
 * stores. `browser_specific_settings` is required by addons.mozilla.org and is
 * ignored by Chrome.
 */
type CrossBrowserManifest = chrome.runtime.ManifestV3 & {
  background: {
    service_worker: string;
    scripts: string[];
    type: "module";
  };
  browser_specific_settings: {
    gecko: {
      id: string;
      strict_min_version: string;
      // Required by addons.mozilla.org for new extensions. S Note collects no
      // data and sends nothing to a server, so nothing is declared.
      data_collection_permissions: {
        required: string[];
      };
    };
  };
};

const manifest: CrossBrowserManifest = {
  manifest_version: 3,
  name: "S Note",
  version: packageJson.version,
  description: packageJson.description,
  homepage_url: "https://github.com/spr021/S-Note",
  background: {
    service_worker: BACKGROUND_ENTRY,
    scripts: [BACKGROUND_ENTRY],
    type: "module",
  },
  browser_specific_settings: {
    gecko: {
      id: "s-note@saberpourrahimi.ir",
      strict_min_version: "140.0",
      data_collection_permissions: {
        required: ["none"],
      },
    },
  },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: {
      "16": "icons/tabink-16.png",
      "24": "icons/tabink-24.png",
      "32": "icons/tabink-32.png",
      "48": "icons/tabink-48.png",
    },
  },
  icons: {
    "16": "icons/tabink-16.png",
    "24": "icons/tabink-24.png",
    "32": "icons/tabink-32.png",
    "48": "icons/tabink-48.png",
    "64": "icons/tabink-64.png",
    "128": "icons/tabink-128.png",
    "256": "icons/tabink-256.png",
    "512": "icons/tabink-512.png",
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
