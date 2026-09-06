import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget } from "../../src/genetics/solve";
import { mateList, childrenWith } from "../../src/genetics/children";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

interface StateCase { i: number; s: any }
const cases: StateCase[] = golden.states.map((s: any, i: number) => ({ i, s }));

describe("后代推演与旧引擎逐字一致", () => {
  it.each(cases)("state #$i", ({ s }) => {
    const t = buildTarget(s.ui);
    const list = mateList(t);
    expect(list.map((m) => m.name)).toEqual(s.mates.map((x: any) => x.name));
    list.forEach((m, k) => {
      expect(childrenWith(t, m)).toEqual(s.mates[k].result);
    });
  });
});
