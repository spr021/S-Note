import { useCallback, useEffect, useMemo, useState } from "react";
import "@pages/popup/Popup.css";
import {
  createNoteId,
  deleteNote,
  deleteNotesForSite,
  getNotes,
  normalizePageUrl,
  saveNote,
  siteHostname,
  STORAGE_KEY,
  updateNoteText,
  type WebNote,
} from "@src/shared/notes";
import { sendToPage } from "@src/shared/page-messaging";
import {
  DEFAULT_SETTINGS,
  getSettings,
  settingsFromChange,
  SETTINGS_KEY,
  updateSettings,
  type SNoteSettings,
} from "@src/shared/settings";
import { openSupportPage } from "@src/shared/support";
import { useResolvedTheme } from "@src/shared/theme";
import SettingsPanel from "@pages/popup/Settings";
import FeedbackDialog from "@pages/popup/Feedback";

interface ActivePage {
  tabId: number;
  url: string;
  title: string;
  supported: boolean;
}

interface LayerState {
  ok: boolean;
  active: boolean;
  mode: string;
  count: number;
}

interface WebsiteNoteGroup {
  hostname: string;
  notes: WebNote[];
}

function activePage(): Promise<ActivePage | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id || !tab.url) {
        resolve(null);
        return;
      }
      resolve({
        tabId: tab.id,
        url: normalizePageUrl(tab.url),
        title: tab.title || new URL(tab.url).hostname,
        supported: /^https?:/.test(tab.url),
      });
    });
  });
}

function kindLabel(note: WebNote): string {
  if (note.kind === "highlight") return "Highlight";
  if (note.kind === "comment") return "Comment";
  if (note.kind === "mark") return "Sticky mark";
  if (note.kind === "drawing") return "Drawing";
  return "Page note";
}

