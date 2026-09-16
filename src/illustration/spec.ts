import type { CoatSpec } from '../genetics/phenotype';
import { coatName } from '../genetics/naming';
export type RGB = readonly [number, number, number];
export interface DomesticArtSpec extends CoatSpec { key: string; label: string; seed: number }

// Explicit field mapping; names and breed guesses are never used as lookup keys.
export function domesticArtSpec(spec: CoatSpec, seed: number): DomesticArtSpec | null {
  if (!['black', 'orange', 'tortie'].includes(spec.series) ||
      typeof spec.dilute !== 'boolean' || typeof spec.tabby !== 'boolean' ||
      typeof spec.long !== 'boolean' || !Number.isInteger(spec.white) ||
      spec.white < 0 || spec.white > 4 || !Number.isFinite(seed)) return null;
  const normalized = { ...spec, tabby: spec.series === 'orange' || spec.tabby };
  const stableSeed = Math.trunc(seed) >>> 0;
  return {
    ...normalized, seed: stableSeed,
    key: [normalized.series, normalized.dilute, normalized.tabby, normalized.white, normalized.long, stableSeed].join(':'),
    label: (normalized.long ? '长毛' : '短毛') + coatName(normalized.series, normalized.dilute, normalized.tabby, normalized.white),
  };
}

export const PALETTE = {
  black: [85, 87, 86], blue: [140, 154, 174],
  tabby: [182, 161, 138], blueTabby: [170, 180, 192],
  stripe: [102, 84, 68], blueStripe: [99, 119, 143],
  orange: [245, 179, 105], cream: [242, 213, 166],
  orangeStripe: [203, 120, 62], creamStripe: [211, 173, 117],
  white: [255, 246, 232],
} as const satisfies Record<string, RGB>;

export function colors(spec: CoatSpec) {
  return {
    dark: spec.dilute ? PALETTE.blue : PALETTE.black,
    ground: spec.dilute ? PALETTE.blueTabby : PALETTE.tabby,
    stripe: spec.dilute ? PALETTE.blueStripe : PALETTE.stripe,
    orange: spec.dilute ? PALETTE.cream : PALETTE.orange,
    orangeStripe: spec.dilute ? PALETTE.creamStripe : PALETTE.orangeStripe,
  };
}
