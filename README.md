# S Note

S Note is a local-first Chrome extension that adds a saved annotation layer on top of every website. Each page gets its own independent canvas for notes, highlights, comments, sticky marks, and freehand drawing.

## Features

- Plain notes linked to the current page
- A toggleable annotation layer that does not modify the website's saved source
- A locked note-taking mode where website links, buttons, forms, and shortcuts cannot run
- Select-text, highlight, comment, sticky-mark, pen, and erase tools
- Persistent yellow, green, blue, and pink text highlights
- Google Docs-style comments anchored to selected website text
- Distinct underlined comments with an inline comment badge
- Draggable sticky notes positioned anywhere on a page
- Scroll-aware freehand pen strokes
- Undo and keyboard tool shortcuts
- Automatic annotation restoration when a page is revisited
- Quote-and-context fallback when a website's DOM structure changes
- Current-page and all-notes views in the extension popup
- Website groups in All notes with one-click bulk deletion
- A minimizable annotation toolbar that keeps the layer active
- Edit, delete, and “show on page” controls
- Selection toolbar and right-click context-menu actions
- Data stored only in `chrome.storage.local`

## Install

S Note targets Chrome (Manifest V3) and Firefox (Manifest V3) from a single
codebase. Store listings are in progress; until they are live you can build and
load the extension yourself:

```sh
yarn install --frozen-lockfile
yarn build:release
```

This produces `release/s-note-<version>-chrome.zip` and
`release/s-note-<version>-firefox.zip`, plus unpacked `release/chrome` and
`release/firefox` folders for local testing.

## Run locally

Requirements: Node.js 16 or newer and Yarn 1.x.

```sh
yarn install --frozen-lockfile
yarn build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this repository's `dist` directory.

After every rebuild, click **Reload** on the S Note card in
`chrome://extensions`, then refresh any website tab that was already open.
Chrome does not inject an updated content script into existing tabs
automatically. The floating **S** is available on normal `http` and `https`
pages, not Chrome-internal pages such as `chrome://extensions`, the New Tab
page, or the Chrome Web Store.

For development with rebuild/reload support:

```sh
yarn dev
```

## Use S Note

1. Open any normal `http` or `https` page.
2. Click the floating **S** button on the page, or choose **Unhide notes** in the extension popup.
3. While notes are unhidden, the website is locked: its links, buttons, forms, and keyboard actions cannot run. Scrolling, selecting text, and the right-click menu remain available for annotation work.
4. Choose a tool from the layer toolbar:
   - **Select text (V)** lets you select a passage and then choose highlight or comment from the small selection toolbar.
   - **Highlight (H)** highlights the next text selection using the active color.
   - **Comment (C)** attaches a comment to the next text selection.
   - **Sticky mark (M)** places a note wherever you click. Drag its top handle to move it.
   - **Pen (D)** draws freehand strokes over the page.
   - **Erase (E)** removes the annotation you click.
5. Use the four color buttons for highlights, comments, marks, and pen strokes. Use **Undo** to remove the newest annotation. Every finished action saves automatically.
6. Click the floating **S**, the toolbar's **×**, or **Hide notes** in the popup. Every annotation disappears and the website becomes fully interactive again.
7. Unhide notes later to restore only the annotations saved for that exact page URL. Use the popup to browse this page's annotations or all saved annotations.

You can also right-click selected text to highlight or comment directly, or right-click a page to unhide notes and choose sticky, pen, or erase mode.

## Development checks

```sh
yarn test --runInBand
yarn build
```

The tests cover storage CRUD, strict per-website separation, URL normalization, text-anchor restoration, multi-element highlighting, layer activation, comments, draggable sticky marks, freehand drawing, erasing, popup tool launching, and page-note capture.

## Architecture

- `src/shared/notes.ts` — data model and `chrome.storage.local` persistence
- `src/pages/content/anchors.ts` — range serialization, quote fallback, and safe DOM wrapping
- `src/pages/content/app.ts` — the website layer, toolbar modes, spatial annotations, text annotations, restoration, and messaging
- `src/pages/popup/Popup.tsx` — layer launcher, page-note capture, and saved-annotation library
- `src/pages/background/index.ts` — layer and selection context menus

Text annotations store a DOM path for fast restoration and the selected quote with surrounding text as a resilient fallback. Sticky marks and drawings store document coordinates and are redrawn relative to the current scroll position. Sites that completely rewrite selected words or radically reflow their dimensions can make an old annotation less precise; the saved annotation remains available in **All notes**.

## Privacy

S Note does not send notes or browsing content to a server. Notes remain in Chrome's local extension storage for the current browser profile. Removing the extension may remove that local data, depending on Chrome's extension-data handling.

## Support

S Note is free and stores everything locally. If it saves you time, you can
buy me a coffee at <https://buymeacoffee.com/spr021>. Tips are entirely
voluntary and go directly to the developer.

## License

MIT
