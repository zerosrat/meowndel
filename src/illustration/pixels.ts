import { WHITE_FRAC } from '../genetics/loci';
import { colors, PALETTE, type DomesticArtSpec, type RGB } from './spec';

export interface Pixels { data: Uint8ClampedArray; width: number; height: number }
export interface ArtMasks {
  fur: Float32Array; whiteRank: Float32Array; stripe: Uint8ClampedArray; patches: Uint8ClampedArray;
}
const clamp = (x: number) => Math.max(0, Math.min(1, x));

export function furCoverage(r: number, g: number, b: number, x: number, y: number): number {
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const eye = ((x - .394) / .036) ** 2 + ((y - .304) / .043) ** 2 < 1.2 ||
    ((x - .556) / .041) ** 2 + ((y - .341) / .040) ** 2 < 1.2;
  if ((eye && r > 240 && g > 240 && b > 240) || chroma > 19 || r < 115) return 0;
  return clamp((20 - chroma) / 9);
}

// White is ranked by anatomical distance, then calibrated against the actual
// colorable fur area. Every higher level contains every lower-level pixel.
export function whiteRanking(source: Pixels, fur: Float32Array, seed: number): Float32Array {
  const { width, height, data } = source;
  const bins = 4096, histogram = new Float64Array(bins), binIndex = new Uint16Array(fur.length);
  const dx = ((seed * 1664525 + 1013904223) >>> 0) / 4294967296 * .04 - .02;
  const dy = ((seed * 22695477 + 1) >>> 0) / 4294967296 * .025 - .0125;
  let total = 0;
  for (let j = 0; j < fur.length; j++) {
    const weight = fur[j] * data[j * 4 + 3] / 255;
    if (!weight) continue;
    const x = (j % width) / width, y = Math.floor(j / width) / height;
    const ellipse = (cx: number, cy: number, rx: number, ry: number) => ((x - cx - dx) / rx) ** 2 + ((y - cy - dy) / ry) ** 2;
    const distance = Math.min(ellipse(.465, .60, .145, .24), ellipse(.46, .956, .24, .105),
      ellipse(.457, .428, .23, .095), ellipse(.838, .495, .065, .072));
    const ripple = .015 * Math.sin(x * 80 + seed % 17) * Math.sin(y * 65);
    const bin = Math.min(bins - 1, Math.max(0, Math.floor((distance + ripple) * 300)));
    binIndex[j] = bin; histogram[bin] += weight; total += weight;
  }
  const cumulative = new Float64Array(bins); let sum = 0;
  for (let b = 0; b < bins; b++) { cumulative[b] = (sum + histogram[b] / 2) / (total || 1); sum += histogram[b]; }
  const out = new Float32Array(fur.length);
  for (let j = 0; j < fur.length; j++) out[j] = fur[j] ? cumulative[binIndex[j]] : 1;
  return out;
}

function mix(a: RGB, b: RGB, t: number): RGB { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

export function compose(source: Pixels, masks: ArtMasks, spec: DomesticArtSpec): Pixels {
  const out = new Uint8ClampedArray(source.data), palette = colors(spec);
  for (let j = 0; j < masks.fur.length; j++) {
    const coverage = masks.fur[j], i = j * 4;
    if (!coverage || !source.data[i + 3]) continue;
    const line = masks.stripe[j] / 255, patch = masks.patches[j] / 255;
    const blackPart = spec.tabby ? mix(palette.ground, palette.stripe, line) : palette.dark;
    const orangePart = mix(palette.orange, palette.orangeStripe, line);
    let pigment = spec.series === 'orange' ? orangePart : spec.series === 'tortie' ? mix(blackPart, orangePart, patch) : blackPart;
    if (spec.white > 0) {
      const white = clamp((WHITE_FRAC[spec.white] - masks.whiteRank[j]) / .004 + .5);
      pigment = mix(pigment, PALETTE.white, white);
    }
    const shade = Math.min(1.08, (source.data[i] + source.data[i + 1] + source.data[i + 2]) / 3 / 222);
    for (let c = 0; c < 3; c++) out[i + c] = source.data[i + c] * (1 - coverage) + Math.min(255, pigment[c] * shade) * coverage;
  }
  return { data: out, width: source.width, height: source.height };
}
