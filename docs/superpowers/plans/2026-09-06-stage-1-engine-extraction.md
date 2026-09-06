# 喵德尔 阶段 1A / 1B 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有单文件 `index.html` 迁移为 Vite + React + TypeScript 工程，遗传引擎抽为零 DOM 依赖的纯模块并补齐测试（1A，行为逐字不变），然后逐项修复 7 个已知缺陷（1B，每项各带一个证明行为改变的测试）。

**Architecture:** 先用「黄金快照」锁死当前行为——UI 状态空间只有 360 种组合，可完整穷举，把旧引擎在全部 360 种状态下的输出录成 `tests/fixtures/golden.json`。之后每移植一个模块，就用快照里对应的切片做特征化测试（characterization test）。1A 结束时新引擎必须逐字复现快照；1B 每修一个 bug，快照会产生**预期内的** diff，必须逐条审阅确认。

**Tech Stack:** Vite 7 · React 19 · TypeScript 5 · Vitest 3 · vite-plugin-singlefile · Node 26（本机 v26.5.1，npm 11.17.0）

**Spec:** `docs/superpowers/specs/2026-09-06-cat-color-v2-design.md`

## Global Constraints

- **产品命名**：仓库 `meowndel`，产品名**喵德尔**，副标题**猫色溯源**，一句话「看看这身花色，究竟随了谁。」。页面 `<title>` 为 `喵德尔 · 猫色溯源`，`h1` 为 `喵德尔`。迁移时原样保留 legacy 里的这三处文案。
- **交付形态不可丢**：`npm run build` 必须产出**单个** `dist/index.html`，内联全部 JS/CSS，无任何外部请求。这是 spec 第 11 节的硬要求。
- **1A 期间行为逐字不变**：包括 SVG 字符串、断言文案、画廊顺序、截断行为。**1A 不修任何 bug**，哪怕已经看见了。
- **1B 每项缺陷独立提交**，各自带「输入 → 旧的错误输出 → 新的正确输出」测试（spec 第 14 节）。
- **引擎零 DOM 依赖**：`src/genetics/**` 与 `src/render/**` 不得引用 `document`、`window`、`localStorage`。
- **数组顺序即契约**：旧代码用 `Object.keys` 插入序驱动输出顺序，移植时**必须保持完全相同的循环顺序**，否则快照对不上。
- 本阶段**不引入任何新位点、不改遗传模型**。spec 第 4、5、6 节属于阶段 2 及以后。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `package.json` / `tsconfig.json` / `vite.config.ts` | 工程配置，单文件构建 |
| `index.html` | Vite 入口壳（仅 `#root` 与 module script） |
| `legacy/index.legacy.html` | 原始单文件，冻结，只作参照与快照生成源 |
| `tools/extract-legacy-engine.mjs` | 从 legacy HTML 抽出可在 Node 里 import 的旧引擎 |
| `tools/generate-golden.mjs` → `.ts` | 穷举 360 种 UI 状态生成黄金快照；1A 用 legacy 引擎，Task 10 起换成新引擎 |
| `tools/diff-golden.mjs` | 按字段归类审阅快照差异 |
| `tests/fixtures/golden.json` | 黄金快照，提交进仓库 |
| `src/genetics/loci.ts` | 位点常量、等位基因表、白斑映射 |
| `src/genetics/punnett.ts` | 单位点杂交：`norm` / `crossAuto` / `crossO` |
| `src/genetics/phenotype.ts` | 基因型 → 表型结构 |
| `src/genetics/naming.ts` | 表型 → 中文花色名（纯查表，不依赖 punnett） |
| `src/genetics/catalog.ts` | `CANON` 常见花色表、`MATES` 配偶表 |
| `src/genetics/solve.ts` | `buildTarget` / `solveParents` / `canonAsParent` |
| `src/genetics/claims.ts` | `parentClaims` / `kidClaims` |
| `src/genetics/children.ts` | `mateList` / `childrenWith` |
| `src/genetics/joint.ts` | `canonPairAllowed`（1B Task 16 新建） |
| `src/genetics/index.ts` | 引擎公开 API 汇总 |
| `src/render/catSVG.ts` | SVG 画猫（含 `mulberry` 随机源） |
| `src/ui/types.ts` | `UiState`、`normalizeUi`、`QUICK` |
| `src/ui/*.tsx` | React 组件 |
| `src/styles.css` | 从 legacy `<style>` 原样搬迁 |

---

### Task 1: Vite + React + TS 骨架，锁定单文件交付

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `legacy/index.legacy.html`（由当前 `index.html` 移动而来）
- Test: `tests/build.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces: 可运行的 `npm run dev` / `npm run build` / `npm run test`；`legacy/index.legacy.html` 供后续任务读取

- [ ] **Step 1: 冻结原始文件并初始化工程**

```bash
mkdir -p legacy src tests tools
git mv index.html legacy/index.legacy.html
npm init -y
npm i react react-dom
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest vite-plugin-singlefile tsx
```

- [ ] **Step 2: 写配置文件**

`vite.config.ts`：

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

`package.json` 的 `scripts` 段改为（并确保顶层有 `"type": "module"`）：

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "golden": "node tools/generate-golden.mjs",
    "golden:diff": "node tools/diff-golden.mjs"
  }
}
```

`.gitignore` 追加两行：

```
dist/
legacy/engine.legacy.mjs
```

- [ ] **Step 3: 写最小入口**

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>喵德尔 · 猫色溯源</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

`src/main.tsx`：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

`src/App.tsx`：

```tsx
export default function App() {
  return <div className="wrap">喵德尔</div>;
}
```

`src/styles.css`：**用命令抽取，不要手抄**——

```bash
sed -n '6,191p' legacy/index.legacy.html > src/styles.css
```

抽完确认首行是 `:root{` 那一段、末行不是 `</style>`。

- [ ] **Step 4: 写构建产物测试**

`tests/build.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

describe("单文件交付", () => {
  it("build 产出单个自包含的 index.html", () => {
    execSync("npm run build", { stdio: "pipe" });
    expect(existsSync("dist/index.html")).toBe(true);

    const files = readdirSync("dist", { recursive: true }) as string[];
    const assets = files.filter((f) => /\.(js|css)$/.test(f));
    expect(assets).toEqual([]);

    const html = readFileSync("dist/index.html", "utf8");
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
  }, 120000);
});
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test -- tests/build.test.ts`
Expected: PASS（1 passed）

若 `assets` 非空，说明 `viteSingleFile()` 没生效——检查它是否排在 `react()` 之后。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: 建立 Vite + React + TS 工程，锁定单文件交付

原 index.html 冻结为 legacy/index.legacy.html 作为行为参照。"
```

---

### Task 2: 抽取旧引擎并生成黄金快照

**Files:**
- Create: `tools/extract-legacy-engine.mjs`, `tools/generate-golden.mjs`
- Create: `tests/fixtures/golden.json`（由脚本生成后提交）

**Interfaces:**
- Consumes: `legacy/index.legacy.html`（Task 1 产出）
- Produces: `tests/fixtures/golden.json`，结构为
  `{ meta: {source, stateCount}, units: {crossAuto[], crossO[], coatName[], specOf[]}, states: GoldenState[] }`；
  `GoldenState = { raw, ui, target, parents, parentClaims, kidClaims, gallery, mates, selfSvg }`

- [ ] **Step 1: 写抽取脚本**

旧引擎包在 IIFE 里且不导出任何东西。抽取方式是机械的：去掉 IIFE 外壳、去掉唯一两处会在加载时碰 DOM 的语句（`document.addEventListener(...)` 与 `render();`），补上 export。

`tools/extract-legacy-engine.mjs`：

```js
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
```

- [ ] **Step 2: 运行抽取，确认能被 Node import**

```bash
node tools/extract-legacy-engine.mjs
node -e 'import("./legacy/engine.legacy.mjs").then(m=>console.log(Object.keys(m).length,"个导出;",m.coatName("black",false,true,0)))'
```

Expected: 打印 `24 个导出; 狸花猫`

若报 `document is not defined`，说明还有别的顶层 DOM 语句，检查 `cut` 位置。

- [ ] **Step 3: 写快照生成脚本**

UI 状态空间是 `3 × 2 × 2 × 5 × 2 × 3 = 360`，可以完整穷举。注意必须复现 `render()` 里的两条归一化，否则快照会记录不可达状态。

`tools/generate-golden.mjs`：

```js
import { writeFileSync, mkdirSync } from "node:fs";
import * as E from "../legacy/engine.legacy.mjs";

// 复现 legacy render() 开头的归一化
function normalize(ui) {
  const u = { ...ui };
  if (u.series === "tortie") u.sex = "F";
  if (u.series === "orange") u.tabby = true;
  return u;
}

function specFromUI(ui) {
  return {
    series: ui.series, dilute: ui.dilute,
    tabby: ui.series === "orange" ? true : ui.tabby,
    white: ui.white, long: ui.long,
  };
}

// 复现 renderParents 的画廊逻辑（含 slice 截断——1A 必须保留）
function gallery(res) {
  const out = {};
  for (const role of ["mother", "father"]) {
    const yes = [], no = [];
    E.CANON.forEach((c) => {
      (E.canonAsParent(c, role, res) ? yes : no).push(c.name);
    });
    out[role] = { yes, no, shownYes: yes.slice(0, 6), shownNo: no.slice(0, 5) };
  }
  return out;
}

const states = [];
for (const series of ["black", "orange", "tortie"])
for (const dilute of [false, true])
for (const tabby of [true, false])
for (let white = 0; white < 5; white++)
for (const long of [false, true])
for (const sex of ["M", "F", "?"]) {
  const raw = { series, dilute, tabby, white, long, sex };
  const ui = normalize(raw);
  const target = E.buildTarget(ui);
  const res = E.solveParents(target);
  const list = E.mateList(target);
  states.push({
    raw, ui, target,
    parents: res,
    parentClaims: E.parentClaims(ui, target, res),
    kidClaims: E.kidClaims(ui, target),
    gallery: gallery(res),
    mates: list.map((m) => ({ name: m.name, result: E.childrenWith(target, m) })),
    selfSvg: E.catSVG(specFromUI(ui), 7, 190),
  });
}

