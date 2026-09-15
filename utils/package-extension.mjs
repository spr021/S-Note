import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const releaseDir = resolve(projectRoot, "release");
const ignored = new Set([".DS_Store"]);

const packageJson = JSON.parse(
  await readFile(resolve(projectRoot, "package.json"), "utf8")
);
const version = packageJson.version;
const baseName = "s-note";

let manifest;
try {
  manifest = JSON.parse(
    await readFile(resolve(distDir, "manifest.json"), "utf8")
  );
} catch {
  throw new Error(
    "Packaging failed: dist/manifest.json is missing. Run the build first."
  );
}

// Chrome: service worker only, and drop Firefox-only keys.
const chromeManifest = structuredClone(manifest);
delete chromeManifest.background.scripts;
delete chromeManifest.browser_specific_settings;
chromeManifest.minimum_chrome_version = "109";

// Firefox: event page instead of a service worker; keep the gecko settings.
const firefoxManifest = structuredClone(manifest);
const backgroundEntry = firefoxManifest.background.service_worker;
delete firefoxManifest.background.service_worker;
firefoxManifest.background.scripts = [backgroundEntry];

async function stage(source, target) {
  await cp(source, target, {
    recursive: true,
    filter: (path) => !ignored.has(path.split("/").pop()),
  });
}

async function zip(directory, zipPath) {
  const entries = await readdir(directory);
  execFileSync("zip", ["-r", "-X", "-q", zipPath, ...entries], {
    cwd: directory,
  });
}

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

for (const target of [
  { browser: "chrome", manifest: chromeManifest },
  { browser: "firefox", manifest: firefoxManifest },
]) {
  const unpackedDir = resolve(releaseDir, target.browser);
  await stage(distDir, unpackedDir);
  await writeFile(
    resolve(unpackedDir, "manifest.json"),
    `${JSON.stringify(target.manifest, null, 2)}\n`
  );
  const zipPath = resolve(
    releaseDir,
    `${baseName}-${version}-${target.browser}.zip`
  );
  await zip(unpackedDir, zipPath);
  console.log(`Packaged ${zipPath}`);
}
