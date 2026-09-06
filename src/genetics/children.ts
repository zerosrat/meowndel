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
