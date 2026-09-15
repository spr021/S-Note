import {
  createNoteId,
  deleteNote,
  getNotesForUrl,
  normalizePageUrl,
  saveNote,
  STORAGE_KEY,
  updateNoteText,
  type HighlightColor,
  type PagePoint,
  type WebNote,
} from "@src/shared/notes";
import {
  DEFAULT_SETTINGS,
  getSettings,
  settingsFromChange,
  SETTINGS_KEY,
  type SNoteSettings,
} from "@src/shared/settings";
import { anchorFromRange, rangeFromAnchor, wrapRange } from "./anchors";

const HOST_ID = "snote-extension-root";
const HIGHLIGHT_CLASS = "snote-highlight";
const COMMENT_CLASS = "snote-comment-anchor";
const SVG_NS = "http://www.w3.org/2000/svg";

type LayerMode = "select" | "highlight" | "comment" | "mark" | "draw" | "erase";

type ContentMessage =
  | { type: "SNOTE_CREATE_HIGHLIGHT"; color?: HighlightColor }
  | { type: "SNOTE_CREATE_COMMENT" }
  | { type: "SNOTE_FOCUS_NOTE"; noteId: string }
  | { type: "SNOTE_TOGGLE_LAYER"; open?: boolean }
  | { type: "SNOTE_GET_LAYER_STATE" }
  | { type: "SNOTE_SET_MODE"; mode: LayerMode };

interface DragState {
  note: WebNote;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  element: HTMLElement;
}

let pageUrl = normalizePageUrl(location.href);
const colorHex: Record<HighlightColor, string> = {
  yellow: "#facc15",
  green: "#22c55e",
  blue: "#38bdf8",
  pink: "#ec4899",
};

function extensionIcon(path: string): string {
  try {
    return chrome.runtime.getURL(path);
  } catch {
    return "";
  }
}

let currentRange: Range | null = null;
let currentPoint: PagePoint | null = null;
let currentDrawing: PagePoint[] | null = null;
let drawingPointerId: number | null = null;
let dragState: DragState | null = null;
let notes: WebNote[] = [];
let layerActive = false;
let layerMode: LayerMode = "select";
let activeColor: HighlightColor = "yellow";
let toolbarMinimized = false;
let settings: SNoteSettings = DEFAULT_SETTINGS;

let host: HTMLDivElement;
let shadow: ShadowRoot;
let launcher: HTMLButtonElement;
let layerToolbar: HTMLDivElement;
let quickToolbar: HTMLDivElement;
let editor: HTMLDivElement;
let toast: HTMLDivElement;
let modeHint: HTMLDivElement;
let markCapture: HTMLDivElement;
let lockWash: HTMLDivElement;
let drawingSvg: SVGSVGElement;
let transientPath: SVGPathElement;
let marksContainer: HTMLDivElement;

