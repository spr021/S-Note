import { anchorFromRange, rangeFromAnchor, wrapRange } from "./anchors";

function textNode(selector: string): Text {
  const node = document.querySelector(selector)?.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE)
    throw new Error("Expected text node");
  return node as Text;
}

describe("website text anchors", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("serializes and restores a selection", () => {
    document.body.innerHTML =
      "<p>The quick brown fox jumps over the lazy dog.</p>";
    const node = textNode("p");
    const range = document.createRange();
    range.setStart(node, 4);
    range.setEnd(node, 19);

    const anchor = anchorFromRange(range);

    expect(anchor?.exact).toBe("quick brown fox");
    expect(anchor && rangeFromAnchor(anchor)?.toString()).toBe(
      "quick brown fox"
    );
  });

  test("falls back to quote context after the DOM structure changes", () => {
    document.body.innerHTML =
      "<p>First target is here.</p><p>The second target is the one.</p>";
    const node = textNode("p:nth-child(2)");
    const range = document.createRange();
    range.setStart(node, 11);
    range.setEnd(node, 17);
    const anchor = anchorFromRange(range);
    expect(anchor).not.toBeNull();

    document.body.innerHTML =
      "<main><div>First target is here.</div><section>The second target is the one.</section></main>";

    expect(anchor && rangeFromAnchor(anchor)?.toString()).toBe("target");
  });

  test("wraps a selection spanning multiple elements without losing text", () => {
    document.body.innerHTML =
      "<p>Hello <strong>useful website</strong> notes.</p>";
    const first = textNode("p");
    const last = document.querySelector("strong")?.firstChild as Text;
    const range = document.createRange();
    range.setStart(first, 2);
    range.setEnd(last, 6);

    const wrappers = wrapRange(range, "note-1", "snote-highlight snote-yellow");

    expect(wrappers).toHaveLength(2);
    expect(wrappers.map((element) => element.textContent).join("")).toBe(
      "llo useful"
    );
    expect(document.body.textContent).toBe("Hello useful website notes.");
    expect(document.querySelectorAll('[data-snote-id="note-1"]')).toHaveLength(
      2
    );
  });

  test("refuses selections inside editable fields", () => {
    document.body.innerHTML =
      '<div contenteditable="true">Do not anchor this</div>';
    const node = textNode("div");
    const range = document.createRange();
    range.selectNodeContents(node);
    expect(anchorFromRange(range)).toBeNull();
  });
});
