# Source code notes for AMO reviewers

S Note is published from the public repository:

- Repository: https://github.com/spr021/S-Note
- Tag: `v1.0.0`
- License: MIT

## How to build the submitted package

The submitted add-on is the bundled output of a standard build. To reproduce it:

```sh
git clone https://github.com/spr021/S-Note.git
cd S-Note
git checkout v1.0.0
yarn install --frozen-lockfile
yarn build
```

`yarn build` runs:

1. `tsc --noEmit` — type check.
2. `vite build` — popup, background, and content CSS bundles.
3. `vite build --config vite.content.config.ts` — the content script as a
   single classic-script IIFE.
4. `utils/verify-extension-build.mjs` and `utils/verify-content-runtime.mjs` —
   build and runtime verification.

The result is written to `dist/`. The AMO submission is a zip of the contents
of `dist/` with a Firefox-specific `manifest.json` (see below).

## Toolchain

- Node.js 18.12.0 (`.nvmrc`)
- Yarn 1.22.x
- Vite 3.1.3, TypeScript 4.8.3, React 18.2.0

## Manifest differences from the Chrome package

The repository keeps one cross-browser MV3 manifest. The packaging script
(`utils/package-extension.mjs`) produces the Firefox variant by:

- removing `background.service_worker` and adding
  `background.scripts: ["src/pages/background/index.js"]` with
  `"type": "module"` (Firefox event page), and
- keeping `browser_specific_settings.gecko` (including
  `data_collection_permissions.required = ["none"]`).

The source code is not minified for its own sake; the bundler performs the
usual whitespace removal and module concatenation. No remote code is fetched or
executed at runtime, and no `eval` or `new Function` is used.

## About the `innerHTML` lint warnings

`web-ext lint` reports `UNSAFE_VAR_ASSIGNMENT` warnings for a few `innerHTML`
assignments in `src/pages/content/app.ts`. Every assignment is either a static
template string or is populated with a value from `chrome.runtime.getURL()` for
the extension's own icon. User-provided text (notes, comments, quotes) is
always written with `textContent`, never `innerHTML`.

## Data collection

S Note collects no data. It has no server component; all notes are stored in
`chrome.storage.local` / `browser.storage.local` on the user's device.
