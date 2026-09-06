export type Series = "orange" | "tortie" | "black";

export interface CoatSpec {
  series: Series;
  dilute: boolean;
  tabby: boolean;
  white: number;
  long: boolean;
}

export function seriesOf(o: string): Series {
  if (o === "O" || o === "OO") return "orange";
  return o === "Oo" ? "tortie" : "black";
}

export function specOf(
  o: string, d: string, a: string, s: string, white: number, long: boolean
): CoatSpec {
  const series = seriesOf(o);
  return {
    series,
    dilute: d === "dd",
    // 橘色系没有"纯色"可言，红色素关不掉
    tabby: series === "orange" ? true : a !== "aa",
    white,
    long: !!long,
  };
}
