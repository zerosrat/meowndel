import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget, solveParents } from "../../src/genetics/solve";
import { parentClaims, kidClaims } from "../../src/genetics/claims";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

interface StateCase { i: number; s: any }
const cases: StateCase[] = golden.states.map((s: any, i: number) => ({ i, s }));

describe("断言与旧引擎逐字一致", () => {
  it.each(cases)("state #$i", ({ s }) => {
    const t = buildTarget(s.ui);
    const res = solveParents(t);
    expect(parentClaims(s.ui, t, res)).toEqual(s.parentClaims);
    expect(kidClaims(s.ui, t)).toEqual(s.kidClaims);
  });
});
