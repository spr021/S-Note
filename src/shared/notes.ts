import { readStorage, writeStorage } from "./storage";

export type NoteKind = "page" | "highlight" | "comment" | "mark" | "drawing";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export interface TextAnchor {
  exact: string;
  prefix: string;
  suffix: string;
  startPath: string;
  startOffset: number;
  endPath: string;
  endOffset: number;
}

export interface PagePoint {
  x: number;
  y: number;
}

export interface DrawingData {
  points: PagePoint[];
  strokeWidth: number;
}

export interface WebNote {
  id: string;
  kind: NoteKind;
  url: string;
  pageTitle: string;
  text: string;
  quote?: string;
  anchor?: TextAnchor;
  position?: PagePoint;
  drawing?: DrawingData;
  color?: HighlightColor;
  createdAt: number;
  updatedAt: number;
}

export const STORAGE_KEY = "snote.notes.v1";

export function normalizePageUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return value.split("#")[0];
  }
}

export function siteHostname(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function createNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `snote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getNotes(): Promise<WebNote[]> {
  const notes = await readStorage<WebNote[]>(STORAGE_KEY);
  if (!Array.isArray(notes)) return [];
  return notes
    .filter((note) => note && typeof note.id === "string")
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getNotesForUrl(url: string): Promise<WebNote[]> {
  const pageUrl = normalizePageUrl(url);
  return (await getNotes()).filter((note) => note.url === pageUrl);
}

export async function saveNote(note: WebNote): Promise<void> {
  const notes = await getNotes();
  const index = notes.findIndex((item) => item.id === note.id);
  if (index >= 0) notes[index] = note;
  else notes.unshift(note);
  await writeStorage({ [STORAGE_KEY]: notes });
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  await writeStorage({
    [STORAGE_KEY]: notes.filter((note) => note.id !== id),
  });
}

export async function deleteNotesForSite(hostname: string): Promise<void> {
  const notes = await getNotes();
  await writeStorage({
    [STORAGE_KEY]: notes.filter((note) => siteHostname(note.url) !== hostname),
  });
}

export async function updateNoteText(id: string, text: string): Promise<void> {
  const notes = await getNotes();
  const note = notes.find((item) => item.id === id);
  if (!note) return;
  note.text = text.trim();
  note.updatedAt = Date.now();
  await writeStorage({ [STORAGE_KEY]: notes });
}
