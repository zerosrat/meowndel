import neutralUrl from "../assets/domestic-neutral.png";
export { neutralUrl };
export const SIZE = 900;
type Plates = { source: ImageData; broad: Float32Array; detail: Float32Array; white: Uint8ClampedArray; features: Uint8ClampedArray };
let pending: Promise<Plates> | undefined;
function surface() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("浏览器未提供 Canvas 2D");
  return { canvas, ctx };
}
function mask(draw: (ctx: CanvasRenderingContext2D) => void, feather: number) {
  const raw = surface();
  raw.ctx.scale(SIZE / 1000, SIZE / 1000);
  raw.ctx.fillStyle = "white";
  draw(raw.ctx);
  const blurred = surface();
  blurred.ctx.filter = `blur(${feather}px)`;
  blurred.ctx.drawImage(raw.canvas, 0, 0);
  return blurred.ctx.getImageData(0, 0, SIZE, SIZE).data;
}
export function loadPlates(): Promise<Plates> {
  if (pending) return pending;
  pending = (async () => {
    const image = new Image();
    image.src = neutralUrl;
    await image.decode();
    const src = surface();
    src.ctx.drawImage(image, 0, 0, SIZE, SIZE);
    const source = src.ctx.getImageData(0, 0, SIZE, SIZE);
    const soft = surface();
    soft.ctx.filter = "blur(4px)";
    soft.ctx.drawImage(src.canvas, 0, 0);
    const low = soft.ctx.getImageData(0, 0, SIZE, SIZE).data;
    const broad = new Float32Array(SIZE * SIZE);
    const detail = new Float32Array(SIZE * SIZE);
    for (let n = 0; n < broad.length; n++) {
      const p = n * 4;
      const y = (source.data[p] * .2126 + source.data[p + 1] * .7152 + source.data[p + 2] * .0722) / 255;
      // Canvas returns unpremultiplied color, retaining form near the alpha silhouette.
      broad[n] = (low[p] * .2126 + low[p + 1] * .7152 + low[p + 2] * .0722) / 255;
      detail[n] = y - broad[n];
    }
    // Authored spatial mask, independent of illumination or selected pigment.
    // Illustrative fixed markings only: not a genotype-to-white-position model.
    const white = mask(ctx => {
      ctx.fill(new Path2D("M260 163 Q271 195 266 230 Q290 257 315 277 Q340 321 339 369 Q349 409 328 450 L296 480 L279 504 L262 478 L248 496 L230 473 L214 486 L195 455 Q160 405 137 321 Q148 290 188 278 Q218 269 236 233 Z"));
      ctx.fill(new Path2D("M120 792 Q172 825 249 803 L256 945 L129 945 Z M267 835 Q301 851 346 824 L347 946 L219 946 Z M510 792 Q569 823 641 799 L630 876 L501 874 Z M666 828 Q719 851 788 833 L803 938 L665 938 Z"));
    }, 2);
    const features = mask(ctx => {
      for (const [x,y,rx,ry,angle] of [[207,198,23,22,-.2],[302,220,22,21,.2],[250,264,21,17,0]]) {
        ctx.beginPath(); ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2); ctx.fill();
      }
      ctx.fill(new Path2D("M158 126 Q160 94 186 48 Q205 46 219 118 L216 143 Q186 115 158 126 Z M321 142 Q350 111 388 94 Q391 124 365 159 L349 171 Z"));
    }, 1.6);
    return { source, broad, detail, white, features };
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