function styles(): string {
  return `
    :host { all: initial; color-scheme: dark; }
    * { box-sizing: border-box; }
    button, textarea { font: inherit; }
    button { border: 0; color: inherit; cursor: pointer; }
    .launcher, .layer-toolbar, .quick-toolbar, .editor, .toast, .mode-hint, .annotation-mark {
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #f2ecff; pointer-events: auto;
    }
    .launcher {
      position: fixed; right: 18px; bottom: 18px; z-index: 30; display: grid; width: 48px; height: 48px;
      place-items: center; border: 1px solid rgba(168,85,247,.5); border-radius: 16px; color: white;
      background: radial-gradient(130% 130% at 25% 15%, rgba(124,58,237,.55), rgba(20,15,32,.96) 70%);
      box-shadow: 0 10px 30px rgba(8,4,18,.55), 0 0 22px rgba(168,85,247,.35);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .launcher:hover, .launcher.active { transform: translateY(-2px); box-shadow: 0 12px 34px rgba(8,4,18,.6), 0 0 30px rgba(217,70,239,.5); }
    .launcher.hidden { display: none; }
    .launcher-icon { width: 30px; height: 30px; object-fit: contain; filter: drop-shadow(0 0 6px rgba(168,85,247,.6)); }
    .launcher-count {
      position: absolute; right: -5px; top: -5px; display: grid; min-width: 19px; height: 19px; padding: 0 5px;
      place-items: center; border: 2px solid #171122; border-radius: 99px; color: white;
      background: linear-gradient(135deg, #c026d3, #f97316); box-shadow: 0 0 10px rgba(236,72,153,.6);
      font: 700 10px/1 sans-serif;
    }
    .layer-toolbar, .quick-toolbar, .editor, .toast, .mode-hint {
      position: fixed; z-index: 40; border: 1px solid rgba(168,85,247,.3); background: rgba(22,17,33,.97);
      backdrop-filter: blur(12px);
      box-shadow: 0 16px 45px rgba(6,3,14,.6), 0 0 30px rgba(124,58,237,.22);
    }
    .layer-toolbar {
      display: none; left: 50%; top: 14px; align-items: center; gap: 3px; max-width: calc(100vw - 24px);
      padding: 6px; border-radius: 15px; transform: translateX(-50%); overflow-x: auto;
    }
    .layer-toolbar.visible { display: flex; }
    .layer-toolbar.minimized {
      left: auto; right: 76px; top: 18px; max-width: none; padding: 5px 6px 5px 9px;
      border-radius: 13px; transform: none; overflow: hidden;
    }
    .layer-toolbar.minimized > :not(.brand):not(.toolbar-size) { display: none; }
    .layer-toolbar.minimized .brand { padding: 0 5px 0 1px; }
    .brand { display: inline-flex; align-items: center; gap: 6px; padding: 0 8px 0 5px; font-size: 14px; font-weight: 750; letter-spacing: -.01em; white-space: nowrap; }
    .brand-icon { width: 18px; height: 18px; object-fit: contain; filter: drop-shadow(0 0 5px rgba(168,85,247,.55)); }
    .divider { width: 1px; height: 27px; flex: 0 0 auto; margin: 0 3px; background: rgba(139,92,246,.28); }
    .mode-button, .icon-button, .quick-button {
      display: inline-flex; min-height: 34px; align-items: center; gap: 5px; padding: 7px 9px; border-radius: 9px;
      background: transparent; color: #cabde6; white-space: nowrap;
    }
    .mode-button:hover, .icon-button:hover, .quick-button:hover { background: rgba(139,92,246,.16); color: #f7f2ff; }
    .mode-button.active { color: #fff; background: linear-gradient(135deg, #7c3aed, #c026d3); box-shadow: 0 4px 14px rgba(168,85,247,.4); }
    .shortcut { color: #7f7496; font-size: 9px; text-transform: uppercase; }
    .mode-button.active .shortcut { color: rgba(255,255,255,.72); }
    .swatches { display: flex; gap: 4px; padding: 0 3px; }
    .swatch {
      width: 23px; height: 23px; padding: 0; border: 2px solid rgba(255,255,255,.85); border-radius: 50%;
      background: var(--color); box-shadow: 0 0 0 1px rgba(139,92,246,.4);
    }
    .swatch.active { box-shadow: 0 0 0 2px #e9dcff, 0 0 12px var(--color); transform: scale(.92); }
    .quick-toolbar {
      display: none; align-items: center; gap: 3px; padding: 5px; border-radius: 13px; transform: translate(-50%, -100%);
    }
    .quick-toolbar.visible { display: flex; }
    .quick-button { font-weight: 650; }
    .editor { display: none; width: min(350px, calc(100vw - 24px)); padding: 13px; border-radius: 15px; }
    .editor.visible { display: block; }
    .editor-title { margin: 0 0 8px; font-size: 13px; font-weight: 750; color: #f4efff; }
    .quote { margin: 0 0 9px; padding: 8px 10px; max-height: 80px; overflow: auto; border-left: 3px solid #d946ef; border-radius: 0 7px 7px 0; background: rgba(168,85,247,.13); color: #ded2f4; font: 12px/1.4 Georgia, serif; }
    textarea { width: 100%; min-height: 92px; resize: vertical; padding: 10px; border: 1px solid rgba(139,92,246,.3); border-radius: 10px; color: #f2ecff; background: rgba(12,8,20,.6); line-height: 1.45; }
    textarea::placeholder { color: #7f7496; }
    textarea:focus { border-color: #a855f7; outline: 2px solid rgba(168,85,247,.3); }
    .actions { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; }
    .actions-group { display: flex; gap: 5px; }
    .actions button { padding: 7px 11px; border-radius: 9px; background: transparent; color: #cabde6; }
    .actions button:hover { background: rgba(139,92,246,.16); color: #f7f2ff; }
    .actions .primary { color: white; background: linear-gradient(135deg, #7c3aed, #c026d3 65%, #ec4899); font-weight: 650; box-shadow: 0 4px 14px rgba(168,85,247,.35); }
    .actions .primary:hover { filter: brightness(1.12); }
    .actions .danger { color: #ff8fa8; }
    .toast { display: none; left: 50%; bottom: 24px; padding: 10px 14px; border-radius: 11px; transform: translateX(-50%); }
    .toast.visible { display: block; animation: snote-in .15s ease-out; }
    .mode-hint { display: none; left: 50%; bottom: 24px; padding: 7px 12px; border-radius: 999px; color: #c9bce6; transform: translateX(-50%); }
    .mode-hint.visible { display: block; }
    .mark-capture { position: fixed; inset: 0; z-index: 5; display: none; pointer-events: none; cursor: crosshair; }
    .mark-capture.active { display: block; pointer-events: auto; }
    .drawing-svg { position: fixed; inset: 0; z-index: 6; width: 100vw; height: 100vh; overflow: visible; pointer-events: none; }
    .drawing-svg.draw { pointer-events: auto; cursor: crosshair; touch-action: none; }
    .drawing-svg.erase path[data-snote-id] { pointer-events: stroke; cursor: not-allowed; }
    .marks { position: fixed; inset: 0; z-index: 8; pointer-events: none; }
    .lock-wash { position: fixed; inset: 0; z-index: 4; display: none; border: 3px solid rgba(168,85,247,.4); background: rgba(124,58,237,.045); pointer-events: none; }
    .lock-wash.visible { display: block; }
    .drawing-svg:not(.annotations-visible) path[data-snote-id], .marks:not(.annotations-visible) .annotation-mark { display: none; }
    .annotation-mark {
      position: absolute; width: 188px; min-height: 70px; padding: 0; overflow: hidden; border: 1px solid rgba(168,85,247,.45);
      border-radius: 10px; background: #fff0a8; box-shadow: 0 10px 28px rgba(50,38,17,.3), 0 0 18px rgba(168,85,247,.25); text-align: left;
      pointer-events: auto;
    }
    .annotation-mark[data-color="green"] { background: #c9f2ce; }
    .annotation-mark[data-color="blue"] { background: #cceaff; }
    .annotation-mark[data-color="pink"] { background: #ffd2e5; }
    .mark-head { display: flex; align-items: center; justify-content: space-between; padding: 5px 8px; color: rgba(55,43,25,.68); background: rgba(255,255,255,.28); font-size: 9px; font-weight: 800; letter-spacing: .08em; }
    .mark-handle { padding: 0 3px; cursor: grab; font-size: 15px; letter-spacing: -3px; }
    .mark-text { padding: 9px 10px 11px; color: #332a1f; font-size: 12px; line-height: 1.42; white-space: pre-wrap; }
    .marks.disabled .annotation-mark { pointer-events: none; }
    .annotation-mark:hover { outline: 2px solid rgba(168,85,247,.55); }
    .annotation-mark.erase { cursor: not-allowed; }
    @keyframes snote-in { from { opacity: 0; transform: translate(-50%, 5px); } }
    @media (max-width: 720px) {
      .mode-button { padding-inline: 8px; }
      .mode-label, .shortcut, .brand { display: none; }
      .annotation-mark { width: 158px; }
    }
  `;
}

