import { useEffect, useRef, useState } from "react";
import { createStudyScene, STUDY_COATS, type StudyCoat, type StudyScene, type StudyStats } from "./scene";
import "./study.css";

export default function CatStudy() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<StudyScene | null>(null);
  const [coat, setCoat] = useState<StudyCoat>("tuxedo");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [stats, setStats] = useState<StudyStats>();
  const [notice, setNotice] = useState("拖动看看它，或者轻轻打个招呼。");
  const pointer = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    let active = true;
    try {
      scene.current = createStudyScene(canvas.current!, value => {
        if (active) { setStats(value); setStatus("ready"); }
      }, () => { if (active) setStatus("error"); });
    } catch {
      setStatus("error");
    }
    return () => { active = false; scene.current?.dispose(); scene.current = null; };
  }, []);
  const pick = (value: StudyCoat) => {
    setCoat(value);
    scene.current?.setCoat(value);
    setNotice(`现在是${STUDY_COATS[value].label}。模型、眼睛和姿态保持不变。`);
  };
  const pet = () => {
    if (status !== "ready") return;
    scene.current?.pet();
    setNotice("它注意到你了。你好，小猫！");
  };
  return <main className="cat-study">
    <header className="study-header">
      <a href={window.location.pathname} className="study-brand"><span>m.</span> 喵德尔</a>
      <nav aria-label="预览导航"><a href="?preview=cat">SVG 样板</a><span>CAT STUDY / 03</span></nav>
    </header>
    <section className="study-intro"><p className="study-eyebrow">一只猫，慢慢认识</p><h1>你好，小猫。</h1><p>看看它的侧脸，换一身毛色。它也正在看着你。</p></section>
    <div className="study-layout">
      <section className="study-stage" aria-label="可交互的三维猫预览">
        <div className="study-stage-top"><span className="study-live">可转动的猫</span><span>短毛 / {coat === "tuxedo" ? "黑白" : "纯黑"}</span></div>
        <canvas ref={canvas} className="study-canvas" aria-label={`可转动查看的短毛${STUDY_COATS[coat].label}猫`} aria-describedby="study-canvas-help"
          onPointerDown={e => { pointer.current = { x: e.clientX, y: e.clientY }; }}
          onPointerCancel={() => { pointer.current = null; }}
          onPointerUp={e => {
            const start = pointer.current; pointer.current = null;
            if (start && Math.hypot(e.clientX-start.x, e.clientY-start.y) < 6) pet();
          }} />
        {status === "loading" && <div className="study-overlay" role="status">小猫正在走进画面…</div>}
        {status === "error" && <div className="study-overlay" role="alert"><p>当前设备无法显示这个 3D 场景。</p><a href="?preview=cat">返回 SVG 样板</a><button onClick={() => window.location.reload()}>重新加载</button></div>}
        <p id="study-canvas-help" className="study-canvas-help">横向拖动转身 · 轻点打招呼 · 下方按钮调整远近</p>
        <div className="study-view-controls" role="group" aria-label="视角控制">
          <button disabled={status !== "ready"} onClick={() => scene.current?.zoom(-1)} aria-label="缩小">−</button>
          <button disabled={status !== "ready"} onClick={() => scene.current?.turn(-1)} aria-label="向左转动">↶</button>
          <button disabled={status !== "ready"} onClick={() => scene.current?.reset()}>重置视角</button>
          <button disabled={status !== "ready"} onClick={() => scene.current?.turn(1)} aria-label="向右转动">↷</button>
          <button disabled={status !== "ready"} onClick={() => scene.current?.zoom(1)} aria-label="放大">＋</button>
        </div>
      </section>
      <aside className="study-panel">
        <p className="study-eyebrow">01 / 毛色实验</p><h2>还是它，只是换了毛色。</h2><p className="study-description">选择一种颜色，看看它的脸颊、身体与尾巴。这里没有重新生成一只猫。</p>
        <div className="study-coats" role="group" aria-label="选择猫的毛色">
          {(Object.keys(STUDY_COATS) as StudyCoat[]).map(value => <button key={value} aria-pressed={coat === value} disabled={status !== "ready"} onClick={() => pick(value)}>
            <span className={`study-swatch study-swatch-${value}`} /><span>{STUDY_COATS[value].label}<small>{STUDY_COATS[value].description}</small></span><span className="study-selected" aria-hidden="true">{coat === value ? "✓" : ""}</span>
          </button>)}
        </div>
        <button className="study-pet" disabled={status !== "ready"} onClick={pet}>和它打个招呼 <span aria-hidden="true">↗</span></button>
        <p className="study-notice" role="status" aria-live="polite">{notice}</p>
        <div className="study-boundary"><p>一只示例猫 · 美术候选版</p><span>白斑位置是这只猫的示例图案，不代表基因决定具体位置。此页只展示外观，尚未连接遗传推演。</span></div>
      </aside>
    </div>
    <footer className="study-footer"><span>喵德尔 · 单猫 3D 样板</span><span>{stats ? `${stats.triangles.toLocaleString()} triangles · ${stats.calls} draw calls` : "本地模型 · 无在线生成"}</span><span>本页为实时模型，不是概念图</span></footer>
    <p className="study-attribution">基础模型 <a href="https://sketchfab.com/3d-models/3d-modelling-my-cat-fripouille-0ab14bf98e754f8d90fe1bf1c84ca66c" target="_blank" rel="noreferrer">Fripouille — guillaume bolis</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>。本站修复导出、适配毛色与轻互动；原作者未参与或背书本应用。</p>
  </main>;
}
