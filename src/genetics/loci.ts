export type AutoLocus = "d" | "a" | "s" | "l";

export const A_GENOS: Record<AutoLocus, string[]> = {
  d: ["DD", "Dd", "dd"],
  a: ["AA", "Aa", "aa"],
  s: ["SS", "Ss", "ss"],
  l: ["LL", "Ll", "ll"],
};

// S 是半显性且表达量变异极大：同样是 Ss，可以是白袜黑猫，也可以是奶牛猫。
// 因此等级 1–4 都对应 {Ss, SS} 全集，等级只作倾向性提示，不作排除依据。
// 只有"完全无白"能唯一确定为 ss。
export const WHITE_S: Record<number, string[]> = {
  0: ["ss"],
  1: ["Ss", "SS"],
  2: ["Ss", "SS"],
  3: ["Ss", "SS"],
  4: ["Ss", "SS"],
};

export const WHITE_LABEL = ["无白", "零星白", "约一半", "大部分", "几乎全白"];
export const WHITE_FRAC = [0, 0.18, 0.48, 0.72, 0.92];

// 倾向性说明，供界面展示，不参与求解
export const WHITE_TENDENCY: Record<number, string> = {
  0: "两份都是无白斑等位基因",
  1: "多半只带一份 S",
  2: "一份或两份 S 都常见",
  3: "带两份 S 的可能性更大",
  4: "多半带两份 S，但一份也做得到",
};
