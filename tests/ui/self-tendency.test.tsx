// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import SelfPanel from "../../src/ui/SelfPanel";
import { WHITE_TENDENCY } from "../../src/genetics";
import type { UiState } from "../../src/genetics";

// 这个项目的 vite.config.ts 没有开 `test.globals`，@testing-library/react 的
// 自动清理靠检测全局 afterEach，检测不到就不会清理——不手动清理，
// render() 会在同一个 jsdom document 里跨用例累积。
afterEach(() => cleanup());

const almostAllWhite: UiState = {
  series: "black", dilute: false, tabby: true, white: 4, long: false, sex: "M",
};

describe("SelfPanel 展示白斑倾向性文案而非硬性结论", () => {
  it("几乎全白等级展示对应的 WHITE_TENDENCY 文案", () => {
    render(<SelfPanel ui={almostAllWhite} seed={7} />);
    expect(screen.getByText(new RegExp(WHITE_TENDENCY[4]))).toBeTruthy();
  });
});
