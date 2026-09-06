import { describe, it, expect } from "vitest";
import { buildTarget } from "../../src/genetics/solve";
import { crossAuto } from "../../src/genetics/punnett";
import { childrenWith, mateList, MATES } from "../../src/genetics/children";
import type { UiState } from "../../src/genetics";

const longCat: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: true, sex: "M",
};
const shortCat: UiState = { ...longCat, long: false };

describe("可以和长毛猫配种", () => {
  it("配偶列表里有长毛条目", () => {
    expect(mateList(buildTarget(longCat)).some((m) => m.l[0] === "ll")).toBe(true);
  });

  it("长毛 × 长毛 → 后代必然全长毛", () => {
    expect(crossAuto("ll", "ll")).toEqual(["ll"]);   // 期望值来自引擎，不是直觉
    const longMate = MATES.find((m) => m.l[0] === "ll")!;
    const r = childrenWith(buildTarget(longCat), longMate)!;
    expect(r.longPossible).toBe(true);
    expect(r.shortPossible).toBe(false);
  });

  it("长毛 × 短毛 → 后代可以是短毛", () => {
    const shortMate = MATES.find((m) => m.name === "狸花猫")!;
    const r = childrenWith(buildTarget(longCat), shortMate)!;
    expect(r.shortPossible).toBe(true);
  });

  it("短毛 × 长毛 → 长短毛都可能（因为'短毛'是 LL 或 Ll 的集合）", () => {
    // 期望值不靠直觉，直接从引擎的杂交结果推：
    expect(crossAuto("LL", "ll")).toEqual(["Ll"]);        // 不携带 → 全短毛
    expect(crossAuto("Ll", "ll")).toEqual(["Ll", "ll"]);  // 携带   → 一半长毛
    // 肉眼看到的"短毛"无法区分这两种，引擎携带的是 {LL, Ll} 全集，
    // 所以并集是 {Ll, ll}，长毛是可能的。
    const longMate = MATES.find((m) => m.l[0] === "ll")!;
    const r = childrenWith(buildTarget(shortCat), longMate)!;
    expect(r.shortPossible).toBe(true);
    expect(r.longPossible).toBe(true);
  });
});
