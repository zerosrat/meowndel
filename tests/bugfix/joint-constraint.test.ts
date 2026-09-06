import { describe, it, expect } from "vitest";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { canonPairAllowed } from "../../src/genetics/joint";
import { CANON } from "../../src/genetics/catalog";
import { WHITE_S } from "../../src/genetics";
import { crossAuto } from "../../src/genetics/punnett";
import type { UiState } from "../../src/genetics";

const tortie: UiState = {
  series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "F",
};
const shortHair: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

describe("O 位点的联合约束（三花：一橘一非橘）", () => {
  const res = solveParents(buildTarget(tortie));
  const orange = CANON.find((c) => c.name === "橘猫")!;

  it("前提：橘猫在两侧边缘集里都成立", () => {
    expect(canonAsParent(orange, "father", res)).toBe(true);
    expect(canonAsParent(orange, "mother", res)).toBe(true);
  });

  it("但橘爸 × 橘妈生不出三花", () => {
    expect(canonPairAllowed(orange, orange, res)).toBe(false);
  });

  it("橘爸 × 奶牛妈可以（非橘，且身上带白）", () => {
    const cow = CANON.find((c) => c.name === "奶牛猫")!;
    expect(canonPairAllowed(orange, cow, res)).toBe(true);
  });

  it("橘爸 × 黑妈也不行——但拦住它的是 S 位点，不是 O 位点", () => {
    const black = CANON.find((c) => c.name === "黑猫")!;
    // 前提：三花 white=2 身上有白；黑猫与橘猫都是 white=0
    expect(WHITE_S[black.white]).toEqual(["ss"]);
    expect(WHITE_S[orange.white]).toEqual(["ss"]);
    // 期望值来自引擎，不是直觉：ss × ss 只能生出 ss，生不出带白的三花
    expect(crossAuto("ss", "ss")).toEqual(["ss"]);
    expect(res.pairs.s.some(([f, m]) => f === "ss" && m === "ss")).toBe(false);
    expect(canonPairAllowed(orange, black, res)).toBe(false);
  });
});

describe("L 位点的联合约束（两只长毛猫生不出短毛猫）", () => {
  const res = solveParents(buildTarget(shortHair));
  const longCat = CANON.find((c) => c.l[0] === "ll")!;
  const shortCat = CANON.find((c) => c.name === "狸花猫")!;

  it("前提：长毛猫在两侧边缘集里都成立（Task 12 的正确语义）", () => {
    expect(canonAsParent(longCat, "father", res)).toBe(true);
    expect(canonAsParent(longCat, "mother", res)).toBe(true);
  });

  it("但长毛 × 长毛生不出短毛后代", () => {
    expect(canonPairAllowed(longCat, longCat, res)).toBe(false);
  });

  it("长毛 × 短毛可以", () => {
    expect(canonPairAllowed(longCat, shortCat, res)).toBe(true);
  });
});
