// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3, { resolve as resolve3 } from "path";

// utils/plugins/make-manifest.ts
import * as fs from "fs";
import * as path from "path";

// utils/log.ts
function colorLog(message, type) {
  let color = type || COLORS.FgBlack;
  switch (type) {
    case "success":
      color = COLORS.FgGreen;
      break;
    case "info":
      color = COLORS.FgBlue;
      break;
    case "error":
      color = COLORS.FgRed;
      break;
    case "warning":
      color = COLORS.FgYellow;
      break;
  }
  console.log(color, message);
}
var COLORS = {
  Reset: "\x1B[0m",
  Bright: "\x1B[1m",
  Dim: "\x1B[2m",
  Underscore: "\x1B[4m",
  Blink: "\x1B[5m",
  Reverse: "\x1B[7m",
  Hidden: "\x1B[8m",
  FgBlack: "\x1B[30m",
  FgRed: "\x1B[31m",
  FgGreen: "\x1B[32m",
  FgYellow: "\x1B[33m",
  FgBlue: "\x1B[34m",
  FgMagenta: "\x1B[35m",
  FgCyan: "\x1B[36m",
  FgWhite: "\x1B[37m",
  BgBlack: "\x1B[40m",
  BgRed: "\x1B[41m",
  BgGreen: "\x1B[42m",
  BgYellow: "\x1B[43m",
  BgBlue: "\x1B[44m",
  BgMagenta: "\x1B[45m",
  BgCyan: "\x1B[46m",
  BgWhite: "\x1B[47m"
};

// utils/manifest-parser/index.ts
var ManifestParser = class {
  constructor() {
  }
  static convertManifestToString(manifest2) {
    return JSON.stringify(manifest2, null, 2);
  }
};
var manifest_parser_default = ManifestParser;

// utils/plugins/make-manifest.ts
var __vite_injected_original_dirname = "/Users/saber/Documents/S-Note/utils/plugins";
var { resolve } = path;
var outDir = resolve(__vite_injected_original_dirname, "..", "..", "public");
function makeManifest(manifest2) {
  return {
    name: "make-manifest",
    buildEnd() {
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
      }
      const manifestPath = resolve(outDir, "manifest.json");
      fs.writeFileSync(
        manifestPath,
        manifest_parser_default.convertManifestToString(manifest2)
      );
      colorLog(`Manifest file copy complete: ${manifestPath}`, "success");
    }
  };
}

// utils/plugins/custom-dynamic-import.ts
function customDynamicImport() {
  return {
    name: "custom-dynamic-import",
    renderDynamicImport() {
      return {
        left: `
        {
          const dynamicImport = (path) => import(path);
          dynamicImport(
          `,
        right: ")}"
      };
    }
  };
}

// utils/plugins/add-hmr.ts
import * as path2 from "path";
import { readFileSync } from "fs";
var __vite_injected_original_dirname2 = "/Users/saber/Documents/S-Note/utils/plugins";
var isDev = process.env.__DEV__ === "true";
var DUMMY_CODE = `export default function(){};`;
function getInjectionCode(fileName) {
  return readFileSync(
    path2.resolve(__vite_injected_original_dirname2, "..", "reload", "injections", fileName),
    { encoding: "utf8" }
  );
}
function addHmr(config) {
  const { background = false, view = true } = config || {};
  const idInBackgroundScript = "virtual:reload-on-update-in-background-script";
  const idInView = "virtual:reload-on-update-in-view";
  const scriptHmrCode = isDev ? getInjectionCode("script.js") : DUMMY_CODE;
  const viewHmrCode = isDev ? getInjectionCode("view.js") : DUMMY_CODE;
  return {
    name: "add-hmr",
    resolveId(id) {
      if (id === idInBackgroundScript || id === idInView) {
        return getResolvedId(id);
      }
    },
    load(id) {
      if (id === getResolvedId(idInBackgroundScript)) {
        return background ? scriptHmrCode : DUMMY_CODE;
      }
      if (id === getResolvedId(idInView)) {
        return view ? viewHmrCode : DUMMY_CODE;
      }
    }
  };
}
function getResolvedId(id) {
  return "\0" + id;
}

