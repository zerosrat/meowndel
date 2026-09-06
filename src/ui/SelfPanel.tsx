import { Fragment, type ReactNode } from "react";
import type { CoatSpec, UiState } from "../genetics";
import { coatName, WHITE_LABEL, WHITE_S } from "../genetics";
import { catSVG } from "../render/catSVG";

// legacy 666-700: renderSelf(t) —— 注意 t（Target）在 legacy 里实际未被使用。
export default function SelfPanel({ ui, seed }: { ui: UiState; seed: number }) {
  const sp: CoatSpec = {
    series: ui.series,
    dilute: ui.dilute,
    tabby: ui.series === "orange" ? true : ui.tabby,
    white: ui.white,
    long: ui.long,
  };
  const name = (ui.long ? "长毛" : "短毛") + coatName(sp.series, sp.dilute, sp.tabby, sp.white);
  const sexTxt = ui.series === "tortie" ? "母猫" : ui.sex === "M" ? "公猫" : ui.sex === "F" ? "母猫" : "性别未知";

  const carry: { head: ReactNode; why: string }[] = [];
  if (ui.long) carry.push({ head: <>它身上藏着<b>两份长毛基因</b></>, why: "长毛是隐性的，必须双份才显现" });
  else carry.push({ head: <>它<b>可能悄悄携带长毛基因</b></>, why: "短毛是显性的，看不出来它是不是携带者" });
  if (ui.dilute) carry.push({ head: <>它<b>一定是两份稀释基因</b></>, why: "所以颜色从黑变蓝、从橘变奶油" });
  else carry.push({ head: <>它<b>可能携带稀释基因</b></>, why: "浓色是显性的，藏得住一份 d" });
  if (ui.white === 0) carry.push({ head: <>它<b>完全不带白斑基因</b></>, why: "一点白都没有，说明两份都是无白斑等位基因" });
  else carry.push({ head: <>它<b>至少带一份白斑基因</b></>, why: "白斑是显性的，有白就一定带 S" });
  if (ui.series === "orange") carry.push({ head: <>它的<b>虎斑基因状态无法判断</b></>, why: "橘猫无论带不带纯色基因，看上去都有虎斑纹" });

  const oRow: ReactNode =
    ui.series === "tortie" ? (<>X<sup>O</sup>X<sup>o</sup></>) :
    ui.series === "orange" ? (
      ui.sex === "M" ? (<>X<sup>O</sup>Y</>) :
      ui.sex === "F" ? (<>X<sup>O</sup>X<sup>O</sup></>) :
      (<>X<sup>O</sup>Y 或 X<sup>O</sup>X<sup>O</sup></>)
    ) : (
      ui.sex === "M" ? (<>X<sup>o</sup>Y</>) :
      ui.sex === "F" ? (<>X<sup>o</sup>X<sup>o</sup></>) :
      (<>X<sup>o</sup>Y 或 X<sup>o</sup>X<sup>o</sup></>)
    );

  const g: [string, string, ReactNode, string][] = [
    ["O", "橘色 · X连锁", oRow, ui.series === "tortie" ? "一橘一非橘，所以两色相间" : (ui.series === "orange" ? "带橘色等位基因" : "不带橘色等位基因")],
    ["D", "稀释", ui.dilute ? "d/d" : "D/D 或 D/d", ui.dilute ? "两份稀释，颜色被冲淡" : "至少一份浓色"],
    ["A", "虎斑开关", ui.series === "orange" ? "无法判断" : (ui.tabby ? "A/A 或 A/a" : "a/a"), ui.series === "orange" ? "被橘色掩盖" : (ui.tabby ? "至少一份虎斑基因" : "两份纯色基因")],
    ["S", "白斑", WHITE_S[ui.white].map((x) => x[0] + "/" + x[1]).join(" 或 "), WHITE_LABEL[ui.white]],
    ["L", "毛长", ui.long ? "l/l" : "L/L 或 L/l", ui.long ? "两份长毛基因" : "至少一份短毛基因"],
  ];

  const svg = catSVG(sp, seed, 190);
  const catsub = sexTxt + " · " + (sp.dilute ? "淡色" : "浓色") + " · " + (sp.tabby ? "有虎斑纹" : "无虎斑纹") + " · " + WHITE_LABEL[ui.white];
  const platecap = WHITE_LABEL[ui.white] + " · seed " + seed;

  return (
    <section className="panel" id="p-self">
      <div className="paneltop"><span className="dir">●</span><span className="paneltitle">这一只</span><span className="panelrule"></span></div>
      <div className="specimen">
        <div className="plate">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="platecap">{platecap}</div>
        </div>
        <div className="spec-info">
          <p className="catname">{name}</p>
          <p className="catsub">{catsub}</p>
          <ul className="carry">
            {carry.map((c, i) => (
              <li key={i}><span>{c.head}<span style={{ color: "var(--ink-3)" }}> —— {c.why}</span></span></li>
            ))}
          </ul>
          <details className="geno">
            <summary>展开基因型符号</summary>
            <div className="gtable">
              {g.map((r, i) => (
                <Fragment key={i}>
                  <span className="gk">{r[0]} {r[1]}</span>
                  <span className="gv">{r[2]}</span>
                  <span className="gd">{r[3]}</span>
                </Fragment>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
