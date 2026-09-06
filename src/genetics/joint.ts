import { A_GENOS, WHITE_S } from "./loci";
import { oForSeries, type CanonEntry } from "./catalog";
import { hasPair, type ParentSolution } from "./solve";

/**
 * 判断"这只花色的公猫 × 这只花色的母猫"是否至少存在一组合法基因型配对。
 * 位点独立，所以每个位点各自存在一组即可；任一位点无解则整对不成立。
 */
export function canonPairAllowed(
  father: CanonEntry, mother: CanonEntry, res: ParentSolution
): boolean {
  const fo = oForSeries(father.series, "M");
  const mo = oForSeries(mother.series, "F");
  if (!fo || !mo) return false;
  if (!hasPair(res.pairs.o, fo, mo)) return false;

  const perLocus: [string, string[], string[]][] = [
    ["d", father.d, mother.d],
    ["a", father.a || A_GENOS.a, mother.a || A_GENOS.a],
    ["s", WHITE_S[father.white], WHITE_S[mother.white]],
    ["l", father.l, mother.l],
  ];

  for (const [loc, fGenos, mGenos] of perLocus) {
    let ok = false;
    for (const f of fGenos) {
      for (const m of mGenos) {
        if (hasPair(res.pairs[loc], f, m)) { ok = true; break; }
      }
      if (ok) break;
    }
    if (!ok) return false;
  }
  return true;
}