function modeButton(
  mode: LayerMode,
  symbol: string,
  label: string,
  key: string
): string {
  return `<button class="mode-button" data-mode="${mode}" title="${label} (${key})" aria-label="${label}"><span aria-hidden="true">${symbol}</span><span class="mode-label">${label}</span><span class="shortcut">${key}</span></button>`;
}

function swatches(action: string): string {
  return (Object.keys(colorHex) as HighlightColor[])
    .map(
      (color) =>
        `<button class="swatch" style="--color:${colorHex[color]}" data-action="${action}" data-color="${color}" title="Use ${color}" aria-label="Use ${color}"></button>`
    )
    .join("");
}

function createUi(): void {
  host = document.createElement("div");
  host.id = HOST_ID;
  host.dataset.snoteUi = "true";
  host.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles();
  shadow.appendChild(style);

  markCapture = document.createElement("div");
  markCapture.className = "mark-capture";
  markCapture.setAttribute("aria-hidden", "true");
  shadow.appendChild(markCapture);

  lockWash = document.createElement("div");
  lockWash.className = "lock-wash";
  lockWash.setAttribute("aria-hidden", "true");
  shadow.appendChild(lockWash);

  drawingSvg = document.createElementNS(SVG_NS, "svg");
  drawingSvg.classList.add("drawing-svg");
  drawingSvg.setAttribute("aria-label", "S Note drawing layer");
  transientPath = document.createElementNS(SVG_NS, "path");
  transientPath.setAttribute("fill", "none");
  transientPath.setAttribute("stroke-linecap", "round");
  transientPath.setAttribute("stroke-linejoin", "round");
  transientPath.setAttribute("stroke-width", "4");
  transientPath.style.pointerEvents = "none";
  drawingSvg.appendChild(transientPath);
  shadow.appendChild(drawingSvg);

  marksContainer = document.createElement("div");
  marksContainer.className = "marks";
  shadow.appendChild(marksContainer);

  launcher = document.createElement("button");
  launcher.className = "launcher";
  launcher.dataset.action = "toggle-layer";
  launcher.title = "Unhide S Note annotations";
  launcher.setAttribute("aria-label", "Unhide S Note annotations");
  const launcherIcon = extensionIcon("icons/tabink-logo-64.png");
  launcher.innerHTML = launcherIcon
    ? `<img class="launcher-icon" src="${launcherIcon}" alt="" /><span class="launcher-count">0</span>`
    : `S<span class="launcher-count">0</span>`;
  shadow.appendChild(launcher);

  layerToolbar = document.createElement("div");
  layerToolbar.className = "layer-toolbar";
  layerToolbar.setAttribute("role", "toolbar");
  layerToolbar.setAttribute("aria-label", "S Note annotation tools");
  const brandIcon = extensionIcon("icons/tabink-logo-64.png");
  layerToolbar.innerHTML = `
    <span class="brand">${
      brandIcon ? `<img class="brand-icon" src="${brandIcon}" alt="" />` : ""
    }S Note</span>
    ${modeButton("select", "⌁", "Select text", "V")}
    ${modeButton("highlight", "▰", "Highlight", "H")}
    ${modeButton("comment", "▤", "Comment", "C")}
    ${modeButton("mark", "◆", "Sticky mark", "M")}
    ${modeButton("draw", "✎", "Pen", "D")}
    ${modeButton("erase", "⌫", "Erase", "E")}
    <span class="divider"></span>
    <span class="swatches">${swatches("set-color")}</span>
    <span class="divider"></span>
    <button class="icon-button" data-action="undo" title="Undo last annotation" aria-label="Undo last annotation">↶</button>
    <button class="icon-button toolbar-size" data-action="toggle-toolbar-size" title="Minimize toolbar" aria-label="Minimize toolbar">−</button>
    <button class="icon-button" data-action="close-layer" title="Hide annotations" aria-label="Hide annotations">×</button>`;
  shadow.appendChild(layerToolbar);

  quickToolbar = document.createElement("div");
  quickToolbar.className = "quick-toolbar";
  quickToolbar.setAttribute("role", "toolbar");
  quickToolbar.setAttribute("aria-label", "Selection annotation tools");
  quickToolbar.innerHTML = `
    <button class="quick-button" data-action="comment">Comment</button>
    <span class="divider"></span>
    <span class="swatches">${swatches("highlight")}</span>`;
  shadow.appendChild(quickToolbar);

  editor = document.createElement("div");
  editor.className = "editor";
  editor.setAttribute("role", "dialog");
  editor.setAttribute("aria-label", "S Note editor");
  shadow.appendChild(editor);

  toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  shadow.appendChild(toast);

  modeHint = document.createElement("div");
  modeHint.className = "mode-hint";
  modeHint.setAttribute("role", "status");
  shadow.appendChild(modeHint);
  document.documentElement.appendChild(host);

  launcher.addEventListener("click", () => void toggleLayer());
  layerToolbar.addEventListener("click", handleLayerToolbarClick);
  quickToolbar.addEventListener("mousedown", (event) => event.preventDefault());
  quickToolbar.addEventListener("click", handleQuickToolbarClick);
  markCapture.addEventListener("click", handleMarkPlacement);
  drawingSvg.addEventListener("pointerdown", handleDrawingStart);
  drawingSvg.addEventListener("pointermove", handleDrawingMove);
  drawingSvg.addEventListener("pointerup", handleDrawingEnd);
  drawingSvg.addEventListener("pointercancel", cancelDrawing);
  drawingSvg.addEventListener("click", handleDrawingClick);
  marksContainer.addEventListener("click", handleMarkClick);
  marksContainer.addEventListener("pointerdown", handleMarkDragStart);
}

