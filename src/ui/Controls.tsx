import type { ReactNode } from "react";
import type { UiState } from "../genetics";
import { WHITE_LABEL, WHITE_FRAC } from "../genetics";

// legacy 625-633: segRow(label,hint,name,opts,cur,disabled)
// 注意：legacy 里 segRow 返回的 `<div class="row">` 故意不闭合——`.seg` 之后的
// `</div>` 由调用方补上，使 note（若有）落在 `.row` 内、`.seg` 之后。
// 这里用 `note` prop 显式表达同一结构。
function SegRow({
  label, hint, opts, cur, disabled, onSelect, note,
}: {
  label: string;
  hint?: ReactNode;
  opts: { v: string; t: string }[];
  cur: string;
  disabled?: boolean;
  onSelect: (v: string) => void;
  note?: ReactNode;
}) {
  return (
    <div className="row">
      <div className="rowhead">
        <span className="rowlabel">{label}</span>
        {hint ? <span className="rowhint">{hint}</span> : null}
      </div>
      <div className="seg">
        {opts.map((o) => (
          <button
            key={o.v}
            aria-pressed={String(cur) === String(o.v)}
            disabled={disabled}
            onClick={() => onSelect(o.v)}
          >
            {o.t}
          </button>
        ))}
      </div>
      {note}
    </div>
  );
}

// legacy 634-664: renderControls()
export default function Controls({
  ui, onChange,
}: {
  ui: UiState; onChange: (next: UiState) => void;
}) {
  const orange = ui.series === "orange";
  const lockSex = ui.series === "tortie";

  return (
    <>
      <SegRow
        label="底色系"
        hint="决定色素类型"
        opts={[{ v: "black", t: "黑色系" }, { v: "orange", t: "橘色系" }, { v: "tortie", t: "玳瑁" }]}
        cur={ui.series}
        onSelect={(v) => onChange({ ...ui, series: v as UiState["series"] })}
      />
      <SegRow
        label="浓淡"
        hint={<>淡色＝黑变灰蓝<br />橘变奶油</>}
        opts={[{ v: "0", t: "浓色" }, { v: "1", t: "淡色" }]}
        cur={ui.dilute ? "1" : "0"}
        onSelect={(v) => onChange({ ...ui, dilute: v === "1" })}
      />
      <SegRow
        label={orange ? "虎斑纹" : ui.series === "tortie" ? "黑色部分有虎斑纹吗" : "有虎斑纹吗"}
        opts={[{ v: "1", t: "有" }, { v: "0", t: "无" }]}
        cur={orange ? "1" : ui.tabby ? "1" : "0"}
        disabled={orange}
        onSelect={(v) => onChange({ ...ui, tabby: v === "1" })}
        note={orange ? <p className="note">橘猫必然带虎斑纹。红色素无法被「纯色」基因关掉，所以世界上不存在纯色的橘猫——这一项对它没有意义。</p> : null}
      />

      <div className="row">
        <div className="rowhead">
          <span className="rowlabel">白色占多少</span>
          <span className="rowhint">位置随机，基因只管量级</span>
        </div>
        <div className="whitescale">
          {[0, 1, 2, 3, 4].map((w) => (
            <button
              key={w}
              className="wstep"
              aria-pressed={ui.white === w}
              onClick={() => onChange({ ...ui, white: w })}
            >
              <span className="wbar"><i style={{ height: Math.round(WHITE_FRAC[w] * 100) + "%" }} /></span>
              <span className="wlabel">{WHITE_LABEL[w]}</span>
            </button>
          ))}
        </div>
      </div>

      <SegRow
        label="毛长"
        opts={[{ v: "0", t: "短毛" }, { v: "1", t: "长毛" }]}
        cur={ui.long ? "1" : "0"}
        onSelect={(v) => onChange({ ...ui, long: v === "1" })}
      />

      <SegRow
        label="性别"
        opts={[{ v: "M", t: "公" }, { v: "F", t: "母" }, { v: "?", t: "不知道" }]}
        cur={lockSex ? "F" : ui.sex}
        disabled={lockSex}
        onSelect={(v) => onChange({ ...ui, sex: v as UiState["sex"] })}
        note={lockSex ? <p className="note">玳瑁和三花<b>几乎必然是母猫</b>——两种毛色需要两条 X 染色体才装得下。极少数例外是 XXY 的克氏综合征公猫，通常不育。已自动锁定为母猫。</p> : null}
      />
    </>
  );
}