// package.json
var package_default = {
  name: "s-note",
  version: "0.1.0",
  description: "S Note everywhere you want",
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/spr021/S-Note.git"
  },
  scripts: {
    build: "tsc --noEmit && vite build",
    "build:hmr": "rollup --config utils/reload/rollup.config.ts",
    wss: "node utils/reload/initReloadServer.js",
    dev: "npm run build:hmr && (run-p wss dev:nodemon)",
    "dev:nodemon": "nodemon",
    test: "jest"
  },
  type: "module",
  dependencies: {
    react: "18.2.0",
    "react-dom": "18.2.0"
  },
  devDependencies: {
    "@rollup/plugin-typescript": "^8.5.0",
    "@testing-library/react": "13.4.0",
    "@types/chrome": "0.0.197",
    "@types/jest": "29.0.3",
    "@types/node": "18.7.23",
    "@types/react": "18.0.21",
    "@types/react-dom": "18.0.6",
    "@types/ws": "^8.5.3",
    "@typescript-eslint/eslint-plugin": "5.38.1",
    "@typescript-eslint/parser": "5.38.1",
    "@vitejs/plugin-react": "2.1.0",
    chokidar: "^3.5.3",
    eslint: "8.24.0",
    "eslint-config-prettier": "^8.5.0",
    "eslint-plugin-prettier": "4.2.1",
    "eslint-plugin-react": "7.31.8",
    "fs-extra": "10.1.0",
    jest: "29.0.3",
    "jest-environment-jsdom": "29.0.3",
    nodemon: "2.0.20",
    "npm-run-all": "^4.1.5",
    prettier: "2.7.1",
    rollup: "2.79.1",
    sass: "1.55.0",
    "ts-jest": "29.0.2",
    "ts-loader": "9.4.1",
    typescript: "4.8.3",
    vite: "3.1.3",
    ws: "8.9.0"
  }
};

// manifest.ts
var manifest = {
  manifest_version: 3,
  name: package_default.name,
  version: package_default.version,
  description: package_default.description,
  options_page: "src/pages/options/index.html",
  background: { service_worker: "src/pages/background/index.js" },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: "icons/sticky-note-64.png"
  },
  icons: {
    "16": "icons/sticky-note-16.png",
    "24": "icons/sticky-note-24.png",
    "32": "icons/sticky-note-32.png",
    "48": "icons/sticky-note-48.png",
    "64": "icons/sticky-note-64.png",
    "128": "icons/sticky-note-128.png",
    "256": "icons/sticky-note-256.png",
    "512": "icons/sticky-note-512.png"
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "<all_urls>"],
      js: ["src/pages/content/index.js"],
      css: ["assets/css/contentStyle.chunk.css"]
    }
  ],
  devtools_page: "src/pages/devtools/index.html",
  web_accessible_resources: [
    {
      resources: [
        "assets/js/*.js",
        "assets/css/*.css",
        "icons/*"
      ],
      matches: ["*://*/*"]
    }
  ]
};
var manifest_default = manifest;

