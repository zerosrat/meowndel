import { useEffect, useId, useRef, useState } from "react";
import openCat from "./assets/domestic-open.png";
import blinkCat from "./assets/domestic-blink.png";
import "./illustration.css";

/** Fixed-pose art trial. The luminance mask is NOT a general phenotype renderer. */
export default function CatIllustration() {
  const id = useId().replace(/:/g, "");
  const [blue, setBlue] = useState(false);
  const [blink, setBlink] = useState(false);
  const [motion, setMotion] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function greet() {
    clearTimeout(timer.current);
    setBlink(true);
    timer.current = setTimeout(() => setBlink(false), 650);
  }
  const url = (name: string) => `url(#${id}-${name})`;
  return <main className="ink-study">
    <header className="ink-header"><a href="?">喵德尔 <span>MEOWNDEL</span></a><span>视觉实验 / 02</span></header>
    <div className="ink-layout">
      <section className="ink-art" aria-label="猫咪展示">
        <div className="ink-caption">DOMESTIC SHORTHAIR <span>成年 · 短毛</span></div>
        <button className={`ink-cat ${motion ? "ink-breathing" : ""}`} onClick={greet} aria-label="轻触猫咪，让它眨眼" data-blinking={blink}>
          <svg viewBox="0 0 1000 1000" role="img" aria-label={`${blue ? "灰白" : "黑白"}田园猫${blink ? "，正在眨眼" : ""}`}>
            <defs>
              <filter id={`${id}-dark`} colorInterpolationFilters="sRGB">
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncR type="table" tableValues="1 1 0.85 0 0" />
                  <feFuncG type="table" tableValues="1 1 0.85 0 0" />
                  <feFuncB type="table" tableValues="1 1 0.85 0 0" />
                </feComponentTransfer>
              </filter>
              <filter id={`${id}-blue`} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values=".2 .5 .1 0 .17  .2 .5 .1 0 .20  .2 .5 .1 0 .24  0 0 0 1 0" />
              </filter>
              <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="3" /></filter>
              <mask id={`${id}-eyes`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
                <g fill="white" filter={url("soft")}><ellipse cx="207" cy="196" rx="34" ry="30" /><ellipse cx="304" cy="218" rx="33" ry="30" /></g>
              </mask>
              <mask id={`${id}-coat`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
                <image href={openCat} width="1000" height="1000" filter={url("dark")} />
                <g fill="black" filter={url("soft")}>
                  <path d="M157 131 L181 44 Q204 26 218 138 Z M310 146 L380 94 L354 181 Z" />
                  <ellipse cx="208" cy="196" rx="24" ry="26" /><ellipse cx="306" cy="219" rx="24" ry="25" />
                  <ellipse cx="253" cy="263" rx="33" ry="24" />
                </g>
              </mask>
            </defs>
            <image href={openCat} width="1000" height="1000" />
            <image className="ink-tint" href={openCat} width="1000" height="1000" filter={url("blue")} mask={url("coat")} opacity={blue ? 1 : 0} />
            <g className="ink-blink" opacity={blink ? 1 : 0} mask={url("eyes")}>
              <image href={blinkCat} width="1000" height="1000" />
              {blue && <image href={blinkCat} width="1000" height="1000" filter={url("blue")} />}
            </g>
          </svg>
        </button>
        <p className="ink-hint">轻触它，收获一个慢眨眼</p>
      </section>
      <section className="ink-controls">
        <p className="ink-eyebrow">一只猫，一点陪伴</p>
        <h1>纸上有猫，<br />眼里有你。</h1>
        <p className="ink-intro">保留笔触的温度，也让每一次选择，都发生在眼前这只猫身上。</p>
        <fieldset><legend>毛色 <span>01 / COAT</span></legend>
          <div className="ink-swatches">
            <button aria-pressed={!blue} onClick={() => setBlue(false)}><i className="ink-black" />黑白<span>温暖炭黑</span></button>
            <button aria-pressed={blue} onClick={() => setBlue(true)}><i className="ink-blue" />灰白<span>柔和蓝灰</span></button>
          </div>
        </fieldset>
        <p className="ink-note">只改变深色毛发，白斑位置保持不变。这是外观演示，不是遗传推演。</p>
        <div className="ink-actions"><button onClick={greet}>和它打个招呼 ↗</button><button aria-pressed={motion} onClick={() => setMotion(!motion)}>呼吸动效：{motion ? "开" : "关"}</button></div>
        <p className="ink-status" role="status">{blink ? "它向你慢慢眨了眨眼。" : `现在是${blue ? "灰白" : "黑白"}，还是同一只猫。`}</p>
      </section>
    </div>
    <footer className="ink-footer">2D 插画交互样板 · 固定姿态 / 两种毛色 / 轻触眨眼 <span>尚未接入遗传引擎</span></footer>
  </main>;
}
