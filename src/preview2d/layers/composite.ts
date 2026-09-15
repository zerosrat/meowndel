export type RGB = readonly [number, number, number];
export const COATS = {
  black: { label: "炭黑", color: [64, 61, 58] as RGB },
  blue: { label: "蓝灰", color: [126, 136, 145] as RGB },
  orange: { label: "暖橘", color: [218, 158, 96] as RGB },
};
export type Coat = keyof typeof COATS;
export type Stage = 0 | 1 | 2 | 3;
const WHITE: RGB = [239, 233, 221];
const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

/** Pigment is an explicit input, never selected from dark pixels of the old coat. */
export function compositePixel(pigment: RGB, white: number, broad: number, detail: number,
  feature: RGB, featureAlpha: number, stage: Stage): RGB {
  const light = stage >= 1 ? Math.max(0.28, Math.min(1.5, (broad / 0.52) ** 1.25)) : 1;
  return pigment.map((channel, i) => {
    const base = channel * (1 - white) + WHITE[i] * white;
    // A small additive light component keeps dark fur from swallowing every fine hair.
    const texture = stage >= 2 ? detail * (85 + base * 0.5) : 0;
    // Softer white-fur response; this is an art-directed material approximation.
    const shaded = channel * (1 - white) * light + WHITE[i] * white * Math.min(1.04, light ** .55) + texture;
    return clamp(stage === 3 ? shaded * (1 - featureAlpha) + feature[i] * featureAlpha : shaded);
  }) as unknown as RGB;
}
