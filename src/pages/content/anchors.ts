import type { TextAnchor } from "@src/shared/notes";

const SKIPPED_ELEMENTS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
]);

interface IndexedTextNode {
  node: Text;
  start: number;
  end: number;
}

interface TextIndex {
  text: string;
  nodes: IndexedTextNode[];
}

function isEligibleTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent || !node.data) return false;
  if (SKIPPED_ELEMENTS.has(parent.tagName)) return false;
  if (parent.closest("[data-snote-ui]")) return false;
  if (parent.closest("[contenteditable='true']")) return false;
  return true;
}

function buildTextIndex(root: Node = document.body): TextIndex {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isEligibleTextNode(node as Text)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: IndexedTextNode[] = [];
  let text = "";
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const node = current as Text;
    const start = text.length;
    text += node.data;
    nodes.push({ node, start, end: text.length });
  }
  return { text, nodes };
}

function nodePath(node: Node): string {
  const parts: number[] = [];
  let current: Node | null = node;
  while (current && current !== document.body) {
    const parent: Node | null = current.parentNode;
    if (!parent) return "";
    parts.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
    current = parent;
  }
  return current === document.body ? parts.join("/") : "";
}

function nodeFromPath(path: string): Node | null {
  if (!document.body) return null;
  if (!path) return document.body;
  let current: Node = document.body;
  for (const segment of path.split("/")) {
    const index = Number(segment);
    if (!Number.isInteger(index) || !current.childNodes[index]) return null;
    current = current.childNodes[index];
  }
  return current;
}

function globalOffset(
  index: TextIndex,
  container: Node,
  offset: number
): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const entry = index.nodes.find(({ node }) => node === container);
    return entry ? entry.start + Math.min(offset, entry.node.length) : null;
  }

  const probe = document.createRange();
  try {
    probe.setStart(document.body, 0);
    probe.setEnd(container, offset);
  } catch {
    return null;
  }
  const last = index.nodes
    .filter(({ node }) => probe.intersectsNode(node))
    .pop();
  return last ? last.end : 0;
}

function rangeFromOffsets(
  index: TextIndex,
  start: number,
  end: number
): Range | null {
  if (start < 0 || end <= start) return null;
  const startEntry = index.nodes.find(
    (entry) => start >= entry.start && start < entry.end
  );
  const endEntry = [...index.nodes]
    .reverse()
    .find((entry) => end > entry.start && end <= entry.end);
  if (!startEntry || !endEntry) return null;

  const range = document.createRange();
  range.setStart(startEntry.node, start - startEntry.start);
  range.setEnd(endEntry.node, end - endEntry.start);
  return range;
}

export function anchorFromRange(range: Range): TextAnchor | null {
  if (!document.body || range.collapsed) return null;
  const exact = range.toString();
  if (!exact.trim()) return null;
  const index = buildTextIndex();
  const start = globalOffset(index, range.startContainer, range.startOffset);
  const end = globalOffset(index, range.endContainer, range.endOffset);
  if (start === null || end === null || index.text.slice(start, end) !== exact)
    return null;

  return {
    exact,
    prefix: index.text.slice(Math.max(0, start - 48), start),
    suffix: index.text.slice(end, end + 48),
    startPath: nodePath(range.startContainer),
    startOffset: range.startOffset,
    endPath: nodePath(range.endContainer),
    endOffset: range.endOffset,
  };
}

function directRange(anchor: TextAnchor): Range | null {
  const start = nodeFromPath(anchor.startPath);
  const end = nodeFromPath(anchor.endPath);
  if (!start || !end) return null;
  try {
    const range = document.createRange();
    range.setStart(start, anchor.startOffset);
    range.setEnd(end, anchor.endOffset);
    return range.toString() === anchor.exact ? range : null;
  } catch {
    return null;
  }
}

function contextScore(text: string, index: number, anchor: TextAnchor): number {
  let score = 0;
  const before = text.slice(Math.max(0, index - anchor.prefix.length), index);
  const after = text.slice(
    index + anchor.exact.length,
    index + anchor.exact.length + anchor.suffix.length
  );
  for (let i = 1; i <= Math.min(before.length, anchor.prefix.length); i += 1) {
    if (before[before.length - i] !== anchor.prefix[anchor.prefix.length - i])
      break;
    score += 1;
  }
  for (let i = 0; i < Math.min(after.length, anchor.suffix.length); i += 1) {
    if (after[i] !== anchor.suffix[i]) break;
    score += 1;
  }
  return score;
}

export function rangeFromAnchor(anchor: TextAnchor): Range | null {
  const direct = directRange(anchor);
  if (direct) return direct;

  const index = buildTextIndex();
  let cursor = index.text.indexOf(anchor.exact);
  let bestIndex = -1;
  let bestScore = -1;
  while (cursor >= 0) {
    const score = contextScore(index.text, cursor, anchor);
    if (score > bestScore) {
      bestIndex = cursor;
      bestScore = score;
    }
    cursor = index.text.indexOf(anchor.exact, cursor + 1);
  }
  return bestIndex >= 0
    ? rangeFromOffsets(index, bestIndex, bestIndex + anchor.exact.length)
    : null;
}

export function wrapRange(
  range: Range,
  noteId: string,
  className: string
): HTMLElement[] {
  const index = buildTextIndex();
  const start = globalOffset(index, range.startContainer, range.startOffset);
  const end = globalOffset(index, range.endContainer, range.endOffset);
  if (start === null || end === null) return [];

  const segments = index.nodes
    .filter((entry) => entry.end > start && entry.start < end)
    .map((entry) => ({
      node: entry.node,
      start: Math.max(0, start - entry.start),
      end: Math.min(entry.node.length, end - entry.start),
    }))
    .filter((segment) => segment.end > segment.start)
    .reverse();

  const wrappers: HTMLElement[] = [];
  for (const segment of segments) {
    let selected = segment.node;
    if (segment.end < selected.length) selected.splitText(segment.end);
    if (segment.start > 0) selected = selected.splitText(segment.start);
    const wrapper = document.createElement("span");
    wrapper.dataset.snoteId = noteId;
    wrapper.className = className;
    selected.parentNode?.insertBefore(wrapper, selected);
    wrapper.appendChild(selected);
    wrappers.push(wrapper);
  }
  return wrappers.reverse();
}
