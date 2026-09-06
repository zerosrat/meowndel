import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildTarget, solveParents } from "../../src/genetics/solve";

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

// 画廊判定的状态级特征化断言已由 tests/drift.test.ts 接管（见 Task 10）——
// 它带归一化器机制，能表达 1B 各次修复引入的预期变化。
