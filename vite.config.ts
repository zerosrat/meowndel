/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const assetRoots = ["art", "references", "src/preview2d/assets", "src/preview3d/assets"]
  .map(path => fileURLToPath(new URL(path, import.meta.url)))
  .filter(existsSync).map(path => realpathSync(path));

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: { fs: { allow: [projectRoot, ...assetRoots] } },
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false },
  // include 必须覆盖 .tsx，否则组件测试根本不会被执行。
  // 默认环境是 node（引擎测试用），组件测试各自用 `// @vitest-environment jsdom` 声明。
  test: { environment: "node", include: ["tests/**/*.test.{ts,tsx}"] },
});
