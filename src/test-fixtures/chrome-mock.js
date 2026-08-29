(function installChromeMock() {
  const values = {};
  const storageListeners = [];
  const messageListeners = [];

  window.chrome = {
    runtime: {
      lastError: undefined,
      getURL: (path) => `/${String(path).replace(/^\//, "")}`,
      onMessage: {
        addListener: (listener) => messageListeners.push(listener),
      },
    },
    storage: {
      local: {
        get: (key, callback) => callback({ [key]: values[key] }),
        set: (updates, callback) => {
          const changes = {};
          for (const [key, newValue] of Object.entries(updates)) {
            changes[key] = { oldValue: values[key], newValue };
            values[key] = newValue;
          }
          callback?.();
          storageListeners.forEach((listener) => listener(changes, "local"));
        },
      },
      onChanged: {
        addListener: (listener) => storageListeners.push(listener),
        removeListener: (listener) => {
          const index = storageListeners.indexOf(listener);
          if (index >= 0) storageListeners.splice(index, 1);
        },
      },
    },
    tabs: {
      query: (_query, callback) =>
        callback([
          {
            id: 1,
            url: "https://fixture.snote.test/article",
            title: "A field guide to useful notes",
          },
        ]),
      sendMessage: (_tabId, message, callback) => {
        let answered = false;
        const sendResponse = (response) => {
          if (!answered) callback?.(response);
          answered = true;
        };
        messageListeners.forEach((listener) =>
          listener(message, {}, sendResponse)
        );
        if (!answered) callback?.({ ok: false });
      },
    },
  };
})();