function setLayerMode(mode: LayerMode): void {
  layerMode = mode;
  quickToolbar.classList.remove("visible");
  currentRange = null;
  updateLayerUi();
}

async function toggleLayer(open = !layerActive): Promise<void> {
  if (!open && editor.classList.contains("visible")) {
    const draft = editor
      .querySelector<HTMLTextAreaElement>("textarea")
      ?.value.trim();
    if (draft) await saveEditor();
    else closeEditor();
  }
  layerActive = open;
  if (!open) {
    setLayerMode("select");
    closeEditor();
  } else {
    updateLayerUi();
    showToast("Annotation layer opened");
  }
}

function updateLayerUi(): void {
  layerToolbar.classList.toggle("visible", layerActive);
  layerToolbar.classList.toggle("minimized", toolbarMinimized);
  const toolbarSizeButton = layerToolbar.querySelector<HTMLButtonElement>(
    '[data-action="toggle-toolbar-size"]'
  );
  if (toolbarSizeButton) {
    const label = toolbarMinimized ? "Expand toolbar" : "Minimize toolbar";
    toolbarSizeButton.textContent = toolbarMinimized ? "↗" : "−";
    toolbarSizeButton.title = label;
    toolbarSizeButton.setAttribute("aria-label", label);
  }
  document.documentElement.classList.toggle("snote-layer-visible", layerActive);
  lockWash.classList.toggle("visible", layerActive);
  drawingSvg.classList.toggle("annotations-visible", layerActive);
  marksContainer.classList.toggle("annotations-visible", layerActive);
  launcher.classList.toggle("active", layerActive);
  launcher.title = layerActive
    ? "Hide S Note annotations"
    : "Unhide S Note annotations";
  launcher.setAttribute("aria-label", launcher.title);
  layerToolbar
    .querySelectorAll<HTMLElement>("[data-mode]")
    .forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === layerMode);
    });
  shadow
    .querySelectorAll<HTMLElement>('[data-action="set-color"]')
    .forEach((button) => {
      button.classList.toggle("active", button.dataset.color === activeColor);
    });
  markCapture.classList.toggle("active", layerActive && layerMode === "mark");
  drawingSvg.classList.toggle("draw", layerActive && layerMode === "draw");
  drawingSvg.classList.toggle("erase", layerActive && layerMode === "erase");
  marksContainer.classList.toggle(
    "disabled",
    layerActive && (layerMode === "draw" || layerMode === "mark")
  );
  marksContainer.querySelectorAll(".annotation-mark").forEach((mark) => {
    mark.classList.toggle("erase", layerActive && layerMode === "erase");
  });
  drawingSvg
    .querySelectorAll<SVGPathElement>("path[data-snote-id]")
    .forEach((path) => {
      path.style.pointerEvents =
        layerActive && layerMode === "erase" ? "stroke" : "none";
    });
  document
    .querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}[data-snote-id]`)
    .forEach((wrapper) => {
      const note = notes.find((item) => item.id === wrapper.dataset.snoteId);
      if (!layerActive || !note) wrapper.removeAttribute("title");
      else
        wrapper.title =
          note.kind === "comment" ? note.text : "S Note highlight";
    });
  syncTextAnnotationVisibility();

  const hints: Partial<Record<LayerMode, string>> = {
    highlight: "Select text to highlight it",
    comment: "Select text to attach a comment",
    mark: "Click anywhere to place a sticky mark",
    draw: "Drag anywhere to draw on the page",
    erase: "Click an annotation to remove it",
  };
  modeHint.textContent = hints[layerMode] ?? "";
  modeHint.classList.toggle("visible", layerActive && layerMode !== "select");
}

function applySettings(): void {
  launcher.classList.toggle("hidden", !settings.showLauncher);
}

async function loadSettings(): Promise<SNoteSettings> {
  try {
    return await getSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function syncTextAnnotationVisibility(): void {
  if (layerActive) {
    [...notes].reverse().forEach(renderTextNote);
    return;
  }
  const renderedIds = new Set<string>();
  document
    .querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}[data-snote-id]`)
    .forEach((wrapper) => {
      if (wrapper.dataset.snoteId) renderedIds.add(wrapper.dataset.snoteId);
    });
  renderedIds.forEach(removeRenderedTextNote);
}

function layerState() {
  return {
    ok: true,
    active: layerActive,
    mode: layerMode,
    count: notes.filter((note) => note.kind !== "page").length,
  };
}

function positionFloating(
  element: HTMLElement,
  rect: DOMRect,
  above = true
): void {
  const padding = 12;
  const width = Math.min(350, innerWidth - padding * 2);
  if (element === quickToolbar) {
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, 135),
      innerWidth - 135
    );
    element.style.left = `${x}px`;
    element.style.top = `${Math.max(55, rect.top - 9)}px`;
    return;
  }
  const left = Math.min(
    Math.max(rect.left, padding),
    innerWidth - width - padding
  );
  const estimatedHeight = 245;
  const top =
    above && rect.top > estimatedHeight + padding
      ? rect.top - estimatedHeight - 8
      : Math.min(rect.bottom + 8, innerHeight - estimatedHeight - padding);
  element.style.left = `${left}px`;
  element.style.top = `${Math.max(padding, top)}px`;
}

function rectAtPoint(point: PagePoint): DOMRect {
  const left = point.x - scrollX;
  const top = point.y - scrollY;
  return {
    left,
    right: left + 1,
    top,
    bottom: top + 1,
    width: 1,
    height: 1,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

let toastTimer = 0;
function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function selectedRange(): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed)
    return null;
  const range = selection.getRangeAt(0);
  return anchorFromRange(range) ? range.cloneRange() : null;
}

