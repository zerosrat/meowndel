import { Fragment, useState, useEffect } from "react";
import {
  CANON, canonAsParent, canonPairAllowed, canonSpec, parentClaims,
  type CanonEntry, type ParentSolution, type Target, type UiState,
} from "../genetics";
import Claims from "./Claims";
import CatChip from "./CatChip";

// legacy 714-731: renderParents(t,res)
export default function ParentsPanel({
  ui, target, res,
}: {
  ui: UiState; target: Target; res: ParentSolution;
}) {
  const claims = parentClaims(ui, target, res);
  const roles: ["mother" | "father", string][] = [
    ["mother", "它妈妈可能是这些"],
    ["father", "它爸爸可能是这些"],
  ];

  const [picked, setPicked] = useState<{ role: "mother" | "father"; name: string } | null>(null);

  function dimmed(role: "mother" | "father", c: CanonEntry): boolean {
    // 灰化表达「与已选的那只不兼容」；同一行（role）的条目不构成配对，所以自己永远不灰化自己
    if (!picked || picked.role === role) return false;
    // picked.name 只可能来自 CANON（通过 toggle 调用），所以 find 必然命中
    const other = CANON.find((x) => x.name === picked.name)!;
    return picked.role === "mother"
      ? !canonPairAllowed(c, other, res)
      : !canonPairAllowed(other, c, res);
  }

  function toggle(role: "mother" | "father", name: string) {
    setPicked((p) => (p && p.role === role && p.name === name ? null : { role, name }));
  }

  // 主体猫一变，旧选择就失效了——必须清空，否则上一只猫的选择
  // 会继续参与新结果的灰化，误导用户。
  // 依赖列表写具体字段而不是 ui 对象：ui 每次渲染都是新对象，会无限重置。
  useEffect(() => {
    setPicked(null);
  }, [ui.series, ui.dilute, ui.tabby, ui.white, ui.long, ui.sex]);

  return (
    <section className="panel" id="p-par">
      <div className="paneltop"><span className="dir">↑</span><span className="paneltitle">上一代</span><span className="panelrule"></span></div>
      <Claims list={claims} />
      <p className="nope">点一只看另一边还剩哪些可能</p>
      <div className="gallery">
        {roles.map(([role, label], ri) => {
          const yes: { c: CanonEntry; ci: number }[] = [];
          const no: { c: CanonEntry; ci: number }[] = [];
          CANON.forEach((c, ci) => {
            const ok = canonAsParent(c, role, res);
            (ok ? yes : no).push({ c, ci });
          });
          return (
            <Fragment key={role}>
              <p className="gallabel">{label}</p>
              <div className="catrow">
                {yes.map(({ c, ci }) => (
                  <CatChip
                    key={c.name}
                    spec={canonSpec(c)}
                    name={c.name}
                    no={dimmed(role, c)}
                    seed={ci * 7 + ri * 3 + 5}
                    onClick={() => toggle(role, c.name)}
                  />
                ))}
              </div>
              {no.length > 0 && (
                <>
                  <p className="gallabel" style={{ color: "var(--ink-3)" }}>{role === "mother" ? "这些不可能是它妈妈" : "这些不可能是它爸爸"}</p>
                  <div className="catrow">
                    {no.map(({ c, ci }) => (
                      <CatChip key={c.name} spec={canonSpec(c)} name={c.name} no={true} seed={ci * 7 + ri * 3 + 5} />
                    ))}
                  </div>
                </>
              )}
            </Fragment>
          );
        })}
      </div>
      <p className="nope">公猫不可能是玳瑁或三花，所以这两项从「爸爸」里直接排除了——不是算出来的结论，是 X 染色体只有一条的必然结果。</p>
    </section>
  );
}
