import { describe, it, expect } from "vitest";
import { buildTarget } from "../../src/genetics/solve";
import { crossAuto } from "../../src/genetics/punnett";
import { childrenWith, mateList, MATES } from "../../src/genetics/children";
import type { UiState } from "../../src/genetics";
import type { CanonEntry } from "../../src/genetics/catalog";

// 缺陷 A：长毛后代被画成短毛（specOf 里毛长硬编码 false），且因为
// coatName() 不含毛长参数，长毛条目永远进不了 specs 的键，于是恒在 nope 里。
// 缺陷 B：KidsPanel 用 r.names.slice(0, 14) 截断渲染，但文案写的是
// r.names.length（可以是 18），页面上出现「说 18、画 14」的矛盾。
//
// 用户已决定的修法（不拆格）：
//   - 一个花色仍占一格
//   - 必然全长毛时，把后代画成长毛、名字冠以「长毛」前缀
//   - 长短毛都可能时保持现状（画短毛、不加前缀）——顶部文案已说明两者都可能
//   - 否决了「同色长短毛各占一格」：会让 90% 的组合格数翻倍

const longOrangeMale: UiState = {
  series: "orange", dilute: false, tabby: true, white: 0, long: true, sex: "M",
};
const shortTabbyMale: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

const longCalicoMate = MATES.find((m) => m.name === "长毛狸花猫")!;

describe("缺陷 A：后代毛长必须真实参与渲染与 nope 判断", () => {
  it("前提：ll × ll 后代必然全长毛（期望值来自引擎，不是表型直觉）", () => {
    expect(crossAuto("ll", "ll")).toEqual(["ll"]);
  });

  it("全长毛：名字全部冠以「长毛」前缀，且 spec.long === true", () => {
    const r = childrenWith(buildTarget(longOrangeMale), longCalicoMate)!;
    expect(r.longPossible).toBe(true);
    expect(r.shortPossible).toBe(false);
    expect(r.names.length).toBeGreaterThan(0);
    for (const n of r.names) {
      expect(n.startsWith("长毛")).toBe(true);
      expect(r.specs[n].long).toBe(true);
    }
    // 「长毛狸花猫」这个 CANON 条目现在确实可能出现，不应再被划进「不会出现」
    expect(r.nope).not.toContain("长毛狸花猫");
  });

  it("全长毛：短毛花色（如「狸花猫」）必须进 nope——证明毛长真的参与了判断", () => {
    const r = childrenWith(buildTarget(longOrangeMale), longCalicoMate)!;
    // 这一窝只会产出长毛，短毛版本的同色花色不可能出现
    expect(r.nope).toContain("狸花猫");
    expect(r.nope).toContain("黑猫");
    expect(r.nope).toContain("蓝虎斑猫");
    expect(r.nope).toContain("蓝猫");
    expect(r.nope).toContain("玳瑁猫");
  });

  it("长短毛都可能：不拆格，names 不带前缀、spec.long === false，且长毛条目不进 nope", () => {
    const r = childrenWith(buildTarget(shortTabbyMale), longCalicoMate)!;
    expect(r.longPossible).toBe(true);
    expect(r.shortPossible).toBe(true);
    expect(r.names).toEqual(["狸花猫", "黑猫", "蓝虎斑猫", "蓝猫"]);
    for (const n of r.names) {
      expect(n.startsWith("长毛")).toBe(false);
      expect(r.specs[n].long).toBe(false);
    }
    // 长毛狸花猫确实可能出现在这一窝里（用短毛的「狸花猫」这一格代表），
    // 不应该被列进「不会出现」
    expect(r.nope).not.toContain("长毛狸花猫");
    // 但橘色系这一窝生不出来，长毛橘猫依然不可能
    expect(r.nope).toContain("长毛橘猫");
  });

  it("全短毛（必然不可能长毛）：长毛狸花猫必须进 nope——这一窝确实出不了长毛", () => {
    // MATES/CANON 里所有「短毛」条目的 l 位点都写成 ["LL","Ll"]（携带者不确定），
    // 只要目标和配偶双方的 l 位点里都含 Ll，crossAuto("Ll","Ll") 就必然产出 "ll"，
    // 于是 longPossible 恒为 true——用真实 MATES 条目造不出「全短毛」的情形。
    // 这里比照 tests/bugfix/l-locus-parent-filter.test.ts 的做法，构造一个
    // L 位点确知纯合短毛（l: ["LL"]，非携带者）的合成配偶条目来验证 nope 的第二分支。
    expect(crossAuto("LL", "LL")).toEqual(["LL"]);
    expect(crossAuto("Ll", "LL")).toEqual(["LL", "Ll"]);
    const syntheticShortOnly: CanonEntry = {
      name: "（测试用）确知纯合短毛猫", series: "black",
      d: ["DD", "Dd"], a: ["AA", "Aa"], l: ["LL"], white: 0,
    };
    const r = childrenWith(buildTarget(shortTabbyMale), syntheticShortOnly)!;
    expect(r.longPossible).toBe(false);
    expect(r.shortPossible).toBe(true);
    expect(r.nope).toContain("长毛狸花猫");
  });
});

describe("缺陷 B：后代花色列表不应被截断", () => {
  it("截断的前提：狸花公猫 × 三花猫 真实产出 18 种花色（> 14）", () => {
    const target = buildTarget(shortTabbyMale);
    const list = mateList(target);
    // mateIdx 3 = 三花猫（与 KidsPanel/组件测试保持一致）
    expect(list[3].name).toBe("三花猫");
    const r = childrenWith(target, list[3])!;
    expect(r.names.length).toBeGreaterThan(14);
    expect(r.names.length).toBe(18);
  });
});
