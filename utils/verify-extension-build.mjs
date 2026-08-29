import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");
const manifestPath = resolve(distRoot, "manifest.json");

if (!existsSync(manifestPath)) {
  throw new Error(
    "Extension build verification failed: dist/manifest.json is missing."
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const contentScript = manifest.content_scripts?.[0]?.js?.[0];

if (!contentScript) {
  throw new Error(
    "Extension build verification failed: no content script is registered."
  );
}

if (!manifest.permissions?.includes("scripting")) {
  throw new Error(
    "Extension build verification failed: the popup cannot repair content-script injection without the scripting permission."
  );
}

if (manifest.background?.type !== "module") {
  throw new Error(
    "Extension build verification failed: the background worker imports shared modules but is not declared as a module."
  );
}

const requiredFiles = [
  contentScript,
  "assets/js/page-messaging.js",
  "assets/css/contentStyle.chunk.css",
  "icons/sticky-note-16.png",
  "icons/sticky-note-32.png",
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(distRoot, relativePath))) {
    throw new Error(
      `Extension build verification failed: dist/${relativePath} is missing.`
    );
  }
}

const entrySource = readFileSync(resolve(distRoot, contentScript), "utf8");

if (!entrySource.includes("snote-extension-root")) {
  throw new Error(
    "Extension build verification failed: the content controller is not bundled into the injectable content script."
  );
}

if (entrySource.includes("assets/js/app.js")) {
  throw new Error(
    "Extension build verification failed: the content script still depends on a runtime controller import."
  );
}

if (/\bimport\s*(?:\(|[{*])/.test(entrySource)) {
  throw new Error(
    "Extension build verification failed: the classic content script contains a module import."
  );
}

console.log(
  "Extension build verified: the S Note page controller is self-contained."
);
