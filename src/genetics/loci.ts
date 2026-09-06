export type AutoLocus = "d" | "a" | "s" | "l";

export const A_GENOS: Record<AutoLocus, string[]> = {
  d: ["DD", "Dd", "dd"],
  a: ["AA", "Aa", "aa"],
  s: ["SS", "Ss", "ss"],
  l: ["LL", "Ll", "ll"],
};

export const WHITE_S: Record<number, string[]> = {
  0: ["ss"], 1: ["Ss"], 2: ["Ss", "SS"], 3: ["Ss", "SS"], 4: ["SS"],
};

export const WHITE_LABEL = ["无白", "零星白", "约一半", "大部分", "几乎全白"];
export const WHITE_FRAC = [0, 0.18, 0.48, 0.72, 0.92];
