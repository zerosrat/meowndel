// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ParentsPanel from "../../src/ui/ParentsPanel";
import { buildTarget, solveParents, canonAsParent } from "../../src/genetics/solve";
import { CANON } from "../../src/genetics/catalog";
import type { UiState } from "../../src/genetics";

// 这个项目的 vite.config.ts 没有开 `test.globals`，@testing-library/react 的
// 自动清理靠检测全局 afterEach，检测不到就不会清理——不手动清理，
// render() 会在同一个 jsdom document 里跨用例累积。
afterEach(() => cleanup());

const orangeMale: UiState = {
  series: "orange", dilute: false, tabby: true, white: 0, long: false, sex: "M",
};

function renderPanel(ui: UiState) {
  const target = buildTarget(ui);
  const res = solveParents(target);
  render(<ParentsPanel ui={ui} target={target} res={res} />);
  return res;
}

describe("爸妈画廊完整渲染", () => {
  it("前提：橘公猫的合法父本超过 6 个（旧代码会截断）", () => {
    const res = solveParents(buildTarget(orangeMale));
    expect(CANON.filter((c) => canonAsParent(c, "father", res)).length).toBeGreaterThan(6);
  });

  it("每一只 CANON 花色都出现在页面上，一只不少", () => {
    renderPanel(orangeMale);
    for (const c of CANON) {
      // 每个花色在"妈妈"和"爸爸"两组里各出现一次
      expect(screen.getAllByText(c.name).length, `${c.name} 应出现 2 次`).toBe(2);
    }
  });

  it("渲染出的候选总数 = CANON 数量 × 2（两个角色）", () => {
    renderPanel(orangeMale);
    const chips = document.querySelectorAll(".catchip");
    expect(chips.length).toBe(CANON.length * 2);
  });
});
