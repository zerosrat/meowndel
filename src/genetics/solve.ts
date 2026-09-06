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
  if (!inter(side.l, c.l)) return false;
  return true;
}
