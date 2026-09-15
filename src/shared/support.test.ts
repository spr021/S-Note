import { openSupportPage, SUPPORT_URL } from "./support";

describe("support link", () => {
  test("opens the donation page in a new tab", async () => {
    const create = jest.fn((_properties: unknown, callback?: () => void) =>
      callback?.()
    );
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: { lastError: undefined },
        tabs: { create },
      },
    });

    await openSupportPage();

    expect(create).toHaveBeenCalledWith(
      { url: SUPPORT_URL },
      expect.any(Function)
    );
    expect(SUPPORT_URL).toBe("https://buymeacoffee.com/spr021");
  });
});
