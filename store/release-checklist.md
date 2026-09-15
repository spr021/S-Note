# S Note v1.0.0 — Release Checklist

## What is already done

- Version bumped to **1.0.0** (`package.json`, read by the manifest).
- Cross-browser MV3 manifest (`manifest.ts`).
- Both packages built and verified:
  - `release/s-note-1.0.0-chrome.zip`
  - `release/s-note-1.0.0-firefox.zip`
  - Unpacked copies for testing: `release/chrome/`, `release/firefox/`
- `yarn test --runInBand` and `yarn build` pass.
- `web-ext lint` on the Firefox package: **0 errors** (7 warnings, all benign).
- Privacy policy: `PRIVACY.md`.
- Store copy: `store/listing.md`.
- AMO source notes for reviewers: `store/amo-source-notes.md`.

Rebuild everything at any time with:

```sh
yarn build:release
```

## Before you submit — test locally

**Chrome / Edge**

1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select the `release/chrome` folder.
3. Test the popup, the floating S button, and a note on a real page.

**Firefox**

1. Open `about:debugging#/runtime/this-firefox`.
2. **Load Temporary Add-on…** → select `release/firefox/manifest.json`.
3. Test the popup, the floating S button, and a note on a real page.

## You need to provide (I cannot generate these)

- **Screenshots** for both stores (see `store/listing.md` → "Screenshots").
- **Chrome promotional images** (optional): 440×280 tile, 1400×560 marquee.
- A **support email or URL** for the listings. Suggested:
  `https://github.com/spr021/S-Note/issues`.

## Chrome Web Store

Field-by-field copy-paste reference: **`store/chrome-dashboard-fields.md`**.

1. Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. **New item** → upload `release/s-note-1.0.0-chrome.zip`.
3. **Store listing** tab:
   - Name: `S Note`
   - Summary and description: paste from `store/listing.md`
   - Category: `Productivity`, Language: `English`
   - Upload the 128×128 icon (`public/icons/tabink-128.png`) and screenshots.
4. **Privacy practices** tab:
   - Data usage: S Note collects **no** user data — declare "none" for each
     category. It does not use remote code.
   - Privacy policy URL:
     `https://github.com/spr021/S-Note/blob/main/PRIVACY.md`
5. **Distribution**: Free, all regions.
6. **Submit for review**.

## addons.mozilla.org (AMO)

1. Open the [Developer Hub](https://addons.mozilla.org/developers/) and sign in.
2. **Submit a New Add-on** → **On this site** (listed).
3. Upload `release/s-note-1.0.0-firefox.zip`.
4. When asked for **source code** (the build is bundled/minified), attach the
   repository and the instructions from `store/amo-source-notes.md`
   (`https://github.com/spr021/S-Note`, tag `v1.0.0`,
   `yarn install --frozen-lockfile && yarn build`).
5. Listing: name, summary, description, category `Productivity`, license `MIT`,
   privacy policy URL, screenshots.
6. **Submit for review**.

> The Firefox add-on ID is `s-note@saberpourrahimi.ir` in `manifest.ts`. It is
> permanent after the first submission — change it now if you prefer another.

## GitHub Release (done)

The `v1.0.0` tag triggered `.github/workflows/release.yml`, which rebuilt both
packages and attached them to a GitHub Release:

- Release: https://github.com/spr021/S-Note/releases/tag/v1.0.0
- Chrome: https://github.com/spr021/S-Note/releases/download/v1.0.0/s-note-1.0.0-chrome.zip
- Firefox: https://github.com/spr021/S-Note/releases/download/v1.0.0/s-note-1.0.0-firefox.zip

To publish a future version: bump `version` in `package.json`, then
`git tag vX.Y.Z && git push origin vX.Y.Z`.
