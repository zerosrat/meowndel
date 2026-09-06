import { describe, it, expect } from "vitest";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { crossAuto } from "../../src/genetics/punnett";
import { CANON, type CanonEntry } from "../../src/genetics/catalog";
import type { UiState } from "../../src/genetics";

const shortHair: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};
const longHair: UiState = { ...shortHair, long: true };

describe("L 位点的边缘约束语义", () => {
  it("前提：ll × LL 全部产出 Ll（单只长毛亲本可以有短毛后代）", () => {
    expect(crossAuto("ll", "LL")).toEqual(["Ll"]);
  });

  it("短毛后代：长毛猫仍是合法的单侧亲本候选", () => {
    const res = solveParents(buildTarget(shortHair));
    const longCat = CANON.find((c) => c.l[0] === "ll")!;
    expect(canonAsParent(longCat, "mother", res)).toBe(true);
    expect(canonAsParent(longCat, "father", res)).toBe(true);
  });

  it("短毛后代：ll × ll 这一对被排除（联合约束，体现在 pairs 里）", () => {
    const res = solveParents(buildTarget(shortHair));
    expect(res.pairs.l.some(([f, m]) => f === "ll" && m === "ll")).toBe(false);
    // 但两侧边缘集都还包含 ll
    expect(res.f.l["ll"]).toBe(1);
    expect(res.m.l["ll"]).toBe(1);
  });

  it("长毛后代：短毛猫仍是合法亲本（它们是携带者）", () => {
    const res = solveParents(buildTarget(longHair));
    const shortCat = CANON.find((c) => c.name === "狸花猫")!;
    expect(canonAsParent(shortCat, "mother", res)).toBe(true);
  });

  it("确知纯合短毛（l:['LL']）的猫，不可能是长毛后代的亲本", () => {
    const res = solveParents(buildTarget(longHair));
    // 合成一个条目：它的 L 基因型确知为 LL。现实的 CANON 里没有这种花色
    // （肉眼分不出 LL 和 Ll），但用它可以直接观测 canonAsParent
    // 有没有真的把 l 位点算进去。
    const syntheticLL: CanonEntry = {
      name: "（测试用）确知纯合短毛猫", series: "black",
      d: ["DD", "Dd"], a: ["AA", "Aa"], l: ["LL"], white: 0,
    };
    // 修复前：l 被忽略 → 返回 true（错）
    // 修复后：长毛后代要求亲本至少带一份 l → 返回 false
    expect(canonAsParent(syntheticLL, "mother", res)).toBe(false);
    expect(canonAsParent(syntheticLL, "father", res)).toBe(false);
  });
});
