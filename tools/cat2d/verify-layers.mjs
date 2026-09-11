// Usage: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.js CHROMIUM_PATH=/path/to/chromium node tools/cat2d/verify-layers.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { default: pw } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const dir = resolve("art/cat2d/layers-verification");
await mkdir(dir, { recursive: true });
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://localhost:5176/?preview=catlayers");
  const ready = () => page.waitForFunction(() => document.querySelectorAll("canvas[data-state=ready]").length === 3);
  await ready();
  const pixelEvidence = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    const pixel = (c,x,y) => [...c.getContext("2d").getImageData(Math.round(x*.9),Math.round(y*.9),1,1).data];
    return { white: canvases.map(c=>pixel(c,250,370)), eye:canvases.map(c=>pixel(c,207,198)),
      background:canvases.map(c=>pixel(c,950,50)), pigment:canvases.map(c=>pixel(c,600,450)) };
  });
  assert.deepEqual(pixelEvidence.white[0], pixelEvidence.white[1]);
  assert.deepEqual(pixelEvidence.white[1], pixelEvidence.white[2]);
  assert.deepEqual(pixelEvidence.eye[0], pixelEvidence.eye[1]);
  assert.deepEqual(pixelEvidence.eye[1], pixelEvidence.eye[2]);
  assert(pixelEvidence.background.every(x=>x[3]===0));
  assert.notDeepEqual(pixelEvidence.pigment[0],pixelEvidence.pigment[1]);
  await page.screenshot({path:resolve(dir,"three-colors-white.png"),fullPage:true});
  await page.getByRole("checkbox").uncheck();
  await page.screenshot({path:resolve(dir,"three-colors-solid.png"),fullPage:true});
  for (const label of ["1. 底色", "2. + 明暗", "3. + 毛发细节", "4. + 五官"]) {
    await page.getByRole("button", {name:label,exact:true}).click();
    await page.screenshot({path:resolve(dir,`stage-${label[0]}.png`),fullPage:true});
  }
  await page.getByRole("checkbox").focus();
  await page.keyboard.press("Space");
  assert(await page.getByRole("checkbox").isChecked());
  const widths = [];
  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    const dimensions = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.equal(dimensions.width,dimensions.scroll);
    widths.push(dimensions);
    await page.screenshot({path:resolve(dir,`width-${width}.png`),fullPage:true});
  }
  await page.context().setOffline(true);
  await page.goto(pathToFileURL(resolve("dist/index.html")).href+"?preview=catlayers");
  await ready();
  await page.getByRole("checkbox").uncheck();
  await page.screenshot({path:resolve(dir,"offline.png"),fullPage:true});
  assert.deepEqual(errors,[]);
  const report = {date:new Date().toISOString(),pixelEvidence,widths,offline:true,errors};
  await writeFile(resolve(dir,"verification.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
