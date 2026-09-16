// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import CatIllustration from "../../src/preview2d/CatIllustration";

afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("illustration study", () => {
  it("switches coat without changing the source pose", () => {
    render(<CatIllustration />);
    const sources = [...document.querySelectorAll("image")].map(x => x.getAttribute("href"));
    fireEvent.click(screen.getByRole("button", { name: /灰白/ }));
    expect(screen.getByRole("button", { name: /灰白/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("灰白田园猫");
    expect([...document.querySelectorAll("image")].slice(0, 4).map(x => x.getAttribute("href"))).toEqual(sources.slice(0, 4));
  });
  it("blinks on touch/click, resets after repeated interaction, and cleans up", () => {
    vi.useFakeTimers();
    const { unmount } = render(<CatIllustration />);
    const cat = screen.getByRole("button", { name: "轻触猫咪，让它眨眼" });
    fireEvent.click(cat);
    expect(cat.getAttribute("data-blinking")).toBe("true");
    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(cat);
    act(() => vi.advanceTimersByTime(400));
    expect(cat.getAttribute("data-blinking")).toBe("true");
    act(() => vi.advanceTimersByTime(250));
    expect(cat.getAttribute("data-blinking")).toBe("false");
    fireEvent.click(cat);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("lets the user stop idle movement", () => {
    render(<CatIllustration />);
    fireEvent.click(screen.getByRole("button", { name: "呼吸动效：开" }));
    expect(document.querySelector(".ink-breathing")).toBeNull();
  });
});
