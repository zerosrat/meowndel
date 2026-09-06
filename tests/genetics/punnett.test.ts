import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { crossAuto, crossO } from "../../src/genetics/punnett";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

describe("crossAuto 与旧引擎逐字一致", () => {
  it.each(golden.units.crossAuto)("crossAuto($args)", (({ args, out }: any) => {
    // 顺序也是契约，用 toEqual 而非 toContain
    expect(crossAuto(args[0], args[1])).toEqual(out);
  }) as any);
});

describe("crossO 与旧引擎逐字一致", () => {
  it.each(golden.units.crossO)("crossO($args)", (({ args, out }: any) => {
    expect(crossO(args[0], args[1])).toEqual(out);
  }) as any);
});
