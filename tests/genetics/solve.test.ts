import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { CANON } from "../../src/genetics/catalog";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

interface StateCase { i: number; s: any }
const cases: StateCase[] = golden.states.map((s: any, i: number) => ({ i, s }));

describe("buildTarget / solveParents 与旧引擎逐字一致", () => {
  it.each(cases)("state #$i", ({ s }) => {
    const t = buildTarget(s.ui);
    expect(JSON.parse(JSON.stringify(t))).toEqual(s.target);
    expect(JSON.parse(JSON.stringify(solveParents(t)))).toEqual(s.parents);
  });
});

describe("canonAsParent 画廊判定与旧引擎一致（比对未截断的完整集合）", () => {
  it.each(cases)("state #$i", ({ s }) => {
    const res = solveParents(buildTarget(s.ui));
    for (const role of ["mother", "father"] as const) {
      const yes = CANON.filter((c) => canonAsParent(c, role, res)).map((c) => c.name);
      const no = CANON.filter((c) => !canonAsParent(c, role, res)).map((c) => c.name);
      expect(yes).toEqual(s.gallery[role].yes);
      expect(no).toEqual(s.gallery[role].no);
    }
  });
});
