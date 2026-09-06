/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false },
  // include 必须覆盖 .tsx，否则组件测试根本不会被执行。
  // 默认环境是 node（引擎测试用），组件测试各自用 `// @vitest-environment jsdom` 声明。
  test: { environment: "node", include: ["tests/**/*.test.{ts,tsx}"] },
});
