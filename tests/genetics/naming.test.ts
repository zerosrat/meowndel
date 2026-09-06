import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { coatName } from "../../src/genetics/naming";
import { specOf } from "../../src/genetics/phenotype";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

describe("coatName 与旧引擎逐字一致", () => {
  it.each(golden.units.coatName)("coatName($args) -> $out", (({ args, out }: any) => {
    expect(coatName(args[0], args[1], args[2], args[3])).toBe(out);
  }) as any);
});

describe("specOf 与旧引擎逐字一致", () => {
  it.each(golden.units.specOf)("specOf($args)", (({ args, out }: any) => {
    expect(specOf(args[0], args[1], args[2], args[3], args[4], args[5])).toEqual(out);
  }) as any);
});