// 单函数级样本，供逐模块 TDD 使用
const units = { crossAuto: [], crossO: [], coatName: [], specOf: [] };
const ALL = ["DD","Dd","dd","AA","Aa","aa","SS","Ss","ss","LL","Ll","ll"];
for (const a of ALL) for (const b of ALL) {
  if (a[0].toLowerCase() !== b[0].toLowerCase()) continue;
  units.crossAuto.push({ args: [a, b], out: E.crossAuto(a, b) });
}
for (const fx of ["O", "o"]) for (const mg of ["OO", "Oo", "oo"]) {
  units.crossO.push({ args: [fx, mg], out: E.crossO(fx, mg) });
}
for (const series of ["black", "orange", "tortie"])
for (const dilute of [false, true])
for (const tabby of [true, false])
for (let white = 0; white < 5; white++) {
  units.coatName.push({ args: [series, dilute, tabby, white], out: E.coatName(series, dilute, tabby, white) });
}
for (const o of ["O", "o", "OO", "Oo", "oo"])
for (const d of ["DD", "Dd", "dd"])
for (const a of ["AA", "Aa", "aa"])
for (const s of ["SS", "Ss", "ss"])
for (let w = 0; w < 5; w++)
for (const l of [false, true]) {
  units.specOf.push({ args: [o, d, a, s, w, l], out: E.specOf(o, d, a, s, w, l) });
}

mkdirSync("tests/fixtures", { recursive: true });
writeFileSync(
  "tests/fixtures/golden.json",
  JSON.stringify({ meta: { source: "legacy/index.legacy.html", stateCount: states.length }, units, states })
);
console.log("已写出 golden.json：" + states.length + " 个状态");
```

- [ ] **Step 4: 生成并检查快照**

```bash
npm run golden
node -e 'const j=JSON.parse(require("fs").readFileSync("tests/fixtures/golden.json","utf8"));console.log("states",j.states.length,"|",Object.entries(j.units).map(([k,v])=>k+":"+v.length).join(" "));console.log("样本:",j.states.find(s=>s.raw.series==="orange"&&s.raw.sex==="M"&&s.raw.long).parentClaims[0].text.slice(0,30))'
```

Expected: `states 360`，`crossO:6 coatName:60 specOf:1350`，样本以「它妈妈身上一定带橘色」开头。

- [ ] **Step 5: 提交**

```bash
git add tools tests/fixtures/golden.json .gitignore
git commit -m "test: 录制旧引擎全状态黄金快照

360 种 UI 状态穷举 + 单函数级样本，作为 1A 行为保持的契约。"
```

---

### Task 3: 移植位点常量与单位点杂交

**Files:**
- Create: `src/genetics/loci.ts`, `src/genetics/punnett.ts`
- Test: `tests/genetics/punnett.test.ts`

**Interfaces:**
- Consumes: `golden.json` 的 `units.crossAuto` 与 `units.crossO`
- Produces:
  - `type AutoLocus = "d" | "a" | "s" | "l"`
  - `A_GENOS: Record<AutoLocus, string[]>`
  - `WHITE_S: Record<number, string[]>`、`WHITE_LABEL: string[]`、`WHITE_FRAC: number[]`
  - `norm(a: string, b: string): string`
  - `crossAuto(g1: string, g2: string): string[]`
  - `crossO(fx: string, mg: string): { M: string[]; F: string[] }`

- [ ] **Step 1: 先写失败的测试**

`tests/genetics/punnett.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { crossAuto, crossO } from "../../src/genetics/punnett";

const golden = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));

describe("crossAuto 与旧引擎逐字一致", () => {
  it.each(golden.units.crossAuto)("crossAuto($args)", ({ args, out }: any) => {
    // 顺序也是契约，用 toEqual 而非 toContain
    expect(crossAuto(args[0], args[1])).toEqual(out);
  });
});

