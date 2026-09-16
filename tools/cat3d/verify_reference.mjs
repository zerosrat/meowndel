// Isolated browser verification. Set PLAYWRIGHT_MODULE to an installed
// playwright entry point when it is not available in this project's modules.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const output = resolve("art/cat3d/fripouille-v2");
await mkdir(output, { recursive: true });
const errors = [];
const results = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: "reduce" });
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:5175/?preview=cat3d");
  const canvas = page.locator("canvas[data-ready=true]");
  await canvas.waitFor();
  assert.ok(await page.getByRole("link", { name: "CC BY 4.0" }).isVisible());
  await page.screenshot({ path: `${output}/web-desktop.png`, fullPage: true });
  const original = await canvas.screenshot();
  assert.equal(await canvas.getAttribute("data-coat"), "tuxedo");
  await page.getByRole("button", { name: /纯黑/ }).click();
  assert.equal(await canvas.getAttribute("data-coat"), "black");
  assert.ok(!original.equals(await canvas.screenshot()), "Coat switch changes rendered pixels");
  await page.screenshot({ path: `${output}/web-black.png`, fullPage: true });
  await page.getByRole("button", { name: /黑白/ }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await canvas.getAttribute("data-coat"), "tuxedo");
  await page.getByRole("button", { name: "向右转动" }).click();
  assert.ok(!original.equals(await canvas.screenshot()), "View button changes rendered pixels");
  await page.getByRole("button", { name: "重置视角" }).click();
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x+bounds.width*.5, bounds.y+bounds.height*.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width*.7, bounds.y+bounds.height*.5, { steps: 8 });
  await page.mouse.up();
  assert.ok(!original.equals(await canvas.screenshot()), "Pointer drag rotates the model");
  await page.getByRole("button", { name: "重置视角" }).click();
  await page.getByRole("button", { name: "放大", exact: true }).click();
  assert.ok(!original.equals(await canvas.screenshot()), "Zoom changes rendered pixels");
  await page.screenshot({ path: `${output}/web-close.png`, fullPage: true });
  for (let i=0;i<3;i++) await page.getByRole("button", { name: "放大", exact: true }).click();
  await page.getByRole("button", { name: "向右转动" }).click();
  await page.getByRole("button", { name: "向右转动" }).click();
  await page.screenshot({ path: `${output}/web-face.png`, fullPage: true });
  await page.getByRole("button", { name: "重置视角" }).click();
  for (let i=0;i<2;i++) await page.getByRole("button", { name: "向左转动" }).click();
  await page.screenshot({ path: `${output}/web-side.png`, fullPage: true });
  await page.getByRole("button", { name: "重置视角" }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: /和它打个招呼/ }).click();
  await page.waitForTimeout(120);
  const gesture = await canvas.screenshot();
  assert.ok(!original.equals(gesture), "Greeting visibly animates");
  await page.waitForTimeout(1900);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const still = await canvas.screenshot();
  await page.getByRole("button", { name: /和它打个招呼/ }).click();
  await page.waitForTimeout(160);
  assert.ok(still.equals(await canvas.screenshot()), "Reduced motion keeps geometry still");
  results.desktop = "coat pixel change, keyboard, rotation, pointer drag, zoom, greeting, reduced motion passed";
  results.resources = await page.locator(".study-footer").innerText();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No overflow at ${width}`);
    const resetBounds = await page.getByRole("button", { name: "重置视角" }).boundingBox();
    assert.ok(resetBounds.height <= 60, `View controls stay on one line at ${width}`);
    await page.screenshot({ path: `${output}/web-${width}.png`, fullPage: true });
  }
  results.viewports = [320, 390, 768, 1440];
  const offline = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  offline.on("pageerror", e => errors.push(e.message));
  await offline.route(/^https?:/, route => route.abort());
  await offline.goto(`file://${resolve("dist/index.html")}?preview=cat3d`);
  await offline.locator("canvas[data-ready=true]").waitFor();
  await offline.getByRole("button", { name: /纯黑/ }).click();
  assert.equal(await offline.locator("canvas").getAttribute("data-coat"), "black");
  results.offline = "single HTML renders and changes coat with HTTP(S) blocked";
  await offline.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2");
    gl.getExtension("WEBGL_lose_context").loseContext();
  });
  await offline.getByRole("alert").waitFor();
  assert.ok(await offline.getByRole("link", { name: "返回 SVG 样板" }).isVisible());
  results.contextLoss = "fallback displayed";
  assert.deepEqual(errors, []);
  results.errors = errors;
  results.environment = "headless Chromium with SwiftShader; not physical phone GPU";
  results.artifacts = {};
  for (const path of ["dist/index.html", "src/preview3d/assets/cat-fripouille-v2.glb"]) {
    const bytes = await readFile(path);
    results.artifacts[path] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  }
  await writeFile(`${output}/verification.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
