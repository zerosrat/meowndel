import { useState } from "react";
import { buildTarget, solveParents, type UiState } from "./genetics";
import { normalizeUi } from "./ui/types";
import QuickPicks from "./ui/QuickPicks";
import Controls from "./ui/Controls";
import SelfPanel from "./ui/SelfPanel";
import ParentsPanel from "./ui/ParentsPanel";
import KidsPanel from "./ui/KidsPanel";

const INITIAL: UiState = {
  series: "orange", dilute: false, tabby: true, white: 0, long: true, sex: "M",
};

export default function App() {
  const [raw, setRaw] = useState<UiState>(INITIAL);
  const [seed, setSeed] = useState(7);
  const [mateIdx, setMateIdx] = useState(0);

  const ui = normalizeUi(raw);
  const target = buildTarget(ui);
  const res = solveParents(target);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brandline">
          <h1>喵德尔</h1>
        </div>
        <p className="tagline"><b>猫色溯源实验室。</b>描述你在街上看到的那只猫，这里推回它的<b>基因型</b>、它<b>爸妈可能长什么样</b>、它<b>孩子会长什么样</b>。所有结论只说「必然 / 可能 / 不可能」——不编概率。</p>
        <div className="loci">
          <span className="locus"><b>O</b> 橘色 · X连锁</span>
          <span className="locus"><b>D</b> 稀释</span>
          <span className="locus"><b>A</b> 虎斑开关</span>
          <span className="locus"><b>S</b> 白斑</span>
          <span className="locus"><b>L</b> 毛长</span>
          <span className="locus">公猫 <b>162</b> 型 · 母猫 <b>243</b> 型 · 配对 <b>39,366</b> 组</span>
        </div>
      </header>

      <main className="lab">
        <aside className="console">
          <p className="eyebrow">常见花色</p>
          <QuickPicks ui={ui} onPick={(next) => { setRaw(next); setSeed((s) => (s * 7 + 13) % 9973); }} />
          <p className="eyebrow">逐项描述</p>
          <Controls ui={ui} onChange={setRaw} />
        </aside>

        <div className="dossier">
          <SelfPanel ui={ui} seed={seed} />
          <ParentsPanel ui={ui} target={target} res={res} />
          <KidsPanel ui={ui} target={target} mateIdx={mateIdx} onMate={setMateIdx} />
        </div>
      </main>

      <footer className="edge">
        <b>这个模型的边界。</b>它只算五个位点（<code>O D A S L</code>），覆盖中国街猫绝大多数花色，但<b>对纯血猫会给出错误答案</b>——暹罗和布偶的重点色（<code>C</code> 位点）、英短金渐层的宽带基因、银虎斑的抑制基因、巧克力色（<code>B</code> 位点）都不在模型里。<br />
        白斑（<code>S</code>）在教科书里被简化成三态，实际是半显性且变异极大：同样是 <code>Ss</code>，可以是一只白袜黑猫，也可以是一只奶牛猫。<b>「三花」和「玳瑁」的区别只是白斑多少，不是不同的基因。</b>所以白斑相关的反推结论天然比其他位点模糊——这是事实，不是 bug。<br />
        猫图是占位示意，不是写实图鉴：同一个基因型每次都会 roll 出不同的白斑分布，因为<b>白斑的具体位置由胚胎期色素细胞迁移的随机性决定，基因只管量级</b>。
      </footer>
    </div>
  );
}
