import shortURL from '../../demos/cat-portrait/flat-assets/domestic-neutral-master.png';
import longURL from '../../demos/cat-portrait/flat-assets/domestic-long-neutral.png';
import { compose, furCoverage, whiteRanking, type Pixels, type ArtMasks } from './pixels';
import { STRIPES, PATCHES } from './paths';
import { domesticArtSpec, type DomesticArtSpec } from './spec';
import type { CoatSpec } from '../genetics';

const SIZE = 512;
const sourceCache = new Map<boolean, Promise<Pixels>>();
const maskCache = new Map<string, ArtMasks>();
const portraitCache = new Map<string, Promise<string>>();
function canvas() { const c = document.createElement('canvas'); c.width = c.height = SIZE; return c; }
function context(c: HTMLCanvasElement) { const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('Canvas unavailable'); return ctx; }
function boundedSet<K,V>(cache: Map<K,V>, key: K, value: V, max: number) {
  if (cache.size >= max) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
}
export function loadDomesticMaster(long: boolean): Promise<Pixels> {
  let pending = sourceCache.get(long);
  if (!pending) {
    pending = (async () => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve(); img.onerror = () => reject(new Error('Cat image unavailable'));
        img.src = long ? longURL : shortURL;
      });
      const c = canvas(), ctx = context(c); ctx.drawImage(img, 0, 0, SIZE, SIZE);
      return ctx.getImageData(0, 0, SIZE, SIZE);
    })();
    sourceCache.set(long, pending);
    pending.catch(() => sourceCache.delete(long));
  }
  return pending;
}
function pathMask(paths: string[], seed = 0): Uint8ClampedArray {
  const c = canvas(), ctx = context(c); ctx.scale(SIZE / 1000, SIZE / 1000);
  if (seed) ctx.translate((seed % 13 - 6) * 1.2, (seed % 7 - 3) * 1.2);
  ctx.fillStyle = '#fff'; for (const path of paths) ctx.fill(new Path2D(path));
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  return Uint8ClampedArray.from({ length: SIZE * SIZE }, (_, j) => data[j * 4 + 3]);
}
let stripes: Uint8ClampedArray | undefined;
export function domesticMasks(source: Pixels, spec: DomesticArtSpec): ArtMasks {
  const key = `${spec.long}:${spec.seed}`; const cached = maskCache.get(key); if (cached) return cached;
  const fur = new Float32Array(SIZE * SIZE);
  for (let j = 0; j < fur.length; j++) {
    const i = j * 4;
    if (source.data[i + 3]) fur[j] = furCoverage(source.data[i], source.data[i + 1], source.data[i + 2], j % SIZE / SIZE, Math.floor(j / SIZE) / SIZE);
  }
  const masks = { fur, whiteRank: whiteRanking(source, fur, spec.seed), stripe: stripes ??= pathMask(STRIPES), patches: pathMask(PATCHES, spec.seed) };
  boundedSet(maskCache, key, masks, 16); return masks;
}
export async function domesticPixels(spec: DomesticArtSpec): Promise<Pixels> {
  const source = await loadDomesticMaster(spec.long);
  return compose(source, domesticMasks(source, spec), spec);
}
export function domesticPortrait(coat: CoatSpec, seed: number): Promise<string> {
  const spec = domesticArtSpec(coat, seed);
  if (!spec) return Promise.reject(new Error('Unsupported cat appearance'));
  const cached = portraitCache.get(spec.key); if (cached) return cached;
  const pending = domesticPixels(spec).then(pixels => {
    const c = canvas(); context(c).putImageData(new ImageData(new Uint8ClampedArray(pixels.data), SIZE, SIZE), 0, 0);
    return c.toDataURL('image/png');
  });
  boundedSet(portraitCache, spec.key, pending, 96);
  pending.catch(() => { if (portraitCache.get(spec.key) === pending) portraitCache.delete(spec.key); });
  return pending;
}
