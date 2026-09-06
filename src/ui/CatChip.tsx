import type { CoatSpec } from "../genetics";
import { catSVG } from "../render/catSVG";

// legacy 702-703: catChip(spec,name,no,sd)
// 被 ParentsPanel（画廊）与 KidsPanel（后代结果）共用。
export default function CatChip({
  spec, name, no, seed,
}: {
  spec: CoatSpec; name: string; no: boolean; seed: number;
}) {
  const svg = catSVG(spec, seed, 46);
  return (
    <div className={"catchip" + (no ? " no" : "")}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="cname">{name}</span>
    </div>
  );
}
