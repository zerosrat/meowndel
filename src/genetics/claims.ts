import { hasPair, type ParentSolution, type Target, type UiState } from "./solve";

export type ClaimLevel = "certain" | "maybe";
export interface Claim { level: ClaimLevel; text: string; why: string }

function C(level: ClaimLevel, text: string, why?: string): Claim {
  return { level, text, why: why || "" };
}

export function parentClaims(ui: UiState, t: Target, res: ParentSolution): Claim[] {
  const out: Claim[] = [];
  const branches = t.sexes.map((sx) => ({ sex: sx, o: Object.keys(t.o[sx])[0] }));
  const multi = branches.length > 1;

  for (const br of branches) {
    const pre = multi ? (br.sex === "M" ? "如果它是公猫，" : "如果它是母猫，") : "";
    const { o, sex: sx } = br;
    let txt = "", why = "";
    if (sx === "M" && o === "O") {
      txt = pre + "<em>它妈妈身上一定带橘色</em>——只可能是橘猫、奶油猫、玳瑁或三花。而<em>它爸爸的花色完全不受限制</em>，什么色都行。";
      why = "橘色基因长在 X 染色体上。公猫只有一条 X，只能来自妈妈；爸爸给的是 Y，不携带任何毛色信息。";
    } else if (sx === "M" && o === "o") {
      txt = pre + "<em>它妈妈一定带着非橘的等位基因</em>——不可能是纯橘猫或纯奶油猫，但完全可以是玳瑁或三花。<em>它爸爸的花色不受任何限制</em>。";
      why = "它唯一那条 X 上带的是非橘等位基因，只能来自妈妈。爸爸给的 Y 不携带毛色信息。";
    } else if (sx === "F" && o === "OO") {
      txt = pre + "<em>它爸爸必然是橘色系</em>——橘猫或奶油猫，没有别的可能。妈妈也一定带橘色。";
      why = "母猫两条 X，一条来自爸爸一条来自妈妈。两条都带橘色，说明爸爸那条 X 就带橘——而公猫只有一条 X，它自己就必然显橘。";
    } else if (sx === "F" && o === "Oo") {
      txt = pre + "<em>爸妈必然一方带橘、一方带非橘</em>：爸爸要是橘猫，妈妈就一定带非橘；爸爸要不是橘猫，妈妈就一定带橘色。";
      why = "玳瑁和三花是两条 X 一橘一非橘的结果，两条分别来自父母。这也是三花几乎只能是母猫的原因——公猫只有一条 X，装不下两种颜色。";
    } else if (sx === "F" && o === "oo") {
      txt = pre + "<em>它爸爸绝不可能是橘猫或奶油猫</em>。妈妈也一定带着非橘等位基因。";
      why = "它两条 X 都不带橘色，其中一条来自爸爸。爸爸唯一的那条 X 若带橘，它自己就是橘猫，女儿也就不会是这样。";
    }
    if (txt) out.push(C("certain", txt, why));
  }

  if (!res.f.d["DD"] && !res.m.d["DD"])
    out.push(C("certain",
      "<em>爸妈双方都携带稀释基因</em>——哪怕它们自己看上去是浓色的黑猫或橘猫。",
      "稀释是隐性的：只有从双方各拿到一份 d，颜色才会从黑变蓝、从橘变奶油。"));
  if (!res.f.l["LL"] && !res.m.l["LL"])
    out.push(C("certain", "<em>爸妈双方都携带长毛基因</em>——它们自己可能都是短毛。",
      "长毛是隐性的，必须双份才显现。所以两只短毛猫完全可能生出长毛后代。"));
  if (!res.f.a["AA"] && !res.m.a["AA"] && ui.series !== "orange")
    out.push(C("certain", "<em>爸妈双方都携带非虎斑基因</em>，即使它们自己是狸花。",
      "纯色（无虎斑纹）是隐性的 aa，两份 a 分别来自父母。"));
  if (ui.white === 0) {
    if (!res.f.s["SS"] && !res.m.s["SS"])
      out.push(C("certain", "<em>爸妈都不可能是几乎全白的猫</em>。", ""));
  } else {
    if (!hasPair(res.pairs.s, "ss", "ss"))
      out.push(C("certain", "<em>爸妈至少有一方身上带白</em>。", "白斑基因 S 是显性的，凭空长不出来。"));
  }
  if (!ui.dilute && !hasPair(res.pairs.d, "dd", "dd"))
    out.push(C("certain", "爸妈<em>至少有一方是浓色</em>——两只蓝猫生不出黑猫。", ""));
  if (!ui.long && !hasPair(res.pairs.l, "ll", "ll"))
    out.push(C("certain", "爸妈<em>至少有一方是短毛</em>——两只长毛猫生不出短毛猫。", ""));
  return out;
}

export function kidClaims(ui: UiState, t: Target): Claim[] {
  const out: Claim[] = [];
  const multi = t.sexes.length > 1;
  for (const sx of t.sexes) {
    const o = Object.keys(t.o[sx])[0];
    const pre = multi ? (sx === "M" ? "如果它是公猫：" : "如果它是母猫：") : "";
    let txt = "", why = "";
    if (sx === "M" && o === "O") {
      txt = pre + "它的<em>女儿会全部带橘色</em>——橘猫、玳瑁或三花，一只都跑不掉。而它<em>儿子橘不橘，跟它毫无关系</em>，完全由母方决定。";
      why = "它唯一那条带橘的 X 必然传给每一个女儿；儿子拿到的是它的 Y。";
    } else if (sx === "M" && o === "o") {
      txt = pre + "它的<em>女儿永远不可能是纯橘猫</em>，最多是玳瑁或三花。儿子的颜色则完全由母方决定。";
      why = "女儿必得它那条非橘的 X，另一条来自妈妈——两条都带橘才会是纯橘猫。";
    } else if (sx === "F" && o === "OO") {
      txt = pre + "它的<em>儿子全部是橘色系</em>——橘猫或奶油猫，一个例外都没有。女儿也一定带橘色。";
      why = "儿子唯一的 X 必来自它，而它两条 X 都带橘。";
    } else if (sx === "F" && o === "Oo") {
      txt = pre + "它的<em>儿子会分成两拨</em>：一部分橘、一部分不橘。这正是它身上两种颜色各传一半的直接结果。";
      why = "它一条 X 带橘、一条不带，儿子随机拿走其中一条。";
    } else if (sx === "F" && o === "oo") {
      txt = pre + "它的<em>儿子永远不可能是橘猫</em>。女儿橘不橘，全看爸爸。";
      why = "儿子唯一的 X 来自它，而它两条 X 都不带橘。";
    }
    if (txt) out.push(C("certain", txt, why));
  }
  if (ui.long) out.push(C("certain", "它的<em>每个孩子都会拿到一份长毛基因</em>，即使孩子自己是短毛。", ""));
  if (ui.dilute) out.push(C("certain", "它的<em>每个孩子都会拿到一份稀释基因</em>。", ""));
  if (ui.white === 0) out.push(C("certain", "它自己不带白斑基因，孩子<em>有没有白，完全取决于对方</em>。", ""));
  if (!ui.tabby && ui.series !== "orange") out.push(C("certain", "它的<em>每个孩子都会拿到一份非虎斑基因</em>。", ""));
  return out;
}
