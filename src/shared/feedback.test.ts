import {
  FEEDBACK_EMAIL,
  FEEDBACK_TYPES,
  feedbackMailtoUrl,
  feedbackSubject,
  openFeedbackEmail,
} from "./feedback";

describe("feedback mailto", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("targets the developer address with a typed subject", () => {
    expect(FEEDBACK_EMAIL).toBe("saber.pourrahimi.1999@gmail.com");
    expect(FEEDBACK_TYPES).toContain("Bug report");
    expect(FEEDBACK_TYPES).toContain("Feature request");
    expect(feedbackSubject("Bug report")).toBe(
      "S-Note Extension Feedback <Bug report>"
    );
  });

  test("encodes the subject and message into the mailto link", () => {
    const url = feedbackMailtoUrl({
      type: "Feature request",
      message: "Add dark mode & tags",
    });

    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(url).toContain(
      `subject=${encodeURIComponent(
        "S-Note Extension Feedback <Feature request>"
      )}`
    );
    expect(url).toContain(`body=${encodeURIComponent("Add dark mode & tags")}`);
  });

  test("opens the mail client through a transient mailto link", () => {
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    openFeedbackEmail({ type: "Idea", message: "What about…" });

    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.getAttribute("href")).toBe(
      feedbackMailtoUrl({ type: "Idea", message: "What about…" })
    );
    expect(document.querySelector("a")).toBeNull();
  });
});
