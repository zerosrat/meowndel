import { describe, it, expect } from "vitest";
import { WHITE_S } from "../../src/genetics/loci";
import { buildTarget, solveParents } from "../../src/genetics/solve";
import type { UiState } from "../../src/genetics";

const base: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

describe("白斑等级不再硬映射到唯一基因型", () => {
  it("只有'无白'能唯一确定基因型", () => {
    expect(WHITE_S[0]).toEqual(["ss"]);
    for (const w of [1, 2, 3, 4]) {
      expect(WHITE_S[w].length, `等级 ${w} 不该只对应一种基因型`).toBeGreaterThan(1);
    }
  });

  it("几乎全白的猫，父母仍可能只带一份 S", () => {
    const res = solveParents(buildTarget({ ...base, white: 4 }));
    expect(res.f.s["Ss"]).toBe(1);
    expect(res.m.s["Ss"]).toBe(1);
  });

  it("零星白的猫，父母可以是 SS", () => {
    const res = solveParents(buildTarget({ ...base, white: 1 }));
    expect(res.f.s["SS"]).toBe(1);
  });

  it("无白的猫不受影响：父母仍不可能双方都是 SS", () => {
    const res = solveParents(buildTarget({ ...base, white: 0 }));
    expect(res.pairs.s.some(([f, m]) => f === "SS" && m === "SS")).toBe(false);
  });
});
