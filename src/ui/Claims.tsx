import type { Claim } from "../genetics";

// legacy 705-712: renderClaims(list)，被 renderParents(715) 与 renderKids(734) 共用。
// c.text 里含 <em> 标签，是 claims.ts 生成的既定字符串，用 dangerouslySetInnerHTML 注入。
export default function Claims({ list }: { list: Claim[] }) {
  return (
    <div className="claims">
      {list.map((c, i) => (
        <div className="claim" key={i}>
          <span className={"badge " + (c.level === "certain" ? "certain" : "maybe")}>
            {c.level === "certain" ? "必然" : "可能"}
          </span>
          <div>
            <p className="claimtext" dangerouslySetInnerHTML={{ __html: c.text }} />
            {c.why && <p className="claimwhy">{c.why}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
