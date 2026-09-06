import { Fragment } from "react";
import {
  CANON, canonAsParent, canonSpec, parentClaims,
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

  return (
    <section className="panel" id="p-par">
      <div className="paneltop"><span className="dir">↑</span><span className="paneltitle">上一代</span><span className="panelrule"></span></div>
      <Claims list={claims} />
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
                  <CatChip key={c.name} spec={canonSpec(c)} name={c.name} no={false} seed={ci * 7 + ri * 3 + 5} />
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