function handleSelection(): void {
  window.setTimeout(() => {
    const range = selectedRange();
    if (!range) {
      quickToolbar.classList.remove("visible");
      return;
    }
    currentRange = range;
    if (!layerActive || editor.classList.contains("visible")) return;
    if (layerMode === "highlight") {
      void createHighlight(activeColor);
      return;
    }
    if (layerMode === "comment") {
      openCommentEditor(range);
      return;
    }
    if (layerMode === "select") {
      positionFloating(quickToolbar, range.getBoundingClientRect());
      quickToolbar.classList.add("visible");
    }
  }, 0);
}

async function createHighlight(
  color: HighlightColor = activeColor
): Promise<boolean> {
  const range = currentRange ?? selectedRange();
  if (!range) {
    showToast("Select some text first");
    return false;
  }
  const anchor = anchorFromRange(range);
  if (!anchor) {
    showToast("This selection cannot be highlighted");
    return false;
  }
  const now = Date.now();
  const note: WebNote = {
    id: createNoteId(),
    kind: "highlight",
    url: pageUrl,
    pageTitle: document.title,
    text: "",
    quote: anchor.exact,
    anchor,
    color,
    createdAt: now,
    updatedAt: now,
  };
  await saveNote(note);
  notes = [note, ...notes.filter((item) => item.id !== note.id)];
  renderTextNote(note);
  window.getSelection()?.removeAllRanges();
  quickToolbar.classList.remove("visible");
  currentRange = null;
  updateCount();
  showToast("Highlight saved");
  return true;
}

function editorMarkup(
  title: string,
  value: string,
  existing: boolean,
  quote?: string
): string {
  return `
    <h2 class="editor-title">${title}</h2>
    ${quote ? '<div class="quote"></div>' : ""}
    <textarea aria-label="Annotation text" placeholder="Write your note..."></textarea>
    <div class="actions">
      <div>${
        existing
          ? '<button class="danger" data-editor-action="delete">Delete</button>'
          : ""
      }</div>
      <div class="actions-group">
        <button data-editor-action="cancel">Cancel</button>
        <button class="primary" data-editor-action="save">Save</button>
      </div>
    </div>`;
}

function prepareEditor(
  type: "comment" | "mark",
  note: WebNote | undefined,
  rect: DOMRect,
  quote?: string
): void {
  editor.dataset.editorType = type;
  editor.dataset.noteId = note?.id ?? "";
  editor.innerHTML = editorMarkup(
    type === "comment" ? "Comment on selection" : "Sticky mark",
    note?.text ?? "",
    Boolean(note),
    quote
  );
  const quoteElement = editor.querySelector<HTMLElement>(".quote");
  const textarea = editor.querySelector<HTMLTextAreaElement>("textarea");
  if (!textarea) return;
  if (quoteElement) quoteElement.textContent = quote ?? "";
  textarea.value = note?.text ?? "";
  textarea.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void saveEditor();
    }
  });
  editor.onclick = handleEditorClick;
  positionFloating(editor, rect);
  editor.classList.add("visible");
  window.setTimeout(() => textarea.focus(), 0);
}

function openCommentEditor(range: Range, existing?: WebNote): void {
  const anchor = existing?.anchor ?? anchorFromRange(range);
  if (!anchor) {
    showToast("This selection cannot be commented on");
    return;
  }
  currentRange = range.cloneRange();
  currentPoint = null;
  quickToolbar.classList.remove("visible");
  prepareEditor(
    "comment",
    existing,
    range.getBoundingClientRect(),
    existing?.quote ?? anchor.exact
  );
}

function openMarkEditor(point: PagePoint, existing?: WebNote): void {
  currentPoint = { ...point };
  currentRange = null;
  prepareEditor("mark", existing, rectAtPoint(point));
}

async function saveEditor(): Promise<void> {
  const textarea = editor.querySelector<HTMLTextAreaElement>("textarea");
  const text = textarea?.value.trim() ?? "";
  if (!text) {
    textarea?.focus();
    return;
  }
  const existingId = editor.dataset.noteId;
  const editorType = editor.dataset.editorType;
  if (existingId) {
    await updateNoteText(existingId, text);
    const existing = notes.find((note) => note.id === existingId);
    if (existing) {
      existing.text = text;
      existing.updatedAt = Date.now();
    }
  } else if (editor.dataset.editorType === "comment" && currentRange) {
    const anchor = anchorFromRange(currentRange);
    if (!anchor) return;
    const now = Date.now();
    const note: WebNote = {
      id: createNoteId(),
      kind: "comment",
      url: pageUrl,
      pageTitle: document.title,
      text,
      quote: anchor.exact,
      anchor,
      color: activeColor,
      createdAt: now,
      updatedAt: now,
    };
    await saveNote(note);
    notes = [note, ...notes.filter((item) => item.id !== note.id)];
    renderTextNote(note);
  } else if (editor.dataset.editorType === "mark" && currentPoint) {
    const now = Date.now();
    const note: WebNote = {
      id: createNoteId(),
      kind: "mark",
      url: pageUrl,
      pageTitle: document.title,
      text,
      position: { ...currentPoint },
      color: activeColor,
      createdAt: now,
      updatedAt: now,
    };
    await saveNote(note);
    notes = [note, ...notes.filter((item) => item.id !== note.id)];
    renderSpatialNotes();
  }
  closeEditor();
  window.getSelection()?.removeAllRanges();
  updateCount();
  showToast(editorType === "mark" ? "Sticky mark saved" : "Comment saved");
}

function closeEditor(): void {
  editor.classList.remove("visible");
  editor.dataset.noteId = "";
  editor.dataset.editorType = "";
  currentRange = null;
  currentPoint = null;
}

async function removeNote(id: string): Promise<void> {
  await deleteNote(id);
  notes = notes.filter((note) => note.id !== id);
  removeRenderedTextNote(id);
  renderSpatialNotes();
  closeEditor();
  updateCount();
  showToast("Annotation deleted");
}

