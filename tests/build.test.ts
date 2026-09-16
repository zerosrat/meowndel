import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

// legacy 本来就依赖 Google Fonts，1A 保留它 —— 唯一允许的外部引用
const FONT_ALLOWLIST = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

describe("单文件交付", () => {
  it("build 产出单个 index.html，无任何本地 JS/CSS 资源", () => {
    // Vitest sets NODE_ENV=test; the delivery check must build React in production mode.
    execSync("pnpm run build", { stdio: "pipe", env: { ...process.env, NODE_ENV: "production" } });
    expect(existsSync("dist/index.html")).toBe(true);

    const files = readdirSync("dist", { recursive: true }) as string[];
    const assets = files.filter((f) => /\.(js|css)$/.test(f));
    expect(assets, "所有 JS/CSS 都应内联，dist 里不该有资源文件").toEqual([]);
  }, 120000);

  it("除字体外链外，没有任何外部引用", () => {
    const html = readFileSync("dist/index.html", "utf8");

    // 收集所有 http(s) 引用：src= / href= / url()
    const urls = [
      ...html.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi),
      ...html.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)["']?\s*\)/gi),
    ].map((m) => m[1]);

    const unexpected = urls.filter(
      (u) => !FONT_ALLOWLIST.some((allowed) => u.startsWith(allowed))
    );
    expect(unexpected, "出现了字体以外的外部引用").toEqual([]);
  });

  it("字体外链确实还在（视觉一致的前提）", () => {
    const html = readFileSync("dist/index.html", "utf8");
    expect(html).toMatch(/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Mono/);
    expect(html).toMatch(/Noto\+Serif\+SC/);
  });

  it("长短毛底稿内联，不依赖本机路径或额外图片文件", () => {
    const html = readFileSync("dist/index.html", "utf8");
    const files = readdirSync("dist", { recursive: true }) as string[];
    expect(files.filter((f) => /\.(png|webp|jpe?g)$/.test(f))).toEqual([]);
    expect((html.match(/data:image\/png;base64,/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(/\/(?:Users|home)\//.test(html), "交付包不应包含开发机绝对路径").toBe(false);
    expect(html).not.toMatch(/(?:src|href)=["'][^"']*flat-assets\//);
  });
});