function relativeTime(timestamp: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const Popup = () => {
  const [page, setPage] = useState<ActivePage | null>(null);
  const [notes, setNotes] = useState<WebNote[]>([]);
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"page" | "all" | "settings">("page");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [layerOpen, setLayerOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [settings, setSettings] = useState<SNoteSettings>(DEFAULT_SETTINGS);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const resolvedTheme = useResolvedTheme(settings.theme);

  const openFeedback = useCallback(() => setFeedbackOpen(true), []);
  const closeFeedback = useCallback(() => setFeedbackOpen(false), []);

  const reload = async () => {
    try {
      setNotes(await getNotes());
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not load notes"
      );
    }
  };

  useEffect(() => {
    void Promise.all([activePage(), getNotes(), getSettings()])
      .then(async ([active, stored, storedSettings]) => {
        setPage(active);
        setNotes(stored);
        setSettings(storedSettings);
        if (active?.supported) {
          const { response: state, error } = await sendToPage<LayerState>(
            active.tabId,
            {
              type: "SNOTE_GET_LAYER_STATE",
            }
          );
          setLayerOpen(Boolean(state?.active));
          if (!state?.ok && error)
            setStatus(`S Note could not attach to this page: ${error}`);
        }
      })
      .catch((error: unknown) => {
        setStatus(
          error instanceof Error ? error.message : "Could not load S Note"
        );
      })
      .finally(() => setLoading(false));
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") return;
      if (changes[STORAGE_KEY]) void reload();
      if (changes[SETTINGS_KEY])
        setSettings(settingsFromChange(changes[SETTINGS_KEY]));
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const changeSettings = async (patch: Partial<SNoteSettings>) => {
    try {
      setSettings(await updateSettings(patch));
      setStatus("");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not save settings"
      );
    }
  };

  const switchView = (next: "page" | "all" | "settings") => {
    setView(next);
    setStatus("");
  };

  const visibleNotes = useMemo(() => {
    if (view === "all") return notes;
    return page ? notes.filter((note) => note.url === page.url) : [];
  }, [notes, page, view]);

  const websiteGroups = useMemo(() => {
    const groups = new Map<string, WebNote[]>();
    notes.forEach((note) => {
      const hostname = siteHostname(note.url);
      groups.set(hostname, [...(groups.get(hostname) ?? []), note]);
    });
    return [...groups.entries()]
      .map<WebsiteNoteGroup>(([hostname, siteNotes]) => ({
        hostname,
        notes: siteNotes,
      }))
      .sort(
        (first, second) =>
          (second.notes[0]?.updatedAt ?? 0) - (first.notes[0]?.updatedAt ?? 0)
      );
  }, [notes]);

  const savePageNote = async () => {
    const text = draft.trim();
    if (!text || !page?.supported) return;
    const now = Date.now();
    await saveNote({
      id: createNoteId(),
      kind: "page",
      url: page.url,
      pageTitle: page.title,
      text,
      createdAt: now,
      updatedAt: now,
    });
    setDraft("");
    setStatus("Page note saved");
    await reload();
  };

  const toggleLayer = async () => {
    if (!page?.supported || working) return;
    setWorking(true);
    setStatus("");
    const { response: state, error } = await sendToPage<LayerState>(
      page.tabId,
      {
        type: "SNOTE_TOGGLE_LAYER",
        open: !layerOpen,
      }
    );
    setWorking(false);
    if (!state?.ok) {
      setStatus(error || "S Note could not open on this page");
      return;
    }
    setLayerOpen(state.active);
    if (state.active) window.close();
  };

  const openTool = async (mode: "highlight" | "comment" | "mark" | "draw") => {
    if (!page?.supported || working) return;
    setWorking(true);
    setStatus("");
    const { response: state, error } = await sendToPage<LayerState>(
      page.tabId,
      {
        type: "SNOTE_SET_MODE",
        mode,
      }
    );
    setWorking(false);
    if (state?.ok) window.close();
    else setStatus(error || "S Note could not open on this page");
  };

  const focusNote = async (note: WebNote) => {
    if (!page || note.url !== page.url || note.kind === "page") return;
    const { response } = await sendToPage<{ ok: boolean }>(page.tabId, {
      type: "SNOTE_FOCUS_NOTE",
      noteId: note.id,
    });
    if (response?.ok) window.close();
    else setStatus("The saved text is not on this version of the page");
  };

  const remove = async (id: string) => {
    await deleteNote(id);
    setStatus("Note deleted");
    await reload();
  };

  const removeWebsite = async (group: WebsiteNoteGroup) => {
    const count = group.notes.length;
    const confirmed = window.confirm(
      `Delete all ${count} ${count === 1 ? "note" : "notes"} from ${
        group.hostname
      }?`
    );
    if (!confirmed) return;
    await deleteNotesForSite(group.hostname);
    setStatus(`Deleted all notes from ${group.hostname}`);
    await reload();
  };

  const editPageNote = async (note: WebNote) => {
    const text = window.prompt("Edit page note", note.text)?.trim();
    if (!text || text === note.text) return;
    await updateNoteText(note.id, text);
    await reload();
  };

  return (
    <main className="popup-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <img src="/icons/tabink-logo-128.png" alt="" />
        </div>
        <div className="brand-copy">
          <h1>S Note</h1>
          <p title={page?.title}>{page?.title || "Website notebook"}</p>
        </div>
        <span className="note-count" title="Saved notes">
          {visibleNotes.length}
        </span>
      </header>

      <nav className="tabs" aria-label="Notes view">
        <button
          className={view === "page" ? "active" : ""}
          onClick={() => switchView("page")}
        >
          This page
        </button>
        <button
          className={view === "all" ? "active" : ""}
          onClick={() => switchView("all")}
        >
          All notes
        </button>
        <button
          className={view === "settings" ? "active" : ""}
          onClick={() => switchView("settings")}
        >
          Settings
        </button>
      </nav>

      {view === "settings" ? (
        <>
          <SettingsPanel
            settings={settings}
            onChange={(patch) => void changeSettings(patch)}
            onSupport={() => void openSupportPage()}
            onFeedback={openFeedback}
          />
          {status && (
            <div className="status" role="status">
              {status}
            </div>
          )}
        </>
      ) : loading ? (
        <div className="empty">Loading notes…</div>
      ) : view === "page" && !page ? (
        <>
          <div className="empty">
            <strong>Could not read the active page.</strong>
            <span>Close and reopen the popup to try again.</span>
          </div>
          {status && (
            <div className="status" role="status">
              {status}
            </div>
          )}
        </>
      ) : view === "page" && page && !page.supported ? (
        <>
          <div className="empty">
            <strong>This page is protected by the browser.</strong>
            <span>Open a regular http or https website to take notes.</span>
          </div>
          {status && (
            <div className="status" role="status">
              {status}
            </div>
          )}
        </>
      ) : (
        <>
          {view === "page" && (
            <>
              <section
                className="layer-card"
                aria-label="Website annotation layer"
              >
                <div>
                  <strong>Website notes</strong>
                  <span>
                    {layerOpen
                      ? "Visible — website interaction is locked"
                      : "Hidden — website works normally"}
                  </span>
                </div>
                <button
                  className={layerOpen ? "layer-toggle active" : "layer-toggle"}
                  disabled={working}
                  onClick={() => void toggleLayer()}
                >
                  {working
                    ? "Opening…"
                    : layerOpen
                    ? "Hide notes"
                    : "Unhide notes"}
                </button>
                <div className="tool-launchers">
                  <button
                    disabled={working}
                    onClick={() => void openTool("highlight")}
                  >
                    Highlight
                  </button>
                  <button
                    disabled={working}
                    onClick={() => void openTool("comment")}
                  >
                    Comment
                  </button>
                  <button
                    disabled={working}
                    onClick={() => void openTool("mark")}
                  >
                    Sticky mark
                  </button>
                  <button
                    disabled={working}
                    onClick={() => void openTool("draw")}
                  >
                    Pen
                  </button>
                </div>
                {status && (
                  <div className="status layer-status" role="status">
                    {status}
                  </div>
                )}
              </section>
              <section className="capture-card" aria-label="Add a page note">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      (event.metaKey || event.ctrlKey) &&
                      event.key === "Enter"
                    )
                      void savePageNote();
                  }}
                  placeholder="Write a note about this page…"
                  aria-label="Page note"
                />
                <div className="capture-actions">
                  <span className="save-hint">⌘/Ctrl + Enter</span>
                  <button
                    className="save-button"
                    disabled={!draft.trim()}
                    onClick={() => void savePageNote()}
                  >
                    Save note
                  </button>
                </div>
              </section>
            </>
          )}

          {status && view !== "page" && (
            <div className="status" role="status">
              {status}
            </div>
          )}

          <section
            className={`notes${view === "all" ? " grouped-notes" : ""}`}
            aria-label="Saved notes"
          >
            {visibleNotes.length === 0 ? (
              <div className="empty small">
                <strong>No notes here yet.</strong>
                <span>
                  Select text on the website to highlight it or add a comment.
                </span>
              </div>
            ) : view === "all" ? (
              websiteGroups.map((group) => (
                <section className="website-group" key={group.hostname}>
                  <header className="website-group-header">
                    <div>
                      <strong>{group.hostname}</strong>
                      <span>
                        {group.notes.length}{" "}
                        {group.notes.length === 1 ? "note" : "notes"}
                      </span>
                    </div>
                    <button
                      className="delete-website"
                      onClick={() => void removeWebsite(group)}
                      aria-label={`Delete all notes from ${group.hostname}`}
                    >
                      Delete all
                    </button>
                  </header>
                  <div className="website-group-notes">
                    {group.notes.map((note) => (
                      <article
                        className={`note-card ${note.kind}`}
                        key={note.id}
                      >
                        <div className="note-meta">
                          <span
                            className={`kind-dot ${note.color || "plain"}`}
                            aria-hidden="true"
                          />
                          <span>{kindLabel(note)}</span>
                          <time
                            title={new Date(note.updatedAt).toLocaleString()}
                          >
                            {relativeTime(note.updatedAt)}
                          </time>
                        </div>
                        <p className="page-title" title={note.pageTitle}>
                          {note.pageTitle}
                        </p>
                        {note.quote && <blockquote>{note.quote}</blockquote>}
                        {note.text ? (
                          <p className="note-text">{note.text}</p>
                        ) : note.kind === "drawing" ? (
                          <p className="note-text muted">Freehand pen stroke</p>
                        ) : null}
                        <div className="note-actions">
                          {note.kind !== "page" && page?.url === note.url && (
                            <button onClick={() => void focusNote(note)}>
                              Show on page
                            </button>
                          )}
                          {note.kind === "page" && (
                            <button onClick={() => void editPageNote(note)}>
                              Edit
                            </button>
                          )}
                          <button
                            className="delete-button"
                            onClick={() => void remove(note.id)}
                            aria-label={`Delete ${kindLabel(
                              note
                            ).toLowerCase()}`}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              visibleNotes.map((note) => (
                <article className={`note-card ${note.kind}`} key={note.id}>
                  <div className="note-meta">
                    <span
                      className={`kind-dot ${note.color || "plain"}`}
                      aria-hidden="true"
                    />
                    <span>{kindLabel(note)}</span>
                    <time title={new Date(note.updatedAt).toLocaleString()}>
                      {relativeTime(note.updatedAt)}
                    </time>
                  </div>
                  {note.quote && <blockquote>{note.quote}</blockquote>}
                  {note.text ? (
                    <p className="note-text">{note.text}</p>
                  ) : note.kind === "drawing" ? (
                    <p className="note-text muted">Freehand pen stroke</p>
                  ) : null}
                  <div className="note-actions">
                    {note.kind !== "page" && page?.url === note.url && (
                      <button onClick={() => void focusNote(note)}>
                        Show on page
                      </button>
                    )}
                    {note.kind === "page" && (
                      <button onClick={() => void editPageNote(note)}>
                        Edit
                      </button>
                    )}
                    <button
                      className="delete-button"
                      onClick={() => void remove(note.id)}
                      aria-label={`Delete ${kindLabel(note).toLowerCase()}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}

      {view !== "settings" && (
        <footer className="support-footer">
          <button type="button" className="support-link" onClick={openFeedback}>
            <span aria-hidden="true">✉</span> Send feedback
          </button>
          <button
            type="button"
            className="support-link"
            onClick={() => void openSupportPage()}
          >
            <span aria-hidden="true">☕</span> Buy me a coffee
          </button>
        </footer>
      )}

      {feedbackOpen && <FeedbackDialog onClose={closeFeedback} />}
    </main>
  );
};

export default Popup;