function handleEditorClick(event: MouseEvent): void {
  const button = (event.target as Element).closest<HTMLButtonElement>(
    "button[data-editor-action]"
  );
  if (!button) return;
  if (button.dataset.editorAction === "save") void saveEditor();
  if (button.dataset.editorAction === "cancel") closeEditor();
  if (button.dataset.editorAction === "delete" && editor.dataset.noteId)
    void removeNote(editor.dataset.noteId);
}

function handleQuickToolbarClick(event: MouseEvent): void {
  const button = (event.target as Element).closest<HTMLButtonElement>(
    "button[data-action]"
  );
  if (!button) return;
  if (button.dataset.action === "highlight")
    void createHighlight(
      (button.dataset.color as HighlightColor) || activeColor
    );
  if (button.dataset.action === "comment" && currentRange)
    openCommentEditor(currentRange);
}

function handleLayerToolbarClick(event: MouseEvent): void {
  const button = (event.target as Element).closest<HTMLButtonElement>("button");
  if (!button) return;
  if (button.dataset.mode) setLayerMode(button.dataset.mode as LayerMode);
  if (button.dataset.action === "set-color" && button.dataset.color) {
    activeColor = button.dataset.color as HighlightColor;
    updateLayerUi();
  }
  if (button.dataset.action === "close-layer") void toggleLayer(false);
  if (button.dataset.action === "undo") void undoLastAnnotation();
  if (button.dataset.action === "toggle-toolbar-size") {
    toolbarMinimized = !toolbarMinimized;
    updateLayerUi();
  }
}

async function undoLastAnnotation(): Promise<void> {
  const latest = notes
    .filter((note) => note.kind !== "page")
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!latest) {
    showToast("Nothing to undo");
    return;
  }
  await removeNote(latest.id);
}

function handleMarkPlacement(event: MouseEvent): void {
  if (!layerActive || layerMode !== "mark") return;
  event.preventDefault();
  openMarkEditor({ x: event.clientX + scrollX, y: event.clientY + scrollY });
}

function pagePoint(event: PointerEvent): PagePoint {
  return { x: event.clientX + scrollX, y: event.clientY + scrollY };
}

