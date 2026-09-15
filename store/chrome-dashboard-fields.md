# Chrome Web Store — Dashboard fields for S Note v1.0.0

Everything you must fill in when publishing. Values are copy-paste ready.
Upload package: `release/s-note-1.0.0-chrome.zip`
(or download it from https://github.com/spr021/S-Note/releases/tag/v1.0.0).

---

## 0. Account prerequisites (do once)

| Field                      | Value                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Developer account          | Your paid Chrome Web Store account ✓                                               |
| Publisher / developer name | Shown publicly on the listing. Use your name or a brand (e.g. `Saber Pourrahimi`). |
| Contact email              | Must be a **verified** Google account email.                                       |
| 2-step verification        | Must be enabled on the account.                                                    |
| Trader status (EU DSA)     | Declared in account settings. See §5.                                              |

---

## 1. Store listing tab

| Dashboard field                   | Value to enter                                                                                                  | Notes                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Product name                      | `S Note`                                                                                                        | Comes from the manifest. Max ~45 chars.       |
| Summary / short description       | `Take notes, highlights, comments, sticky marks, and drawings on any website. Everything stays on your device.` | Max **132** chars.                            |
| Description                       | Paste the "Detailed description" section from `store/listing.md`                                                | Max 16,000 chars.                             |
| Category                          | `Productivity`                                                                                                  | Single choice.                                |
| Language                          | `English`                                                                                                       | Primary language.                             |
| Store icon (128×128)              | `public/icons/tabink-128.png`                                                                                   | Required. PNG, no transparency issues.        |
| Screenshots (1280×800 or 640×400) | **You must capture these**                                                                                      | 1–5 required. See §6.                         |
| Small promo tile (440×280)        | Optional / recommended                                                                                          | Used in store browsing.                       |
| Marquee promo tile (1400×560)     | Optional                                                                                                        | Only used if Google features the item.        |
| YouTube video URL                 | Leave blank (or paste a demo video)                                                                             | Optional.                                     |
| Homepage URL                      | `https://github.com/spr021/S-Note`                                                                              | Optional but recommended.                     |
| Support URL                       | `https://github.com/spr021/S-Note/issues`                                                                       | Optional; use an email instead if you prefer. |
| Official URL                      | Leave blank                                                                                                     | Only for verified site owners.                |
| Mature content                    | `No`                                                                                                            |                                               |

---

## 2. Privacy tab (Privacy practices)

### 2.1 Single purpose

> S Note lets users annotate web pages with notes, highlights, comments, sticky
> marks, and freehand drawings. All annotations are stored locally on the
> user's device and never leave it.

### 2.2 Permission justifications

Paste one per permission. The manifest requests exactly these four.

| Permission     | Justification to paste                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`      | Saves the user's notes, highlights, comments, sticky marks, drawings, and settings locally in the browser. No data is transmitted off the device.                       |
| `activeTab`    | Lets S Note act only on the page the user is currently viewing, and only after they invoke it (toolbar click, keyboard shortcut, or context menu).                      |
| `scripting`    | Injects the S Note annotation layer into the current page when the user opens it, and repairs tabs that were already open when the extension was installed or reloaded. |
| `contextMenus` | Adds right-click actions to highlight or comment on the user's selected text.                                                                                           |

> The content script matches `http://*/*` and `https://*/*`, so the listing will
> warn that S Note can run on all websites. This is required for a page
> annotation tool; the justification above covers it.

### 2.3 Remote code

- Are you using remote code? → **No**

### 2.4 Data usage

- "What user data do you plan to collect?" → **select none** for every category
  (personally identifiable info, health, financial, authentication, personal
  communications, location, web history, user activity, website content).
- S Note stores data only in `chrome.storage.local`; it never sends it anywhere.

### 2.5 Certifications (tick all three)

- I do not sell or transfer user data to third parties, apart from approved use cases.
- I do not use or transfer user data for purposes unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

### 2.6 Privacy policy URL

```
https://github.com/spr021/S-Note/blob/main/PRIVACY.md
```

---

## 3. Distribution tab

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Payments       | `Free` (no in-app purchases)              |
| Visibility     | `Public`                                  |
| Regions        | `All regions` (or restrict if you prefer) |
| Pricing        | Free                                      |
| Mature content | `No`                                      |

---

## 4. Test instructions (optional but speeds up review)

> No account or setup is needed.
>
> 1. Open any normal `http` or `https` page (e.g. https://en.wikipedia.org).
> 2. Click the S Note toolbar icon → "Unhide notes" (or click the floating S).
> 3. Select text and use Highlight/Comment, place a sticky mark, or draw.
> 4. Hide the layer; annotations are restored when you revisit the page.
>    Everything is stored locally in `chrome.storage.local`. Donations are
>    optional and handled entirely by Buy Me a Coffee.

---

## 5. Trader status (EU DSA)

The dashboard asks whether you are a **trader** or **non-trader** for the EU.
Choose the one that accurately describes you. As a general guide:

- **Non-trader** — you publish as an individual/hobbyist and do not
  commercially sell the item. Note: items declared non-trader may be hidden
  from users in the EU.
- **Trader** — you offer the item commercially. You will then need to provide
  trader contact details that are shown publicly in the EU.

An optional "buy me a coffee" donation link generally is not commercial selling,
but this is a legal declaration — answer truthfully and check the in-dashboard
help text if unsure.

---

## 6. Screenshots you must capture

Chrome accepts `1280×800` or `640×400` PNG/JPEG, 1–5 images. Suggested set
(see `store/listing.md` for the full shot list):

1. Popup open on a normal article page ("This page" view).
2. Floating S button + annotation toolbar on a page.
3. Highlights, a comment, and a sticky mark on a page.
4. The pen tool drawing.
5. Settings tab (toggles + support card).

Capture tips: use a clean page (e.g. Wikipedia), 100% zoom, and crop to
1280×800 so nothing is letterboxed.

---

## 7. Submit

1. Complete §1–§3.
2. Click **Submit for review**.
3. First review usually takes a few days; you'll get an email with any changes
   requested.