// vite.config.ts
var __vite_injected_original_dirname3 = "/Users/saber/Documents/S-Note";
var root = resolve3(__vite_injected_original_dirname3, "src");
var pagesDir = resolve3(root, "pages");
var assetsDir = resolve3(root, "assets");
var outDir2 = resolve3(__vite_injected_original_dirname3, "dist");
var publicDir = resolve3(__vite_injected_original_dirname3, "public");
var isDev2 = process.env.__DEV__ === "true";
var enableHmrInBackgroundScript = true;
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@src": root,
      "@assets": assetsDir,
      "@pages": pagesDir
    }
  },
  plugins: [
    react(),
    makeManifest(manifest_default),
    customDynamicImport(),
    addHmr({ background: enableHmrInBackgroundScript, view: true })
  ],
  publicDir,
  build: {
    outDir: outDir2,
    sourcemap: isDev2,
    rollupOptions: {
      input: {
        devtools: resolve3(pagesDir, "devtools", "index.html"),
        panel: resolve3(pagesDir, "panel", "index.html"),
        content: resolve3(pagesDir, "content", "index.ts"),
        background: resolve3(pagesDir, "background", "index.ts"),
        contentStyle: resolve3(pagesDir, "content", "style.scss"),
        popup: resolve3(pagesDir, "popup", "index.html"),
        options: resolve3(pagesDir, "options", "index.html")
      },
      output: {
        entryFileNames: "src/pages/[name]/index.js",
        chunkFileNames: isDev2 ? "assets/js/[name].js" : "assets/js/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          const { dir, name: _name } = path3.parse(assetInfo.name);
          const assetFolder = getLastElement(dir.split("/"));
          const name = assetFolder + firstUpperCase(_name);
          return `assets/[ext]/${name}.chunk.[ext]`;
        }
      }
    }
  }
});
function getLastElement(array) {
  const length = array.length;
  const lastIndex = length - 1;
  return array[lastIndex];
}
function firstUpperCase(str) {
  const firstAlphabet = new RegExp(/( |^)[a-z]/, "g");
  return str.toLowerCase().replace(firstAlphabet, (L) => L.toUpperCase());
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAidXRpbHMvcGx1Z2lucy9tYWtlLW1hbmlmZXN0LnRzIiwgInV0aWxzL2xvZy50cyIsICJ1dGlscy9tYW5pZmVzdC1wYXJzZXIvaW5kZXgudHMiLCAidXRpbHMvcGx1Z2lucy9jdXN0b20tZHluYW1pYy1pbXBvcnQudHMiLCAidXRpbHMvcGx1Z2lucy9hZGQtaG1yLnRzIiwgIm1hbmlmZXN0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYWJlci9Eb2N1bWVudHMvUy1Ob3RlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zYWJlci9Eb2N1bWVudHMvUy1Ob3RlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCBwYXRoLCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG1ha2VNYW5pZmVzdCBmcm9tIFwiLi91dGlscy9wbHVnaW5zL21ha2UtbWFuaWZlc3RcIjtcbmltcG9ydCBjdXN0b21EeW5hbWljSW1wb3J0IGZyb20gXCIuL3V0aWxzL3BsdWdpbnMvY3VzdG9tLWR5bmFtaWMtaW1wb3J0XCI7XG5pbXBvcnQgYWRkSG1yIGZyb20gXCIuL3V0aWxzL3BsdWdpbnMvYWRkLWhtclwiO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gXCIuL21hbmlmZXN0XCI7XG5cbmNvbnN0IHJvb3QgPSByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIik7XG5jb25zdCBwYWdlc0RpciA9IHJlc29sdmUocm9vdCwgXCJwYWdlc1wiKTtcbmNvbnN0IGFzc2V0c0RpciA9IHJlc29sdmUocm9vdCwgXCJhc3NldHNcIik7XG5jb25zdCBvdXREaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0XCIpO1xuY29uc3QgcHVibGljRGlyID0gcmVzb2x2ZShfX2Rpcm5hbWUsIFwicHVibGljXCIpO1xuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Ll9fREVWX18gPT09IFwidHJ1ZVwiO1xuXG4vLyBFTkFCTEUgSE1SIElOIEJBQ0tHUk9VTkQgU0NSSVBUXG5jb25zdCBlbmFibGVIbXJJbkJhY2tncm91bmRTY3JpcHQgPSB0cnVlO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQHNyY1wiOiByb290LFxuICAgICAgXCJAYXNzZXRzXCI6IGFzc2V0c0RpcixcbiAgICAgIFwiQHBhZ2VzXCI6IHBhZ2VzRGlyLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1ha2VNYW5pZmVzdChtYW5pZmVzdCksXG4gICAgY3VzdG9tRHluYW1pY0ltcG9ydCgpLFxuICAgIGFkZEhtcih7IGJhY2tncm91bmQ6IGVuYWJsZUhtckluQmFja2dyb3VuZFNjcmlwdCwgdmlldzogdHJ1ZSB9KSxcbiAgXSxcbiAgcHVibGljRGlyLFxuICBidWlsZDoge1xuICAgIG91dERpcixcbiAgICBzb3VyY2VtYXA6IGlzRGV2LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIGRldnRvb2xzOiByZXNvbHZlKHBhZ2VzRGlyLCBcImRldnRvb2xzXCIsIFwiaW5kZXguaHRtbFwiKSxcbiAgICAgICAgcGFuZWw6IHJlc29sdmUocGFnZXNEaXIsIFwicGFuZWxcIiwgXCJpbmRleC5odG1sXCIpLFxuICAgICAgICBjb250ZW50OiByZXNvbHZlKHBhZ2VzRGlyLCBcImNvbnRlbnRcIiwgXCJpbmRleC50c1wiKSxcbiAgICAgICAgYmFja2dyb3VuZDogcmVzb2x2ZShwYWdlc0RpciwgXCJiYWNrZ3JvdW5kXCIsIFwiaW5kZXgudHNcIiksXG4gICAgICAgIGNvbnRlbnRTdHlsZTogcmVzb2x2ZShwYWdlc0RpciwgXCJjb250ZW50XCIsIFwic3R5bGUuc2Nzc1wiKSxcbiAgICAgICAgcG9wdXA6IHJlc29sdmUocGFnZXNEaXIsIFwicG9wdXBcIiwgXCJpbmRleC5odG1sXCIpLFxuICAgICAgICBvcHRpb25zOiByZXNvbHZlKHBhZ2VzRGlyLCBcIm9wdGlvbnNcIiwgXCJpbmRleC5odG1sXCIpLFxuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJzcmMvcGFnZXMvW25hbWVdL2luZGV4LmpzXCIsXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiBpc0RldlxuICAgICAgICAgID8gXCJhc3NldHMvanMvW25hbWVdLmpzXCJcbiAgICAgICAgICA6IFwiYXNzZXRzL2pzL1tuYW1lXS5baGFzaF0uanNcIixcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICBjb25zdCB7IGRpciwgbmFtZTogX25hbWUgfSA9IHBhdGgucGFyc2UoYXNzZXRJbmZvLm5hbWUpO1xuICAgICAgICAgIGNvbnN0IGFzc2V0Rm9sZGVyID0gZ2V0TGFzdEVsZW1lbnQoZGlyLnNwbGl0KFwiL1wiKSk7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGFzc2V0Rm9sZGVyICsgZmlyc3RVcHBlckNhc2UoX25hbWUpO1xuICAgICAgICAgIHJldHVybiBgYXNzZXRzL1tleHRdLyR7bmFtZX0uY2h1bmsuW2V4dF1gO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG5cbmZ1bmN0aW9uIGdldExhc3RFbGVtZW50PFQ+KGFycmF5OiBBcnJheUxpa2U8VD4pOiBUIHtcbiAgY29uc3QgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICBjb25zdCBsYXN0SW5kZXggPSBsZW5ndGggLSAxO1xuICByZXR1cm4gYXJyYXlbbGFzdEluZGV4XTtcbn1cblxuZnVuY3Rpb24gZmlyc3RVcHBlckNhc2Uoc3RyOiBzdHJpbmcpIHtcbiAgY29uc3QgZmlyc3RBbHBoYWJldCA9IG5ldyBSZWdFeHAoLyggfF4pW2Etel0vLCBcImdcIik7XG4gIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKGZpcnN0QWxwaGFiZXQsIChMKSA9PiBMLnRvVXBwZXJDYXNlKCkpO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9wbHVnaW5zL21ha2UtbWFuaWZlc3QudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGUvdXRpbHMvcGx1Z2lucy9tYWtlLW1hbmlmZXN0LnRzXCI7aW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgY29sb3JMb2cgZnJvbSBcIi4uL2xvZ1wiO1xuaW1wb3J0IHsgUGx1Z2luT3B0aW9uIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBNYW5pZmVzdFBhcnNlciBmcm9tIFwiLi4vbWFuaWZlc3QtcGFyc2VyXCI7XG5cbmNvbnN0IHsgcmVzb2x2ZSB9ID0gcGF0aDtcblxuY29uc3Qgb3V0RGlyID0gcmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi5cIiwgXCIuLlwiLCBcInB1YmxpY1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWFrZU1hbmlmZXN0KFxuICBtYW5pZmVzdDogY2hyb21lLnJ1bnRpbWUuTWFuaWZlc3RWM1xuKTogUGx1Z2luT3B0aW9uIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcIm1ha2UtbWFuaWZlc3RcIixcbiAgICBidWlsZEVuZCgpIHtcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXREaXIpKSB7XG4gICAgICAgIGZzLm1rZGlyU3luYyhvdXREaXIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYW5pZmVzdFBhdGggPSByZXNvbHZlKG91dERpciwgXCJtYW5pZmVzdC5qc29uXCIpO1xuXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKFxuICAgICAgICBtYW5pZmVzdFBhdGgsXG4gICAgICAgIE1hbmlmZXN0UGFyc2VyLmNvbnZlcnRNYW5pZmVzdFRvU3RyaW5nKG1hbmlmZXN0KVxuICAgICAgKTtcblxuICAgICAgY29sb3JMb2coYE1hbmlmZXN0IGZpbGUgY29weSBjb21wbGV0ZTogJHttYW5pZmVzdFBhdGh9YCwgXCJzdWNjZXNzXCIpO1xuICAgIH0sXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9zYWJlci9Eb2N1bWVudHMvUy1Ob3RlL3V0aWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9sb2cudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGUvdXRpbHMvbG9nLnRzXCI7dHlwZSBDb2xvclR5cGUgPSBcInN1Y2Nlc3NcIiB8IFwiaW5mb1wiIHwgXCJlcnJvclwiIHwgXCJ3YXJuaW5nXCIgfCBrZXlvZiB0eXBlb2YgQ09MT1JTO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb2xvckxvZyhtZXNzYWdlOiBzdHJpbmcsIHR5cGU/OiBDb2xvclR5cGUpIHtcbiAgbGV0IGNvbG9yOiBzdHJpbmcgPSB0eXBlIHx8IENPTE9SUy5GZ0JsYWNrO1xuXG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgXCJzdWNjZXNzXCI6XG4gICAgICBjb2xvciA9IENPTE9SUy5GZ0dyZWVuO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImluZm9cIjpcbiAgICAgIGNvbG9yID0gQ09MT1JTLkZnQmx1ZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJlcnJvclwiOlxuICAgICAgY29sb3IgPSBDT0xPUlMuRmdSZWQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwid2FybmluZ1wiOlxuICAgICAgY29sb3IgPSBDT0xPUlMuRmdZZWxsb3c7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGNvbG9yLCBtZXNzYWdlKTtcbn1cblxuY29uc3QgQ09MT1JTID0ge1xuICBSZXNldDogXCJcXHgxYlswbVwiLFxuICBCcmlnaHQ6IFwiXFx4MWJbMW1cIixcbiAgRGltOiBcIlxceDFiWzJtXCIsXG4gIFVuZGVyc2NvcmU6IFwiXFx4MWJbNG1cIixcbiAgQmxpbms6IFwiXFx4MWJbNW1cIixcbiAgUmV2ZXJzZTogXCJcXHgxYls3bVwiLFxuICBIaWRkZW46IFwiXFx4MWJbOG1cIixcbiAgRmdCbGFjazogXCJcXHgxYlszMG1cIixcbiAgRmdSZWQ6IFwiXFx4MWJbMzFtXCIsXG4gIEZnR3JlZW46IFwiXFx4MWJbMzJtXCIsXG4gIEZnWWVsbG93OiBcIlxceDFiWzMzbVwiLFxuICBGZ0JsdWU6IFwiXFx4MWJbMzRtXCIsXG4gIEZnTWFnZW50YTogXCJcXHgxYlszNW1cIixcbiAgRmdDeWFuOiBcIlxceDFiWzM2bVwiLFxuICBGZ1doaXRlOiBcIlxceDFiWzM3bVwiLFxuICBCZ0JsYWNrOiBcIlxceDFiWzQwbVwiLFxuICBCZ1JlZDogXCJcXHgxYls0MW1cIixcbiAgQmdHcmVlbjogXCJcXHgxYls0Mm1cIixcbiAgQmdZZWxsb3c6IFwiXFx4MWJbNDNtXCIsXG4gIEJnQmx1ZTogXCJcXHgxYls0NG1cIixcbiAgQmdNYWdlbnRhOiBcIlxceDFiWzQ1bVwiLFxuICBCZ0N5YW46IFwiXFx4MWJbNDZtXCIsXG4gIEJnV2hpdGU6IFwiXFx4MWJbNDdtXCIsXG59IGFzIGNvbnN0O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9tYW5pZmVzdC1wYXJzZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYWJlci9Eb2N1bWVudHMvUy1Ob3RlL3V0aWxzL21hbmlmZXN0LXBhcnNlci9pbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9tYW5pZmVzdC1wYXJzZXIvaW5kZXgudHNcIjt0eXBlIE1hbmlmZXN0ID0gY2hyb21lLnJ1bnRpbWUuTWFuaWZlc3RWMztcblxuY2xhc3MgTWFuaWZlc3RQYXJzZXIge1xuICAvKiogU0lOR0xFVE9OICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb25cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgc3RhdGljIGNvbnZlcnRNYW5pZmVzdFRvU3RyaW5nKG1hbmlmZXN0OiBNYW5pZmVzdCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNYW5pZmVzdFBhcnNlcjtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGUvdXRpbHMvcGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGUvdXRpbHMvcGx1Z2lucy9jdXN0b20tZHluYW1pYy1pbXBvcnQudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGUvdXRpbHMvcGx1Z2lucy9jdXN0b20tZHluYW1pYy1pbXBvcnQudHNcIjtpbXBvcnQgeyBQbHVnaW5PcHRpb24gfSBmcm9tIFwidml0ZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjdXN0b21EeW5hbWljSW1wb3J0KCk6IFBsdWdpbk9wdGlvbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJjdXN0b20tZHluYW1pYy1pbXBvcnRcIixcbiAgICByZW5kZXJEeW5hbWljSW1wb3J0KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogYFxuICAgICAgICB7XG4gICAgICAgICAgY29uc3QgZHluYW1pY0ltcG9ydCA9IChwYXRoKSA9PiBpbXBvcnQocGF0aCk7XG4gICAgICAgICAgZHluYW1pY0ltcG9ydChcbiAgICAgICAgICBgLFxuICAgICAgICByaWdodDogXCIpfVwiLFxuICAgICAgfTtcbiAgICB9LFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2FiZXIvRG9jdW1lbnRzL1MtTm90ZS91dGlscy9wbHVnaW5zL2FkZC1obXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGUvdXRpbHMvcGx1Z2lucy9hZGQtaG1yLnRzXCI7aW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgUGx1Z2luT3B0aW9uIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gXCJmc1wiO1xuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Ll9fREVWX18gPT09IFwidHJ1ZVwiO1xuXG5jb25zdCBEVU1NWV9DT0RFID0gYGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCl7fTtgO1xuXG5mdW5jdGlvbiBnZXRJbmplY3Rpb25Db2RlKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcmVhZEZpbGVTeW5jKFxuICAgIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi5cIiwgXCJyZWxvYWRcIiwgXCJpbmplY3Rpb25zXCIsIGZpbGVOYW1lKSxcbiAgICB7IGVuY29kaW5nOiBcInV0ZjhcIiB9XG4gICk7XG59XG5cbnR5cGUgQ29uZmlnID0ge1xuICBiYWNrZ3JvdW5kPzogYm9vbGVhbjtcbiAgdmlldz86IGJvb2xlYW47XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBhZGRIbXIoY29uZmlnPzogQ29uZmlnKTogUGx1Z2luT3B0aW9uIHtcbiAgY29uc3QgeyBiYWNrZ3JvdW5kID0gZmFsc2UsIHZpZXcgPSB0cnVlIH0gPSBjb25maWcgfHwge307XG4gIGNvbnN0IGlkSW5CYWNrZ3JvdW5kU2NyaXB0ID0gXCJ2aXJ0dWFsOnJlbG9hZC1vbi11cGRhdGUtaW4tYmFja2dyb3VuZC1zY3JpcHRcIjtcbiAgY29uc3QgaWRJblZpZXcgPSBcInZpcnR1YWw6cmVsb2FkLW9uLXVwZGF0ZS1pbi12aWV3XCI7XG5cbiAgY29uc3Qgc2NyaXB0SG1yQ29kZSA9IGlzRGV2ID8gZ2V0SW5qZWN0aW9uQ29kZShcInNjcmlwdC5qc1wiKSA6IERVTU1ZX0NPREU7XG4gIGNvbnN0IHZpZXdIbXJDb2RlID0gaXNEZXYgPyBnZXRJbmplY3Rpb25Db2RlKFwidmlldy5qc1wiKSA6IERVTU1ZX0NPREU7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImFkZC1obXJcIixcbiAgICByZXNvbHZlSWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gaWRJbkJhY2tncm91bmRTY3JpcHQgfHwgaWQgPT09IGlkSW5WaWV3KSB7XG4gICAgICAgIHJldHVybiBnZXRSZXNvbHZlZElkKGlkKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGxvYWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gZ2V0UmVzb2x2ZWRJZChpZEluQmFja2dyb3VuZFNjcmlwdCkpIHtcbiAgICAgICAgcmV0dXJuIGJhY2tncm91bmQgPyBzY3JpcHRIbXJDb2RlIDogRFVNTVlfQ09ERTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlkID09PSBnZXRSZXNvbHZlZElkKGlkSW5WaWV3KSkge1xuICAgICAgICByZXR1cm4gdmlldyA/IHZpZXdIbXJDb2RlIDogRFVNTVlfQ09ERTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRSZXNvbHZlZElkKGlkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIFwiXFwwXCIgKyBpZDtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NhYmVyL0RvY3VtZW50cy9TLU5vdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYWJlci9Eb2N1bWVudHMvUy1Ob3RlL21hbmlmZXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zYWJlci9Eb2N1bWVudHMvUy1Ob3RlL21hbmlmZXN0LnRzXCI7aW1wb3J0IHBhY2thZ2VKc29uIGZyb20gXCIuL3BhY2thZ2UuanNvblwiO1xuXG5jb25zdCBtYW5pZmVzdDogY2hyb21lLnJ1bnRpbWUuTWFuaWZlc3RWMyA9IHtcbiAgbWFuaWZlc3RfdmVyc2lvbjogMyxcbiAgbmFtZTogcGFja2FnZUpzb24ubmFtZSxcbiAgdmVyc2lvbjogcGFja2FnZUpzb24udmVyc2lvbixcbiAgZGVzY3JpcHRpb246IHBhY2thZ2VKc29uLmRlc2NyaXB0aW9uLFxuICBvcHRpb25zX3BhZ2U6IFwic3JjL3BhZ2VzL29wdGlvbnMvaW5kZXguaHRtbFwiLFxuICBiYWNrZ3JvdW5kOiB7IHNlcnZpY2Vfd29ya2VyOiBcInNyYy9wYWdlcy9iYWNrZ3JvdW5kL2luZGV4LmpzXCIgfSxcbiAgYWN0aW9uOiB7XG4gICAgZGVmYXVsdF9wb3B1cDogXCJzcmMvcGFnZXMvcG9wdXAvaW5kZXguaHRtbFwiLFxuICAgIGRlZmF1bHRfaWNvbjogXCJpY29ucy9zdGlja3ktbm90ZS02NC5wbmdcIixcbiAgfSxcbiAgaWNvbnM6IHtcbiAgICBcIjE2XCI6IFwiaWNvbnMvc3RpY2t5LW5vdGUtMTYucG5nXCIsXG4gICAgXCIyNFwiOiBcImljb25zL3N0aWNreS1ub3RlLTI0LnBuZ1wiLFxuICAgIFwiMzJcIjogXCJpY29ucy9zdGlja3ktbm90ZS0zMi5wbmdcIixcbiAgICBcIjQ4XCI6IFwiaWNvbnMvc3RpY2t5LW5vdGUtNDgucG5nXCIsXG4gICAgXCI2NFwiOiBcImljb25zL3N0aWNreS1ub3RlLTY0LnBuZ1wiLFxuICAgIFwiMTI4XCI6IFwiaWNvbnMvc3RpY2t5LW5vdGUtMTI4LnBuZ1wiLFxuICAgIFwiMjU2XCI6IFwiaWNvbnMvc3RpY2t5LW5vdGUtMjU2LnBuZ1wiLFxuICAgIFwiNTEyXCI6IFwiaWNvbnMvc3RpY2t5LW5vdGUtNTEyLnBuZ1wiLFxuICB9LFxuICBjb250ZW50X3NjcmlwdHM6IFtcbiAgICB7XG4gICAgICBtYXRjaGVzOiBbXCJodHRwOi8vKi8qXCIsIFwiaHR0cHM6Ly8qLypcIiwgXCI8YWxsX3VybHM+XCJdLFxuICAgICAganM6IFtcInNyYy9wYWdlcy9jb250ZW50L2luZGV4LmpzXCJdLFxuICAgICAgY3NzOiBbXCJhc3NldHMvY3NzL2NvbnRlbnRTdHlsZS5jaHVuay5jc3NcIl0sXG4gICAgfSxcbiAgXSxcbiAgZGV2dG9vbHNfcGFnZTogXCJzcmMvcGFnZXMvZGV2dG9vbHMvaW5kZXguaHRtbFwiLFxuICB3ZWJfYWNjZXNzaWJsZV9yZXNvdXJjZXM6IFtcbiAgICB7XG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgXCJhc3NldHMvanMvKi5qc1wiLFxuICAgICAgICBcImFzc2V0cy9jc3MvKi5jc3NcIixcbiAgICAgICAgXCJpY29ucy8qXCIsXG4gICAgICBdLFxuICAgICAgbWF0Y2hlczogW1wiKjovLyovKlwiXSxcbiAgICB9LFxuICBdLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgbWFuaWZlc3Q7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlRLFNBQVMsb0JBQW9CO0FBQ3RTLE9BQU8sV0FBVztBQUNsQixPQUFPQSxTQUFRLFdBQUFDLGdCQUFlOzs7QUNGeVIsWUFBWSxRQUFRO0FBQzNVLFlBQVksVUFBVTs7O0FDQ1AsU0FBUixTQUEwQixTQUFpQixNQUFrQjtBQUNsRSxNQUFJLFFBQWdCLFFBQVEsT0FBTztBQUVuQyxVQUFRLE1BQU07QUFBQSxJQUNaLEtBQUs7QUFDSCxjQUFRLE9BQU87QUFDZjtBQUFBLElBQ0YsS0FBSztBQUNILGNBQVEsT0FBTztBQUNmO0FBQUEsSUFDRixLQUFLO0FBQ0gsY0FBUSxPQUFPO0FBQ2Y7QUFBQSxJQUNGLEtBQUs7QUFDSCxjQUFRLE9BQU87QUFDZjtBQUFBLEVBQ0o7QUFFQSxVQUFRLElBQUksT0FBTyxPQUFPO0FBQzVCO0FBRUEsSUFBTSxTQUFTO0FBQUEsRUFDYixPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixLQUFLO0FBQUEsRUFDTCxZQUFZO0FBQUEsRUFDWixPQUFPO0FBQUEsRUFDUCxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsRUFDVCxPQUFPO0FBQUEsRUFDUCxTQUFTO0FBQUEsRUFDVCxVQUFVO0FBQUEsRUFDVixRQUFRO0FBQUEsRUFDUixXQUFX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QW9CO0FBQUEsSUFDcEIsT0FBTyxFQUFFLFlBQVksNkJBQTZCLE1BQU0sS0FBSyxDQUFDO0FBQUEsRUFDaEU7QUFBQSxFQUNBO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFBRDtBQUFBLElBQ0EsV0FBV0M7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLFVBQVVILFNBQVEsVUFBVSxZQUFZLFlBQVk7QUFBQSxRQUNwRCxPQUFPQSxTQUFRLFVBQVUsU0FBUyxZQUFZO0FBQUEsUUFDOUMsU0FBU0EsU0FBUSxVQUFVLFdBQVcsVUFBVTtBQUFBLFFBQ2hELFlBQVlBLFNBQVEsVUFBVSxjQUFjLFVBQVU7QUFBQSxRQUN0RCxjQUFjQSxTQUFRLFVBQVUsV0FBVyxZQUFZO0FBQUEsUUFDdkQsT0FBT0EsU0FBUSxVQUFVLFNBQVMsWUFBWTtBQUFBLFFBQzlDLFNBQVNBLFNBQVEsVUFBVSxXQUFXLFlBQVk7QUFBQSxNQUNwRDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCRyxTQUNaLHdCQUNBO0FBQUEsUUFDSixnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGdCQUFNLEVBQUUsS0FBSyxNQUFNLE1BQU0sSUFBSUMsTUFBSyxNQUFNLFVBQVUsSUFBSTtBQUN0RCxnQkFBTSxjQUFjLGVBQWUsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUNqRCxnQkFBTSxPQUFPLGNBQWMsZUFBZSxLQUFLO0FBQy9DLGlCQUFPLGdCQUFnQjtBQUFBLFFBQ3pCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQztBQUVELFNBQVMsZUFBa0IsT0FBd0I7QUFDakQsUUFBTSxTQUFTLE1BQU07QUFDckIsUUFBTSxZQUFZLFNBQVM7QUFDM0IsU0FBTyxNQUFNO0FBQ2Y7QUFFQSxTQUFTLGVBQWUsS0FBYTtBQUNuQyxRQUFNLGdCQUFnQixJQUFJLE9BQU8sY0FBYyxHQUFHO0FBQ2xELFNBQU8sSUFBSSxZQUFZLEVBQUUsUUFBUSxlQUFlLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQztBQUN4RTsiLAogICJuYW1lcyI6IFsicGF0aCIsICJyZXNvbHZlIiwgIm1hbmlmZXN0IiwgIm1hbmlmZXN0IiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAicmVzb2x2ZSIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJvdXREaXIiLCAiaXNEZXYiLCAicGF0aCJdCn0K