function pathData(points: PagePoint[]): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${(point.x - scrollX).toFixed(1)} ${(
          point.y - scrollY
        ).toFixed(1)}`
    )
    .join(" ");
}

function handleDrawingStart(event: PointerEvent): void {
  if (!layerActive || layerMode !== "draw" || event.button !== 0) return;
  event.preventDefault();
  drawingPointerId = event.pointerId;
  currentDrawing = [pagePoint(event)];
  transientPath.setAttribute("stroke", colorHex[activeColor]);
  transientPath.setAttribute("d", pathData(currentDrawing));
  drawingSvg.setPointerCapture?.(event.pointerId);
}

function handleDrawingMove(event: PointerEvent): void {
  if (drawingPointerId !== event.pointerId || !currentDrawing) return;
  event.preventDefault();
  const point = pagePoint(event);
  const last = currentDrawing[currentDrawing.length - 1];
  if (Math.hypot(point.x - last.x, point.y - last.y) < 2.5) return;
  currentDrawing.push(point);
  transientPath.setAttribute("d", pathData(currentDrawing));
}

async function handleDrawingEnd(event: PointerEvent): Promise<void> {
  if (drawingPointerId !== event.pointerId || !currentDrawing) return;
  event.preventDefault();
  const points = currentDrawing;
  drawingPointerId = null;
  currentDrawing = null;
  transientPath.removeAttribute("d");
  drawingSvg.releasePointerCapture?.(event.pointerId);
  if (points.length < 2) return;
  const now = Date.now();
  const note: WebNote = {
    id: createNoteId(),
    kind: "drawing",
    url: pageUrl,
    pageTitle: document.title,
    text: "",
    drawing: { points, strokeWidth: 4 },
    color: activeColor,
    createdAt: now,
    updatedAt: now,
  };
  await saveNote(note);
  notes = [note, ...notes.filter((item) => item.id !== note.id)];
  renderSpatialNotes();
  updateCount();
  showToast("Drawing saved");
}

function cancelDrawing(event?: PointerEvent): void {
  if (event && drawingPointerId !== event.pointerId) return;
  currentDrawing = null;
  drawingPointerId = null;
  transientPath.removeAttribute("d");
}

function handleDrawingClick(event: MouseEvent): void {
  if (!layerActive || layerMode !== "erase") return;
  const path = (event.target as Element).closest<SVGPathElement>(
    "path[data-snote-id]"
  );
  if (path?.dataset.snoteId) void removeNote(path.dataset.snoteId);
}

function handleMarkClick(event: MouseEvent): void {
  const element = (event.target as Element).closest<HTMLElement>(
    ".annotation-mark[data-snote-id]"
  );
  if (!element?.dataset.snoteId || dragState) return;
  event.stopPropagation();
  const note = notes.find((item) => item.id === element.dataset.snoteId);
  if (!note?.position) return;
  if (layerActive && layerMode === "erase") {
    void removeNote(note.id);
    return;
  }
  if (layerActive && layerMode === "select")
    openMarkEditor(note.position, note);
}

function handleMarkDragStart(event: PointerEvent): void {
  const handle = (event.target as Element).closest<HTMLElement>(".mark-handle");
  const element = handle?.closest<HTMLElement>(
    ".annotation-mark[data-snote-id]"
  );
  if (
    !handle ||
    !element?.dataset.snoteId ||
    (layerActive && layerMode !== "select")
  )
    return;
  const note = notes.find((item) => item.id === element.dataset.snoteId);
  if (!note?.position) return;
  event.preventDefault();
  event.stopPropagation();
  dragState = {
    note,
    element,
    pointerId: event.pointerId,
    offsetX: event.clientX - (note.position.x - scrollX),
    offsetY: event.clientY - (note.position.y - scrollY),
  };
  handle.setPointerCapture?.(event.pointerId);
}

function handleMarkDragMove(event: PointerEvent): void {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const position = {
    x: event.clientX + scrollX - dragState.offsetX,
    y: event.clientY + scrollY - dragState.offsetY,
  };
  dragState.note.position = position;
  positionMark(dragState.element, position);
}

async function handleMarkDragEnd(event: PointerEvent): Promise<void> {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const note = dragState.note;
  dragState = null;
  note.updatedAt = Date.now();
  await saveNote(note);
  showToast("Sticky mark moved");
}

function removeRenderedTextNote(id: string): void {
  document
    .querySelectorAll<HTMLElement>(`[data-snote-id="${CSS.escape(id)}"]`)
    .forEach((wrapper) => {
      if (!wrapper.classList.contains(HIGHLIGHT_CLASS)) return;
      const parent = wrapper.parentNode;
      if (!parent) return;
      while (wrapper.firstChild)
        parent.insertBefore(wrapper.firstChild, wrapper);
      parent.removeChild(wrapper);
      parent.normalize();
    });
}

function renderTextNote(note: WebNote): void {
  if (!note.anchor || (note.kind !== "highlight" && note.kind !== "comment"))
    return;
  if (document.querySelector(`[data-snote-id="${CSS.escape(note.id)}"]`))
    return;
  const range = rangeFromAnchor(note.anchor);
  if (!range) return;
  const color = note.color ?? "yellow";
  const className = `${HIGHLIGHT_CLASS} snote-${color}${
    note.kind === "comment" ? ` ${COMMENT_CLASS}` : ""
  }`;
  const wrappers = wrapRange(range, note.id, className);
  if (note.kind === "comment")
    wrappers[wrappers.length - 1]?.classList.add("snote-comment-marker");
  wrappers.forEach((wrapper) => {
    if (layerActive)
      wrapper.title = note.kind === "comment" ? note.text : "S Note highlight";
  });
}

function positionMark(element: HTMLElement, point: PagePoint): void {
  element.style.left = `${point.x - scrollX}px`;
  element.style.top = `${point.y - scrollY}px`;
}

function renderSpatialNotes(): void {
  marksContainer.replaceChildren();
  drawingSvg
    .querySelectorAll("path[data-snote-id]")
    .forEach((path) => path.remove());
  notes
    .filter((note) => note.kind === "drawing" && note.drawing?.points.length)
    .forEach((note) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.dataset.snoteId = note.id;
      path.setAttribute("d", pathData(note.drawing?.points ?? []));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", colorHex[note.color ?? "yellow"]);
      path.setAttribute("stroke-width", String(note.drawing?.strokeWidth ?? 4));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.style.pointerEvents =
        layerActive && layerMode === "erase" ? "stroke" : "none";
      drawingSvg.insertBefore(path, transientPath);
    });
  notes
    .filter((note) => note.kind === "mark" && note.position)
    .forEach((note) => {
      const mark = document.createElement("article");
      mark.className = `annotation-mark${
        layerActive && layerMode === "erase" ? " erase" : ""
      }`;
      mark.dataset.snoteId = note.id;
      mark.dataset.color = note.color ?? "yellow";
      mark.tabIndex = 0;
      mark.setAttribute("role", "button");
      mark.setAttribute("aria-label", `Sticky mark: ${note.text}`);
      mark.innerHTML =
        '<div class="mark-head"><span>STICKY MARK</span><span class="mark-handle" title="Drag to move">•••</span></div><div class="mark-text"></div>';
      const text = mark.querySelector<HTMLElement>(".mark-text");
      if (text) text.textContent = note.text;
      positionMark(mark, note.position as PagePoint);
      marksContainer.appendChild(mark);
    });
  updateLayerUi();
}

function updateSpatialPositions(): void {
  marksContainer
    .querySelectorAll<HTMLElement>(".annotation-mark[data-snote-id]")
    .forEach((element) => {
      const note = notes.find((item) => item.id === element.dataset.snoteId);
      if (note?.position) positionMark(element, note.position);
    });
  drawingSvg
    .querySelectorAll<SVGPathElement>("path[data-snote-id]")
    .forEach((path) => {
      const note = notes.find((item) => item.id === path.dataset.snoteId);
      if (note?.drawing) path.setAttribute("d", pathData(note.drawing.points));
    });
  if (currentDrawing) transientPath.setAttribute("d", pathData(currentDrawing));
}

function updateCount(): void {
  const count = notes.filter((note) => note.kind !== "page").length;
  const badge = launcher.querySelector<HTMLElement>(".launcher-count");
  if (badge) {
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
  }
}

async function renderAllNotes(): Promise<void> {
  const renderedIds = new Set<string>();
  document
    .querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}[data-snote-id]`)
    .forEach((wrapper) => {
      if (wrapper.dataset.snoteId) renderedIds.add(wrapper.dataset.snoteId);
    });
  renderedIds.forEach(removeRenderedTextNote);
  notes = await getNotesForUrl(pageUrl);
  if (layerActive) [...notes].reverse().forEach(renderTextNote);
  renderSpatialNotes();
  updateCount();
}

function openRenderedComment(noteId: string): void {
  const note = notes.find((item) => item.id === noteId);
  if (!note || note.kind !== "comment" || !note.anchor) return;
  const range = rangeFromAnchor(note.anchor);
  if (range) openCommentEditor(range, note);
}

function isUiEvent(event: Event): boolean {
  return event.composedPath().includes(host);
}

