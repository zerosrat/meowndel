// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParentsPanel from "../../src/ui/ParentsPanel";
import { buildTarget, solveParents } from "../../src/genetics/solve";
import type { UiState } from "../../src/genetics";

// 这个项目的 vite.config.ts 没有开 `test.globals`，@testing-library/react 的
// 自动清理靠检测全局 afterEach，检测不到就不会清理——不手动清理，
// render() 会在同一个 jsdom document 里跨用例累积，chipFor 的按索引取值就会错位。
afterEach(() => cleanup());

const tortie: UiState = {
  series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "F",
};

function chipFor(name: string, which: 0 | 1) {
  // 0 = 妈妈组，1 = 爸爸组（渲染顺序与 legacy 一致）
  return screen.getAllByText(name)[which].closest(".catchip") as HTMLElement;
}

describe("点选一边，另一边不兼容的候选灰掉", () => {
  it("选橘妈妈后，爸爸行只剩奶牛猫、狸花白猫——O 与 S 两个位点同时收紧", async () => {
    const user = userEvent.setup();
    const target = buildTarget(tortie);
    render(<ParentsPanel ui={tortie} target={target} res={solveParents(target)} />);

    // 未选择时，爸爸行的橘猫是正常的
    expect(chipFor("橘猫", 1).className).not.toMatch(/\bno\b/);

    await user.click(chipFor("橘猫", 0));   // 点妈妈行的橘猫

    // 橘爸 × 橘妈生不出三花 → 爸爸行的橘色系全部灰掉（O 位点）
    expect(chipFor("橘猫", 1).className).toMatch(/\bno\b/);
    expect(chipFor("奶油猫", 1).className).toMatch(/\bno\b/);
    // 无白的非橘猫同样灰掉：三花身上有白，双方都无白就生不出来（S 位点）
    expect(chipFor("黑猫", 1).className).toMatch(/\bno\b/);
    // 非橘 + 带白的才仍然可能
    expect(chipFor("奶牛猫", 1).className).not.toMatch(/\bno\b/);
  });

  it("再点一次取消选择，全部恢复", async () => {
    const user = userEvent.setup();
    const target = buildTarget(tortie);
    render(<ParentsPanel ui={tortie} target={target} res={solveParents(target)} />);

    await user.click(chipFor("橘猫", 0));
    await user.click(chipFor("橘猫", 0));
    expect(chipFor("橘猫", 1).className).not.toMatch(/\bno\b/);
  });

  it("主体猫变了，旧选择必须清空", async () => {
    const user = userEvent.setup();
    const t1 = buildTarget(tortie);
    const { rerender } = render(
      <ParentsPanel ui={tortie} target={t1} res={solveParents(t1)} />
    );
    await user.click(chipFor("橘猫", 0));
    expect(chipFor("橘猫", 1).className).toMatch(/\bno\b/);

    // 切换到一只完全不同的猫
    const black: UiState = {
      series: "black", dilute: false, tabby: false, white: 0, long: false, sex: "M",
    };
    const t2 = buildTarget(black);
    rerender(<ParentsPanel ui={black} target={t2} res={solveParents(t2)} />);

    // 上一只猫的选择不得残留，继续灰化新结果
    expect(chipFor("橘猫", 1).className).not.toMatch(/\bno\b/);
  });
});
