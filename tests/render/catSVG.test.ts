import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { catSVG } from "../../src/render/catSVG";

const golden = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));

interface StateCase { i: number; s: any }
const cases: StateCase[] = golden.states.map((s: any, i: number) => ({ i, s }));

describe("catSVG 输出与旧引擎逐字一致", () => {
  it.each(cases)("state #$i", ({ s }) => {
    const spec = {
      series: s.ui.series, dilute: s.ui.dilute,
      tabby: s.ui.series === "orange" ? true : s.ui.tabby,
      white: s.ui.white, long: s.ui.long,
    };
    expect(catSVG(spec, 7, 190)).toBe(s.selfSvg);
  });
});
