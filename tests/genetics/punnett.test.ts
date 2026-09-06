import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { crossAuto, crossO } from "../../src/genetics/punnett";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

interface UnitCase { args: any[]; out: any }
const crossAutoCases: UnitCase[] = golden.units.crossAuto;
const crossOCases: UnitCase[] = golden.units.crossO;

describe("crossAuto 与旧引擎逐字一致", () => {
  it.each(crossAutoCases)("crossAuto($args)", ({ args, out }) => {
    // 顺序也是契约，用 toEqual 而非 toContain
    expect(crossAuto(args[0], args[1])).toEqual(out);
  });
});

describe("crossO 与旧引擎逐字一致", () => {
  it.each(crossOCases)("crossO($args)", ({ args, out }) => {
    expect(crossO(args[0], args[1])).toEqual(out);
  });
});
