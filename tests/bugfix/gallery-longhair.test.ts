import { describe, it, expect } from "vitest";
import { CANON, canonSpec } from "../../src/genetics/catalog";

describe("画廊能画出长毛猫", () => {
  it("CANON 里有长毛条目", () => {
    expect(CANON.some((c) => c.l.length === 1 && c.l[0] === "ll")).toBe(true);
  });

  it("canonSpec 按 l 字段决定毛长，不再硬编码 false", () => {
    const longEntry = CANON.find((c) => c.l[0] === "ll")!;
    expect(canonSpec(longEntry).long).toBe(true);

    const shortEntry = CANON.find((c) => c.name === "狸花猫")!;
    expect(canonSpec(shortEntry).long).toBe(false);
  });
});
