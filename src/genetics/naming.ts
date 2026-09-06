import type { Series } from "./phenotype";

export function baseName(series: Series, dilute: boolean, tabby: boolean): string {
  if (series === "orange") return dilute ? "奶油" : "橘";
  if (series === "black") {
    if (tabby) return dilute ? "蓝虎斑" : "狸花";
    return dilute ? "蓝" : "黑";
  }
  if (tabby) return dilute ? "淡玳瑁虎斑" : "玳瑁虎斑";
  return dilute ? "淡玳瑁" : "玳瑁";
}

export function coatName(
  series: Series, dilute: boolean, tabby: boolean, white: number
): string {
  const b = baseName(series, dilute, tabby);
  if (series === "tortie") return white >= 2 ? (dilute ? "淡三花猫" : "三花猫") : b + "猫";
  if (white <= 1) return b + "猫";
  if (white === 4) return "高白" + b + "猫";
  if (series === "black" && !dilute && !tabby) return "奶牛猫";
  return b + "白猫";
}
