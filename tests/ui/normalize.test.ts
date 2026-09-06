import { describe, it, expect } from "vitest";
import { normalizeUi } from "../../src/ui/types";
import type { UiState } from "../../src/genetics";

describe("UI 归一化复现 legacy render() 的两条规则", () => {
  it("玳瑁强制为母猫", () => {
    const r = normalizeUi({ series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "M" });
    expect(r.sex).toBe("F");
  });
  it("橘色强制带虎斑纹", () => {
    const r = normalizeUi({ series: "orange", dilute: false, tabby: false, white: 0, long: false, sex: "M" });
    expect(r.tabby).toBe(true);
  });
  it("其余情况原样返回", () => {
    const ui: UiState = { series: "black", dilute: true, tabby: false, white: 3, long: true, sex: "?" };
    expect(normalizeUi({ ...ui })).toEqual(ui);
  });
});
