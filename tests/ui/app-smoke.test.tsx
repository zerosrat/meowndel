// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";

// 这个项目的 vite.config.ts 没有开 `test.globals`，@testing-library/react 的
// 自动清理靠检测全局 afterEach，检测不到就不会清理——不手动清理，
// render() 会在同一个 jsdom document 里跨用例累积。
afterEach(() => cleanup());

describe("App 渲染冒烟", () => {
  it("三个面板与快捷卡都在", () => {
    const { container } = render(<App />);
    expect(screen.getByText("这一只")).toBeTruthy();
    expect(screen.getByText("上一代")).toBeTruthy();
    expect(screen.getByText("下一代")).toBeTruthy();
    // 默认状态是公猫，下一代面板会出现「三花猫」配偶 tab，
    // 它的可访问名同样含「三花」，所以查「三花」按钮要限定在 .picks 容器内，
    // 否则会命中两个按钮（快捷卡 + 配偶 tab）。
    const picks = container.querySelector(".picks") as HTMLElement;
    expect(within(picks).getByRole("button", { name: /三花/ })).toBeTruthy();
  });

  it("点快捷卡「三花」后，性别被锁为母猫并出现说明", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const picks = container.querySelector(".picks") as HTMLElement;
    await user.click(within(picks).getByRole("button", { name: /三花/ }));
    expect(screen.getByText(/几乎必然是母猫/)).toBeTruthy();
  });

  it("每张快捷卡都点得动，且不抛错", async () => {
    const user = userEvent.setup();
    render(<App />);
    const picks = document.querySelectorAll(".pick");
    expect(picks.length).toBe(12);
    for (const b of Array.from(picks)) {
      await user.click(b as HTMLElement);
    }
  });
});
