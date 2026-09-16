// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CatSample from "../../src/preview/CatSample";
import CatIllustration from "../../src/preview/CatIllustration";

afterEach(cleanup);

describe("单猫样板与既有表型规则保持一致", () => {
  it("从纯色蓝猫切到橘色系，恢复虎斑并保留稀释属性", async () => {
    const user = userEvent.setup();
    render(<CatSample />);
    await user.click(screen.getByRole("button", { name: "黑色系" }));
    await user.click(screen.getByRole("button", { name: "无纹路" }));
    await user.click(screen.getByRole("button", { name: "淡色" }));
    expect(screen.getByRole("img", { name: "短毛蓝猫" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "橘色系" }));
    expect(screen.getByRole("img", { name: "短毛奶油猫" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "无纹路" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "有纹路" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("连续切换白斑以后，选择、猫名与反馈描述同一最新状态", async () => {
    const user = userEvent.setup();
    render(<CatSample />);
    const white = screen.getByRole("group", { name: /白色占多少/ });
    for (const name of ["无白", "零星白", "约一半", "大部分", "几乎全白", "无白"]) {
      await user.click(within(white).getByRole("button", { name }));
    }
    expect(within(white).getAllByRole("button", { pressed: true })).toHaveLength(1);
    expect(within(white).getByRole("button", { name: "无白", pressed: true })).toBeTruthy();
    expect(screen.getByRole("img", { name: "短毛橘猫" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("无白");
    expect(screen.getByRole("status").textContent).toContain("位置仅为示意");
    await user.click(screen.getByRole("button", { name: "长毛" }));
    expect(screen.getByRole("img", { name: "长毛橘猫" })).toBeTruthy();
  });

  it("多只插画的渐变与遮罩引用各自存在且不串用", () => {
    const spec = { series: "tortie" as const, dilute: false, tabby: false, white: 2, long: true };
    const { container } = render(<><CatIllustration spec={spec} /><CatIllustration spec={spec} /></>);
    const ids = Array.from(container.querySelectorAll("[id]"), el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg")) {
      const localIds = new Set(Array.from(svg.querySelectorAll("[id]"), el => el.id));
      for (const el of svg.querySelectorAll("[fill], [clip-path]")) {
        for (const attr of ["fill", "clip-path"]) {
          const reference = el.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1];
          if (reference) expect(localIds.has(reference)).toBe(true);
        }
      }
    }
  });
});
