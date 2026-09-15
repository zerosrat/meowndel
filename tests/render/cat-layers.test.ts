import { describe, expect, it } from "vitest";
import { COATS, compositePixel, type RGB } from "../../src/preview2d/layers/composite";
const feature: RGB = [183, 141, 99];
describe("neutral plate layer compositor", () => {
  it("starts with exact chosen flat pigment rather than sampled old coat", () => {
    for (const { color } of Object.values(COATS)) {
      expect(compositePixel(color, 0, .3, .2, feature, 0, 0)).toEqual(color);
    }
  });
  it("keeps full white pixels identical across all pigments", () => {
    for (const light of [.2, .5, .8]) {
      const results = Object.values(COATS).map(({color}) => compositePixel(color, 1, light, .07, feature, 0, 3));
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    }
  });
  it("preserves eye and nose colors independently of pigment and illumination", () => {
    for (const {color} of Object.values(COATS)) {
      expect(compositePixel(color, 0, .2, -.3, feature, 1, 3)).toEqual(feature);
    }
  });
  it("adds form and texture only at their respective stages", () => {
    const c = COATS.blue.color;
    const flat = compositePixel(c, 0, .4, .1, feature, 0, 0);
    const shaded = compositePixel(c, 0, .4, .1, feature, 0, 1);
    const textured = compositePixel(c, 0, .4, .1, feature, 0, 2);
    expect(shaded[0]).toBeLessThan(flat[0]);
    expect(textured[0]).toBeGreaterThan(shaded[0]);
    expect(compositePixel(c, 0, .4, -.1, feature, 0, 1)).toEqual(shaded);
  });
  it("bounds the output even at extreme light and detail", () => {
    for (const light of [0, 1]) for (const detail of [-1, 1]) {
      const result = compositePixel(COATS.orange.color, .5, light, detail, feature, .2, 3);
      expect(result.every(x => Number.isInteger(x) && x >= 0 && x <= 255)).toBe(true);
    }
  });
});
