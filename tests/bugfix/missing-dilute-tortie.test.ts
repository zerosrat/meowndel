import { describe, it, expect } from "vitest";
import { CANON, canonSpec } from "../../src/genetics/catalog";
import { coatName } from "../../src/genetics/naming";

describe("命名器能生成的花色，画廊里都要有对应条目", () => {
  it("淡玳瑁与淡三花在 CANON 中", () => {
    const names = CANON.map((c) => c.name);
    expect(names).toContain("淡玳瑁猫");
    expect(names).toContain("淡三花猫");
  });

  it("每个 CANON 条目的名字与其规格算出的名字一致", () => {
    for (const c of CANON) {
      const sp = canonSpec(c);
      const expected = (sp.long ? "长毛" : "") + coatName(sp.series, sp.dilute, sp.tabby, sp.white);
      expect(expected, `条目 ${c.name} 名实不符`).toBe(c.name);
    }
  });

  it("CANON 里没有重名条目", () => {
    const names = CANON.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