describe("crossO 与旧引擎逐字一致", () => {
  it.each(golden.units.crossO)("crossO($args)", ({ args, out }: any) => {
    expect(crossO(args[0], args[1])).toEqual(out);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/genetics/punnett.test.ts`
Expected: FAIL，报 `Cannot find module '../../src/genetics/punnett'`

- [ ] **Step 3: 写实现**

`src/genetics/loci.ts`：

```ts
export type AutoLocus = "d" | "a" | "s" | "l";

export const A_GENOS: Record<AutoLocus, string[]> = {
  d: ["DD", "Dd", "dd"],
  a: ["AA", "Aa", "aa"],
  s: ["SS", "Ss", "ss"],
  l: ["LL", "Ll", "ll"],
};

export const WHITE_S: Record<number, string[]> = {
  0: ["ss"], 1: ["Ss"], 2: ["Ss", "SS"], 3: ["Ss", "SS"], 4: ["SS"],
};

export const WHITE_LABEL = ["无白", "零星白", "约一半", "大部分", "几乎全白"];
export const WHITE_FRAC = [0, 0.18, 0.48, 0.72, 0.92];
```

`src/genetics/punnett.ts`：

```ts
export function norm(a: string, b: string): string {
  if (a === b) return a + a;
  return a === a.toUpperCase() ? a + b : b + a;
}

// 循环顺序即输出顺序，是与旧引擎对齐的契约，不要"优化"
export function crossAuto(g1: string, g2: string): string[] {
  const seen: Record<string, 1> = {};
  const r: string[] = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const k = norm(g1[i], g2[j]);
      if (!seen[k]) { seen[k] = 1; r.push(k); }
    }
  }
  return r;
}

export function crossO(fx: string, mg: string): { M: string[]; F: string[] } {
  const mAll = mg[0] === mg[1] ? [mg[0]] : [mg[0], mg[1]];
  const seen: Record<string, 1> = {};
  const fr: string[] = [];
  for (let i = 0; i < mAll.length; i++) {
    const k = norm(fx, mAll[i]);
    if (!seen[k]) { seen[k] = 1; fr.push(k); }
  }
  return { M: mAll, F: fr };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/genetics/punnett.test.ts`
Expected: PASS（全部用例通过）

- [ ] **Step 5: 提交**

```bash
git add src/genetics/loci.ts src/genetics/punnett.ts tests/genetics/punnett.test.ts
git commit -m "refactor: 移植位点常量与单位点杂交为纯 TS 模块"
```

---

### Task 4: 移植表型与命名

**Files:**
- Create: `src/genetics/phenotype.ts`, `src/genetics/naming.ts`
- Test: `tests/genetics/naming.test.ts`

**Interfaces:**
- Consumes: `units.coatName`、`units.specOf`
- Produces:
  - `type Series = "orange" | "tortie" | "black"`
  - `interface CoatSpec { series: Series; dilute: boolean; tabby: boolean; white: number; long: boolean }`
  - `seriesOf(o: string): Series`
  - `specOf(o: string, d: string, a: string, s: string, white: number, long: boolean): CoatSpec`
  - `baseName(series: Series, dilute: boolean, tabby: boolean): string`
  - `coatName(series: Series, dilute: boolean, tabby: boolean, white: number): string`

- [ ] **Step 1: 先写失败的测试**

`tests/genetics/naming.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { coatName } from "../../src/genetics/naming";
import { specOf } from "../../src/genetics/phenotype";

const golden = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));

describe("coatName 与旧引擎逐字一致", () => {
  it.each(golden.units.coatName)("coatName($args) -> $out", ({ args, out }: any) => {
    expect(coatName(args[0], args[1], args[2], args[3])).toBe(out);
  });
});

describe("specOf 与旧引擎逐字一致", () => {
  it.each(golden.units.specOf)("specOf($args)", ({ args, out }: any) => {
    expect(specOf(args[0], args[1], args[2], args[3], args[4], args[5])).toEqual(out);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/genetics/naming.test.ts`
Expected: FAIL，报模块找不到

- [ ] **Step 3: 写实现**

`src/genetics/phenotype.ts`：

```ts
export type Series = "orange" | "tortie" | "black";

export interface CoatSpec {
  series: Series;
  dilute: boolean;
  tabby: boolean;
  white: number;
  long: boolean;
}

export function seriesOf(o: string): Series {
  if (o === "O" || o === "OO") return "orange";
  return o === "Oo" ? "tortie" : "black";
}

export function specOf(
  o: string, d: string, a: string, s: string, white: number, long: boolean
): CoatSpec {
  const series = seriesOf(o);
  return {
    series,
    dilute: d === "dd",
    // 橘色系没有"纯色"可言，红色素关不掉
    tabby: series === "orange" ? true : a !== "aa",
    white,
    long: !!long,
  };
}
```

`src/genetics/naming.ts`：

```ts
import type { Series } from "./phenotype";

export function baseName(series: Series, dilute: boolean, tabby: boolean): string {
  if (series === "orange") return dilute ? "奶油" : "橘";
  if (series === "black") {
    if (tabby) return dilute ? "蓝虎斑" : "狸花";
    return dilute ? "蓝" : "黑";
  }
  if (tabby) return dilute ? "淡玳瑁虎斑" : "玳瑁虎斑";
  return dilute ? "淡玳瑁" : "玳瑁";
}

export function coatName(
  series: Series, dilute: boolean, tabby: boolean, white: number
): string {
  const b = baseName(series, dilute, tabby);
  if (series === "tortie") return white >= 2 ? (dilute ? "淡三花猫" : "三花猫") : b + "猫";
  if (white <= 1) return b + "猫";
  if (white === 4) return "高白" + b + "猫";
  if (series === "black" && !dilute && !tabby) return "奶牛猫";
  return b + "白猫";
}
```

注意 `naming.ts` 只 `import type`，运行时不依赖任何模块——这是 spec 第 5 节要求的边界。

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/genetics/naming.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/genetics/phenotype.ts src/genetics/naming.ts tests/genetics/naming.test.ts
git commit -m "refactor: 移植表型结构与中文花色命名"
```

---

### Task 5: 移植花色目录与求解器

**Files:**
- Create: `src/genetics/catalog.ts`, `src/genetics/solve.ts`
- Test: `tests/genetics/solve.test.ts`

**Interfaces:**
- Consumes: `A_GENOS` / `WHITE_S` / `crossAuto` / `crossO`（Task 3）、`CoatSpec` / `Series`（Task 4）
- Produces:
  - `interface CanonEntry { name: string; series: Series; d: string[]; a: string[] | null; white: number }`
  - `CANON: CanonEntry[]`、`canonSpec(c: CanonEntry): CoatSpec`、`oForSeries(series: Series, sex: "M" | "F"): string | null`
  - `type Sex = "M" | "F"`、`type SexInput = Sex | "?"`、`type GenoSet = Record<string, 1>`
  - `interface UiState { series; dilute; tabby; white; long; sex: SexInput }`
  - `interface Target { sexes: Sex[]; o: { M: GenoSet; F: GenoSet }; d: GenoSet; a: GenoSet; s: GenoSet; l: GenoSet }`
  - `interface ParentSolution { pairs: Record<string, [string,string][]>; f: Record<string, GenoSet>; m: Record<string, GenoSet> }`
  - `buildTarget(ui: UiState): Target`、`solveParents(t: Target): ParentSolution`
  - `hasPair(pairs: [string,string][], a: string, b: string): boolean`
  - `canonAsParent(c: CanonEntry, role: "father" | "mother", res: ParentSolution): boolean`

- [ ] **Step 1: 先写失败的测试**

`tests/genetics/solve.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { CANON } from "../../src/genetics/catalog";

const golden = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));
const cases = golden.states.map((s: any, i: number) => ({ i, s }));

describe("buildTarget / solveParents 与旧引擎逐字一致", () => {
  it.each(cases)("state #$i", ({ s }: any) => {
    const t = buildTarget(s.ui);
    expect(JSON.parse(JSON.stringify(t))).toEqual(s.target);
    expect(JSON.parse(JSON.stringify(solveParents(t)))).toEqual(s.parents);
  });
});

describe("canonAsParent 画廊判定与旧引擎一致（比对未截断的完整集合）", () => {
  it.each(cases)("state #$i", ({ s }: any) => {
    const res = solveParents(buildTarget(s.ui));
    for (const role of ["mother", "father"] as const) {
      const yes = CANON.filter((c) => canonAsParent(c, role, res)).map((c) => c.name);
      const no = CANON.filter((c) => !canonAsParent(c, role, res)).map((c) => c.name);
      expect(yes).toEqual(s.gallery[role].yes);
      expect(no).toEqual(s.gallery[role].no);
    }
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/genetics/solve.test.ts`
Expected: FAIL，报模块找不到

- [ ] **Step 3: 写 catalog.ts**

```ts
import type { Series, CoatSpec } from "./phenotype";

export interface CanonEntry {
  name: string;
  series: Series;
  d: string[];
  a: string[] | null;   // null 表示该花色对 A 位点无约束（橘色系）
  white: number;
}

export const CANON: CanonEntry[] = [
  { name: "黑猫",     series: "black",  d: ["DD","Dd"], a: ["aa"],      white: 0 },
  { name: "狸花猫",   series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], white: 0 },
  { name: "蓝猫",     series: "black",  d: ["dd"],      a: ["aa"],      white: 0 },
  { name: "蓝虎斑猫", series: "black",  d: ["dd"],      a: ["AA","Aa"], white: 0 },
  { name: "橘猫",     series: "orange", d: ["DD","Dd"], a: null,        white: 0 },
  { name: "奶油猫",   series: "orange", d: ["dd"],      a: null,        white: 0 },
  { name: "玳瑁猫",   series: "tortie", d: ["DD","Dd"], a: ["aa"],      white: 0 },
  { name: "三花猫",   series: "tortie", d: ["DD","Dd"], a: ["aa"],      white: 2 },
  { name: "奶牛猫",   series: "black",  d: ["DD","Dd"], a: ["aa"],      white: 2 },
  { name: "蓝白猫",   series: "black",  d: ["dd"],      a: ["aa"],      white: 2 },
  { name: "橘白猫",   series: "orange", d: ["DD","Dd"], a: null,        white: 2 },
  { name: "狸花白猫", series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], white: 2 },
];

export function canonSpec(c: CanonEntry): CoatSpec {
  return {
    series: c.series,
    dilute: c.d[0] === "dd",
    tabby: c.a ? c.a[0] !== "aa" : true,
    white: c.white,
    long: false,   // 1A 保持原样；1B Task 11 修
  };
}

export function oForSeries(series: Series, sex: "M" | "F"): string | null {
  if (sex === "M") return series === "orange" ? "O" : series === "black" ? "o" : null;
  return series === "orange" ? "OO" : series === "black" ? "oo" : "Oo";
}
```

- [ ] **Step 4: 写 solve.ts**

```ts
import { A_GENOS, WHITE_S, type AutoLocus } from "./loci";
import { crossAuto, crossO } from "./punnett";
import { oForSeries, type CanonEntry } from "./catalog";
import type { Series } from "./phenotype";

export type Sex = "M" | "F";
export type SexInput = Sex | "?";
export type GenoSet = Record<string, 1>;

export interface UiState {
  series: Series; dilute: boolean; tabby: boolean;
  white: number; long: boolean; sex: SexInput;
}

export interface Target {
  sexes: Sex[];
  o: { M: GenoSet; F: GenoSet };
  d: GenoSet; a: GenoSet; s: GenoSet; l: GenoSet;
}

export interface ParentSolution {
  pairs: Record<string, [string, string][]>;
  f: Record<string, GenoSet>;
  m: Record<string, GenoSet>;
}

export function buildTarget(ui: UiState): Target {
  const t: Target = { sexes: [], o: { M: {}, F: {} }, d: {}, a: {}, s: {}, l: {} };
  const sexes: Sex[] =
    ui.series === "tortie" ? ["F"] : ui.sex === "?" ? ["M", "F"] : [ui.sex as Sex];
  t.sexes = sexes;
  for (const sx of sexes) {
    const g = oForSeries(ui.series, sx);
    if (g) t.o[sx][g] = 1;
  }
  (ui.dilute ? ["dd"] : ["DD", "Dd"]).forEach((x) => { t.d[x] = 1; });
  (ui.series === "orange" ? A_GENOS.a : ui.tabby ? ["AA", "Aa"] : ["aa"])
    .forEach((x) => { t.a[x] = 1; });
  WHITE_S[ui.white].forEach((x) => { t.s[x] = 1; });
  (ui.long ? ["ll"] : ["LL", "Ll"]).forEach((x) => { t.l[x] = 1; });
  return t;
}

// 位点独立 + 目标是乘积集 ⇒ 父母配对的合法性可逐位点分解，与穷举 39,366 组等价
export function solveParents(t: Target): ParentSolution {
  const res: ParentSolution = { pairs: {}, f: {}, m: {} };
  const L: AutoLocus[] = ["d", "a", "s", "l"];
  for (const loc of L) {
    const list = A_GENOS[loc];
    const pairs: [string, string][] = [];
    const fs: GenoSet = {}, ms: GenoSet = {};
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const kids = crossAuto(list[i], list[j]);
        let ok = false;
        for (const k of kids) if (t[loc][k]) { ok = true; break; }
        if (ok) { pairs.push([list[i], list[j]]); fs[list[i]] = 1; ms[list[j]] = 1; }
      }
    }
    res.pairs[loc] = pairs; res.f[loc] = fs; res.m[loc] = ms;
  }
  const oPairs: [string, string][] = [];
  const fo: GenoSet = {}, mo: GenoSet = {};
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      const fx = (["O", "o"] as const)[i];
      const mg = (["OO", "Oo", "oo"] as const)[j];
      const kid = crossO(fx, mg);
      let ok = false;
      for (const sx of t.sexes) {
        const cand = sx === "M" ? kid.M : kid.F;
        for (const c of cand) if (t.o[sx][c]) { ok = true; break; }
        if (ok) break;
      }
      if (ok) { oPairs.push([fx, mg]); fo[fx] = 1; mo[mg] = 1; }
    }
  }
  res.pairs.o = oPairs; res.f.o = fo; res.m.o = mo;
  return res;
}

export function hasPair(pairs: [string, string][], a: string, b: string): boolean {
  return pairs.some(([x, y]) => x === a && y === b);
}

function inter(setObj: GenoSet, list: string[]): boolean {
  return list.some((x) => !!setObj[x]);
}

export function canonAsParent(
  c: CanonEntry, role: "father" | "mother", res: ParentSolution
): boolean {
  const sex: Sex = role === "father" ? "M" : "F";
  const o = oForSeries(c.series, sex);
  if (!o || !(role === "father" ? res.f.o : res.m.o)[o]) return false;
  const side = role === "father" ? res.f : res.m;
  if (!inter(side.d, c.d)) return false;
  if (!inter(side.a, c.a || A_GENOS.a)) return false;
  if (!inter(side.s, WHITE_S[c.white])) return false;
  // 注意：这里故意不检查 l 位点——这是已知缺陷，1B Task 11 修
  return true;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npm run test -- tests/genetics/solve.test.ts`
Expected: PASS（720 个用例通过）

若 `pairs` 顺序对不上，检查双层 `for` 的 `i`/`j` 是否写反——`i` 是父本、`j` 是母本。

- [ ] **Step 6: 提交**

```bash
git add src/genetics/catalog.ts src/genetics/solve.ts tests/genetics/solve.test.ts
git commit -m "refactor: 移植花色目录与亲代求解器"
```

---

### Task 6: 移植断言生成

**Files:**
- Create: `src/genetics/claims.ts`
- Test: `tests/genetics/claims.test.ts`

**Interfaces:**
- Consumes: `UiState` / `Target` / `ParentSolution` / `hasPair`（Task 5）
- Produces:
  - `type ClaimLevel = "certain" | "maybe"`
  - `interface Claim { level: ClaimLevel; text: string; why: string }`
  - `parentClaims(ui: UiState, t: Target, res: ParentSolution): Claim[]`
  - `kidClaims(ui: UiState, t: Target): Claim[]`

- [ ] **Step 1: 先写失败的测试**

`tests/genetics/claims.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget, solveParents } from "../../src/genetics/solve";
import { parentClaims, kidClaims } from "../../src/genetics/claims";

const golden = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));

describe("断言与旧引擎逐字一致", () => {
  it.each(golden.states.map((s: any, i: number) => ({ i, s })))(
    "state #$i", ({ s }: any) => {
      const t = buildTarget(s.ui);
      const res = solveParents(t);
      expect(parentClaims(s.ui, t, res)).toEqual(s.parentClaims);
      expect(kidClaims(s.ui, t)).toEqual(s.kidClaims);
    }
  );
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/genetics/claims.test.ts`
Expected: FAIL，报模块找不到

- [ ] **Step 3: 写实现**

`src/genetics/claims.ts`。**文案一个字都不能改。** 先把原文打到终端上，逐句对照着搬，不要凭记忆重写：

```bash
sed -n '452,535p' legacy/index.legacy.html
```

骨架与首个分支如下，其余分支从上面的输出里逐字复制：

```ts
import { hasPair, type ParentSolution, type Target, type UiState } from "./solve";

export type ClaimLevel = "certain" | "maybe";
export interface Claim { level: ClaimLevel; text: string; why: string }

function C(level: ClaimLevel, text: string, why?: string): Claim {
  return { level, text, why: why || "" };
}

export function parentClaims(ui: UiState, t: Target, res: ParentSolution): Claim[] {
  const out: Claim[] = [];
  const branches = t.sexes.map((sx) => ({ sex: sx, o: Object.keys(t.o[sx])[0] }));
  const multi = branches.length > 1;

  for (const br of branches) {
    const pre = multi ? (br.sex === "M" ? "如果它是公猫，" : "如果它是母猫，") : "";
    const { o, sex: sx } = br;
    let txt = "", why = "";
    if (sx === "M" && o === "O") {
      txt = pre + "<em>它妈妈身上一定带橘色</em>——只可能是橘猫、奶油猫、玳瑁或三花。而<em>它爸爸的花色完全不受限制</em>，什么色都行。";
      why = "橘色基因长在 X 染色体上。公猫只有一条 X，只能来自妈妈；爸爸给的是 Y，不携带任何毛色信息。";
    }
    // 其余四个分支（M/o、F/OO、F/Oo、F/oo）从 legacy 第 466–478 行逐字搬
    if (txt) out.push(C("certain", txt, why));
  }

  if (!res.f.d["DD"] && !res.m.d["DD"])
    out.push(C("certain",
      "<em>爸妈双方都携带稀释基因</em>——哪怕它们自己看上去是浓色的黑猫或橘猫。",
      "稀释是隐性的：只有从双方各拿到一份 d，颜色才会从黑变蓝、从橘变奶油。"));
  // 其余条件断言（L、A、白斑、浓淡、毛长）从 legacy 第 483–501 行逐字搬
  return out;
}

export function kidClaims(ui: UiState, t: Target): Claim[] {
  // 从 legacy 第 505–535 行逐字搬
  const out: Claim[] = [];
  return out;
}
```

移植时的两个陷阱：

1. `parentClaims` 里各条件断言的**判断顺序决定输出数组顺序**，不要重排。
2. `kidClaims` 最后那条 `!ui.tabby` 分支在 `ui.series === "orange"` 时被排除，保留这个短路。

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/genetics/claims.test.ts`
Expected: PASS（360 个状态全绿）

任何一个状态失败都说明文案或顺序搬错了——用 `expect` 的 diff 定位到具体是哪一句。

- [ ] **Step 5: 提交**

```bash
git add src/genetics/claims.ts tests/genetics/claims.test.ts
git commit -m "refactor: 移植断言生成，文案与顺序逐字保持"
```

---

### Task 7: 移植后代推演

**Files:**
- Create: `src/genetics/children.ts`, `src/genetics/index.ts`
- Test: `tests/genetics/children.test.ts`

**Interfaces:**
- Consumes: `Target` / `GenoSet`（Task 5）、`CANON` / `oForSeries`（Task 5）、`crossAuto` / `crossO`（Task 3）、`specOf` / `coatName`（Task 4）
- Produces:
  - `type MateEntry = CanonEntry`、`MATES: MateEntry[]`
  - `mateList(t: Target): MateEntry[]`
  - `unionCross(setA: GenoSet, listB: string[]): GenoSet`
  - `interface ChildrenResult { names: string[]; specs: Record<string, CoatSpec>; longPossible: boolean; nope: string[] }`
  - `childrenWith(t: Target, mate: MateEntry): ChildrenResult | null`
  - `src/genetics/index.ts` 重新导出以上全部公开 API

- [ ] **Step 1: 先写失败的测试**

`tests/genetics/children.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget } from "../../src/genetics/solve";
import { mateList, childrenWith } from "../../src/genetics/children";

const golden = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));

describe("后代推演与旧引擎逐字一致", () => {
  it.each(golden.states.map((s: any, i: number) => ({ i, s })))(
    "state #$i", ({ s }: any) => {
      const t = buildTarget(s.ui);
      const list = mateList(t);
      expect(list.map((m) => m.name)).toEqual(s.mates.map((x: any) => x.name));
      list.forEach((m, k) => {
        expect(childrenWith(t, m)).toEqual(s.mates[k].result);
      });
    }
  );
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/genetics/children.test.ts`
Expected: FAIL，报模块找不到

- [ ] **Step 3: 写实现**

`src/genetics/children.ts`：

```ts
import { A_GENOS, WHITE_S } from "./loci";
import { crossAuto, crossO } from "./punnett";
import { CANON, oForSeries, type CanonEntry } from "./catalog";
import { specOf, type CoatSpec } from "./phenotype";
import { coatName } from "./naming";
import type { GenoSet, Target } from "./solve";

export type MateEntry = CanonEntry;

export const MATES: MateEntry[] = [
  { name: "黑猫",   series: "black",  d: ["DD","Dd"], a: ["aa"],      white: 0 },
  { name: "狸花猫", series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], white: 0 },
  { name: "橘猫",   series: "orange", d: ["DD","Dd"], a: null,        white: 0 },
  { name: "三花猫", series: "tortie", d: ["DD","Dd"], a: ["aa"],      white: 2 },
  { name: "奶牛猫", series: "black",  d: ["DD","Dd"], a: ["aa"],      white: 2 },
];

export function mateList(t: Target): MateEntry[] {
  // 猫是公 → 配偶是母 → 三花可行；否则用奶牛替换
  const canF = t.sexes.indexOf("M") >= 0;
  return canF
    ? [MATES[0], MATES[1], MATES[2], MATES[3]]
    : [MATES[0], MATES[1], MATES[2], MATES[4]];
}

export function unionCross(setA: GenoSet, listB: string[]): GenoSet {
  const out: GenoSet = {};
  for (const a of Object.keys(setA)) {
    for (const b of listB) {
      for (const k of crossAuto(a, b)) out[k] = 1;
    }
  }
  return out;
}

export interface ChildrenResult {
  names: string[];
  specs: Record<string, CoatSpec>;
  longPossible: boolean;
  nope: string[];
}

export function childrenWith(t: Target, mate: MateEntry): ChildrenResult | null {
  const kidO: { M: GenoSet; F: GenoSet } = { M: {}, F: {} };
  for (const catSex of t.sexes) {
    const mateSex = catSex === "M" ? "F" : "M";
    const mateO = oForSeries(mate.series, mateSex);
    if (!mateO) continue;
    for (const co of Object.keys(t.o[catSex])) {
      const fx = catSex === "M" ? co : mateO;
      const mg = catSex === "M" ? mateO : co;
      const r = crossO(fx, mg);
      for (const x of r.M) kidO.M[x] = 1;
      for (const x of r.F) kidO.F[x] = 1;
    }
  }
  if (!Object.keys(kidO.M).length && !Object.keys(kidO.F).length) return null;

  const kd = unionCross(t.d, mate.d);
  const ka = unionCross(t.a, mate.a || A_GENOS.a);
  const ks = unionCross(t.s, WHITE_S[mate.white]);
  // 配偶的 L 写死为短毛——这是已知缺陷，1B Task 12 修
  const kl = unionCross(t.l, ["LL", "Ll"]);

  const specs: Record<string, CoatSpec> = {};
  const names: string[] = [];
  const SW: Record<string, number> = { ss: 0, Ss: 2, SS: 3 };

  for (const sx of ["M", "F"] as const) {
    for (const o of Object.keys(kidO[sx])) {
      for (const d of Object.keys(kd)) {
        for (const a of Object.keys(ka)) {
          for (const s of Object.keys(ks)) {
            const sp = specOf(o, d, a, s, SW[s], false);
            const n = coatName(sp.series, sp.dilute, sp.tabby, sp.white);
            if (!specs[n]) { specs[n] = sp; names.push(n); }
          }
        }
      }
    }
  }

  const nope = CANON.filter((c) => !specs[c.name]).map((c) => c.name);
  return { names, specs, longPossible: !!kl["ll"], nope };
}
```

`src/genetics/index.ts`：

```ts
export * from "./loci";
export * from "./punnett";
export * from "./phenotype";
export * from "./naming";
export * from "./catalog";
export * from "./solve";
export * from "./claims";
export * from "./children";
```

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/genetics/children.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/genetics/children.ts src/genetics/index.ts tests/genetics/children.test.ts
git commit -m "refactor: 移植后代推演并汇总引擎公开 API"
```

---

### Task 8: 移植 SVG 渲染器

**Files:**
- Create: `src/render/catSVG.ts`
- Test: `tests/render/catSVG.test.ts`

**Interfaces:**
- Consumes: `CoatSpec`（Task 4）
- Produces: `mulberry(seed: number): () => number`、`catSVG(spec: CoatSpec, seed: number, size: number): string`、`COAT` 色板常量

- [ ] **Step 1: 先写失败的测试**

`tests/render/catSVG.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { catSVG } from "../../src/render/catSVG";

const golden = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));

describe("catSVG 输出与旧引擎逐字一致", () => {
  it.each(golden.states.map((s: any, i: number) => ({ i, s })))(
    "state #$i", ({ s }: any) => {
      const spec = {
        series: s.ui.series, dilute: s.ui.dilute,
        tabby: s.ui.series === "orange" ? true : s.ui.tabby,
        white: s.ui.white, long: s.ui.long,
      };
      expect(catSVG(spec, 7, 190)).toBe(s.selfSvg);
    }
  );
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/render/catSVG.test.ts`
Expected: FAIL，报模块找不到

- [ ] **Step 3: 写实现**

先把原文打到终端上：

```bash
sed -n '295,375p' legacy/index.legacy.html
```

把这段（`COAT` 常量、`mulberry`、`shapes`、`waveTop`、`catSVG`）原样搬进 `src/render/catSVG.ts`，只加类型标注、只把 `function` 改成 `export function`。

**不要改任何数字、任何路径字符串、任何拼接顺序。** `mulberry` 是确定性伪随机源，任何调用次数或顺序的改变都会让 SVG 输出漂移。

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/render/catSVG.test.ts`
Expected: PASS（360 个状态全绿）

若整批失败且 diff 只差浮点尾数，说明 `mulberry` 的位运算被改写过——检查 `>>>` 与 `Math.imul` 是否原样保留。

- [ ] **Step 5: 提交**

```bash
git add src/render/catSVG.ts tests/render/catSVG.test.ts
git commit -m "refactor: 移植 SVG 画猫渲染器，输出逐字保持"
```

---

### Task 9: 移植 React UI，端到端行为对齐

**Files:**
- Create: `src/ui/types.ts`, `src/ui/QuickPicks.tsx`, `src/ui/Controls.tsx`, `src/ui/SelfPanel.tsx`, `src/ui/ParentsPanel.tsx`, `src/ui/KidsPanel.tsx`
- Modify: `src/App.tsx`
- Test: `tests/ui/normalize.test.ts`

**Interfaces:**
- Consumes: `src/genetics` 全部公开 API、`catSVG`（Task 8）
- Produces: `normalizeUi(ui: UiState): UiState`、`QUICK: { label: string; ui: UiState }[]`、各面板组件

- [ ] **Step 1: 先写失败的测试**

`tests/ui/normalize.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { normalizeUi } from "../../src/ui/types";
import type { UiState } from "../../src/genetics";

describe("UI 归一化复现 legacy render() 的两条规则", () => {
  it("玳瑁强制为母猫", () => {
    const r = normalizeUi({ series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "M" });
    expect(r.sex).toBe("F");
  });
  it("橘色强制带虎斑纹", () => {
    const r = normalizeUi({ series: "orange", dilute: false, tabby: false, white: 0, long: false, sex: "M" });
    expect(r.tabby).toBe(true);
  });
  it("其余情况原样返回", () => {
    const ui: UiState = { series: "black", dilute: true, tabby: false, white: 3, long: true, sex: "?" };
    expect(normalizeUi({ ...ui })).toEqual(ui);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/ui/normalize.test.ts`
Expected: FAIL，报模块找不到

- [ ] **Step 3: 写 `src/ui/types.ts`**

```ts
import type { UiState } from "../genetics";
export type { UiState };

export function normalizeUi(ui: UiState): UiState {
  const u = { ...ui };
  if (u.series === "tortie") u.sex = "F";
  if (u.series === "orange") u.tabby = true;
  return u;
}

export const QUICK: { label: string; ui: UiState }[] = [
  { label: "狸花",   ui: { series: "black",  dilute: false, tabby: true,  white: 0, long: false, sex: "?" } },
  { label: "黑猫",   ui: { series: "black",  dilute: false, tabby: false, white: 0, long: false, sex: "?" } },
  { label: "橘猫",   ui: { series: "orange", dilute: false, tabby: true,  white: 0, long: false, sex: "?" } },
  { label: "长毛橘", ui: { series: "orange", dilute: false, tabby: true,  white: 0, long: true,  sex: "M" } },
  { label: "奶牛",   ui: { series: "black",  dilute: false, tabby: false, white: 2, long: false, sex: "?" } },
  { label: "三花",   ui: { series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "F" } },
  { label: "玳瑁",   ui: { series: "tortie", dilute: false, tabby: false, white: 0, long: false, sex: "F" } },
  { label: "蓝猫",   ui: { series: "black",  dilute: true,  tabby: false, white: 0, long: false, sex: "?" } },
  { label: "蓝白",   ui: { series: "black",  dilute: true,  tabby: false, white: 2, long: false, sex: "?" } },
  { label: "橘白",   ui: { series: "orange", dilute: false, tabby: true,  white: 2, long: false, sex: "?" } },
  { label: "奶油",   ui: { series: "orange", dilute: true,  tabby: true,  white: 0, long: false, sex: "?" } },
  { label: "狸花白", ui: { series: "black",  dilute: false, tabby: true,  white: 2, long: false, sex: "?" } },
];
```

- [ ] **Step 4: 运行确认归一化测试通过**

Run: `npm run test -- tests/ui/normalize.test.ts`
Expected: PASS（3 passed）

- [ ] **Step 5: 写各面板组件**

把 legacy 第 614–755 行的每个 `renderXxx` 改写为一个 React 组件：`renderPicks`→`QuickPicks`、`renderControls`→`Controls`、`renderSelf`→`SelfPanel`、`renderParents`→`ParentsPanel`、`renderKids`→`KidsPanel`。

改写规则：

- 保留全部 `className`，CSS 一个字节都没改，类名对不上就没样式
- 原本 `innerHTML` 拼接的 HTML 改为 JSX；**唯独 `catSVG()` 的返回值**用 `dangerouslySetInnerHTML={{ __html: svg }}` 注入——它是我们自己生成的字符串，没有外部输入
- 断言文案里含 `<em>` 标签，同样用 `dangerouslySetInnerHTML`
- 原本 `esc()` 的地方直接删掉，JSX 默认转义
- `seed` 与 `mateIdx` 提升为 `App` 的 `useState`；点快捷卡时 `seed => (seed * 7 + 13) % 9973`，与 legacy 一致

`src/App.tsx`：

```tsx
import { useState } from "react";
import { buildTarget, solveParents, type UiState } from "./genetics";
import { normalizeUi } from "./ui/types";
import QuickPicks from "./ui/QuickPicks";
import Controls from "./ui/Controls";
import SelfPanel from "./ui/SelfPanel";
import ParentsPanel from "./ui/ParentsPanel";
import KidsPanel from "./ui/KidsPanel";

const INITIAL: UiState = {
  series: "orange", dilute: false, tabby: true, white: 0, long: true, sex: "M",
};

export default function App() {
  const [raw, setRaw] = useState<UiState>(INITIAL);
  const [seed, setSeed] = useState(7);
  const [mateIdx, setMateIdx] = useState(0);

  const ui = normalizeUi(raw);
  const target = buildTarget(ui);
  const res = solveParents(target);

  return (
    <div className="wrap">
      {/* header 与 footer 从 legacy 第 194–241 行搬为 JSX（用
          `sed -n '194,241p' legacy/index.legacy.html` 打出原文对照）：
          h1 是「喵德尔」，tagline 以「猫色溯源实验室。」开头，
          class= 一律改成 className=，<br> 改成 <br /> */}
      <main className="lab">
        <aside className="console">
          <p className="eyebrow">常见花色</p>
          <QuickPicks ui={ui} onPick={(next) => { setRaw(next); setSeed((s) => (s * 7 + 13) % 9973); }} />
          <p className="eyebrow">逐项描述</p>
          <Controls ui={ui} onChange={setRaw} />
        </aside>
        <div className="dossier">
          <SelfPanel ui={ui} seed={seed} />
          <ParentsPanel ui={ui} target={target} res={res} />
          <KidsPanel ui={ui} target={target} mateIdx={mateIdx} onMate={setMateIdx} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: 人工对照新旧页面**

```bash
npm run dev
```

同时用浏览器打开 `legacy/index.legacy.html`，逐项对照下列 6 个状态，确认**视觉与文字完全一致**：

| # | 状态 | 重点看 |
|---|---|---|
| 1 | 默认（长毛橘公猫·无白） | 三个面板全部内容 |
| 2 | 点「三花」 | 性别锁定为母 + 那段说明文字 |
| 3 | 点「橘猫」 | 虎斑项被禁用 + 那段说明文字 |
| 4 | 白斑滑到「几乎全白」 | 五级滑块高度与标签 |
| 5 | 切到「蓝猫」 | 爸妈画廊灰掉哪几只 |
| 6 | 下一代面板切四个配偶 | 每个配偶的孩子花色列表与「不会出现」行 |

任何一处不一致都必须修到一致再往下走——**1A 的验收标准就是「看不出区别」**。

- [ ] **Step 7: 全量测试 + 构建**

Run: `npm run test && npm run build`
Expected: 全部 PASS，且 `dist/index.html` 仍是单文件

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "refactor: UI 迁移到 React 组件，行为与视觉保持不变

阶段 1A 完成：引擎已抽为零 DOM 依赖的纯模块，
360 种状态的输出与旧引擎逐字一致。"
```

---

### Task 10: 快照源切到新引擎（1A 验收证明）+ 差异审阅工具

**这一步既是 1A 的收尾证明，也是 1B 工作流的前提。**

快照此前由 **legacy 引擎**生成。1B 一旦开始改行为，legacy 就不能再当基准了——继续跑 `npm run golden` 会把快照倒回旧行为，Task 5 / 6 / 7 / 8 的特征化测试立刻全崩。

所以在这里把快照源换成**新引擎**。换源那一刻 `golden.json` 应当**逐字节不变**——这正是 1A「行为完全保持」最硬的证明。

**Files:**
- Create: `tools/generate-golden.ts`, `tools/diff-golden.mjs`
- Delete: `tools/generate-golden.mjs`
- Modify: `package.json`（`golden` 脚本改用 tsx）

**Interfaces:**
- Consumes: `src/genetics`（Task 3–7）、`catSVG`（Task 8）、`normalizeUi`（Task 9）
- Produces: `npm run golden` 改由新引擎生成；`npm run golden:diff` 打印**按字段归类**的差异摘要

- [ ] **Step 1: 写新引擎版生成器**

`tools/generate-golden.ts`——与 `generate-golden.mjs` 逻辑完全相同，只把数据源从 legacy 换成 `src/`：

```ts
import { writeFileSync, mkdirSync } from "node:fs";
import {
  buildTarget, solveParents, parentClaims, kidClaims,
  mateList, childrenWith, canonAsParent, CANON,
  crossAuto, crossO, coatName, specOf,
  type ParentSolution, type UiState, type Series,
} from "../src/genetics";
import { catSVG } from "../src/render/catSVG";
import { normalizeUi } from "../src/ui/types";

function specFromUI(ui: UiState) {
  return {
    series: ui.series, dilute: ui.dilute,
    tabby: ui.series === "orange" ? true : ui.tabby,
    white: ui.white, long: ui.long,
  };
}

// 与 legacy renderParents 一致，含 slice 截断（Task 13 会去掉）
function gallery(res: ParentSolution) {
  const out: any = {};
  for (const role of ["mother", "father"] as const) {
    const yes: string[] = [], no: string[] = [];
    CANON.forEach((c) => {
      (canonAsParent(c, role, res) ? yes : no).push(c.name);
    });
    out[role] = { yes, no, shownYes: yes.slice(0, 6), shownNo: no.slice(0, 5) };
  }
  return out;
}

const states: any[] = [];
for (const series of ["black", "orange", "tortie"] as Series[])
for (const dilute of [false, true])
for (const tabby of [true, false])
for (let white = 0; white < 5; white++)
for (const long of [false, true])
for (const sex of ["M", "F", "?"] as const) {
  const raw: UiState = { series, dilute, tabby, white, long, sex };
  const ui = normalizeUi(raw);
  const target = buildTarget(ui);
  const res = solveParents(target);
  const list = mateList(target);
  states.push({
    raw, ui, target,
    parents: res,
    parentClaims: parentClaims(ui, target, res),
    kidClaims: kidClaims(ui, target),
    gallery: gallery(res),
    mates: list.map((m) => ({ name: m.name, result: childrenWith(target, m) })),
    selfSvg: catSVG(specFromUI(ui), 7, 190),
  });
}

const units: any = { crossAuto: [], crossO: [], coatName: [], specOf: [] };
const ALL = ["DD","Dd","dd","AA","Aa","aa","SS","Ss","ss","LL","Ll","ll"];
for (const a of ALL) for (const b of ALL) {
  if (a[0].toLowerCase() !== b[0].toLowerCase()) continue;
  units.crossAuto.push({ args: [a, b], out: crossAuto(a, b) });
}
for (const fx of ["O", "o"]) for (const mg of ["OO", "Oo", "oo"]) {
  units.crossO.push({ args: [fx, mg], out: crossO(fx, mg) });
}
for (const series of ["black", "orange", "tortie"] as Series[])
for (const dilute of [false, true])
for (const tabby of [true, false])
for (let white = 0; white < 5; white++) {
  units.coatName.push({ args: [series, dilute, tabby, white], out: coatName(series, dilute, tabby, white) });
}
for (const o of ["O", "o", "OO", "Oo", "oo"])
for (const d of ["DD", "Dd", "dd"])
for (const a of ["AA", "Aa", "aa"])
for (const s of ["SS", "Ss", "ss"])
for (let w = 0; w < 5; w++)
for (const l of [false, true]) {
  units.specOf.push({ args: [o, d, a, s, w, l], out: specOf(o, d, a, s, w, l) });
}

mkdirSync("tests/fixtures", { recursive: true });
writeFileSync(
  "tests/fixtures/golden.json",
  JSON.stringify({ meta: { source: "src/genetics", stateCount: states.length }, units, states })
);
console.log("已写出 golden.json：" + states.length + " 个状态（源：新引擎）");
```

`package.json` 的 `golden` 脚本改为：

```json
"golden": "tsx tools/generate-golden.ts"
```

- [ ] **Step 2: 换源，验证零 diff（1A 验收证明）**

```bash
npm run golden
git diff --stat tests/fixtures/golden.json
```

Expected: **只有 `meta.source` 从 `legacy/index.legacy.html` 变成 `src/genetics` 这一处差异**，其余字节完全相同。

若 `git diff --stat` 显示的改动量明显更大，说明新引擎某处与 legacy 有偏差——用下一步的 `golden:diff` 定位到具体字段和状态，**必须修到零差异才能进入 1B**。

- [ ] **Step 3: 删除 legacy 生成器**

```bash
git rm tools/generate-golden.mjs
```

`tools/extract-legacy-engine.mjs` 保留——万一将来需要回头核对 legacy 行为。

- [ ] **Step 4: 写差异审阅工具**

`golden.json` 是单行 JSON，`git diff` 完全不可读。这个脚本把 HEAD 版本与工作区版本按状态、按字段比对。

`tools/diff-golden.mjs`：

```js
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const cur = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));
let old;
try {
  old = JSON.parse(execSync("git show HEAD:tests/fixtures/golden.json", { encoding: "utf8", maxBuffer: 1 << 28 }));
} catch {
  console.log("HEAD 里没有快照，视为首次生成。");
  process.exit(0);
}

const FIELDS = ["target", "parents", "parentClaims", "kidClaims", "gallery", "mates", "selfSvg"];
const tally = Object.fromEntries(FIELDS.map((f) => [f, []]));

cur.states.forEach((s, i) => {
  const o = old.states[i];
  if (!o) return;
  for (const f of FIELDS) {
    if (JSON.stringify(s[f]) !== JSON.stringify(o[f])) tally[f].push(i);
  }
});

console.log("=== 快照差异摘要 ===");
for (const f of FIELDS) {
  const n = tally[f].length;
  console.log(`${f.padEnd(14)} ${n} / ${cur.states.length} 个状态变化` +
    (n && n <= 5 ? `  → #${tally[f].join(", #")}` : ""));
}

const first = FIELDS.find((f) => tally[f].length);
if (first) {
  const i = tally[first][0];
  console.log(`\n=== 首个差异样本（状态 #${i}，字段 ${first}）===`);
  console.log("ui: ", JSON.stringify(cur.states[i].raw));
  console.log("旧: ", JSON.stringify(old.states[i][first]).slice(0, 400));
  console.log("新: ", JSON.stringify(cur.states[i][first]).slice(0, 400));
} else {
  console.log("\n无差异。");
}
```

- [ ] **Step 5: 验证工具在「无变化」时正确报告**

```bash
npm run golden && npm run golden:diff
```

Expected: 每个字段都是 `0 / 360 个状态变化`，末行 `无差异。`

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "test: 快照源切到新引擎，加差异审阅工具

换源后 golden.json 除 meta.source 外逐字节不变——
这是阶段 1A『行为完全保持』的验收证明。"
```

---

## 阶段 1B：逐项修复已知缺陷

从这里开始，**每个任务都会让 `golden.json` 产生 diff**。这是预期内的——每一步都要重新生成快照并**逐条审阅 diff**，确认只有该任务意图内的变化。

快照现在由**新引擎**生成（Task 10），所以它会跟着修复一起前进，这正是我们要的。

---

### Task 11: 修复 L 位点未参与亲代筛选

**缺陷**：`canonAsParent` 只检查 o/d/a/s 四个位点，漏了 l。断言说「爸妈双方都携带长毛基因」，画廊却完全不按 L 筛。

**Files:**
- Modify: `src/genetics/catalog.ts`（`CanonEntry` 加 `l` 字段、新增两个长毛条目、`canonSpec` 按 `l` 取值）
- Modify: `src/genetics/solve.ts`（`canonAsParent` 加 L 检查）
- Modify: `src/genetics/children.ts`（`MATES` 五个条目补 `l: ["LL","Ll"]`）
- Test: `tests/bugfix/l-locus-parent-filter.test.ts`

**Interfaces:**
- Consumes: `canonAsParent`（Task 5）
- Produces: `CanonEntry` 新增 `l: string[]` 字段；`canonAsParent` 行为改变

- [ ] **Step 1: 先写失败的测试**

`tests/bugfix/l-locus-parent-filter.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { CANON } from "../../src/genetics/catalog";
import type { UiState } from "../../src/genetics";

const shortHair: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

describe("L 位点参与亲代筛选", () => {
  it("短毛猫的亲代候选里，纯长毛花色应被排除（两只长毛猫生不出短毛猫）", () => {
    const res = solveParents(buildTarget(shortHair));
    const longOnly = CANON.find((c) => c.l.length === 1 && c.l[0] === "ll");
    expect(longOnly, "CANON 里应有至少一个纯长毛条目").toBeDefined();
    // 旧行为：canonAsParent 不看 l → 长毛条目照样通过（错）
    expect(canonAsParent(longOnly!, "mother", res)).toBe(false);
  });

  it("长毛猫的亲代候选里，短毛花色仍然成立（它们是携带者）", () => {
    const res = solveParents(buildTarget({ ...shortHair, long: true }));
    const shortCat = CANON.find((c) => c.name === "狸花猫")!;
    expect(canonAsParent(shortCat, "mother", res)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/bugfix/l-locus-parent-filter.test.ts`
Expected: FAIL。若报 `c.l is undefined`，说明第 3 步还没做——这是预期的。

- [ ] **Step 3: 写实现**

`src/genetics/catalog.ts`：

```ts
export interface CanonEntry {
  name: string; series: Series;
  d: string[]; a: string[] | null; l: string[]; white: number;
}
```

12 个现有条目全部补 `l: ["LL","Ll"]`（它们都是短毛），末尾追加两个长毛条目：

```ts
  { name: "长毛狸花猫", series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], l: ["ll"], white: 0 },
  { name: "长毛橘猫",   series: "orange", d: ["DD","Dd"], a: null,        l: ["ll"], white: 0 },
```

`canonSpec` 改为按 `l` 取值：

```ts
export function canonSpec(c: CanonEntry): CoatSpec {
  return {
    series: c.series,
    dilute: c.d[0] === "dd",
    tabby: c.a ? c.a[0] !== "aa" : true,
    white: c.white,
    long: c.l[0] === "ll",
  };
}
```

`src/genetics/solve.ts` 的 `canonAsParent`，把那行注释换成真的检查：

```ts
  if (!inter(side.s, WHITE_S[c.white])) return false;
  if (!inter(side.l, c.l)) return false;
  return true;
```

`src/genetics/children.ts` 的 `MATES` 五个条目各补 `l: ["LL","Ll"]`（类型要求）。

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/bugfix/l-locus-parent-filter.test.ts`
Expected: PASS（2 passed）

- [ ] **Step 5: 更新并审阅快照**

```bash
npm run golden && npm run golden:diff
```

预期差异：`gallery` 大量状态变化（新增两个长毛条目 + L 筛选生效）；`parents` / `parentClaims` / `kidClaims` / `selfSvg` **应为 0 变化**。若后四者非 0，说明改动溢出了，回去查。

- [ ] **Step 6: 全量测试并提交**

Run: `npm run test`

```bash
git add -A
git commit -m "fix: L 位点参与亲代筛选，画廊补长毛花色

canonAsParent 此前只检查 o/d/a/s，与'爸妈都携带长毛基因'的断言矛盾。
CANON 增加 l 字段与两个长毛条目。"
```

---

### Task 12: 修复无法与长毛猫配种

**缺陷**：`childrenWith` 把配偶的 L 基因型写死为 `["LL","Ll"]`，长毛 × 长毛这个最好讲的例子做不出来。

**Files:**
- Modify: `src/genetics/children.ts`, `src/ui/KidsPanel.tsx`
- Test: `tests/bugfix/long-hair-mate.test.ts`

**Interfaces:**
- Consumes: `MateEntry`（Task 11 后已有 `l` 字段）、`childrenWith`（Task 7）
- Produces: `ChildrenResult` 新增 `shortPossible: boolean`；`MATES` 新增一个长毛条目；`mateList` 返回 5 个配偶

- [ ] **Step 1: 先写失败的测试**

`tests/bugfix/long-hair-mate.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { buildTarget } from "../../src/genetics/solve";
import { childrenWith, mateList, MATES } from "../../src/genetics/children";
import type { UiState } from "../../src/genetics";

const longCat: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: true, sex: "M",
};

describe("可以和长毛猫配种", () => {
  it("配偶列表里有长毛条目", () => {
    const list = mateList(buildTarget(longCat));
    expect(list.some((m) => m.l[0] === "ll")).toBe(true);
  });

  it("长毛 × 长毛 → 后代必然全部长毛", () => {
    const t = buildTarget(longCat);
    const longMate = MATES.find((m) => m.l[0] === "ll")!;
    const r = childrenWith(t, longMate)!;
    expect(r.longPossible).toBe(true);
    expect(r.shortPossible).toBe(false);
  });

  it("长毛 × 短毛 → 后代可以是短毛", () => {
    const t = buildTarget(longCat);
    const shortMate = MATES.find((m) => m.name === "狸花猫")!;
    const r = childrenWith(t, shortMate)!;
    expect(r.shortPossible).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/bugfix/long-hair-mate.test.ts`
Expected: FAIL，第一个用例报 `expected false to be true`

- [ ] **Step 3: 写实现**

`src/genetics/children.ts`，`MATES` 末尾追加：

```ts
  { name: "长毛狸花猫", series: "black", d: ["DD","Dd"], a: ["AA","Aa"], l: ["ll"], white: 0 },
```

`mateList` 把长毛条目加进去（对两种性别都可用）：

```ts
export function mateList(t: Target): MateEntry[] {
  const canF = t.sexes.indexOf("M") >= 0;
  const base = canF
    ? [MATES[0], MATES[1], MATES[2], MATES[3]]
    : [MATES[0], MATES[1], MATES[2], MATES[4]];
  return [...base, MATES[5]];
}
```

`ChildrenResult` 加字段，`childrenWith` 里那行写死的改掉：

```ts
export interface ChildrenResult {
  names: string[];
  specs: Record<string, CoatSpec>;
  longPossible: boolean;
  shortPossible: boolean;
  nope: string[];
}
```

```ts
  const kl = unionCross(t.l, mate.l);
  // ...
  return {
    names, specs, nope,
    longPossible: !!kl["ll"],
    shortPossible: !!kl["LL"] || !!kl["Ll"],
  };
```

`src/ui/KidsPanel.tsx` 里那句毛长文案改为三分支：

```tsx
const hairText = r.longPossible && r.shortPossible ? "（长毛短毛都可能）"
  : r.longPossible ? "（都会是长毛）" : "（都会是短毛）";
```

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/bugfix/long-hair-mate.test.ts`
Expected: PASS（3 passed）

- [ ] **Step 5: 更新并审阅快照**

```bash
npm run golden && npm run golden:diff
```

预期差异：`mates` 全部 360 个状态变化（多一个配偶 + 结构多了 `shortPossible`）。`target` / `parents` / `parentClaims` / `kidClaims` / `gallery` / `selfSvg` 应为 0。

- [ ] **Step 6: 全量测试并提交**

Run: `npm run test && npm run build`

```bash
git add -A
git commit -m "fix: 支持与长毛猫配种

childrenWith 此前把配偶 L 写死为短毛，长毛×长毛这个教学场景做不出来。
新增 shortPossible 字段，毛长文案改为三分支。"
```

---

### Task 13: 修复画廊静默截断

**缺陷**：`yes.slice(0, 6)` / `no.slice(0, 5)`。橘公猫有 10 个合法父本，只显示 6 个，用户无从知晓。

**Files:**
- Modify: `src/ui/ParentsPanel.tsx`, `tools/generate-golden.ts`
- Test: `tests/bugfix/gallery-truncation.test.ts`

**Interfaces:**
- Consumes: `canonAsParent`（Task 11 后版本）、`CANON`
- Produces: `ParentsPanel` 渲染全部候选；`golden.json` 的 `gallery` 去掉 `shownYes` / `shownNo`

- [ ] **Step 1: 先写失败的测试**

`tests/bugfix/gallery-truncation.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { CANON } from "../../src/genetics/catalog";
import type { UiState } from "../../src/genetics";

const orangeMale: UiState = {
  series: "orange", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

describe("画廊不截断", () => {
  it("前提：橘公猫的合法父本超过 6 个", () => {
    const res = solveParents(buildTarget(orangeMale));
    const yes = CANON.filter((c) => canonAsParent(c, "father", res));
    expect(yes.length).toBeGreaterThan(6);
  });

  it("快照里不再保留 shown* 截断字段", () => {
    const g = JSON.parse(readFileSync("tests/fixtures/golden.json", "utf8"));
    expect(g.states[0].gallery.mother).not.toHaveProperty("shownYes");
  });

  it("ParentsPanel 源码里没有 slice 截断", () => {
    const src = readFileSync("src/ui/ParentsPanel.tsx", "utf8");
    expect(src).not.toMatch(/\.slice\(0,\s*[56]\)/);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/bugfix/gallery-truncation.test.ts`
Expected: FAIL，后两个用例失败（第一个本来就成立，它证明的是「确实被截断了」这个前提）

- [ ] **Step 3: 写实现**

`src/ui/ParentsPanel.tsx`：把两处 `.slice(0, 6)` / `.slice(0, 5)` 删掉，直接渲染完整数组。CSS 的 `.catrow` 已经是 flex-wrap，条目变多会自动换行，不需要改样式。

`tools/generate-golden.ts` 的 `gallery()` 去掉两个截断字段：

```ts
function gallery(res: ParentSolution) {
  const out: any = {};
  for (const role of ["mother", "father"] as const) {
    const yes: string[] = [], no: string[] = [];
    CANON.forEach((c) => {
      (canonAsParent(c, role, res) ? yes : no).push(c.name);
    });
    out[role] = { yes, no };
  }
  return out;
}
```

- [ ] **Step 4: 重新生成快照并确认测试通过**

```bash
npm run golden && npm run test -- tests/bugfix/gallery-truncation.test.ts
```

Expected: PASS（3 passed）

- [ ] **Step 5: 审阅快照并提交**

```bash
npm run golden:diff && npm run test
```

预期差异：仅 `gallery` 字段（去掉了两个键），其余为 0。

```bash
git add -A
git commit -m "fix: 画廊不再静默截断候选亲代

橘公猫有 10 个合法父本，此前只显示 6 个且不作任何提示。"
```

---

### Task 14: 修复白斑映射过窄导致的假「不可能」

**缺陷**：`WHITE_S` 把白斑等级硬映射成唯一基因型（「零星白 → 必然 Ss」「几乎全白 → 必然 SS」）。S 实际是半显性且变异极大，这个映射会排除真实存在的组合。

**Files:**
- Modify: `src/genetics/loci.ts`, `src/ui/SelfPanel.tsx`
- Test: `tests/bugfix/white-spotting-range.test.ts`

**Interfaces:**
- Consumes: `WHITE_S`（Task 3）
- Produces: `WHITE_S` 改为多对多映射；新增 `WHITE_TENDENCY: Record<number, string>`

- [ ] **Step 1: 先写失败的测试**

`tests/bugfix/white-spotting-range.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { WHITE_S } from "../../src/genetics/loci";
import { buildTarget, solveParents } from "../../src/genetics/solve";
import type { UiState } from "../../src/genetics";

describe("白斑等级不再硬映射到唯一基因型", () => {
  it("只有'无白'能唯一确定基因型", () => {
    expect(WHITE_S[0]).toEqual(["ss"]);
    for (const w of [1, 2, 3, 4]) {
      expect(WHITE_S[w].length, `等级 ${w} 不该只对应一种基因型`).toBeGreaterThan(1);
    }
  });

  it("几乎全白的猫，父母仍可能是只带一份 S 的猫", () => {
    const ui: UiState = { series: "black", dilute: false, tabby: true, white: 4, long: false, sex: "M" };
    const res = solveParents(buildTarget(ui));
    // 旧行为：white=4 只映射到 SS → Ss×ss 这类亲代被错误排除
    expect(res.f.s["Ss"]).toBe(1);
    expect(res.m.s["Ss"]).toBe(1);
  });

  it("零星白的猫，父母可以是 SS", () => {
    const ui: UiState = { series: "black", dilute: false, tabby: true, white: 1, long: false, sex: "M" };
    const res = solveParents(buildTarget(ui));
    expect(res.f.s["SS"]).toBe(1);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/bugfix/white-spotting-range.test.ts`
Expected: FAIL，第一个用例在等级 1 处报 `等级 1 不该只对应一种基因型`

- [ ] **Step 3: 写实现**

`src/genetics/loci.ts`：

```ts
// S 是半显性且表达量变异极大：同样是 Ss，可以是白袜黑猫，也可以是奶牛猫。
// 因此等级 1–4 都对应 {Ss, SS} 全集，等级只作倾向性提示，不作排除依据。
// 只有"完全无白"能唯一确定为 ss。
export const WHITE_S: Record<number, string[]> = {
  0: ["ss"],
  1: ["Ss", "SS"],
  2: ["Ss", "SS"],
  3: ["Ss", "SS"],
  4: ["Ss", "SS"],
};

// 倾向性说明，供界面展示，不参与求解
export const WHITE_TENDENCY: Record<number, string> = {
  0: "两份都是无白斑等位基因",
  1: "多半只带一份 S",
  2: "一份或两份 S 都常见",
  3: "带两份 S 的可能性更大",
  4: "多半带两份 S，但一份也做得到",
};
```

`src/ui/SelfPanel.tsx` 里展示 S 位点的那行说明，改为 `WHITE_LABEL[ui.white] + " · " + WHITE_TENDENCY[ui.white]`。

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/bugfix/white-spotting-range.test.ts`
Expected: PASS（3 passed）

- [ ] **Step 5: 更新并审阅快照**

```bash
npm run golden && npm run golden:diff
```

预期差异：`target` / `parents` / `parentClaims` / `gallery` / `mates` 在 `white >= 1` 的状态上变化（288 / 360 个）。**`white = 0` 的 72 个状态应完全不变**——这是个好检查点。`selfSvg` 应为 0 变化。

- [ ] **Step 6: 全量测试并提交**

Run: `npm run test`

```bash
git add -A
git commit -m "fix: 白斑等级不再硬映射到唯一基因型

S 是半显性且变异极大，旧映射会排除真实存在的亲代组合，
产生假的'不可能'。等级改为只作倾向性提示。"
```

---

### Task 15: 补齐缺失的淡色玳瑁系花色

**缺陷**：`coatName()` 能生成「淡玳瑁猫」「淡三花猫」，但 `CANON` 里没有对应条目，它们永远不会出现在爸妈画廊里。

**Files:**
- Modify: `src/genetics/catalog.ts`
- Test: `tests/bugfix/missing-dilute-tortie.test.ts`

**Interfaces:**
- Consumes: `CANON` / `canonSpec`（Task 11 后版本）、`coatName`（Task 4）
- Produces: `CANON` 新增 2 个淡色玳瑁系条目

- [ ] **Step 1: 先写失败的测试**

`tests/bugfix/missing-dilute-tortie.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { CANON, canonSpec } from "../../src/genetics/catalog";
import { coatName } from "../../src/genetics/naming";

describe("命名器能生成的花色，画廊里都要有对应条目", () => {
  it("淡玳瑁与淡三花在 CANON 中", () => {
    const names = CANON.map((c) => c.name);
    expect(names).toContain("淡玳瑁猫");
    expect(names).toContain("淡三花猫");
  });

  it("每个 CANON 条目的名字与其规格算出的名字一致", () => {
    for (const c of CANON) {
      const sp = canonSpec(c);
      expect(coatName(sp.series, sp.dilute, sp.tabby, sp.white), `条目 ${c.name} 名实不符`)
        .toBe(c.name);
    }
  });
});
```

第二个用例是不变量测试——它会顺带抓出未来新增条目时的命名笔误。

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/bugfix/missing-dilute-tortie.test.ts`
Expected: FAIL，第一个用例报 CANON 里没有「淡玳瑁猫」

- [ ] **Step 3: 写实现**

`src/genetics/catalog.ts` 的 `CANON` 追加：

```ts
  { name: "淡玳瑁猫", series: "tortie", d: ["dd"], a: ["aa"], l: ["LL","Ll"], white: 0 },
  { name: "淡三花猫", series: "tortie", d: ["dd"], a: ["aa"], l: ["LL","Ll"], white: 2 },
```

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/bugfix/missing-dilute-tortie.test.ts`
Expected: PASS（2 passed）

若第二个用例对某个**既有**条目失败，说明发现了一处原有的名实不符——单独记录，不要在本任务里顺手改，它需要自己的任务。

- [ ] **Step 5: 更新快照、审阅并提交**

```bash
npm run golden && npm run golden:diff && npm run test
```

预期差异：仅 `gallery`（多两个候选）与 `mates` 的 `nope` 列表。

```bash
git add -A
git commit -m "fix: CANON 补齐淡玳瑁与淡三花

coatName 能生成这两个名字，但画廊里没有条目，它们永远不会被展示。
新增名实一致性不变量测试。"
```

---

### Task 16: 修复边缘集与联合约束在 UI 上的错位

**缺陷**：爸妈两行各自独立渲染的是**边缘集**。用户可以从两行各挑一只，凑出实际不可能的组合——三花的「一橘一非橘」是联合约束，断言文字里说了，画廊里没体现。

**Files:**
- Create: `src/genetics/joint.ts`
- Modify: `src/ui/ParentsPanel.tsx`, `src/genetics/index.ts`
- Test: `tests/bugfix/joint-constraint.test.ts`

**Interfaces:**
- Consumes: `ParentSolution` / `hasPair` / `canonAsParent`（Task 11 后版本）、`CANON` / `oForSeries`
- Produces: `canonPairAllowed(father: CanonEntry, mother: CanonEntry, res: ParentSolution): boolean`

- [ ] **Step 1: 先写失败的测试**

`tests/bugfix/joint-constraint.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { canonPairAllowed } from "../../src/genetics/joint";
import { CANON } from "../../src/genetics/catalog";
import type { UiState } from "../../src/genetics";

const tortie: UiState = {
  series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "F",
};

describe("三花的联合约束", () => {
  const res = solveParents(buildTarget(tortie));
  const orange = CANON.find((c) => c.name === "橘猫")!;

  it("前提：橘猫在两行的边缘集里都成立", () => {
    expect(canonAsParent(orange, "father", res)).toBe(true);
    expect(canonAsParent(orange, "mother", res)).toBe(true);
  });

  it("但橘爸 × 橘妈生不出三花", () => {
    expect(canonPairAllowed(orange, orange, res)).toBe(false);
  });

  it("橘爸 × 黑妈可以生出三花", () => {
    const black = CANON.find((c) => c.name === "黑猫")!;
    expect(canonPairAllowed(orange, black, res)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run test -- tests/bugfix/joint-constraint.test.ts`
Expected: FAIL，报找不到 `../../src/genetics/joint`

- [ ] **Step 3: 写实现**

`src/genetics/joint.ts`：

```ts
import { A_GENOS, WHITE_S } from "./loci";
import { oForSeries, type CanonEntry } from "./catalog";
import { hasPair, type ParentSolution } from "./solve";

/**
 * 判断"这只花色的公猫 × 这只花色的母猫"是否至少存在一组合法基因型配对。
 * 位点独立，所以每个位点各自存在一组即可；任一位点无解则整对不成立。
 */
export function canonPairAllowed(
  father: CanonEntry, mother: CanonEntry, res: ParentSolution
): boolean {
  const fo = oForSeries(father.series, "M");
  const mo = oForSeries(mother.series, "F");
  if (!fo || !mo) return false;
  if (!hasPair(res.pairs.o, fo, mo)) return false;

  const perLocus: [string, string[], string[]][] = [
    ["d", father.d, mother.d],
    ["a", father.a || A_GENOS.a, mother.a || A_GENOS.a],
    ["s", WHITE_S[father.white], WHITE_S[mother.white]],
    ["l", father.l, mother.l],
  ];

  for (const [loc, fGenos, mGenos] of perLocus) {
    let ok = false;
    for (const f of fGenos) {
      for (const m of mGenos) {
        if (hasPair(res.pairs[loc], f, m)) { ok = true; break; }
      }
      if (ok) break;
    }
    if (!ok) return false;
  }
  return true;
}
```

`src/genetics/index.ts` 加一行 `export * from "./joint";`。

`src/ui/ParentsPanel.tsx`：加 `picked` 状态，点选一只候选后，另一行里 `canonPairAllowed` 为 false 的条目加上现有的 `.no` 类（灰度化 + 划线，与「不可能」共用同一套视觉编码）：

```tsx
const [picked, setPicked] = useState<{ role: "mother" | "father"; name: string } | null>(null);

function dimmed(role: "mother" | "father", c: CanonEntry): boolean {
  if (!picked || picked.role === role) return false;
  const other = CANON.find((x) => x.name === picked.name)!;
  return picked.role === "mother"
    ? !canonPairAllowed(c, other, res)
    : !canonPairAllowed(other, c, res);
}
```

再次点击同一只则取消选择（`setPicked(null)`）。画廊上方加一行提示：`点一只看另一边还剩哪些可能`。

- [ ] **Step 4: 运行确认通过**

Run: `npm run test -- tests/bugfix/joint-constraint.test.ts`
Expected: PASS（3 passed）

- [ ] **Step 5: 人工验证联动**

```bash
npm run dev
```

点「三花」→ 在「它妈妈可能是这些」里点**橘猫** → 确认爸爸行里的**橘猫、奶油猫、橘白猫**立刻灰掉，而**黑猫、狸花猫**仍然正常。再点一次取消选择，全部恢复。

- [ ] **Step 6: 审阅快照并提交**

```bash
npm run golden && npm run golden:diff && npm run test && npm run build
```

预期差异：**全部字段 0 变化**——本任务只加了新函数和 UI 交互，没改任何既有计算路径。若有非 0，说明改动溢出了。

```bash
git add -A
git commit -m "fix: 爸妈画廊体现联合约束

两行此前各自渲染边缘集，用户可以凑出实际不可能的组合
（三花的'一橘一非橘'是联合约束）。点选一边即灰掉另一边不兼容的候选。

阶段 1B 完成。"
```

---

### Task 17: 更新文档并归档 legacy

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-09-06-cat-color-v2-design.md`

- [ ] **Step 1: 更新 README 的「当前状态」一节**

```markdown
## 当前状态

阶段 1A / 1B 完成：已迁移为 Vite + React + TypeScript 工程，遗传引擎抽为
零 DOM 依赖的纯模块并有全量测试覆盖；7 项已知缺陷已修复。

- 开发：`npm run dev`
- 构建：`npm run build` → 产出单个自包含的 `dist/index.html`
- 测试：`npm run test`
- 行为快照：`npm run golden` 重新录制，`npm run golden:diff` 审阅差异

`legacy/index.legacy.html` 是迁移前的原始单文件，保留作为行为参照，不再维护。
```

- [ ] **Step 2: 在 spec 第 12 节表格上方加一行**

```markdown
> 全部 7 项已于阶段 1B 修复，各带独立测试。见 `docs/superpowers/plans/2026-09-06-stage-1-engine-extraction.md`。
```

- [ ] **Step 3: 最终验证**

Run: `npm run test && npm run build`
Expected: 全部 PASS，`dist/index.html` 为单文件

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "docs: 更新 README 与 spec，标记阶段 1 完成"
```

---

## 完成标准

**1A：**
- [ ] `npm run build` 产出单个自包含 `dist/index.html`
- [ ] `src/genetics/**` 与 `src/render/**` 无任何 `document` / `window` 引用
- [ ] 360 种 UI 状态下，新引擎输出与 `golden.json` 逐字一致
- [ ] 6 个人工对照状态视觉与文字完全一致
- [ ] 快照源切到新引擎后重新生成，除 `meta.source` 外**逐字节无差异**

**1B：**
- [ ] 7 项缺陷各有一个独立测试，且该测试在修复前会失败
- [ ] 每次快照变更都经过 `golden:diff` 审阅，变化范围与任务意图相符
- [ ] `npm run test` 全绿
