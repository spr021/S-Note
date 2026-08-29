import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentScript = readFileSync(
  resolve(projectRoot, "dist/src/pages/content/index.js"),
  "utf8"
);
const messageListeners = [];
const storageListeners = [];

const dom = new JSDOM(
  "<!doctype html><html><body><main><p>Fixture article text</p></main></body></html>",
  {
    pretendToBeVisual: true,
    runScripts: "dangerously",
    url: "https://fixture.snote.test/article",
  }
);

const { window } = dom;
window.chrome = {
  runtime: {
    lastError: undefined,
    onMessage: {
      addListener: (listener) => messageListeners.push(listener),
    },
  },
  storage: {
    local: {
      get: (key, callback) => callback({ [key]: [] }),
      set: (_updates, callback) => callback?.(),
    },
    onChanged: {
      addListener: (listener) => storageListeners.push(listener),
      removeListener: (listener) => {
        const index = storageListeners.indexOf(listener);
        if (index >= 0) storageListeners.splice(index, 1);
      },
    },
  },
};
window.CSS ??= {};
window.CSS.escape ??= (value) =>
  String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
window.scrollTo = () => undefined;

window.eval(contentScript);
await new Promise((resolvePromise) => window.setTimeout(resolvePromise, 0));

const host = window.document.getElementById("snote-extension-root");
const launcher = host?.shadowRoot?.querySelector(".launcher");

if (!host || !launcher) {
  throw new Error(
    "Content runtime verification failed: the floating S launcher was not created."
  );
}

if (messageListeners.length !== 1) {
  throw new Error(
    `Content runtime verification failed: expected one message listener, found ${messageListeners.length}.`
  );
}

let initialState;
messageListeners[0]({ type: "SNOTE_GET_LAYER_STATE" }, {}, (response) => {
  initialState = response;
});

if (!initialState?.ok || initialState.active) {
  throw new Error(
    "Content runtime verification failed: the hidden layer did not answer popup messages."
  );
}

launcher.click();
await new Promise((resolvePromise) => window.setTimeout(resolvePromise, 0));

if (
  !host.shadowRoot
    ?.querySelector(".layer-toolbar")
    ?.classList.contains("visible")
) {
  throw new Error(
    "Content runtime verification failed: clicking S did not unhide the annotation layer."
  );
}

window.close();
console.log(
  "Content runtime verified: the floating S button renders, listens, and opens the layer."
);
