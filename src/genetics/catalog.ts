import type { Series, CoatSpec } from "./phenotype";

export interface CanonEntry {
  name: string;
  series: Series;
  d: string[];
  a: string[] | null;   // null 表示该花色对 A 位点无约束（橘色系）
  l: string[];
  white: number;
}

export const CANON: CanonEntry[] = [
  { name: "黑猫",     series: "black",  d: ["DD","Dd"], a: ["aa"],      l: ["LL","Ll"], white: 0 },
  { name: "狸花猫",   series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], l: ["LL","Ll"], white: 0 },
  { name: "蓝猫",     series: "black",  d: ["dd"],      a: ["aa"],      l: ["LL","Ll"], white: 0 },
  { name: "蓝虎斑猫", series: "black",  d: ["dd"],      a: ["AA","Aa"], l: ["LL","Ll"], white: 0 },
  { name: "橘猫",     series: "orange", d: ["DD","Dd"], a: null,        l: ["LL","Ll"], white: 0 },
  { name: "奶油猫",   series: "orange", d: ["dd"],      a: null,        l: ["LL","Ll"], white: 0 },
  { name: "玳瑁猫",   series: "tortie", d: ["DD","Dd"], a: ["aa"],      l: ["LL","Ll"], white: 0 },
  { name: "三花猫",   series: "tortie", d: ["DD","Dd"], a: ["aa"],      l: ["LL","Ll"], white: 2 },
  { name: "奶牛猫",   series: "black",  d: ["DD","Dd"], a: ["aa"],      l: ["LL","Ll"], white: 2 },
  { name: "蓝白猫",   series: "black",  d: ["dd"],      a: ["aa"],      l: ["LL","Ll"], white: 2 },
  { name: "橘白猫",   series: "orange", d: ["DD","Dd"], a: null,        l: ["LL","Ll"], white: 2 },
  { name: "狸花白猫", series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], l: ["LL","Ll"], white: 2 },
  { name: "长毛狸花猫", series: "black",  d: ["DD","Dd"], a: ["AA","Aa"], l: ["ll"], white: 0 },
  { name: "长毛橘猫",   series: "orange", d: ["DD","Dd"], a: null,        l: ["ll"], white: 0 },
];

export function canonSpec(c: CanonEntry): CoatSpec {
  return {
    series: c.series,
    dilute: c.d[0] === "dd",
    tabby: c.a ? c.a[0] !== "aa" : true,
    white: c.white,
    long: c.l[0] === "ll",
  };
}

export function oForSeries(series: Series, sex: "M" | "F"): string | null {
  if (sex === "M") return series === "orange" ? "O" : series === "black" ? "o" : null;
  return series === "orange" ? "OO" : series === "black" ? "oo" : "Oo";
}
