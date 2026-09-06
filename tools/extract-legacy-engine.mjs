import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("legacy/index.legacy.html", "utf8");
const m = html.match(/<script>\n([\s\S]*?)\n<\/script>/);
if (!m) throw new Error("未找到 <script> 块");

let js = m[1];

// 去掉 IIFE 头
js = js.replace(/^\(function\(\)\{\s*\n"use strict";\n/, "");

// 去掉加载时会碰 DOM 的尾部（从 document.addEventListener 到文件末尾）
const cut = js.indexOf('document.addEventListener("click"');
if (cut < 0) throw new Error("未找到尾部事件绑定，legacy 文件可能已变动");
js = js.slice(0, cut);

js += `
export {
  A_GENOS, WHITE_S, WHITE_LABEL, WHITE_FRAC,
  norm, crossAuto, crossO,
  seriesOf, baseName, coatName, specOf,
  catSVG, mulberry,
  CANON, canonSpec, oForSeries,
  buildTarget, solveParents, hasPair, canonAsParent,
  parentClaims, kidClaims,
  MATES, mateList, unionCross, childrenWith,
  QUICK
};
`;

writeFileSync("legacy/engine.legacy.mjs", js);
console.log("已写出 legacy/engine.legacy.mjs（" + js.length + " 字节）");
