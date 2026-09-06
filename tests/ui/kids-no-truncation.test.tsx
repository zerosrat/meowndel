// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { buildTarget } from "../../src/genetics/solve";
import { childrenWith, mateList } from "../../src/genetics/children";
import type { UiState } from "../../src/genetics";
import KidsPanel from "../../src/ui/KidsPanel";

// 这个项目的 vite.config.ts 没有开 `test.globals`，@testing-library/react 的
// 自动清理靠检测全局 afterEach，检测不到就不会清理——不手动清理，
// render() 会在同一个 jsdom document 里跨用例累积（Ruling R18）。
afterEach(() => cleanup());

const tabbyMale: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

describe("KidsPanel 不应截断后代花色", () => {
  it("渲染出的 .catchip 数量必须等于 r.names.length（不是硬编码 18）", () => {
    const target = buildTarget(tabbyMale);
    const list = mateList(target);
    // 狸花公猫 × 三花猫（配偶索引 3），实测产出 18 种花色，
    // 旧代码 `r.names.slice(0, 14)` 会把它截断到 14。
    const expected = childrenWith(target, list[3])!;
    expect(expected.names.length).toBeGreaterThan(14); // 前提：确有截断风险

    render(
      <KidsPanel ui={tabbyMale} target={target} mateIdx={3} onMate={() => {}} />
    );
    const chips = document.querySelectorAll(".catrow .catchip");
    expect(chips.length).toBe(expected.names.length);
  });
});
