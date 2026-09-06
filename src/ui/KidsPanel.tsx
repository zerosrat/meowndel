import { Fragment } from "react";
import {
  mateList, canonSpec, childrenWith, kidClaims,
  type Target, type UiState,
} from "../genetics";
import Claims from "./Claims";
import CatChip from "./CatChip";
import { catSVG } from "../render/catSVG";

// legacy 733-754: renderKids(t)
export default function KidsPanel({
  ui, target, mateIdx, onMate,
}: {
  ui: UiState; target: Target; mateIdx: number; onMate: (i: number) => void;
}) {
  const claims = kidClaims(ui, target);
  const list = mateList(target);
  // legacy 736 行 `if(mateIdx>=list.length) mateIdx=0;` 在渲染期就地改 mateIdx——
  // React 里不能在渲染期改 state，改用等价的派生值。
  const idx = mateIdx >= list.length ? 0 : mateIdx;
  const r = childrenWith(target, list[idx]);

  return (
    <section className="panel" id="p-kid">
      <div className="paneltop"><span className="dir">↓</span><span className="paneltitle">下一代</span><span className="panelrule"></span></div>
      <Claims list={claims} />
      <p className="gallabel">要是让它配一只……</p>
      <div className="tabs">
        {list.map((m, i) => {
          const svg = catSVG(canonSpec(m), i * 13 + 2, 26);
          return (
            <button key={m.name} className="tab" aria-pressed={i === idx} onClick={() => onMate(i)}>
              <div dangerouslySetInnerHTML={{ __html: svg }} />{m.name}
            </button>
          );
        })}
      </div>
      {!r ? (
        <p className="mateline">这个组合不成立。</p>
      ) : (
        <div className="mateout">
          <p className="mateline">和一只<b>{list[idx].name}</b>配，孩子可能出现这 <b>{r.names.length}</b> 种花色{r.longPossible && r.shortPossible ? "（长毛短毛都可能）" : r.longPossible ? "（都会是长毛）" : "（都会是短毛）"}：</p>
          <div className="catrow">
            {r.names.slice(0, 14).map((n, i) => (
              <CatChip key={n} spec={r.specs[n]} name={n} no={false} seed={i * 5 + 31} />
            ))}
          </div>
          {r.nope.length > 0 && (
            <p className="nope">不会出现：{r.nope.map((n, i) => (
              <Fragment key={n}>{i > 0 ? " " : null}<s>{n}</s></Fragment>
            ))}</p>
          )}
        </div>
      )}
    </section>
  );
}
