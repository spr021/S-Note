# AGENTS.md — S Note

MV3 local-first Chrome extension. All notes live in `chrome.storage.local` under key `snote.notes.v1`; no backend.

## Commands

- Setup: `yarn install --frozen-lockfile` (Node 20.19.0 per `.nvmrc`, Yarn 1.x).
- Verify: `yarn test --runInBand && yarn build` — same order as CI (`.github/workflows/build.yml`: `build:hmr` → `test` → `build`).
- Single test: `yarn test <path> --runInBand`, e.g. `yarn test src/shared/notes --runInBand`.
- Full build: `yarn build` = `tsc --noEmit` + both vite bundles + `utils/verify-extension-build.mjs` + `utils/verify-content-runtime.mjs`. Do not skip or reorder; the verify scripts fail the build if the content bundle isn't self-contained or the floating S doesn't render.
- Dev loop: `yarn dev` (HMR server + nodemon rebuild on `src/`, `utils/`, vite configs). Then in `chrome://extensions` load unpacked `dist/`, click Reload on the S Note card, and refresh already-open site tabs.

## Build gotchas

- Two vite builds, both required: `vite.config.ts` (background, popup, content CSS) and `vite.content.config.ts` (content script as single-file IIFE, `emptyOutDir: false`, `inlineDynamicImports: true`). The content script is a classic script — it must contain no `import(` / `import{` at runtime; verification enforces this.
- `manifest.ts` is the manifest source of truth (via `make-manifest` plugin). Never hand-edit `public/manifest.json` (gitignored, generated).
- `dist/` is gitignored build output. Manual testing only works on normal `http(s)` pages, not `chrome://`, New Tab, or Web Store.
- Path aliases `@src/@assets/@pages` are defined in three places — keep in sync: `tsconfig.json`, both vite configs, `jest.config.js` (`moduleNameMapper`).

## Architecture

- `src/shared/notes.ts` — `WebNote` model, URL normalization (hash stripped; per-exact-URL storage), storage CRUD.
- `src/pages/content/index.ts` → `app.ts` — layer controller (toolbar modes, restore, messaging). `anchors.ts` — range serialization + quote/prefix/suffix fallback.
- `src/pages/popup/Popup.tsx` — launcher + notes library. `src/pages/background/index.ts` — context menus, `sendToPage` messaging (`src/shared/page-messaging.ts`).

## Tests

- Jest 29 + ts-jest + jsdom. `clearMocks: true`; CSS imports map to `test-utils/styleMock.js`. `chrome` API is mocked per test file — follow `src/shared/notes.test.ts` / `src/pages/popup/Popup.test.tsx` patterns.
- Nodemon ignores `src/**/*.spec.ts`; colocated `*.test.ts(x)` are the convention (5 suites: notes, page-messaging, anchors, app, Popup).

## Style

- Prettier: double quotes, `trailingComma: es5`, `arrowParens: always`. ESLint extends `plugin:prettier/recommended`; `react/react-in-jsx-scope` off, `chrome` is a readonly global.


<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->
