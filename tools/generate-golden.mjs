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
  "tests/fixtures/legacy-golden.json",
  JSON.stringify({ meta: { source: "legacy/index.legacy.html", stateCount: states.length }, units, states })
);
console.log("已写出 legacy-golden.json：" + states.length + " 个状态");
