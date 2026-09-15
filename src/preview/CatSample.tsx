import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { coatName } from "../genetics/naming";
import { WHITE_LABEL } from "../genetics/loci";
import { normalizeUi, type UiState } from "../ui/types";
import CatIllustration, { type CoatFeature } from "./CatIllustration";
import "./cat-sample.css";

const INITIAL: UiState = { series: "orange", dilute: false, tabby: true, white: 1, long: false, sex: "?" };

function Option({ selected, onClick, children, disabled = false }: {
  selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean;
}) {
  return <button type="button" className="sample-option" aria-pressed={selected} disabled={disabled} onClick={onClick}>{children}<span className="sample-check" aria-hidden="true">✓</span></button>;
}

export default function CatSample() {
  const [raw, setRaw] = useState<UiState>(INITIAL);
  const [feedback, setFeedback] = useState({ feature: null as CoatFeature | null, message: "试着改变一个属性，看看它哪里不一样。", serial: 0 });
  const [focus, setFocus] = useState<CoatFeature | null>(null);
  const [pet, setPet] = useState(0);
  const [petting, setPetting] = useState(false);
  const ui = normalizeUi(raw);
  const name = coatName(ui.series, ui.dilute, ui.tabby, ui.white);
  const pigment = ui.series === "orange" ? (ui.dilute ? "#DEC398" : "#CC8B4B") : ui.dilute ? "#939FA9" : ui.tabby ? "#9D8B6D" : "#48464B";

  useEffect(() => {
    if (!feedback.feature) return;
    setFocus(feedback.feature);
    const timer = window.setTimeout(() => setFocus(null), 1400);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    if (!pet) return;
    setPetting(true);
    const timer = window.setTimeout(() => setPetting(false), 750);
    return () => window.clearTimeout(timer);
  }, [pet]);

  function change(feature: CoatFeature, value: UiState[CoatFeature]) {
    if (raw[feature] === value) return;
    const next = normalizeUi({ ...raw, [feature]: value });
    setRaw(next);
    const messages: Record<CoatFeature, string> = {
      series: `现在是${coatName(next.series, next.dilute, next.tabby, next.white)}，留意色素的变化。`,
      dilute: next.dilute ? "色素变淡了：黑色变灰蓝，橘色变奶油。" : "恢复浓色，毛色变得更浓郁了。",
      tabby: next.tabby ? "虎斑纹出现了，看看额头、身体和尾巴。" : "虎斑纹淡去了，留下整片底色。",
      white: `白斑改为「${WHITE_LABEL[next.white]}」。位置仅为示意，等级不能确定具体位置。`,
      long: next.long ? "身体和尾巴变蓬松了，是一只长毛猫。" : "毛发变短了，轮廓也更利落了。",
    };
    setFeedback(previous => ({ feature, message: messages[feature], serial: previous.serial + 1 }));
  }

  return <div className="cat-sample" style={{ "--coat-accent": pigment } as CSSProperties}>
    <header className="sample-header">
      <a className="sample-brand" href={window.location.pathname} aria-label="喵德尔，返回猫色溯源实验室"><span aria-hidden="true">m.</span>喵德尔</a>
      <span className="sample-edition">外观实验 <i /> 01</span>
    </header>
    <div className="sample-intro"><p className="sample-kicker">每一只猫，都有自己的模样</p><h1>从一抹毛色，<br className="sample-mobile-break" />认识一只猫。</h1><p>选一选，看看颜色、花纹和毛长如何改变它。</p></div>
    <main className="sample-layout">
      <section className="sample-preview" aria-label="猫的实时预览">
        <div className="sample-stage">
          <span className="sample-stage-label">这一只 <span>CAT / 001</span></span>
          <div className="sample-halo" />
          <button className={`sample-cat-button${petting ? " is-petted" : ""}`} type="button" onClick={() => setPet(n => n + 1)} aria-label="轻轻摸摸这只猫">
            <CatIllustration spec={ui} seed={17} focus={focus} />
            {petting && <span key={pet} className="sample-heart" aria-hidden="true">♡</span>}
          </button>
          <span className="sample-touch-hint">轻点，和它打个招呼</span>
        </div>
        <div className="sample-identity"><div><p className="sample-cat-name">{name}</p><p className="sample-traits">{ui.long ? "长毛" : "短毛"}<span>·</span>{ui.dilute ? "淡色" : "浓色"}<span>·</span>{WHITE_LABEL[ui.white]}</p></div><span className="sample-coat-dot" aria-hidden="true" /></div>
        <div className="sample-feedback" role="status" aria-live="polite" aria-atomic="true"><span className="sample-feedback-dot" aria-hidden="true" /><p key={feedback.serial}>{feedback.message}</p></div>
      </section>
      <section className="sample-controls" aria-label="外观属性">
        <div className="sample-controls-heading"><span>描绘它的模样</span><small>一次改变一点点</small></div>
        <fieldset><legend><span>01</span>底色系</legend><div className="sample-options sample-colors">
          <Option selected={ui.series === "orange"} onClick={() => change("series", "orange")}><i className="sample-swatch orange" aria-hidden="true" /><span>橘色系</span></Option>
          <Option selected={ui.series === "black"} onClick={() => change("series", "black")}><i className="sample-swatch black" aria-hidden="true" /><span>黑色系</span></Option>
          <Option selected={ui.series === "tortie"} onClick={() => change("series", "tortie")}><i className="sample-swatch tortie" aria-hidden="true" /><span>玳瑁</span></Option>
        </div></fieldset>
        <fieldset><legend><span>02</span>颜色浓淡</legend><div className="sample-options">
          <Option selected={!ui.dilute} onClick={() => change("dilute", false)}><i className={`sample-mini-swatch ${ui.series === "orange" ? "orange" : "black"}`} aria-hidden="true" />浓色</Option>
          <Option selected={ui.dilute} onClick={() => change("dilute", true)}><i className={`sample-mini-swatch ${ui.series === "orange" ? "cream" : "blue"}`} aria-hidden="true" />淡色</Option>
        </div></fieldset>
        <fieldset><legend><span>03</span>虎斑纹</legend><div className="sample-options">
          <Option selected={ui.tabby} onClick={() => change("tabby", true)} disabled={ui.series === "orange"}><i className="sample-pattern striped" aria-hidden="true" />有纹路</Option>
          <Option selected={!ui.tabby} onClick={() => change("tabby", false)} disabled={ui.series === "orange"}><i className="sample-pattern" aria-hidden="true" />无纹路</Option>
        </div><p className="sample-field-note">{ui.series === "orange" ? "橘色系始终显示虎斑纹，这一项无需选择。" : ui.series === "tortie" ? "这里描述的是黑色部分有没有虎斑纹。" : "额头、身体和尾巴，都会留下纹路。"}</p></fieldset>
        <fieldset><legend><span>04</span>白色占多少</legend><div className="sample-options sample-white-options">
          {WHITE_LABEL.map((label, white) => <Option key={white} selected={ui.white === white} onClick={() => change("white", white)}><i className={`sample-white-icon white-${white}`} aria-hidden="true" /><span>{label}</span></Option>)}
        </div><p className="sample-field-note">白斑位置仅为示意，等级不能确定具体位置。</p></fieldset>
        <fieldset><legend><span>05</span>毛长</legend><div className="sample-options">
          <Option selected={!ui.long} onClick={() => change("long", false)}><i className="sample-fur short" aria-hidden="true" />短毛</Option>
          <Option selected={ui.long} onClick={() => change("long", true)}><i className="sample-fur long" aria-hidden="true" />长毛</Option>
        </div></fieldset>
      </section>
    </main>
    <footer className="sample-footer"><span>喵德尔 · 猫色溯源实验室</span><span>单猫视觉样板 · 花色示意，非写实图鉴</span></footer>
  </div>;
}
