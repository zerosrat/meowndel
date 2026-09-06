import type { CoatSpec } from "../genetics";
import { catSVG } from "../render/catSVG";

// legacy 702-703: catChip(spec,name,no,sd)
// 被 ParentsPanel（画廊）与 KidsPanel（后代结果）共用。
// onClick 只在真正可选的候选条目上传入（ParentsPanel 的"yes"组）——传了才渲染成
// <button>（键盘可达）；不传（KidsPanel、以及本来就不可能的条目）保持原来的 <div>，
// 不会看起来像能点、也不影响既有用法。
export default function CatChip({
  spec, name, no, seed, onClick,
}: {
  spec: CoatSpec; name: string; no: boolean; seed: number; onClick?: () => void;
}) {
  const svg = catSVG(spec, seed, 46);
  const className = "catchip" + (no ? " no" : "");
  const inner = (
    <>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="cname">{name}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}
