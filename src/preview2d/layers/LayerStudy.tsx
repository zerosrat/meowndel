import { useEffect, useRef, useState } from "react";
import { COATS, compositePixel, type Coat, type Stage } from "./composite";
import { loadPlates, neutralUrl, SIZE } from "./plates";
import "./layers.css";

const STAGES = ["底色", "+ 明暗", "+ 毛发细节", "+ 五官"];
function LayerCat({ coat, stage, white }: { coat: Coat; stage: Stage; white: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let disposed = false;
    loadPlates().then(plates => {
      if (disposed || !ref.current) return;
      const ctx = ref.current.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      const result = ctx.createImageData(SIZE, SIZE);
      const s = plates.source.data;
      for (let n = 0; n < SIZE * SIZE; n++) {
        const p = n * 4;
        if (!s[p + 3]) continue;
        const color = compositePixel(COATS[coat].color, white ? plates.white[p + 3] / 255 : 0,
          plates.broad[n], plates.detail[n], [s[p], s[p + 1], s[p + 2]], plates.features[p + 3] / 255, stage);
        result.data[p] = color[0]; result.data[p + 1] = color[1]; result.data[p + 2] = color[2];
        result.data[p + 3] = s[p + 3];
      }
      ctx.putImageData(result, 0, 0);
      setState("ready");
    }).catch(() => { if (!disposed) setState("error"); });
    return () => { disposed = true; };
  }, [coat, stage, white]);
  return <figure className="layer-card">
    <canvas ref={ref} width={SIZE} height={SIZE} role="img" aria-label={`${COATS[coat].label}猫，${STAGES[stage]}`} data-state={state} />
    {state !== "ready" && <p role="status">{state === "error" ? "底稿加载失败，请刷新重试。" : "正在合成图层…"}</p>}
    <figcaption><strong>{COATS[coat].label}</strong><span>{white ? "固定白斑" : "无白斑"} · 同一明暗底稿</span></figcaption>
  </figure>;
}
export default function LayerStudy() {
  const [stage, setStage] = useState<Stage>(3);
  const [white, setWhite] = useState(true);
  return <main className="layer-study">
    <header><a href="?">喵德尔 / 美术实验</a><a href="?preview=cat2d">查看上一版 ↗</a></header>
    <p className="layer-kicker">LAYER STUDY / 03</p>
    <h1>换的是毛色，<br className="layer-mobile-break" />不是光照。</h1>
    <p className="layer-lead">同一张无花纹中性底稿，三种独立底色。先看合成结果，再逐层拆开检查。</p>
    <section className="layer-toolbar" aria-label="图层控制">
      <div role="group" aria-label="合成阶段">{STAGES.map((label, i) => <button key={label} aria-pressed={stage === i} onClick={() => setStage(i as Stage)}>{i + 1}. {label}</button>)}</div>
      <label><input type="checkbox" checked={white} onChange={e => setWhite(e.target.checked)} />独立白斑层</label>
    </section>
    <div className="layer-grid">{(Object.keys(COATS) as Coat[]).map(coat => <LayerCat key={coat} coat={coat} stage={stage} white={white} />)}</div>
    <p className="layer-disclaimer">暖橘只用于配色压力测试，尚未添加虎斑，不代表完整遗传表型。此页没有动画，也没有接入遗传引擎。</p>
    <details className="layer-explain"><summary>查看中性底稿与分层边界</summary>
      <div><img src={neutralUrl} alt="无花纹中性灰猫底稿" /><section>
        <h2>这一版怎样合成</h2>
        <ol><li>底色：程序指定的平涂颜色，加独立空间白斑遮罩。</li><li>明暗：中性底稿的低频亮度，只描述体积。</li><li>细节：中性底稿减去低频亮度，保留局部毛发起伏。</li><li>五官：眼睛、鼻子、内耳原色按空间遮罩覆盖。</li></ol>
        <p>这是从生成的中性底稿派生的程序分层，不是画师分别绘制的四张图。白斑边缘、五官遮罩和深浅毛发的光照响应仍需美术验收。</p>
      </section></div>
    </details>
    <footer>待验收 / 重点看黑毛体积、灰毛质感、橘毛是否像染色，以及五官和白斑边缘。</footer>
  </main>;
}
