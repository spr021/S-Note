/**
 * Feedback delivery. S Note stays local-first, so feedback never passes through
 * a server: the form builds a `mailto:` link and hands it to the browser, which
 * opens the user's own email client with the subject and message prefilled.
 */

export const FEEDBACK_EMAIL = "saber.pourrahimi.1999@gmail.com";

export const FEEDBACK_TYPES = [
  "Bug report",
  "Feature request",
  "Improvement",
  "Idea",
  "Question",
  "Other",
] as const;

export type FeedbackType = typeof FEEDBACK_TYPES[number];

export interface FeedbackDraft {
  type: FeedbackType;
  message: string;
}

export function feedbackSubject(type: FeedbackType): string {
  return `S-Note Extension Feedback <${type}>`;
}

export function feedbackMailtoUrl({ type, message }: FeedbackDraft): string {
  const subject = encodeURIComponent(feedbackSubject(type));
  const body = encodeURIComponent(message);
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * Opens the user's mail client through a real `mailto:` link. External protocol
 * URLs are not reliably delegated by `chrome.tabs.create`, whereas an anchor
 * click needs no permission and works in both Chrome and Firefox. The node is
 * removed right after the click so it never lingers in the DOM.
 */
export function openFeedbackEmail(draft: FeedbackDraft): void {
  const link = document.createElement("a");
  link.href = feedbackMailtoUrl(draft);
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
