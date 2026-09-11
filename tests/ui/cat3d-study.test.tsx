// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CatStudy from "../../src/preview3d/CatStudy";

const mocks = vi.hoisted(() => ({
  setCoat: vi.fn(), pet: vi.fn(), reset: vi.fn(), turn: vi.fn(), zoom: vi.fn(), dispose: vi.fn(), fail: false,
}));
vi.mock("../../src/preview3d/scene", () => ({
  STUDY_COATS: { tuxedo: { label: "黑白" }, black: { label: "纯黑" } },
  createStudyScene: (_canvas: HTMLCanvasElement, ready: (s: object) => void) => {
    if (mocks.fail) throw new Error("WebGL unavailable");
    ready({ triangles: 100, calls: 5, geometries: 4 });
    return mocks;
  },
}));
beforeEach(() => { vi.clearAllMocks(); mocks.fail = false; });
afterEach(cleanup);

describe("single-cat 3D controls", () => {
  it("keeps visible attribution, the source, license and adaptation notice", () => {
    render(<CatStudy />);
    expect(screen.getByRole("link", { name: "Fripouille — guillaume bolis" }).getAttribute("href")).toContain("0ab14bf98e754f8d90fe1bf1c84ca66c");
    expect(screen.getByRole("link", { name: "CC BY 4.0" }).getAttribute("href")).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(screen.getByText(/本站修复导出/)).toBeTruthy();
  });
  it("changes the same scene coat and exposes selected state", () => {
    render(<CatStudy />);
    fireEvent.click(screen.getByRole("button", { name: /纯黑/ }));
    expect(mocks.setCoat).toHaveBeenCalledWith("black");
    expect(screen.getByRole("button", { name: /纯黑/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /黑白/ }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByLabelText("可转动查看的短毛纯黑猫")).toBeTruthy();
  });
  it("provides button alternatives to gestures and disposes on unmount", () => {
    const view = render(<CatStudy />);
    fireEvent.click(screen.getByRole("button", { name: "向左转动" }));
    fireEvent.click(screen.getByRole("button", { name: "向右转动" }));
    fireEvent.click(screen.getByRole("button", { name: "重置视角" }));
    fireEvent.click(screen.getByRole("button", { name: "放大" }));
    fireEvent.click(screen.getByRole("button", { name: "缩小" }));
    fireEvent.click(screen.getByRole("button", { name: /和它打个招呼/ }));
    expect(mocks.turn.mock.calls).toEqual([[-1], [1]]);
    expect(mocks.reset).toHaveBeenCalledOnce();
    expect(mocks.zoom.mock.calls).toEqual([[1], [-1]]);
    expect(mocks.pet).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("它注意到你了");
    view.unmount();
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
  it("offers a usable SVG fallback if WebGL initialization fails", () => {
    mocks.fail = true;
    render(<CatStudy />);
    expect(screen.getByRole("alert").textContent).toContain("当前设备无法显示");
    expect(screen.getByRole("link", { name: "返回 SVG 样板" }).getAttribute("href")).toBe("?preview=cat");
    expect(screen.getByRole("button", { name: /和它打个招呼/ }).hasAttribute("disabled")).toBe(true);
  });
});