function blockWebsiteEvent(event: Event): void {
  if (!layerActive || isUiEvent(event)) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function handlePageClick(event: MouseEvent): void {
  if (isUiEvent(event)) return;
  const target = (event.target as Element).closest<HTMLElement>(
    `.${HIGHLIGHT_CLASS}[data-snote-id]`
  );
  if (target?.dataset.snoteId) {
    if (layerActive && layerMode === "erase") {
      event.preventDefault();
      event.stopPropagation();
      void removeNote(target.dataset.snoteId);
      return;
    }
    if (
      target.classList.contains(COMMENT_CLASS) &&
      layerActive &&
      layerMode === "select"
    ) {
      event.preventDefault();
      event.stopPropagation();
      openRenderedComment(target.dataset.snoteId);
      return;
    }
  }
  quickToolbar.classList.remove("visible");
  blockWebsiteEvent(event);
}

function focusNote(noteId: string): boolean {
  const note = notes.find((item) => item.id === noteId);
  if (!note) return false;
  if (!layerActive) void toggleLayer(true);
  if (note.kind === "mark" && note.position) {
    scrollTo({
      top: Math.max(0, note.position.y - innerHeight / 2),
      behavior: "smooth",
    });
    window.setTimeout(() => {
      updateSpatialPositions();
      const mark = marksContainer.querySelector<HTMLElement>(
        `[data-snote-id="${CSS.escape(note.id)}"]`
      );
      mark?.animate(
        [
          { outline: "3px solid #ef762f" },
          { outline: "3px solid transparent" },
        ],
        { duration: 1600 }
      );
      openMarkEditor(note.position as PagePoint, note);
    }, 350);
    return true;
  }
  if (note.kind === "drawing" && note.drawing?.points[0]) {
    scrollTo({
      top: Math.max(0, note.drawing.points[0].y - innerHeight / 2),
      behavior: "smooth",
    });
    window.setTimeout(updateSpatialPositions, 350);
    return true;
  }
  const element = document.querySelector<HTMLElement>(
    `[data-snote-id="${CSS.escape(noteId)}"]`
  );
  if (!element) return false;
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.animate(
    [{ outline: "3px solid #ef762f" }, { outline: "3px solid transparent" }],
    { duration: 1600 }
  );
  if (note.kind === "comment") openRenderedComment(noteId);
  return true;
}

function handleKeyboard(event: KeyboardEvent): void {
  if (isUiEvent(event)) return;
  if (event.key === "Escape") {
    if (editor.classList.contains("visible")) closeEditor();
    else if (layerActive) setLayerMode("select");
    return;
  }
  if (!layerActive) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
    event.stopImmediatePropagation();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const shortcuts: Record<string, LayerMode> = {
    v: "select",
    h: "highlight",
    c: "comment",
    m: "mark",
    d: "draw",
    e: "erase",
  };
  const mode = shortcuts[event.key.toLowerCase()];
  if (mode) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setLayerMode(mode);
    return;
  }

  const scrollingKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
  ]);
  if (scrollingKeys.has(event.key)) {
    event.stopImmediatePropagation();
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
}

function handleWebsiteFocus(event: FocusEvent): void {
  if (!layerActive || isUiEvent(event)) return;
  const target = event.target as HTMLElement;
  if (
    target.matches("input, textarea, select, button, [contenteditable='true']")
  ) {
    target.blur();
  }
}

function installListeners(): void {
  document.addEventListener("mouseup", handleSelection, true);
  document.addEventListener("keyup", handleSelection, true);
  document.addEventListener("click", handlePageClick, true);
  document.addEventListener("auxclick", blockWebsiteEvent, true);
  document.addEventListener("dblclick", blockWebsiteEvent, true);
  document.addEventListener("submit", blockWebsiteEvent, true);
  document.addEventListener("dragstart", blockWebsiteEvent, true);
  document.addEventListener("drop", blockWebsiteEvent, true);
  document.addEventListener("focusin", handleWebsiteFocus, true);
  document.addEventListener("keydown", handleKeyboard, true);
  window.addEventListener("pointermove", handleMarkDragMove, true);
  window.addEventListener(
    "pointerup",
    (event) => void handleMarkDragEnd(event),
    true
  );
  let spatialFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(spatialFrame);
      spatialFrame = requestAnimationFrame(updateSpatialPositions);
    },
    { passive: true }
  );
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[STORAGE_KEY]) void renderAllNotes();
    if (changes[SETTINGS_KEY]) {
      settings = settingsFromChange(changes[SETTINGS_KEY]);
      applySettings();
    }
  });
  window.setInterval(() => {
    const nextUrl = normalizePageUrl(location.href);
    if (nextUrl === pageUrl) return;
    pageUrl = nextUrl;
    closeEditor();
    quickToolbar.classList.remove("visible");
    void renderAllNotes();
  }, 1000);
  chrome.runtime.onMessage.addListener(
    (message: ContentMessage, _sender, sendResponse) => {
      if (message.type === "SNOTE_CREATE_HIGHLIGHT") {
        if (!layerActive) void toggleLayer(true);
        void createHighlight(message.color).then((ok) => sendResponse({ ok }));
        return true;
      }
      if (message.type === "SNOTE_CREATE_COMMENT") {
        if (!layerActive) void toggleLayer(true);
        const range = currentRange ?? selectedRange();
        if (range) openCommentEditor(range);
        else showToast("Select some text first");
        sendResponse({ ok: Boolean(range) });
      }
      if (message.type === "SNOTE_FOCUS_NOTE")
        sendResponse({ ok: focusNote(message.noteId) });
      if (message.type === "SNOTE_TOGGLE_LAYER") {
        void toggleLayer(message.open ?? !layerActive).then(() =>
          sendResponse(layerState())
        );
        return true;
      }
      if (message.type === "SNOTE_GET_LAYER_STATE") sendResponse(layerState());
      if (message.type === "SNOTE_SET_MODE") {
        void toggleLayer(true).then(() => {
          setLayerMode(message.mode);
          sendResponse(layerState());
        });
        return true;
      }
      return false;
    }
  );
}

export async function startSNote(): Promise<void> {
  if (document.getElementById(HOST_ID) || !document.body) return;
  settings = await loadSettings();
  createUi();
  applySettings();
  installListeners();
  updateLayerUi();
  await renderAllNotes();
}
