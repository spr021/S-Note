import {
  deleteNote,
  deleteNotesForSite,
  getNotes,
  getNotesForUrl,
  normalizePageUrl,
  saveNote,
  siteHostname,
  STORAGE_KEY,
  updateNoteText,
  type WebNote,
} from "./notes";

describe("note storage", () => {
  let data: Record<string, unknown>;

  beforeEach(() => {
    data = {};
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: { lastError: undefined },
        storage: {
          local: {
            get: (
              key: string,
              callback: (result: Record<string, unknown>) => void
            ) => callback({ [key]: data[key] }),
            set: (values: Record<string, unknown>, callback: () => void) => {
              Object.assign(data, values);
              callback();
            },
          },
        },
      },
    });
  });

  test("creates, updates, sorts, and deletes notes", async () => {
    const older: WebNote = {
      id: "older",
      kind: "page",
      url: "https://example.com/",
      pageTitle: "Example",
      text: "First",
      createdAt: 1,
      updatedAt: 1,
    };
    const newer: WebNote = {
      id: "newer",
      kind: "highlight",
      url: "https://example.com/",
      pageTitle: "Example",
      text: "",
      quote: "sample",
      createdAt: 2,
      updatedAt: 2,
    };

    await saveNote(older);
    await saveNote(newer);
    expect((await getNotes()).map((note) => note.id)).toEqual([
      "newer",
      "older",
    ]);

    await updateNoteText("older", "Updated");
    expect((await getNotes())[0]).toMatchObject({
      id: "older",
      text: "Updated",
    });

    await deleteNote("newer");
    expect(await getNotes()).toHaveLength(1);
    expect(data[STORAGE_KEY]).toEqual(expect.any(Array));
  });

  test("normalizes page fragments while preserving query identity", () => {
    expect(normalizePageUrl("https://example.com/read?q=notes#chapter-2")).toBe(
      "https://example.com/read?q=notes"
    );
    expect(siteHostname("https://www.Example.com/article")).toBe("example.com");
  });

  test("keeps each website's annotation collection separate", async () => {
    const first: WebNote = {
      id: "site-a-mark",
      kind: "mark",
      url: "https://alpha.example/article",
      pageTitle: "Alpha",
      text: "Alpha only",
      position: { x: 100, y: 200 },
      createdAt: 1,
      updatedAt: 1,
    };
    const second: WebNote = {
      id: "site-b-drawing",
      kind: "drawing",
      url: "https://beta.example/article",
      pageTitle: "Beta",
      text: "",
      drawing: {
        points: [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ],
        strokeWidth: 4,
      },
      createdAt: 2,
      updatedAt: 2,
    };
    await saveNote(first);
    await saveNote(second);

    expect(
      await getNotesForUrl("https://alpha.example/article#part-2")
    ).toEqual([first]);
    expect(await getNotesForUrl("https://beta.example/article")).toEqual([
      second,
    ]);
  });

  test("deletes every note in one website group without affecting others", async () => {
    const makeNote = (id: string, url: string): WebNote => ({
      id,
      kind: "page",
      url,
      pageTitle: id,
      text: id,
      createdAt: 1,
      updatedAt: 1,
    });
    await saveNote(makeNote("first-page", "https://www.example.com/one"));
    await saveNote(makeNote("second-page", "https://example.com/two"));
    await saveNote(makeNote("other-site", "https://other.example/one"));

    await deleteNotesForSite("example.com");

    expect((await getNotes()).map((note) => note.id)).toEqual(["other-site"]);
  });
});
