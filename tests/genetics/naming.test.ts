import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { coatName } from "../../src/genetics/naming";
import { specOf } from "../../src/genetics/phenotype";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

interface UnitCase { args: any[]; out: any }
const coatNameCases: UnitCase[] = golden.units.coatName;
const specOfCases: UnitCase[] = golden.units.specOf;

describe("coatName 与旧引擎逐字一致", () => {
  it.each(coatNameCases)("coatName($args) -> $out", ({ args, out }) => {
    expect(coatName(args[0], args[1], args[2], args[3])).toBe(out);
  });
});

describe("specOf 与旧引擎逐字一致", () => {
  it.each(specOfCases)("specOf($args)", ({ args, out }) => {
    expect(specOf(args[0], args[1], args[2], args[3], args[4], args[5])).toEqual(out);
  });
});
