/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import codesandbox from "@gsimone/codesandbox-vite-plugin";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  // optimizeDeps: {
  //   // exclude: ['@fireproof/core'],
  // },
  // define: {
  //   global: "globalThis",
  // },
  plugins: [react(), codesandbox(), wasm(), topLevelAwait()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    // you might want to disable it, if you don't have tests that rely on CSS
    // since parsing CSS is slow
    css: true,
  },
});
