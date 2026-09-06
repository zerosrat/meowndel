// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { buildTarget } from "../../src/genetics/solve";
import type { UiState } from "../../src/genetics";
import KidsPanel from "../../src/ui/KidsPanel";

// 这个项目的 vite.config.ts 没有开 `test.globals`，@testing-library/react 的
// 自动清理靠检测全局 afterEach，检测不到就不会清理——不手动清理，
// render() 会在同一个 jsdom document 里跨用例累积。
afterEach(() => cleanup());

const longCat: UiState = {
  series: "black", dilute: false, tabby: true, white: 0, long: true, sex: "M",
};

// mateList(t) 对公猫返回 [黑猫, 狸花猫, 橘猫, 三花猫, 长毛狸花猫]，
// 长毛条目排在最后（mateIdx 4）；狸花猫（短毛）在 mateIdx 1。
describe("KidsPanel 毛长文案三分支", () => {
  it("长毛猫 × 长毛配偶 → 都会是长毛（新分支，修复前不可能出现）", () => {
    const target = buildTarget(longCat);
    render(<KidsPanel ui={longCat} target={target} mateIdx={4} onMate={() => {}} />);
    expect(screen.getByText(/都会是长毛/)).toBeTruthy();
  });

  it("长毛猫 × 短毛配偶 → 长毛短毛都可能", () => {
    const target = buildTarget(longCat);
    render(<KidsPanel ui={longCat} target={target} mateIdx={1} onMate={() => {}} />);
    expect(screen.getByText(/长毛短毛都可能/)).toBeTruthy();
  });
});
